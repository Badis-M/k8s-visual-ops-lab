import type { Chapter } from "../types";
import { l, h, p, code, note, list, quiz, question, challenge } from "../lesson-kit";
import web from "../../../lab/level-4/multi-cluster/web.yaml?raw";

export const multiCluster: Chapter = {
  id: "multi-cluster",
  level: 4,
  minutes: 50,
  title: l("Multi-cluster and fleet management", "Multi-cluster et gestion de flotte"),
  summary: l(
    "Operate two explicitly identified local clusters, detect drift and stage a bounded rollout without confusing fleet consistency with cross-cluster availability.",
    "Exploiter deux clusters locaux explicitement identifiés, détecter la dérive et séquencer un rollout sans confondre cohérence de flotte et disponibilité inter-clusters.",
  ),
  prerequisites: ["namespaces-contexts", "gitops", "ha"],
  related: ["platform-engineering", "failure-scenarios"],
  blocks: [
    h(
      "objectives",
      "A cluster is a separate control boundary",
      "Un cluster constitue une frontière de contrôle distincte",
    ),
    list(
      l(
        "Bind every command to a specific kubeconfig, context and namespace and verify the target's identity.",
        "Lier chaque commande à un kubeconfig, contexte et namespace précis puis vérifier l’identité de la cible.",
      ),
      l(
        "Separate shared intent, deployment waves, drift detection and data/traffic failover responsibilities.",
        "Séparer intention commune, vagues de déploiement, détection de dérive et responsabilités de bascule des données/du trafic.",
      ),
    ),
    h(
      "mental-model",
      "A fleet does not create one giant cluster",
      "Une flotte ne forme pas un cluster géant",
    ),
    p(
      "Each cluster owns API state, identities, admission, scheduling and normally service discovery. Reusing a namespace or Service name does not join those control planes. A fleet layer can distribute reviewed configuration, report health and stage changes, but it must explicitly handle version skew, policy differences, credentials and per-cluster failure. Shared Git intent is useful; blindly applying one change everywhere turns a common configuration defect into a fleet-wide incident. Start with a canary cluster, acceptance criteria and an abort rule.",
      "Chaque cluster possède état API, identités, admission, ordonnancement et généralement découverte de services. Réutiliser un namespace ou un nom de Service ne relie pas les control planes. Une couche de flotte peut distribuer la configuration examinée, rapporter la santé et séquencer les changements, mais doit traiter écarts de versions, politiques, identifiants et pannes propres à chaque cluster. Git commun aide ; appliquer aveuglément partout transforme un défaut partagé en incident global. Commencez par un cluster canari, des critères d’acceptation et une règle d’arrêt.",
    ),
    p(
      "A kubeconfig maps context names to a cluster, user and optional namespace. Names are local aliases, not proof of the remote target. Explicit --kubeconfig and --context avoid reliance on a mutable current-context or merged KUBECONFIG precedence. A kubeconfig may contain administrator credentials or executable credential plugins: accept only trusted files and never print --raw output into logs. In production prefer separate scoped credentials, not a universally privileged fleet identity.",
      "Un kubeconfig relie un nom de contexte à un cluster, un utilisateur et éventuellement un namespace. Les noms sont des alias locaux, pas la preuve de la cible distante. --kubeconfig et --context explicites évitent current-context mutable et priorité d’un KUBECONFIG fusionné. Un kubeconfig peut contenir des identifiants administrateur ou plugins exécutables : n’utilisez que des fichiers fiables et ne versez jamais --raw dans les logs. En production, préférez des identifiants séparés et limités plutôt qu’une identité de flotte universellement privilégiée.",
    ),
    h(
      "lab-preparation",
      "Two optional disposable single-node clusters",
      "Deux clusters jetables optionnels à un nœud",
    ),
    note(
      "warn",
      l("Additional local capacity", "Capacité locale supplémentaire"),
      l(
        "Only the learner creates these clusters. Expect roughly 4 CPU / 6 GiB available for the two small clusters, in addition to any other running lab. kind 0.31.0, Kubernetes 1.35.0 and registry access are required. Check kind get clusters first and stop if fleet-a or fleet-b already belongs to another task. Both clusters still share one Docker host: this cannot demonstrate regional or physical disaster tolerance.",
        "Seul l’apprenant crée ces clusters. Prévoyez environ 4 CPU / 6 GiB disponibles pour les deux petits clusters, en plus des autres labs actifs. kind 0.31.0, Kubernetes 1.35.0 et accès registre sont requis. Examinez d’abord kind get clusters et arrêtez-vous si fleet-a ou fleet-b appartient déjà à un autre travail. Les deux partagent l’hôte Docker : cela ne démontre aucune tolérance à un sinistre physique ou régional.",
      ),
    ),
    code(
      "bash",
      'kind get clusters\numask 077\nfleet_dir=$(mktemp -d)\nkind create cluster --name fleet-a --image kindest/node:v1.35.0 --config lab/level-4/multi-cluster/kind.yaml --kubeconfig "$fleet_dir/a.kubeconfig"\nkind create cluster --name fleet-b --image kindest/node:v1.35.0 --config lab/level-4/multi-cluster/kind.yaml --kubeconfig "$fleet_dir/b.kubeconfig"\nka() { kubectl --kubeconfig "$fleet_dir/a.kubeconfig" --context kind-fleet-a "$@"; }\nkb() { kubectl --kubeconfig "$fleet_dir/b.kubeconfig" --context kind-fleet-b "$@"; }',
    ),
    p(
      "These commands write dedicated temporary kubeconfigs rather than changing your normal current context. Keep the directory variable and functions in this shell. The minimal kind clusters schedule demo workloads on their single node; they are not production HA layouts. If a creation fails, inspect kind output and remove only a newly created cluster you own before retrying; do not overwrite existing fleet names.",
      "Ces commandes écrivent des kubeconfigs temporaires dédiés au lieu de changer votre contexte habituel. Gardez variable et fonctions dans ce shell. Les clusters kind minimaux placent le workload sur leur nœud unique ; ce n’est pas une architecture HA de production. Si la création échoue, examinez la sortie et retirez seulement un nouveau cluster vous appartenant avant de réessayer ; n’écrasez pas des noms existants.",
    ),
    code(
      "bash",
      "ka cluster-info\nkb cluster-info\nka get namespace kube-system -o jsonpath='{.metadata.uid}'\nkb get namespace kube-system -o jsonpath='{.metadata.uid}'\nka create namespace lab-fleet\nkb create namespace lab-fleet",
    ),
    p(
      "Expected: different API endpoints and kube-system namespace UIDs. Those observations support that two independent API stores are being addressed. The same printed context nickname alone would not establish that. Each function selects a context and file; every following namespaced command also supplies -n lab-fleet.",
      "Attendu : endpoints API et UID de kube-system distincts. Ces observations étayent l’accès à deux magasins API indépendants. Un simple surnom de contexte affiché ne le démontrerait pas. Chaque fonction fixe contexte et fichier ; chaque commande namespacée suivante fournit aussi -n lab-fleet.",
    ),
    h(
      "intent",
      "Apply one reviewed contract in two waves",
      "Appliquer un contrat examiné en deux vagues",
    ),
    code("yaml", web, "lab/level-4/multi-cluster/web.yaml"),
    code(
      "bash",
      "ka -n lab-fleet apply -f lab/level-4/multi-cluster/web.yaml\nka -n lab-fleet rollout status deployment/web --timeout=120s\nka -n lab-fleet get endpointslices -l kubernetes.io/service-name=web\nkb -n lab-fleet apply -f lab/level-4/multi-cluster/web.yaml\nkb -n lab-fleet rollout status deployment/web --timeout=120s\nkb -n lab-fleet get endpointslices -l kubernetes.io/service-name=web",
    ),
    p(
      "For this manual exercise, inspect a ready endpoint in A before proceeding to B. In a real fleet, add application acceptance, error budgets, security checks and policy/version compatibility; Ready alone is too weak a promotion gate. This is deliberately manual distribution, not evidence of an installed GitOps fleet controller. ClusterIP addresses and service DNS may overlap and remain local; shared names do not make cross-cluster requests work.",
      "Pour cet exercice manuel, vérifiez un endpoint prêt dans A avant B. Pour une vraie flotte, ajoutez acceptation applicative, budgets d’erreurs, contrôles sécurité et compatibilité politiques/versions ; Ready seul est un critère insuffisant. La distribution est volontairement manuelle, pas la preuve d’un contrôleur GitOps installé. Les ClusterIP et DNS peuvent se recouvrir et restent locaux ; partager les noms ne permet pas les requêtes entre clusters.",
    ),
    h("drift", "Distinguish drift from cluster failure", "Distinguer dérive et panne du cluster"),
    code(
      "bash",
      "kb -n lab-fleet scale deployment/web --replicas=2\nka -n lab-fleet get deployment web\nkb -n lab-fleet get deployment web\nkb -n lab-fleet diff -f lab/level-4/multi-cluster/web.yaml\nkb -n lab-fleet apply -f lab/level-4/multi-cluster/web.yaml\nkb -n lab-fleet rollout status deployment/web --timeout=120s",
    ),
    p(
      "Expected: B temporarily diverges to two replicas; diff exits 1 to report a difference, not a transport failure. Reapplying the authoritative file restores one. A fleet inventory should track desired revision, actual revision, health and last successful reconciliation separately. Before an emergency manual change under GitOps, account for the controller that could immediately reverse it. Fleet health must distinguish unreachable API, incompatible policy, drift and a degraded application rather than one red status.",
      "Attendu : B diverge temporairement à deux réplicas ; diff sort avec 1 pour signaler une différence, pas une panne de transport. Réappliquer le fichier rétablit un réplica. L’inventaire doit distinguer révision voulue, révision réelle, santé et dernière réconciliation réussie. Avant un changement manuel d’urgence sous GitOps, prenez en compte le contrôleur susceptible de l’annuler immédiatement. La santé de flotte distingue API injoignable, politique incompatible, dérive et application dégradée plutôt qu’un unique statut rouge.",
    ),
    h(
      "architecture",
      "Traffic and data need their own recovery design",
      "Trafic et données exigent leur propre reprise",
    ),
    p(
      "A second healthy Deployment does not replicate user data, DNS failover, sessions, certificate trust or external dependencies. Define active/passive versus active/active ownership, write conflict handling, RPO/RTO and tested traffic switching. Avoid stretching one consensus cluster over unreliable distant links merely to call it multi-cluster. Prefer independent control-plane failure boundaries with explicit application recovery contracts. This local lab has neither a global load balancer nor replicated storage and claims no automatic failover.",
      "Un second Deployment sain ne réplique ni données utilisateur, ni bascule DNS, ni sessions, ni confiance des certificats, ni dépendances externes. Définissez ownership actif/passif ou actif/actif, conflits d’écriture, RPO/RTO et bascule testée. Évitez d’étirer un consensus sur des liens lointains peu fiables pour l’appeler multi-cluster. Préférez des frontières de control plane indépendantes avec contrats de reprise applicatifs explicites. Ce lab n’a ni équilibreur global ni stockage répliqué et ne revendique aucune bascule automatique.",
    ),
    h("quiz", "Check the boundary", "Vérifier la frontière"),
    quiz(
      question(
        l(
          "What proves more than a context nickname?",
          "Qu’est-ce qui étaye davantage qu’un surnom de contexte ?",
        ),
        [
          l(
            "Explicit config/context plus inspected endpoint and cluster identity",
            "Config/contexte explicites et endpoint/identité examinés",
          ),
          l("The terminal tab's color", "La couleur du terminal"),
          l("Identical namespace names", "Des namespaces de même nom"),
        ],
        0,
        l(
          "Aliases can point anywhere; verify the actual target before a mutation.",
          "Les alias peuvent pointer partout ; vérifiez la cible réelle avant mutation.",
        ),
      ),
      question(
        l(
          "Does one healthy deployment per cluster prove data failover?",
          "Un déploiement sain par cluster prouve-t-il la bascule des données ?",
        ),
        [
          l("Yes, Kubernetes copies every PVC", "Oui, Kubernetes copie tous les PVC"),
          l(
            "No, replication and traffic recovery are separate designs",
            "Non, réplication et reprise du trafic sont distinctes",
          ),
          l("Only when Service names match", "Seulement si les Services portent le même nom"),
        ],
        1,
        l(
          "Independent control planes do not automatically synchronize application state.",
          "Des control planes indépendants ne synchronisent pas automatiquement l’état applicatif.",
        ),
      ),
      question(
        l(
          "Why promote a wave only after acceptance?",
          "Pourquoi promouvoir une vague seulement après acceptation ?",
        ),
        [
          l("To make image tags immutable", "Pour rendre les tags immuables"),
          l("To merge every cluster DNS zone", "Pour fusionner les zones DNS"),
          l(
            "To contain a shared bad change before it reaches every cluster",
            "Pour contenir un mauvais changement avant toute la flotte",
          ),
        ],
        2,
        l(
          "Common desired state is also a common failure vector without staged verification.",
          "Un état voulu commun est aussi un vecteur de panne commun sans vérification progressive.",
        ),
      ),
    ),
    challenge(
      l("Contain a failed canary in B", "Contenir un canari échoué dans B"),
      l(
        "Inject an invalid image only in B, inspect the failure and demonstrate A remains available. Restore B from rollout history, and explain what the single-host setup cannot prove.",
        "Injectez une image invalide uniquement dans B, diagnostiquez puis démontrez que A reste disponible. Restaurez B depuis l’historique et expliquez la limite du même hôte.",
      ),
      [
        l(
          "Use kb explicitly for the mutation and ka for the independent observation.",
          "Utilisez explicitement kb pour modifier et ka pour observer l’autre cible.",
        ),
        l(
          "Image-pull failure is different from an unreachable cluster API.",
          "Une erreur d’image diffère d’une API de cluster injoignable.",
        ),
      ],
      [
        code(
          "bash",
          "kb -n lab-fleet set image deployment/web web=nginxinc/nginx-unprivileged:missing-lab-tag\nkb -n lab-fleet rollout status deployment/web --timeout=30s\nkb -n lab-fleet describe pods -l app=fleet-web\nka -n lab-fleet rollout status deployment/web --timeout=120s\nkb -n lab-fleet rollout undo deployment/web\nkb -n lab-fleet rollout status deployment/web --timeout=120s",
        ),
        p(
          "Expected: B reports an image retrieval failure while A retains a healthy desired revision. Existing B replicas may keep serving under its rollout budget: a stalled update is not necessarily a total outage. Both still fail together if the host disappears, so the result proves change scope only.",
          "Attendu : B signale un échec d’image tandis que A garde sa révision saine. Les anciens réplicas B peuvent encore servir selon le budget du rollout : mise à jour bloquée ne signifie pas toujours panne totale. Les deux tombent si l’hôte disparaît ; le résultat prouve seulement la portée du changement.",
        ),
      ],
    ),
    h("cleanup", "Clean up each owned target", "Nettoyer chaque cible détenue"),
    code(
      "bash",
      'ka delete namespace lab-fleet\nkb delete namespace lab-fleet\nkind delete cluster --name fleet-a --kubeconfig "$fleet_dir/a.kubeconfig"\nkind delete cluster --name fleet-b --kubeconfig "$fleet_dir/b.kubeconfig"\nprintf "Inspect and manually remove private kubeconfigs: %s\\n" "$fleet_dir"',
    ),
    p(
      "Delete these clusters only if created for this exercise; the original k8s-ops-lab is untouched. Remove the temporary kubeconfigs manually after cleanup because they contain privileged local credentials. No external DNS, traffic routing or cloud resource was changed.",
      "Supprimez ces clusters seulement s’ils ont été créés pour cet exercice ; k8s-ops-lab reste intact. Retirez ensuite manuellement les kubeconfigs temporaires, qui contiennent des identifiants locaux privilégiés. Aucun DNS externe, routage global ou ressource cloud n’a été modifié.",
    ),
  ],
};
