import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import workload from "../../../lab/level-4/scheduler-internals/workload.yaml?raw";
import profile from "../../../lab/level-4/scheduler-internals/profile.yaml?raw";

export const schedulerInternals: Chapter = {
  id: "scheduler-internals",
  level: 4,
  minutes: 60,
  title: l(
    "Scheduler architecture and custom scheduling",
    "Architecture du scheduler et ordonnancement personnalisé",
  ),
  summary: l(
    "Follow queue, filtering, scoring and binding; distinguish a scheduler profile from a running scheduler and diagnose an unclaimed Pod.",
    "Suivre file, filtrage, score et binding ; distinguer profil et scheduler actif, diagnostiquer un Pod que personne ne prend en charge.",
  ),
  prerequisites: ["advanced-scheduling", "api-architecture"],
  related: ["controllers-internals", "control-plane-scale"],
  blocks: [
    h(
      "objectives",
      "Locate the decision before tuning it",
      "Localiser la décision avant de la régler",
    ),
    list(
      l(
        "Explain why an unscheduled Pod may have no FailedScheduling event.",
        "Expliquer pourquoi un Pod non affecté peut n’avoir aucun Event FailedScheduling.",
      ),
      l(
        "Read a v1 scheduler profile without replacing the lab control plane.",
        "Lire un profil scheduler v1 sans remplacer le control plane du lab.",
      ),
    ),
    p(
      "The scheduler watches unbound Pods assigned to one of its scheduler names. It does not create replicas or start containers. Scheduling cycles choose a node; binding cycles make that choice visible through the API. The kubelet on the selected node then handles admission and runtime setup. A successful bind can therefore precede image, CNI or volume failure. PodScheduled=True is evidence of placement, not application readiness.",
      "Le scheduler observe les Pods non affectés correspondant à ses noms. Il ne crée pas les réplicas et ne démarre pas les conteneurs. Le cycle d’ordonnancement choisit un nœud ; celui de binding rend ce choix visible dans l’API. Le kubelet du nœud sélectionné gère ensuite admission et runtime. Un binding réussi peut précéder une panne d’image, CNI ou volume. PodScheduled=True prouve le placement, pas la readiness applicative.",
    ),
    p(
      "The framework separates extension points: QueueSort orders candidates; PreFilter prepares shared state; Filter rejects infeasible nodes; PreScore/Score rank survivors. Reserve can hold assumed resources, Permit can delay approval, and PreBind/Bind perform final work. Failure paths release assumptions with Unreserve. PostFilter may attempt preemption when no node fits. Not every plugin implements every point. A high score cannot resurrect a node rejected by a hard filter.",
      "Le framework distingue les points d’extension : QueueSort ordonne les candidats ; PreFilter prépare un état partagé ; Filter rejette les nœuds impossibles ; PreScore/Score classent les survivants. Reserve peut réserver des ressources supposées, Permit retarder l’accord, PreBind/Bind finaliser. Unreserve libère les hypothèses lors d’échecs. PostFilter peut envisager la préemption si aucun nœud ne convient. Tous les plugins n’implémentent pas chaque étape. Aucun score ne réhabilite un nœud exclu par un filtre strict.",
    ),
    p(
      "A local cache and assumed placement allow scheduling to progress without waiting for every API observation. Retries pass through active, backoff or unschedulable queues and relevant events can make a Pod worth reconsidering. Scheduling cycles are serial within a scheduler process while binding work can overlap. Leader election avoids two active leaders of the same deployment; multiple deliberately separate schedulers need distinct ownership and profiles, not a race to bind the same Pods.",
      "Un cache local et le placement supposé permettent d’avancer sans attendre chaque observation API. Les reprises passent par les files active, backoff ou unschedulable ; des événements pertinents peuvent rendre un Pod réexaminable. Les cycles d’ordonnancement sont sériels dans un processus tandis que les bindings peuvent se chevaucher. L’élection évite deux leaders actifs d’un même déploiement ; plusieurs schedulers distincts exigent des responsabilités et profils explicites, pas une course au binding des mêmes Pods.",
    ),
    ...labContext("lab-scheduler"),
    h(
      "unclaimed",
      "Observe a Pod with no matching scheduler",
      "Observer un Pod sans scheduler correspondant",
    ),
    code("yaml", workload, "lab/level-4/scheduler-internals/workload.yaml"),
    code(
      "bash",
      "k -n lab-scheduler apply -f lab/level-4/scheduler-internals/workload.yaml\nk -n lab-scheduler get pods -o wide\nk -n lab-scheduler describe pods -l app=queued-web\nk -n kube-system get pods -l component=kube-scheduler\nk -n kube-system logs -l component=kube-scheduler --tail=40",
    ),
    p(
      "Expected: the Pod stays Pending with no node because lab-unregistered has no running scheduler/profile. It may have no scheduling rejection Event at all: no responsible process attempted placement. Read schedulerName before blaming CPU or affinity. Inspect the baseline scheduler's command arguments with the following read-only query; do not edit its static Pod manifest. Scheduler logs at normal verbosity need not contain every decision.",
      "Attendu : le Pod reste Pending sans nœud car aucun scheduler/profil actif ne correspond à lab-unregistered. Il peut n’avoir aucun Event de rejet : aucun processus responsable n’a essayé de le placer. Lisez schedulerName avant d’accuser CPU ou affinité. Examinez les arguments du scheduler avec la lecture seule suivante, sans modifier son manifest de Pod statique. Les logs normaux ne détaillent pas nécessairement chaque décision.",
    ),
    code(
      "bash",
      'k -n kube-system get pods -l component=kube-scheduler -o jsonpath=\'{range .items[*]}{.metadata.name}{"\\n"}{.spec.containers[0].command}{"\\n"}{end}\'\nk -n lab-scheduler patch deployment queued-web --type=merge -p \'{"spec":{"template":{"spec":{"schedulerName":"default-scheduler"}}}}\'\nk -n lab-scheduler rollout status deployment/queued-web --timeout=120s\nk -n lab-scheduler get pods -o wide',
    ),
    p(
      "The Deployment creates a replacement Pod because schedulerName belongs to its template; do not attempt to mutate that immutable field on an existing Pod. Expected: default-scheduler binds the replacement if ordinary constraints fit. A subsequent ImagePullBackOff would show that scheduling succeeded but runtime preparation failed. Recreate is scoped to this one disposable replica, not a production delivery recommendation.",
      "Le Deployment crée un remplaçant car schedulerName appartient à son template ; ne tentez pas de modifier ce champ immuable sur un Pod existant. Attendu : default-scheduler affecte le remplaçant si ses contraintes conviennent. Un ImagePullBackOff ensuite prouverait un placement réussi puis une panne de préparation runtime. Recreate concerne ce réplica jetable, sans recommander cette stratégie en production.",
    ),
    h("profile", "Read a real profile configuration", "Lire une vraie configuration de profil"),
    code("yaml", profile, "lab/level-4/scheduler-internals/profile.yaml"),
    note(
      "warn",
      l("Configuration, not an API resource", "Configuration, pas ressource API"),
      l(
        "This is a complete profile example for a compatible kube-scheduler binary, not a kubectl apply manifest and not an installed second scheduler. Authentication, leader election and deployment lifecycle would still need an explicit operational setup. Do not mount it over the lab scheduler to test this lesson.",
        "Ceci est un exemple de profil pour un binaire kube-scheduler compatible, pas un manifest kubectl apply ni un second scheduler installé. Authentification, élection et cycle de déploiement demanderaient encore une préparation opérationnelle. Ne remplacez pas la configuration du scheduler du lab pour ce cours.",
      ),
    ),
    p(
      "Both profiles keep default plugins; lab-balanced changes NodeResourcesFit scoring to LeastAllocated and gives its score weight two. CPU/memory scoring weights are distinct from the plugin's overall weight. Other scoring plugins still influence the result. Multiple profiles in one scheduler share a pending queue, so QueueSort configuration must agree. Built-in plugin configuration is a smaller extension than compiling a custom framework plugin; new plugin code must implement cancellation, failure cleanup, cache interactions and tests before operational use.",
      "Les deux profils gardent les plugins par défaut ; lab-balanced utilise LeastAllocated pour NodeResourcesFit et pondère son score à deux. Les poids CPU/mémoire diffèrent du poids global du plugin. D’autres plugins influencent encore le résultat. Plusieurs profils d’un scheduler partagent la file d’attente : leur QueueSort doit concorder. Configurer un plugin intégré est une extension plus limitée que compiler un plugin personnalisé ; celui-ci doit gérer annulation, nettoyage, cache et tests avant usage opérationnel.",
    ),
    h(
      "quiz",
      "Distinguish ownership and feasibility",
      "Distinguer responsabilité et admissibilité",
    ),
    quiz(
      question(
        l(
          "Pending without scheduling Events can mean what?",
          "Pending sans Events d’ordonnancement peut signifier quoi ?",
        ),
        [
          l(
            "No running scheduler owns schedulerName",
            "Aucun scheduler actif ne gère schedulerName",
          ),
          l("Every node rejected the Pod", "Tous les nœuds ont rejeté le Pod"),
          l("The image already started", "L’image a déjà démarré"),
        ],
        0,
        l(
          "An unclaimed Pod need not reach the filtering stage at all.",
          "Un Pod non pris en charge peut ne jamais atteindre le filtrage.",
        ),
      ),
      question(
        l("Can Score override a Filter rejection?", "Score annule-t-il un rejet de Filter ?"),
        [
          l("With a large enough weight", "Avec un poids suffisant"),
          l("No, only feasible nodes are ranked", "Non, seuls les nœuds admissibles sont classés"),
          l("Only for memory", "Seulement pour la mémoire"),
        ],
        1,
        l(
          "Filter defines candidates; Score chooses among them.",
          "Filter définit les candidats ; Score choisit parmi eux.",
        ),
      ),
      question(
        l("PodScheduled=True guarantees what?", "Que garantit PodScheduled=True ?"),
        [
          l("The application passed readiness", "L’application a passé la readiness"),
          l("Its disk data is replicated", "Ses données sont répliquées"),
          l(
            "A node was assigned; kubelet/runtime work follows",
            "Un nœud a été affecté ; le travail kubelet/runtime suit",
          ),
        ],
        2,
        l(
          "Runtime, network and mount setup can still fail after binding.",
          "Runtime, réseau et montage peuvent encore échouer après le binding.",
        ),
      ),
    ),
    h(
      "challenge",
      "Explain why a profile file changes nothing",
      "Expliquer pourquoi un fichier de profil ne change rien",
    ),
    challenge(
      l("The absent lab-balanced scheduler", "Le scheduler lab-balanced absent"),
      l(
        "Set the Deployment's schedulerName to lab-balanced. Predict and observe its state, then restore default-scheduler. Explain what additional running component would be needed to use the profile.",
        "Passez schedulerName du Deployment à lab-balanced. Prévoyez et observez son état puis restaurez default-scheduler. Expliquez quel composant actif manque pour utiliser le profil.",
      ),
      [
        l(
          "A local YAML file is not watched by the existing scheduler.",
          "Un fichier YAML local n’est pas observé par le scheduler existant.",
        ),
        l(
          "The replacement Pod needs an active process configured for that scheduler name.",
          "Le Pod remplaçant exige un processus actif configuré pour ce nom.",
        ),
      ],
      [
        code(
          "bash",
          'k -n lab-scheduler patch deployment queued-web --type=merge -p \'{"spec":{"template":{"spec":{"schedulerName":"lab-balanced"}}}}\'\nk -n lab-scheduler get pods -o wide\nk -n lab-scheduler patch deployment queued-web --type=merge -p \'{"spec":{"template":{"spec":{"schedulerName":"default-scheduler"}}}}\'\nk -n lab-scheduler rollout status deployment/queued-web --timeout=120s',
        ),
        p(
          "Expected after each replacement: lab-balanced remains unclaimed, then default-scheduler restores placement. A managed scheduler process must load the profile and possess required credentials/permissions before that name becomes functional. This lesson demonstrates configuration reasoning and recovery, not implementation of a custom scheduler.",
          "Attendu après remplacement : lab-balanced reste non pris en charge puis default-scheduler restaure le placement. Un processus géré doit charger le profil et posséder identifiants/permissions nécessaires avant que ce nom fonctionne. Le cours démontre raisonnement et récupération, pas l’implémentation d’un scheduler personnalisé.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code("bash", "k delete namespace lab-scheduler"),
  ],
};
