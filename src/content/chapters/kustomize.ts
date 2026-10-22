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
import base from "../../../lab/level-3/kustomize/base/kustomization.yaml?raw";
import dev from "../../../lab/level-3/kustomize/overlays/dev/kustomization.yaml?raw";
import prod from "../../../lab/level-3/kustomize/overlays/prod/kustomization.yaml?raw";

export const kustomize: Chapter = {
  id: "kustomize",
  level: 3,
  minutes: 60,
  title: l("Kustomize and environment overlays", "Kustomize et overlays d’environnement"),
  summary: l(
    "Compose ordinary Kubernetes YAML into reviewed environment variants, understand generated ConfigMap hashes, and preserve resource identity across patches.",
    "Composer du YAML Kubernetes ordinaire en variantes d’environnement examinées, comprendre les hashes de ConfigMap et préserver l’identité des ressources.",
  ),
  prerequisites: ["deployments", "configmaps-secrets"],
  related: ["helm-charts", "gitops"],
  blocks: [
    h(
      "objectives",
      "Compose differences rather than copy entire apps",
      "Composer les différences plutôt que copier l’application",
    ),
    list(
      l(
        "Explain base resources, overlays, transforms and targeted patches using their rendered result.",
        "Expliquer ressources de base, overlays, transformations et patches ciblés à partir du résultat rendu.",
      ),
      l(
        "Predict a configuration-triggered rollout and distinguish applying current resources from pruning obsolete ones.",
        "Prédire un rollout lié à la configuration et distinguer application des ressources actuelles et suppression des anciennes.",
      ),
    ),
    h(
      "model",
      "A build graph of ordinary resources",
      "Un graphe de construction de ressources ordinaires",
    ),
    p(
      "Kustomize starts from valid Kubernetes YAML, then composes resources and transformations. A base contains common objects and does not know which overlay will consume it. An overlay refers to that base and describes deliberate differences: namespace, prefix, replica count, image or patches. The result is still ordinary API YAML. Unlike a Helm release, kubectl apply -k does not create a release history that can later be rolled back by a package manager; the reviewed Git revision remains the reproducible input.",
      "Kustomize part de YAML Kubernetes valide puis compose ressources et transformations. Une base contient les objets communs sans connaître l’overlay qui l’utilisera. L’overlay référence la base et décrit des différences voulues : namespace, préfixe, effectif, image ou patches. Le résultat reste du YAML API ordinaire. Contrairement à une release Helm, kubectl apply -k ne crée pas d’historique de release à restaurer par un gestionnaire de paquets ; la révision Git examinée reste l’entrée reproductible.",
    ),
    code("yaml", base, "lab/level-3/kustomize/base/kustomization.yaml"),
    p(
      "The base defines a rootless BusyBox HTTP server and a Service with matching app labels. configMapGenerator reads index.html and appends a content-derived hash to web-content. Kustomize also rewrites the Deployment's known ConfigMap name reference to that generated name. When the content changes, the volume reference changes in the Pod template, causing a rollout. Arbitrary strings in unknown custom resource fields are not all rewritten automatically; custom schemas or name-reference configuration can be necessary.",
      "La base définit un serveur HTTP BusyBox non root et un Service aux labels concordants. configMapGenerator lit index.html et ajoute à web-content un hash dérivé du contenu. Kustomize réécrit aussi la référence connue du Deployment vers ce nom. Un contenu changé modifie la référence de volume dans le template et provoque un rollout. Les chaînes arbitraires dans des champs inconnus de ressources personnalisées ne sont pas toutes réécrites automatiquement ; schéma ou configuration de références peuvent être nécessaires.",
    ),
    h(
      "overlays",
      "Read the exact environment differences",
      "Lire les différences exactes d’environnement",
    ),
    code("yaml", dev, "lab/level-3/kustomize/overlays/dev/kustomization.yaml"),
    code("yaml", prod, "lab/level-3/kustomize/overlays/prod/kustomization.yaml"),
    {
      type: "fields",
      rows: [
        {
          field: "resources: ../../base",
          text: l(
            "Shares the resource definitions; edits to the base affect every consuming overlay and require reviewing every render.",
            "Partage les définitions ; modifier la base affecte chaque overlay et exige d’examiner chaque rendu.",
          ),
        },
        {
          field: "labels.includeSelectors: false",
          text: l(
            "Adds environment metadata without changing immutable Deployment selectors. includeTemplates separately adds the Pod label.",
            "Ajoute les métadonnées d’environnement sans changer les sélecteurs immuables. includeTemplates ajoute séparément le label aux Pods.",
          ),
        },
        {
          field: "configMapGenerator.behavior: merge",
          text: l(
            "Overrides the same generator's content in the overlay while retaining generated-name behavior.",
            "Remplace le contenu du même générateur dans l’overlay en conservant le nom généré.",
          ),
        },
        {
          field: "patches[].target",
          text: l(
            "Scopes a JSON patch to the intended Deployment. The array index in this small fixture assumes web remains container zero; revisit it when restructuring containers.",
            "Cible le Deployment prévu. L’index du tableau suppose ici que web reste le premier conteneur ; réexaminez-le si la structure change.",
          ),
        },
      ],
    },
    note(
      "warn",
      l(
        "An environment name is not a readiness claim",
        "Un nom d’environnement n’est pas une garantie",
      ),
      l(
        "The prod overlay is a teaching comparison, not a production-certified design. Both replicas still run on the same physical host in kind, and this sample has no authentication, TLS, real persistence or SLO. Evaluate those application requirements independently instead of interpreting a directory name as architecture evidence.",
        "L’overlay prod sert à comparer, pas à certifier une conception de production. Les réplicas partagent toujours l’hôte physique kind et cet exemple n’a ni authentification, TLS, persistance réelle ou SLO. Évaluez séparément ces besoins au lieu de prendre un nom de dossier pour une preuve architecturale.",
      ),
    ),
    h("offline", "Build before contacting the API", "Construire avant de contacter l’API"),
    code(
      "bash",
      "kubectl version --client -o yaml\nkubectl kustomize lab/level-3/kustomize/overlays/dev > /tmp/overlay-dev.yaml\nkubectl kustomize lab/level-3/kustomize/overlays/prod > /tmp/overlay-prod.yaml\ndiff -u /tmp/overlay-dev.yaml /tmp/overlay-prod.yaml",
    ),
    p(
      "The client version reports the bundled Kustomize version, which can differ across kubectl installations. The lab baseline uses kubectl 1.35.x; record the renderer used for a review and CI. diff exit code 1 means the expected differences exist. Inspect names, namespaces, replica counts, resource requests and generated references in the YAML. No controller, cluster connection or Helm plugin is required to build these local overlays.",
      "La version client indique le Kustomize intégré, qui peut varier selon kubectl. La base du lab utilise kubectl 1.35.x ; relevez le moteur utilisé pour revue et CI. Le code 1 de diff signifie que les différences attendues existent. Inspectez noms, namespaces, réplicas, requests et références générées. Aucun contrôleur, accès cluster ou plugin Helm n’est nécessaire pour construire ces overlays locaux.",
    ),
    ...labContext("lab-kustomize-dev"),
    h("exercise", "Optional side-by-side application", "Application optionnelle côte à côte"),
    steps(
      {
        title: l(
          "Create isolated namespaces and apply",
          "Créer les namespaces isolés et appliquer",
        ),
        code: {
          lang: "bash",
          code: "k create namespace lab-kustomize-prod\nk apply -k lab/level-3/kustomize/overlays/dev\nk apply -k lab/level-3/kustomize/overlays/prod\nk -n lab-kustomize-dev rollout status deployment/dev-web --timeout=120s\nk -n lab-kustomize-prod rollout status deployment/prod-web --timeout=120s\nk -n lab-kustomize-dev get deployment,service,configmap\nk -n lab-kustomize-prod get deployment,service,configmap",
        },
        explain: l(
          "Namespace transforms assign existing resources to namespaces but do not create Namespace objects here. That is why both namespaces are explicitly created before applying.",
          "Les transformations affectent les ressources aux namespaces mais ne créent pas ici d’objets Namespace. Les deux espaces sont donc créés explicitement avant application.",
        ),
        expected: {
          text: l(
            "Expected: dev-web has one replica, prod-web has two, and each Deployment references its own prefixed, hashed ConfigMap.",
            "Attendu : dev-web a un réplica, prod-web deux et chaque Deployment référence sa ConfigMap préfixée avec hash.",
          ),
        },
      },
      {
        title: l("Observe the effective output", "Observer le résultat effectif"),
        code: {
          lang: "bash",
          code: "k -n lab-kustomize-dev port-forward service/dev-web 8084:8080\n# In a second terminal:\ncurl --fail http://127.0.0.1:8084/\nkubectl --context kind-k8s-ops-lab diff -k lab/level-3/kustomize/overlays/prod",
        },
        explain: l(
          "Expected response: Development learning configuration. The live diff normally reports no drift immediately after a successful apply; admission defaults and concurrent controllers can affect comparison, so inspect any difference rather than ignoring it.",
          "Réponse attendue : Development learning configuration. Le diff réel ne devrait normalement pas montrer de dérive juste après application ; défauts d’admission et autres contrôleurs peuvent influencer la comparaison : examinez chaque différence.",
        ),
      },
    ),
    h(
      "diagnosis",
      "Patches and generated resources have boundaries",
      "Patches et ressources générées ont des limites",
    ),
    p(
      "A patch that finds no target often uses the wrong kind, name or API group; inspect the base and selector rather than disabling validation. JSON patches are ordered operations and fragile positional paths deserve a test. Removing a generator's hash can stop the reference change that previously triggered rollouts. Reapplying a new hashed ConfigMap does not automatically delete old hashed ConfigMaps with plain apply -k. Use reviewed controller inventory/prune policies or deliberate cleanup, never broad cluster-wide pruning. A secretGenerator still produces Secret data, not encryption safe for committing credentials.",
      "Un patch sans cible utilise souvent un mauvais kind, nom ou groupe API ; inspectez la base et la cible au lieu de désactiver la validation. Les opérations JSON sont ordonnées et les chemins positionnels fragiles méritent une vérification. Retirer le hash peut supprimer le changement de référence qui déclenchait le rollout. Appliquer une nouvelle ConfigMap avec hash ne supprime pas automatiquement les anciennes avec apply -k. Utilisez inventaire et politique prune examinés, ou un nettoyage explicite, jamais une suppression globale du cluster. secretGenerator produit encore des données Secret, pas un chiffrement permettant de versionner des identifiants.",
    ),
    h("quiz", "Check the composition contract", "Vérifier le contrat de composition"),
    quiz(
      question(
        l(
          "The generated ConfigMap name changes. Why can Pods roll?",
          "Le nom de ConfigMap généré change. Pourquoi les Pods peuvent-ils être renouvelés ?",
        ),
        [
          l(
            "The rewritten reference changes the Pod template",
            "La référence réécrite change le template du Pod",
          ),
          l("ConfigMap always deletes every Pod", "Une ConfigMap supprime toujours tous les Pods"),
          l("The Service restarts kubelet", "Le Service redémarre kubelet"),
        ],
        0,
        l(
          "The Deployment reconciles a changed spec.template; the hash by itself is not a special restart API.",
          "Le Deployment réconcilie un spec.template changé ; le hash n’est pas en soi une API de redémarrage.",
        ),
      ),
      question(
        l(
          "Does namespace: create a Namespace object in this fixture?",
          "namespace: crée-t-il un objet Namespace dans cet exemple ?",
        ),
        [
          l("Yes, always", "Oui, toujours"),
          l(
            "No, it assigns namespaces to rendered namespaced resources",
            "Non, il affecte un namespace aux ressources rendues",
          ),
          l("Only if replicas is two", "Seulement avec deux réplicas"),
        ],
        1,
        l(
          "Create the namespace separately or deliberately include its resource manifest.",
          "Créez-le séparément ou incluez explicitement son manifest.",
        ),
      ),
      question(
        l(
          "What happens to obsolete hashed ConfigMaps with plain apply -k?",
          "Que deviennent les anciennes ConfigMaps avec hash avec apply -k seul ?",
        ),
        [
          l(
            "They are always garbage-collected immediately",
            "Elles sont toujours supprimées immédiatement",
          ),
          l("They are moved to another namespace", "Elles changent de namespace"),
          l(
            "They can remain until explicit inventory-aware cleanup",
            "Elles peuvent rester jusqu’à un nettoyage explicite avec inventaire",
          ),
        ],
        2,
        l(
          "Building/applying the desired set and deleting objects no longer in it are distinct responsibilities.",
          "Construire/appliquer l’ensemble désiré et supprimer les objets qui n’y figurent plus sont des responsabilités distinctes.",
        ),
      ),
    ),
    h(
      "challenge",
      "Build a third overlay without affecting others",
      "Construire un troisième overlay indépendant",
    ),
    challenge(
      l("An offline preview", "Une preview hors ligne"),
      l(
        "Copy the kustomize exercise tree to /tmp/kustomize-exercise, add overlays/preview, and render a three-replica preview with its own namespace and prefix. Keep base selectors unchanged and explain which inherited defaults still apply. Do not apply it to a cluster for this challenge.",
        "Copiez l’arbre de l’exercice dans /tmp/kustomize-exercise, ajoutez overlays/preview puis rendez une preview à trois réplicas avec namespace et préfixe distincts. Gardez les sélecteurs de base et expliquez les défauts hérités. N’appliquez pas cette variante au cluster pour ce défi.",
      ),
      [
        l(
          "The new overlay references ../../base from its own directory.",
          "Le nouvel overlay référence ../../base depuis son dossier.",
        ),
        l(
          "Only values you explicitly transform differ from the base.",
          "Seules les valeurs explicitement transformées diffèrent de la base.",
        ),
      ],
      [
        code(
          "yaml",
          "apiVersion: kustomize.config.k8s.io/v1beta1\nkind: Kustomization\nresources:\n  - ../../base\nnamespace: lab-kustomize-preview\nnamePrefix: preview-\nreplicas:\n  - name: web\n    count: 3",
          "/tmp/kustomize-exercise/overlays/preview/kustomization.yaml",
        ),
        code("bash", "kubectl kustomize /tmp/kustomize-exercise/overlays/preview"),
        p(
          "The render has three preview-web replicas and a renamed ConfigMap reference. With no generator override, it serves Base learning configuration and keeps the base memory settings. Existing dev/prod inputs remain untouched. This is a useful review property: differences are explicit rather than hidden inside copied resource files.",
          "Le rendu contient trois réplicas preview-web et une référence de ConfigMap renommée. Sans surcharge de générateur, il sert Base learning configuration et conserve la mémoire de base. Les entrées dev/prod restent intactes. La revue peut ainsi identifier les différences explicitement au lieu de les chercher dans des ressources copiées.",
        ),
      ],
    ),
    h("cleanup", "Remove both isolated applications", "Supprimer les deux applications isolées"),
    p(
      "Stop port-forward first. Deleting these dedicated namespaces also removes obsolete generated ConfigMaps from earlier experiments. It would be inappropriate in a namespace shared with unrelated applications. Local rendering alone creates no API resources to clean up.",
      "Arrêtez d’abord port-forward. Supprimer ces namespaces dédiés retire aussi les anciennes ConfigMaps générées. Cela serait inapproprié dans un namespace partagé avec d’autres applications. Un rendu local seul ne crée aucune ressource API à nettoyer.",
    ),
    code("bash", "k delete namespace lab-kustomize-dev lab-kustomize-prod"),
  ],
};
