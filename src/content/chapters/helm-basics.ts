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
import chart from "../../../lab/level-2/helm-basics/chart/Chart.yaml?raw";
import values from "../../../lab/level-2/helm-basics/chart/values.yaml?raw";
import deployment from "../../../lab/level-2/helm-basics/chart/templates/deployment.yaml?raw";
import overrides from "../../../lab/level-2/helm-basics/values-lab.yaml?raw";

export const helmBasics: Chapter = {
  id: "helm-basics",
  level: 2,
  minutes: 55,
  title: l("Helm fundamentals", "Les bases de Helm"),
  summary: l(
    "Render a local chart, install a named release, understand values and inspect a reversible upgrade.",
    "Rendre un chart local, installer une release nommée, comprendre les values et examiner une mise à jour réversible.",
  ),
  prerequisites: ["deployments", "services", "rollbacks"],
  related: ["helm-charts", "helm-releases", "gitops"],
  blocks: [
    h("objectives", "Read the package before installing it", "Lire le paquet avant de l’installer"),
    list(
      l(
        "Distinguish chart version, application version and release revision.",
        "Distinguer version du chart, version applicative et révision de release.",
      ),
      l(
        "Trace an override through rendered YAML to the live resource, then reverse the change.",
        "Suivre une surcharge jusqu’au YAML rendu puis à la ressource réelle, et inverser le changement.",
      ),
    ),
    h(
      "mental-model",
      "Chart plus values produces manifests",
      "Un chart et ses values produisent des manifests",
    ),
    p(
      "A chart packages templates and defaults. Helm renders them into Kubernetes objects; a release is a named installation in a namespace with revision history. Kubernetes controllers still run the workloads. Helm is a CLI package manager, not a continuously reconciling GitOps controller: a manual kubectl change can drift until another operation addresses it. Inspect unfamiliar charts as executable deployment inputs, including RBAC, hooks, CRDs and external images.",
      "Un chart regroupe des templates et des valeurs par défaut. Helm les rend en objets Kubernetes ; une release est une installation nommée dans un namespace avec un historique de révisions. Les contrôleurs Kubernetes continuent d’exécuter les workloads. Helm est un gestionnaire de paquets en ligne de commande, pas un contrôleur GitOps qui réconcilie en permanence : une modification manuelle kubectl peut persister jusqu’à une autre opération. Examinez les charts inconnus comme des entrées de déploiement, notamment leurs RBAC, hooks, CRD et images externes.",
    ),
    p(
      "Chart.yaml version identifies the package; appVersion is descriptive metadata and does not automatically select a container image. A release revision increases with upgrades and rollbacks independently of those versions. Defaults in values.yaml can be overridden with -f files, then --set. With repeated files the rightmost wins. Keep intended configuration in reviewable files; a forgotten terminal override is difficult to reproduce.",
      "version dans Chart.yaml identifie le paquet ; appVersion est une métadonnée descriptive qui ne sélectionne pas automatiquement une image de conteneur. Une révision de release augmente avec les upgrades et rollbacks indépendamment de ces versions. Les valeurs par défaut de values.yaml sont surchargées par les fichiers -f, puis par --set. Avec plusieurs fichiers, le plus à droite prévaut. Conservez la configuration voulue dans des fichiers relisibles ; une surcharge oubliée dans le terminal est difficile à reproduire.",
    ),
    note(
      "info",
      l("Deliberate client baseline", "Version cliente choisie"),
      l(
        "Use Helm 4.3.1, checked against the official release and support matrix on 2026-10-22: Helm 4.3 supports Kubernetes 1.34–1.37, including this 1.35 lab. Install the reviewed official binary yourself if needed. Helm 4 changes some flags; this lesson uses --rollback-on-failure, not the older --atomic workflow. No chart repository or additional cluster controller is required.",
        "Utilisez Helm 4.3.1, vérifié avec la release et la matrice officielles le 2026-10-22 : Helm 4.3 prend en charge Kubernetes 1.34 à 1.37, dont ce lab 1.35. Installez vous-même le binaire officiel vérifié si nécessaire. Helm 4 modifie certains flags ; ce cours utilise --rollback-on-failure, pas l’ancien fonctionnement --atomic. Aucun dépôt de charts ni contrôleur supplémentaire n’est nécessaire.",
      ),
    ),
    ...labContext("lab-helm"),
    h("files", "Inspect this small local package", "Examiner ce petit paquet local"),
    code("yaml", chart, "lab/level-2/helm-basics/chart/Chart.yaml"),
    code("yaml", values, "lab/level-2/helm-basics/chart/values.yaml"),
    code("helm", deployment, "lab/level-2/helm-basics/chart/templates/deployment.yaml"),
    p(
      "The templates/deployment.yaml source above contains Helm Go-template expressions such as {{ .Values.replicaCount }}. It is not a Kubernetes manifest to apply directly. helm template evaluates those expressions and emits ordinary YAML. The release name prefixes both workload and Service names; the same instance label joins the selector and Pod template. The image is built from explicit values, not appVersion. The Service template maps its configurable port to the named http container port. values.schema.json rejects replica counts outside 1–3 before resource submission; it validates input shape, not image existence or available capacity. kubeVersion deliberately limits this teaching chart to the lab's Kubernetes minor.",
      "Le fichier source templates/deployment.yaml ci-dessus contient des expressions Go de Helm comme {{ .Values.replicaCount }}. Ce n’est pas un manifest Kubernetes à appliquer directement. helm template évalue ces expressions et produit du YAML ordinaire. Le nom de release préfixe le workload et le Service ; le même label d’instance relie sélecteur et template de Pod. L’image est construite à partir de values explicites, pas d’appVersion. Le template de Service relie son port configurable au port de conteneur nommé http. values.schema.json rejette un nombre de réplicas hors de 1 à 3 avant l’envoi des ressources ; il valide la forme des entrées, pas l’existence de l’image ni la capacité disponible. kubeVersion limite volontairement ce chart pédagogique à la version mineure du lab.",
    ),
    steps(
      {
        title: l("Render without a cluster write", "Rendre sans écriture sur le cluster"),
        code: {
          lang: "bash",
          code: "helm version --short\nhelm lint lab/level-2/helm-basics/chart --kube-version 1.35.0\nhelm template demo lab/level-2/helm-basics/chart --namespace lab-helm --kube-version 1.35.0\nhelm template demo lab/level-2/helm-basics/chart --namespace lab-helm --kube-version 1.35.0 -f lab/level-2/helm-basics/values-lab.yaml",
        },
        explain: l(
          "Compare the two outputs: defaults render replicas: 1 and Service port: 80; values-lab.yaml renders replicas: 2 and port: 8080, while the container still listens on 80. The {{ ... }} expressions must be absent from both outputs. Local rendering does not query admission controllers or prove the Pod can run. Do not apply this output separately: the next step lets Helm own the release lifecycle.",
          "Comparez les deux sorties : les défauts produisent replicas: 1 et port de Service 80 ; values-lab.yaml produit replicas: 2 et port 8080, tandis que le conteneur écoute toujours sur 80. Les expressions {{ ... }} doivent avoir disparu des deux sorties. Le rendu local ne consulte pas les contrôleurs d’admission et ne prouve pas le démarrage du Pod. N’appliquez pas séparément ce rendu : l’étape suivante confie le cycle de vie de la release à Helm.",
        ),
      },
      {
        title: l("Install the first revision", "Installer la première révision"),
        code: {
          lang: "bash",
          code: "helm install demo lab/level-2/helm-basics/chart --kube-context kind-k8s-ops-lab --namespace lab-helm --wait --timeout 2m\nhelm status demo --kube-context kind-k8s-ops-lab --namespace lab-helm\nhelm get values demo --all --kube-context kind-k8s-ops-lab --namespace lab-helm\nk -n lab-helm get deployment,service",
        },
        explain: l(
          "Expected: release demo revision 1 with one available replica and a Service on port 80, if image retrieval and scheduling succeed. Readiness is a limited application signal, not a full end-to-end test.",
          "Attendu : release demo en révision 1, un réplica disponible et un Service sur le port 80, si téléchargement et placement réussissent. La readiness est un signal applicatif limité, pas un test complet de bout en bout.",
        ),
      },
    ),
    h(
      "upgrade",
      "Apply an explicit desired configuration",
      "Appliquer une configuration voulue explicite",
    ),
    code("yaml", overrides, "lab/level-2/helm-basics/values-lab.yaml"),
    code(
      "bash",
      "helm upgrade demo lab/level-2/helm-basics/chart --kube-context kind-k8s-ops-lab --namespace lab-helm --reset-values -f lab/level-2/helm-basics/values-lab.yaml --wait --timeout 2m --rollback-on-failure\nhelm history demo --kube-context kind-k8s-ops-lab --namespace lab-helm\nk -n lab-helm get deployment,service\nk -n lab-helm port-forward service/demo-web 8081:8080",
    ),
    p(
      "Open http://localhost:8081, then stop port-forward with Ctrl+C. Expected after upgrade: two replicas and a Service port of 8080; nginx still listens on container port 80. --reset-values starts from chart defaults before the explicit override file, avoiding accidental reuse of a previous ad hoc value. Helm waits for declared resource readiness; automatic rollback on upgrade failure does not reverse external side effects or database writes.",
      "Ouvrez http://localhost:8081 puis arrêtez port-forward avec Ctrl+C. Attendu après upgrade : deux réplicas et un port de Service 8080 ; nginx écoute toujours sur le port de conteneur 80. --reset-values repart des valeurs du chart avant le fichier explicite et évite de réutiliser par accident une ancienne valeur improvisée. Helm attend la disponibilité déclarée des ressources ; le rollback automatique d’un upgrade échoué n’inverse ni effets externes ni écritures en base.",
    ),
    h("diagnosis", "Find which stage failed", "Trouver l’étape défaillante"),
    p(
      "A schema error occurs before deployment: repair the values rather than skipping validation. A name already in use requires checking helm list in the correct namespace, not deleting an unrelated release. A wait timeout needs Pod Events, rollout state and container logs; inspect helm status/history and the actual resources before retrying. get manifest shows Helm's recorded desired objects, whereas kubectl get shows live objects. Neither output should be shared blindly when charts contain Secrets.",
      "Une erreur de schéma arrive avant le déploiement : corrigez les values sans désactiver la validation. Un nom déjà utilisé impose de consulter helm list dans le bon namespace, pas de supprimer une release étrangère. Un délai d’attente impose les Events, l’état du rollout et les logs ; examinez helm status/history et les ressources avant de réessayer. get manifest montre les objets désirés enregistrés par Helm, kubectl get les objets réels. Ne partagez aveuglément aucune de ces sorties si le chart contient des Secrets.",
    ),
    h("quiz", "Separate the versions", "Séparer les versions"),
    quiz(
      question(
        l(
          "Does changing appVersion alone update this chart's image?",
          "Modifier seulement appVersion met-il à jour l’image de ce chart ?",
        ),
        [
          l("Yes, Helm rewrites all tags", "Oui, Helm réécrit tous les tags"),
          l("No, the template reads image.tag", "Non, le template lit image.tag"),
          l("Only with two replicas", "Seulement avec deux réplicas"),
        ],
        1,
        l(
          "Metadata does not override the explicit expression in the Deployment template.",
          "Une métadonnée ne remplace pas l’expression explicite du template de Deployment.",
        ),
      ),
      question(
        l("What does successful helm template prove?", "Que prouve un helm template réussi ?"),
        [
          l(
            "The workload passes every admission policy",
            "Le workload passe toutes les politiques d’admission",
          ),
          l("The image exists", "L’image existe"),
          l(
            "The supplied templates can render locally",
            "Les templates fournis peuvent être rendus localement",
          ),
        ],
        2,
        l(
          "Cluster admission, networking and runtime behavior require separate validation.",
          "Admission, réseau et comportement d’exécution exigent des validations distinctes.",
        ),
      ),
      question(
        l(
          "Is a Helm rollback a database restore?",
          "Un rollback Helm restaure-t-il la base de données ?",
        ),
        [
          l(
            "No, data recovery is a separate design",
            "Non, la restauration des données est distincte",
          ),
          l("Yes, Helm snapshots every volume", "Oui, Helm photographie tous les volumes"),
          l("Only if appVersion is unchanged", "Seulement si appVersion reste identique"),
        ],
        0,
        l(
          "Reapplying old Kubernetes objects does not undo writes or incompatible schema migrations.",
          "Réappliquer d’anciens objets Kubernetes n’annule ni écritures ni migrations de schéma incompatibles.",
        ),
      ),
    ),
    challenge(
      l("Restore the first contract", "Rétablir le contrat initial"),
      l(
        "Use release history to restore the first revision. Verify replicas and Service port, and explain why the current release revision is not reset to one.",
        "Utilisez l’historique pour rétablir la première révision. Vérifiez réplicas et port de Service, puis expliquez pourquoi la révision courante ne revient pas à un.",
      ),
      [
        l(
          "Look at helm history before choosing a target.",
          "Consultez helm history avant de choisir la cible.",
        ),
        l(
          "A rollback creates a new revision from an older configuration.",
          "Un rollback crée une nouvelle révision à partir d’une ancienne configuration.",
        ),
      ],
      [
        code(
          "bash",
          "helm history demo --kube-context kind-k8s-ops-lab --namespace lab-helm\nhelm rollback demo 1 --kube-context kind-k8s-ops-lab --namespace lab-helm --wait --timeout 2m\nhelm history demo --kube-context kind-k8s-ops-lab --namespace lab-helm\nk -n lab-helm get deployment,service",
        ),
        p(
          "Expected in the uninterrupted sequence: one replica and Service port 80, recorded as revision 3. If you ran additional upgrades, the revision number will differ. The history preserves the sequence rather than erasing the attempted change.",
          "Attendu dans la séquence sans étape supplémentaire : un réplica et un Service sur le port 80, enregistrés en révision 3. Si vous avez lancé d’autres upgrades, le numéro diffère. L’historique conserve la séquence au lieu d’effacer le changement tenté.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Uninstall before deleting the namespace",
      "Désinstaller avant de supprimer le namespace",
    ),
    code(
      "bash",
      "helm uninstall demo --kube-context kind-k8s-ops-lab --namespace lab-helm\nk delete namespace lab-helm",
    ),
    p(
      "This chart creates no CRDs, hooks, persistent volumes or cluster-scoped resources. More complex charts may leave such resources behind; inspect their lifecycle before installation. Reusable template engineering and dependencies are covered next.",
      "Ce chart ne crée ni CRD, hook, volume persistant ni ressource globale. Des charts plus complexes peuvent laisser ces ressources ; examinez leur cycle de vie avant installation. Les templates réutilisables et dépendances sont abordés ensuite.",
    ),
  ],
};
