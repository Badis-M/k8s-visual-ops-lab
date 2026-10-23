import type { Chapter } from "../types";
import {
  l,
  h,
  p,
  code,
  note,
  list,
  labContext,
  steps,
  quiz,
  question,
  challenge,
} from "../lesson-kit";
import argo from "../../../lab/level-3/gitops/argocd.yaml?raw";
import flux from "../../../lab/level-3/gitops/flux.yaml?raw";
import app from "../../../lab/level-3/gitops/app/kustomization.yaml?raw";

export const gitops: Chapter = {
  id: "gitops",
  level: 3,
  minutes: 80,
  title: l("GitOps with Argo CD and Flux", "GitOps avec Argo CD et Flux"),
  summary: l(
    "Trace a reviewed commit through source, rendering, apply and health; configure two separate reconciliation paths with explicit ownership and deletion policies.",
    "Suivre un commit examiné de la source au rendu, à l’application et à la santé ; configurer deux parcours de réconciliation aux responsabilités et suppressions explicites.",
  ),
  prerequisites: ["kustomize", "rbac", "helm-releases"],
  related: ["platform-engineering", "incidents", "security-hardening"],
  heavy: l(
    "Live paths require an extra controller stack and a readable Git remote. Offline rendering and configuration generation require neither installation nor cluster access.",
    "Les parcours réels demandent une pile de contrôleurs et un dépôt Git lisible. Rendu et génération de configuration hors ligne ne nécessitent ni installation ni accès cluster.",
  ),
  blocks: [
    h(
      "objectives",
      "Separate delivery intent from runtime success",
      "Séparer intention de livraison et succès réel",
    ),
    list(
      l(
        "Distinguish source retrieval, manifest rendering, reconciliation, pruning and application health.",
        "Distinguer lecture de source, rendu, réconciliation, suppression des absents et santé applicative.",
      ),
      l(
        "Configure Argo CD and Flux against the same reviewed source without making them own the same resources.",
        "Configurer Argo CD et Flux depuis la même source examinée sans leur donner les mêmes ressources à gérer.",
      ),
    ),
    h(
      "model",
      "Git is an input; controllers close the loop",
      "Git est une entrée ; les contrôleurs ferment la boucle",
    ),
    p(
      "GitOps continuously compares a declared versioned state with observed API resources. CI usually builds and tests artifacts; the GitOps controller fetches approved inputs and reconciles them using its cluster credentials. A successful Git push proves only repository acceptance, not rendering, API admission or runtime health. Trace a specific commit through each stage. A webhook can reduce fetch latency but does not replace reconciliation or make delivery instantaneous.",
      "GitOps compare continuellement un état déclaré et versionné aux ressources API observées. La CI construit et teste généralement les artefacts ; le contrôleur GitOps récupère les entrées approuvées et les réconcilie avec ses identifiants cluster. Un push réussi prouve seulement l’acceptation du dépôt, pas rendu, admission ou santé. Suivez un commit précis à chaque étape. Un webhook peut réduire la latence de lecture sans remplacer la réconciliation ni rendre la livraison instantanée.",
    ),
    {
      type: "table",
      head: [l("Responsibility", "Responsabilité"), l("Argo CD", "Argo CD"), l("Flux", "Flux")],
      rows: [
        [
          l("Source and desired objects", "Source et objets désirés"),
          l(
            "Application points to repository, revision and path",
            "Application indique dépôt, révision et chemin",
          ),
          l(
            "GitRepository produces an artifact; Kustomization consumes it",
            "GitRepository produit un artefact consommé par Kustomization",
          ),
        ],
        [
          l("Policy boundary", "Frontière de politique"),
          l(
            "AppProject restricts source, destination and allowed kinds",
            "AppProject limite source, destination et kinds",
          ),
          l(
            "Kustomization impersonates a narrowly scoped ServiceAccount",
            "Kustomization emprunte une ServiceAccount aux droits ciblés",
          ),
        ],
        [
          l("State versus health", "État et santé"),
          l("Synced and Healthy are separate signals", "Synced et Healthy sont deux signaux"),
          l(
            "Source Ready and apply/health Ready belong to separate objects",
            "Ready de source et Ready d’application/santé appartiennent à deux objets",
          ),
        ],
      ],
    },
    h(
      "prerequisites",
      "Choose a controller path explicitly",
      "Choisir explicitement le parcours de contrôleur",
    ),
    p(
      "The standard kind lab does not include GitOps controllers or their CRDs. For a live exercise, separately install and review Argo CD 3.5.6 in argocd or Flux 2.9.6 with source-controller and kustomize-controller watching the exercise namespace. Pinned upstream artifacts and prerequisites are in lab/level-3/gitops/README.md. Their installation can create cluster-wide roles and CRDs; it is a separate administrator action. Size extra laptop resources from the chosen stack's requests. Both projects document support/testing for Kubernetes 1.35; this repository does not claim to have run those installations.",
      "Le lab kind standard ne contient ni contrôleurs GitOps ni leurs CRD. Pour un exercice réel, installez et examinez séparément Argo CD 3.5.6 dans argocd ou Flux 2.9.6 avec source-controller et kustomize-controller surveillant le namespace d’exercice. Artefacts upstream fixés et prérequis sont dans lab/level-3/gitops/README.md. Leur installation peut créer rôles de cluster et CRD : c’est une action administrateur distincte. Dimensionnez les ressources supplémentaires depuis les requests choisies. Les deux projets documentent prise en charge/tests pour Kubernetes 1.35 ; ce dépôt ne prétend pas avoir exécuté ces installations.",
    ),
    note(
      "warn",
      l("One owner per target", "Un seul responsable par cible"),
      l(
        "Argo deploys into lab-gitops-argo and Flux into lab-gitops-flux. Do not point both at the same objects or let a human/CI/Helm independently manage those same fields. Argo's project policy constrains delivery scope but is not a replacement for hardening its controller credentials. The Flux example additionally uses a namespaced Role that cannot create Secrets, cluster roles or Namespaces.",
        "Argo déploie dans lab-gitops-argo et Flux dans lab-gitops-flux. Ne les faites pas gérer les mêmes objets avec, en parallèle, un humain, une CI ou Helm modifiant les mêmes champs. Le projet Argo limite la portée de livraison sans remplacer le durcissement des identifiants de son contrôleur. L’exemple Flux utilise aussi un Role de namespace incapable de créer Secrets, rôles de cluster ou Namespaces.",
      ),
    ),
    h(
      "offline",
      "Render the same application without GitOps",
      "Rendre la même application sans GitOps",
    ),
    code("yaml", app, "lab/level-3/gitops/app/kustomization.yaml"),
    code("bash", "kubectl kustomize lab/level-3/gitops/app"),
    p(
      "The output is the preceding Kustomize base with a gitops- prefix and a distinct page. It needs no CRDs to render. Live delivery requires this app directory and its referenced base to exist in a remote commit readable from inside the cluster; a local unpushed commit is insufficient. Use a public non-sensitive exercise repository or separately configured read-only credentials. A Git access token is never a value to commit into these source files.",
      "Le rendu reprend la base Kustomize précédente avec le préfixe gitops- et une page distincte. Il ne demande aucune CRD. La livraison réelle exige que le dossier et sa base existent dans un commit distant lisible depuis le cluster ; un commit local non poussé ne suffit pas. Utilisez un dépôt d’exercice public sans données sensibles ou des identifiants de lecture configurés séparément. Un token Git ne doit jamais être versionné dans ces sources.",
    ),
    code(
      "bash",
      'git status --short\nLAB_GITOPS_REPO_URL=$(git remote get-url origin)\nLAB_GITOPS_COMMIT=$(git rev-parse HEAD)\nLAB_GITOPS_OUTPUT_DIR=$(mktemp -d)\nprintf \'GitOps configuration directory: %s\\n\' "$LAB_GITOPS_OUTPUT_DIR"\npython3 lab/level-3/gitops/configure.py --repository "$LAB_GITOPS_REPO_URL" --commit "$LAB_GITOPS_COMMIT" --output-dir "$LAB_GITOPS_OUTPUT_DIR"',
    ),
    p(
      "Run configuration generation only after your reviewed commit containing the exercise has been pushed by you. If origin uses SSH, supply the equivalent credential-free HTTPS Git URL instead; the generator rejects embedded credentials and invalid SHAs. It writes temporary Argo/Flux files without contacting a remote or proving that the commit exists there. Keep these variables in the same shell. Existing outputs are refused: create a new private directory for each reviewed revision. Full commit pinning prevents a moving branch from changing this lesson's input unexpectedly; promotion requires updating the pin explicitly.",
      "Générez la configuration seulement après avoir vous-même poussé le commit examiné contenant l’exercice. Si origin utilise SSH, fournissez l’URL Git HTTPS équivalente sans identifiants ; le générateur refuse credentials intégrés et SHA invalides. Il écrit des fichiers temporaires sans contacter de serveur ni prouver la présence distante du commit. Gardez ces variables dans le même shell. Les sorties existantes sont refusées : créez un nouveau répertoire privé par révision examinée. Le SHA complet empêche une branche mobile de changer silencieusement l’entrée ; une promotion exige de modifier ce pin explicitement.",
    ),
    ...labContext("lab-gitops-argo"),
    h(
      "argo",
      "Argo CD: source, destination and policy",
      "Argo CD : source, destination et politique",
    ),
    code("yaml", argo, "lab/level-3/gitops/argocd.yaml — source template"),
    steps({
      title: l(
        "Apply only after the controller prerequisite is met",
        "Appliquer seulement après le prérequis contrôleur",
      ),
      code: {
        lang: "bash",
        code: 'k get crd applications.argoproj.io appprojects.argoproj.io\nk -n argocd get deployments,statefulsets\nk apply -f "$LAB_GITOPS_OUTPUT_DIR/argocd.yaml"\nk -n argocd get application academy-lab -o yaml\nk -n lab-gitops-argo get deployment,service,configmap',
      },
      explain: l(
        "Stop on missing CRDs or an unavailable stack. Inspect the Application's sync revision, sync status, health and conditions. Automated selfHeal repairs live drift; prune removes previously managed objects absent from the source, while allowEmpty: false guards against automatically emptying the entire app.",
        "Arrêtez-vous si CRD ou pile manquent. Inspectez révision synchronisée, sync, health et conditions de l’Application. selfHeal répare la dérive réelle ; prune retire les objets auparavant gérés absents de la source, tandis que allowEmpty: false protège contre un vidage automatique complet.",
      ),
      expected: {
        text: l(
          "Expected after successful reconciliation: Synced to your pinned SHA, Healthy, and gitops-web ready in lab-gitops-argo. These are observations to verify, not recorded results.",
          "Attendu après réussite : Synced vers votre SHA fixé, Healthy et gitops-web prêt dans lab-gitops-argo. Ce sont des observations à vérifier, pas des résultats enregistrés.",
        ),
      },
    }),
    h(
      "flux",
      "Flux: source artifact and scoped application",
      "Flux : artefact source et application ciblée",
    ),
    code("yaml", flux, "lab/level-3/gitops/flux.yaml — source template"),
    steps({
      title: l(
        "Create the namespace and restricted identity",
        "Créer le namespace et l’identité limitée",
      ),
      code: {
        lang: "bash",
        code: 'k get crd gitrepositories.source.toolkit.fluxcd.io kustomizations.kustomize.toolkit.fluxcd.io\nk -n flux-system get deployments\nk create namespace lab-gitops-flux\nk apply -f lab/level-3/gitops/flux-rbac.yaml\nk apply -f "$LAB_GITOPS_OUTPUT_DIR/flux.yaml"\nk -n lab-gitops-flux wait --for=condition=Ready gitrepository/academy-source --timeout=120s\nk -n lab-gitops-flux wait --for=condition=Ready kustomizations.kustomize.toolkit.fluxcd.io/academy-lab --timeout=180s\nk -n lab-gitops-flux get gitrepositories,kustomizations -o yaml\nk -n lab-gitops-flux get deployment,service,configmap',
      },
      explain: l(
        "The source's Ready condition proves retrieval, not application readiness. The Kustomization checks the artifact path, applies through gitops-applier and waits for workload health. targetNamespace must already exist; the restricted identity cannot create it. Here Kustomization is a Flux API object, distinct from the local Kustomize build file.",
        "Ready de la source prouve la lecture, pas la disponibilité applicative. Kustomization vérifie le chemin de l’artefact, applique avec gitops-applier puis attend la santé du workload. targetNamespace doit exister ; l’identité limitée ne peut pas le créer. Kustomization est ici un objet API Flux, distinct du fichier local de construction Kustomize.",
      ),
      expected: {
        text: l(
          "Expected: both Flux objects become Ready and their status identifies the pinned source revision. A valid source with apply Forbidden is a permissions problem, not a Git download failure.",
          "Attendu : les deux objets Flux deviennent Ready avec la révision fixée. Une source valide suivie d’un Forbidden à l’application indique un problème de droits, pas un échec de téléchargement Git.",
        ),
      },
    }),
    h(
      "drift",
      "Observe drift repair and follow the right failure stage",
      "Observer la réparation et suivre la bonne étape en échec",
    ),
    p(
      "Choose the following block for the controller path you installed. They are alternatives, not consecutive steps. Stop its watch with Ctrl+C once you have observed the correction; a watch does not return to the shell by itself.",
      "Choisissez le bloc suivant correspondant au contrôleur installé. Ce sont des alternatives, pas des étapes successives. Arrêtez son watch avec Ctrl+C après avoir observé la correction ; il ne rend pas spontanément la main au shell.",
    ),
    code(
      "bash",
      "# Argo alternative: run only if you installed this path.\nk -n lab-gitops-argo scale deployment/gitops-web --replicas=3\nk -n lab-gitops-argo get deployment gitops-web --watch",
    ),
    code(
      "bash",
      "# Flux alternative: run only if you installed this path.\nk -n lab-gitops-flux scale deployment/gitops-web --replicas=3\nk -n lab-gitops-flux get deployment gitops-web --watch",
    ),
    p(
      "Stop each watch with Ctrl+C. The controller should eventually restore one desired replica; do not assume a fixed number of seconds. For failures, follow retrieval/authentication → revision/path → build/schema → RBAC/admission → workload readiness. Inspect object conditions and Events before changing Git. Flux corrects drift during reconciliation; Argo requires the configured self-heal policy. Emergency changes need an explicit pause plus a matching Git fix, otherwise reconciliation may undo them. Encrypted secret delivery such as SOPS requires key management and controller configuration; base64 Secret manifests alone are not safe Git content.",
      "Arrêtez chaque watch avec Ctrl+C. Le contrôleur doit finir par rétablir un réplica désiré ; ne supposez pas de délai fixe. Pour dépanner, suivez lecture/authentification → révision/chemin → build/schéma → RBAC/admission → readiness. Examinez conditions et Events avant de modifier Git. Flux corrige à la réconciliation ; Argo utilise ici self-heal. Une intervention urgente exige une pause explicite puis une correction Git concordante, sinon elle peut être annulée. Livrer des secrets chiffrés avec SOPS exige clés et configuration du contrôleur ; un Secret en base64 n’est pas un contenu Git sûr.",
    ),
    h("quiz", "Check ownership and evidence", "Vérifier responsabilité et preuves"),
    quiz(
      question(
        l(
          "Flux GitRepository is Ready but Kustomization is Forbidden. Which stage failed?",
          "GitRepository Flux est Ready mais Kustomization reçoit Forbidden. Quelle étape échoue ?",
        ),
        [
          l(
            "Application authorization after source retrieval",
            "L’autorisation d’application après lecture de la source",
          ),
          l("Git commit creation", "La création du commit Git"),
          l("The browser's local progress storage", "Le stockage de progression du navigateur"),
        ],
        0,
        l(
          "A fetched artifact does not grant apply permissions to the reconciler identity.",
          "Un artefact récupéré n’accorde pas des droits d’application à l’identité du réconciliateur.",
        ),
      ),
      question(
        l(
          "Why should Argo CD and Flux use different target namespaces here?",
          "Pourquoi Argo CD et Flux visent-ils ici deux namespaces ?",
        ),
        [
          l("Git permits only one reader", "Git n’autorise qu’un lecteur"),
          l(
            "Two writers must not fight over the same managed objects",
            "Deux responsables ne doivent pas se disputer les mêmes objets",
          ),
          l("Kubernetes forbids two controllers", "Kubernetes interdit deux contrôleurs"),
        ],
        1,
        l(
          "Separate targets preserve a clear desired-state owner and make drift repair understandable.",
          "Des cibles distinctes gardent un responsable clair de l’état désiré et rendent la réparation compréhensible.",
        ),
      ),
      question(
        l(
          "Does prune remove every unrelated object in the namespace?",
          "prune supprime-t-il tous les objets étrangers du namespace ?",
        ),
        [
          l("Yes, namespaces must be empty", "Oui, les namespaces doivent être vides"),
          l("It also deletes all Git history", "Il supprime aussi l’historique Git"),
          l(
            "It operates on tracked managed resources absent from the desired source",
            "Il agit sur les ressources suivies absentes de la source désirée",
          ),
        ],
        2,
        l(
          "Inventory/tracking defines the deletion set. This still makes source removal a potentially destructive change requiring review.",
          "L’inventaire définit l’ensemble supprimable. Retirer une ressource de la source reste donc une modification potentiellement destructive à examiner.",
        ),
      ),
    ),
    h(
      "challenge",
      "Roll back intent without rewriting history",
      "Revenir sur l’intention sans réécrire l’historique",
    ),
    challenge(
      l("A bad application commit", "Un mauvais commit applicatif"),
      l(
        "A reviewed application change is unhealthy and auto-reconciliation is enabled. Describe recovery through a new Git revert commit and explicit promotion of its SHA. Explain why kubectl rollout undo alone and a database rollback claim would be insufficient.",
        "Une modification applicative examinée est malsaine et la réconciliation automatique active. Décrivez la récupération par un nouveau commit Git revert puis promotion explicite de son SHA. Expliquez pourquoi kubectl rollout undo seul et une promesse de restauration de base seraient insuffisants.",
      ),
      [
        l(
          "The fixed source SHA will not follow a new branch commit automatically.",
          "Le SHA fixé ne suit pas automatiquement un nouveau commit de branche.",
        ),
        l(
          "Argo documents that application rollback cannot be performed while automated sync is enabled.",
          "Argo documente qu’un rollback applicatif ne peut être exécuté avec la synchronisation automatique active.",
        ),
      ],
      [
        p(
          "Review the bad change, create and push a revert commit yourself, render that commit's app and validate it. Regenerate temporary configuration with the new full SHA and apply only the chosen controller path. Verify observed revision, health and an HTTP request independently. The controller may undo a live rollout undo because Git still requests the bad template. Manifest recovery does not reverse data migrations; follow a separately tested data recovery plan if needed. During an emergency, pause the appropriate reconciler deliberately and document resumption rather than leaving two competing desired states.",
          "Examinez le changement, créez et poussez vous-même un commit de revert, rendez son application et validez-la. Régénérez la configuration avec le nouveau SHA complet et appliquez seulement le parcours choisi. Vérifiez séparément révision observée, santé et requête HTTP. Le contrôleur peut annuler un rollout undo réel puisque Git demande encore le mauvais template. Récupérer les manifests n’annule pas les migrations ; suivez un plan de données testé séparément si nécessaire. En urgence, suspendez explicitement le bon réconciliateur et documentez sa reprise plutôt que de laisser deux états désirés concurrents.",
        ),
        code(
          "bash",
          '# After reviewing and pushing the recovery commit yourself:\nLAB_GITOPS_COMMIT=$(git rev-parse HEAD)\nLAB_GITOPS_OUTPUT_DIR=$(mktemp -d)\nprintf \'Recovery configuration directory: %s\\n\' "$LAB_GITOPS_OUTPUT_DIR"\npython3 lab/level-3/gitops/configure.py --repository "$LAB_GITOPS_REPO_URL" --commit "$LAB_GITOPS_COMMIT" --output-dir "$LAB_GITOPS_OUTPUT_DIR"\n# Apply only the generated file for your selected controller path.',
        ),
      ],
    ),
    h(
      "cleanup",
      "Detach reconciliation before deleting its target",
      "Détacher la réconciliation avant de supprimer sa cible",
    ),
    p(
      "Run only the cleanup for paths you installed. This Argo Application has no cascading deletion finalizer, and Flux explicitly uses deletionPolicy: Orphan: deleting those control objects leaves the app for the subsequent deliberate namespace deletion. Neither path manages its controller installation. Shared CRDs, cluster roles and the controller stack remain administrator-owned; never delete them merely to clean this app lab. If you created the preparation namespace but skipped Argo, remove that empty dedicated namespace too.",
      "Nettoyez seulement les parcours installés. Cette Application Argo n’a pas de finalizer de suppression en cascade et Flux utilise deletionPolicy: Orphan : supprimer ces objets laisse l’application pour la suppression explicite du namespace ensuite. Aucun parcours ne gère l’installation du contrôleur. CRD, rôles de cluster et pile partagés restent sous responsabilité administrateur ; ne les supprimez pas pour nettoyer ce lab applicatif. Si vous avez créé le namespace de préparation sans utiliser Argo, retirez aussi cet espace dédié vide.",
    ),
    code(
      "bash",
      "# Argo cleanup: run only if you installed this path.\nk -n argocd delete application academy-lab\nk -n argocd delete appproject academy-lab\nk delete namespace lab-gitops-argo",
    ),
    code(
      "bash",
      "# Flux cleanup: run only if you installed this path.\nk -n lab-gitops-flux delete kustomizations.kustomize.toolkit.fluxcd.io academy-lab\nk -n lab-gitops-flux delete gitrepository academy-source\nk delete namespace lab-gitops-flux",
    ),
    p(
      "The printed configuration directories are local artifacts, separate from cluster cleanup. Inspect them and manually remove only the temporary copies created by this exercise. Controller installations remain administrator-owned.",
      "Les répertoires de configuration affichés sont des artefacts locaux, distincts du nettoyage cluster. Examinez-les puis retirez manuellement uniquement les copies temporaires de cet exercice. Les installations de contrôleurs restent sous responsabilité administrateur.",
    ),
  ],
};
