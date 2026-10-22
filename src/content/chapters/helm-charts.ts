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
import metadata from "../../../lab/level-3/helm-charts/academy-web/Chart.yaml?raw";
import values from "../../../lab/level-3/helm-charts/academy-web/values.yaml?raw";
import deployment from "../../../lab/level-3/helm-charts/academy-web/templates/deployment.yaml?raw";
import helpers from "../../../lab/level-3/helm-charts/academy-web/templates/_helpers.tpl?raw";

import renderedService from "../../../lab/level-3/helm-charts/rendered-service.example.yaml?raw";

export const helmCharts: Chapter = {
  id: "helm-charts",
  level: 3,
  minutes: 70,
  title: l(
    "Build a chart with a stable values contract",
    "Construire un chart au contrat de valeurs stable",
  ),
  summary: l(
    "Design reusable templates, validate values before rendering, and keep identity stable when configuration changes.",
    "Concevoir des templates réutilisables, valider les valeurs avant rendu et garder une identité stable lorsque la configuration change.",
  ),
  prerequisites: ["helm-basics", "configmaps-secrets", "probes"],
  related: ["helm-releases", "kustomize", "gitops"],
  blocks: [
    h("objectives", "Treat values as an API", "Traiter les valeurs comme une API"),
    list(
      l(
        "Separate chart version, application image and release identity.",
        "Séparer version du chart, image applicative et identité de release.",
      ),
      l(
        "Render and validate two configurations without contacting Kubernetes, then inspect a narrowly scoped installation.",
        "Rendre et valider deux configurations sans contacter Kubernetes puis inspecter une installation ciblée.",
      ),
    ),
    h(
      "model",
      "The output is the real Kubernetes input",
      "Le résultat du rendu est l’entrée réelle de Kubernetes",
    ),
    p(
      "A chart is a package that combines templates with a values contract. Kubernetes never interprets Helm braces: Helm renders ordinary API objects first. The chart version describes the package; appVersion is descriptive metadata and does not automatically choose an image tag. A release is one named installation. Changing a release name changes resource identity in this chart, while changing a message should change configuration without replacing immutable selectors.",
      "Un chart combine des templates avec un contrat de valeurs. Kubernetes n’interprète jamais les accolades Helm : Helm rend d’abord des objets API ordinaires. La version du chart décrit le paquet ; appVersion est une métadonnée descriptive et ne choisit pas automatiquement le tag d’image. Une release est une installation nommée. Changer son nom change ici l’identité des ressources, tandis qu’une modification du message doit changer la configuration sans remplacer des sélecteurs immuables.",
    ),
    code("yaml", metadata, "lab/level-3/helm-charts/academy-web/Chart.yaml"),
    code("yaml", values, "lab/level-3/helm-charts/academy-web/values.yaml"),
    p(
      "Keep a small public values surface. replicaCount is an integer, message a bounded string, and service.port an unprivileged integer port. values.schema.json rejects malformed input before it becomes YAML. It cannot prove that an image exists or that a cluster has enough capacity. Avoid exposing every possible Kubernetes field merely because templating makes it easy; each supported value creates compatibility work for later chart versions.",
      "Gardez une petite surface publique de valeurs. replicaCount est un entier, message une chaîne bornée et service.port un port entier non privilégié. values.schema.json rejette une entrée mal formée avant sa transformation en YAML. Il ne prouve ni l’existence de l’image ni la capacité du cluster. N’exposez pas tous les champs Kubernetes parce que le templating le permet : chaque valeur prise en charge crée un travail de compatibilité pour les futures versions.",
    ),
    h(
      "templates",
      "Share identity helpers, not accidental selectors",
      "Partager l’identité sans fragiliser les sélecteurs",
    ),
    p(
      "The next block is the contents of templates/_helpers.tpl, not a terminal command or a Makefile. Helm evaluates its Go-template expressions while rendering the chart. Keep the double braces in this source file; Kubernetes receives the rendered YAML, not these helpers.",
      "Le bloc suivant contient le fichier templates/_helpers.tpl : ce n’est ni une commande terminal ni un Makefile. Helm évalue ses expressions Go templates pendant le rendu du chart. Conservez les doubles accolades dans ce fichier source ; Kubernetes reçoit le YAML rendu, pas ces helpers.",
    ),
    code("helm", helpers, "lab/level-3/helm-charts/academy-web/templates/_helpers.tpl"),
    {
      type: "fields",
      rows: [
        {
          field: "define / include",
          text: l(
            "define names a reusable fragment; include evaluates it with the supplied context (the dot).",
            "define nomme un fragment réutilisable ; include l’évalue avec le contexte fourni (le point).",
          ),
        },
        {
          field: ".Release / .Chart",
          text: l(
            "For the command below, Release.Name is review, Chart.Name is academy-web and Chart.Version is 0.1.0.",
            "Pour la commande ci-dessous, Release.Name vaut review, Chart.Name academy-web et Chart.Version 0.1.0.",
          ),
        },
        {
          field: "printf / trunc / trimSuffix",
          text: l(
            "Compose a resource name, bound it to 63 characters, then remove a trailing dash. The dash next to a template delimiter trims whitespace.",
            "Composer un nom de ressource, le borner à 63 caractères puis retirer un tiret final. Le tiret accolé au délimiteur de template retire les espaces adjacents.",
          ),
        },
      ],
    },
    code(
      "bash",
      "helm template review lab/level-3/helm-charts/academy-web --namespace lab-charts --kube-version 1.35.0 --show-only templates/service.yaml",
    ),
    p(
      "Compare the helper definitions with this expected local render using the checked-in default values. The Service name becomes review-academy-web, the instance label becomes review and the default port is 8080. This is an offline render example, not evidence of an installed release. _helpers.tpl emits no standalone Kubernetes object; service.yaml calls its definitions.",
      "Comparez les helpers avec ce rendu local attendu utilisant les valeurs par défaut versionnées. Le Service devient review-academy-web, le label d’instance review et le port par défaut 8080. C’est un exemple de rendu hors cluster, pas une preuve d’installation. _helpers.tpl n’émet aucun objet Kubernetes autonome ; service.yaml appelle ses définitions.",
    ),
    {
      type: "code",
      lang: "yaml",
      title: "Rendered Service · helm template review",
      code: renderedService,
      output: true,
    },
    p(
      "Named templates are global across the parent and its dependencies, so helpers use a chart-specific prefix. include returns text that can flow through nindent; this keeps YAML nesting deliberate. Stable selector labels use only chart name and release name. Chart version belongs in informational labels, not the Deployment selector: a version upgrade must not accidentally change an immutable selector or detach the Service from its Pods.",
      "Les templates nommés sont globaux au parent et à ses dépendances ; les helpers utilisent donc un préfixe propre au chart. include renvoie du texte que nindent peut indenter explicitement. Les labels de sélection stables utilisent seulement les noms du chart et de la release. La version du chart appartient aux labels informatifs, pas au sélecteur du Deployment : une mise à jour ne doit pas modifier accidentellement un sélecteur immuable ni détacher le Service de ses Pods.",
    ),
    code("helm", deployment, "lab/level-3/helm-charts/academy-web/templates/deployment.yaml"),
    p(
      "The configuration checksum lives in spec.template.metadata.annotations. A changed ConfigMap therefore changes the Pod template and triggers a rollout. Without that link, nginx may continue using configuration loaded at startup even when a projected file updates. The chart mounts content and nginx configuration separately, drops capabilities, runs as UID 101 and provides only /tmp as writable image scratch space. Values still control resource requests: a chart is not a substitute for workload measurement.",
      "Le checksum de configuration se trouve dans spec.template.metadata.annotations. Une ConfigMap modifiée change ainsi le template du Pod et déclenche un rollout. Sans ce lien, nginx peut conserver la configuration chargée au démarrage même si un fichier projeté change. Le chart monte séparément contenu et configuration nginx, retire les capabilities, utilise l’UID 101 et fournit seulement /tmp comme espace temporaire inscriptible. Les requests restent des valeurs à dimensionner : un chart ne remplace pas la mesure du workload.",
    ),
    h(
      "offline",
      "Review defaults and overrides offline",
      "Examiner défauts et surcharges hors ligne",
    ),
    note(
      "info",
      l("Version boundary", "Frontière de version"),
      l(
        "The lesson targets Helm 4.3.1 and Kubernetes 1.35. Offline rendering uses --kube-version because your local default capability version may differ. Never pass real secret values into output you intend to paste or commit; this exercise contains no secrets.",
        "La leçon vise Helm 4.3.1 et Kubernetes 1.35. Le rendu hors ligne utilise --kube-version car les capacités par défaut de votre CLI peuvent différer. Ne mettez jamais de vraies valeurs secrètes dans une sortie à coller ou versionner ; cet exercice n’en contient pas.",
      ),
    ),
    steps(
      {
        title: l("Lint and compare two renders", "Valider et comparer deux rendus"),
        code: {
          lang: "bash",
          code: 'LAB_CHART_RENDER_DIR=$(mktemp -d)\nprintf \'Render directory: %s\\n\' "$LAB_CHART_RENDER_DIR"\nhelm version --short\nhelm lint lab/level-3/helm-charts/academy-web --kube-version 1.35.0\nhelm template chart-demo lab/level-3/helm-charts/academy-web --namespace lab-charts --kube-version 1.35.0 > "$LAB_CHART_RENDER_DIR/default.yaml"\nhelm template chart-demo lab/level-3/helm-charts/academy-web --namespace lab-charts --kube-version 1.35.0 -f lab/level-3/helm-charts/staging.yaml > "$LAB_CHART_RENDER_DIR/staging.yaml"\ndiff -u "$LAB_CHART_RENDER_DIR/default.yaml" "$LAB_CHART_RENDER_DIR/staging.yaml"',
        },
        explain: l(
          "diff returns 1 when differences exist; that is the expected comparison result, not a rendering failure. Inspect replica count, message, checksum and matching Service selectors in both files.",
          "diff renvoie 1 en présence de différences : c’est le résultat attendu de comparaison, pas un échec de rendu. Inspectez effectif, message, checksum et sélecteurs concordants dans les deux fichiers.",
        ),
        expected: {
          text: l(
            "Expected: three API resources per render; staging changes replicas to two and changes the configuration checksum without changing selector identity.",
            "Attendu : trois ressources API par rendu ; staging passe à deux réplicas et change le checksum sans modifier l’identité des sélecteurs.",
          ),
        },
      },
      {
        title: l("Reject an invalid public input", "Rejeter une entrée publique invalide"),
        code: {
          lang: "bash",
          code: "helm template chart-demo lab/level-3/helm-charts/academy-web --kube-version 1.35.0 --set replicaCount=0",
        },
        explain: l(
          "This command must fail schema validation. Do not bypass the schema to make the demonstration green; explain which contract was violated.",
          "Cette commande doit échouer à la validation du schéma. Ne contournez pas ce schéma pour rendre la démonstration verte : expliquez le contrat violé.",
        ),
      },
    ),
    ...labContext("lab-charts"),
    h("live", "Optional installation and diagnosis", "Installation optionnelle et diagnostic"),
    code(
      "bash",
      "helm install chart-demo lab/level-3/helm-charts/academy-web --kube-context kind-k8s-ops-lab --namespace lab-charts --wait --timeout 120s\nk -n lab-charts get deployment,service,configmap\nk -n lab-charts port-forward service/chart-demo-academy-web 8083:8080\n# In a second terminal:\ncurl --fail http://127.0.0.1:8083/",
    ),
    p(
      "Expected response: Hello from a rendered chart. If rendering fails, inspect template scope and YAML indentation first; within a range, dot changes and root scope may require $. If installation fails after rendering, inspect API rejection, Pod Events and readiness separately. Lint and schema validation do not simulate admission policies, registry access or nginx runtime. Do not remove security settings merely to hide a permissions error: inspect the exact writable path.",
      "Réponse attendue : Hello from a rendered chart. Si le rendu échoue, examinez d’abord portée des templates et indentation YAML ; dans range, le point change et la racine peut nécessiter $. Si l’installation échoue après rendu, séparez rejet API, Events et readiness. Lint et schéma ne simulent ni admission, ni registre, ni exécution nginx. Ne supprimez pas les réglages de sécurité pour masquer un problème de permissions : identifiez le chemin inscriptible exact.",
    ),
    h("quiz", "Check the chart contract", "Vérifier le contrat du chart"),
    quiz(
      question(
        l(
          "Does changing appVersion necessarily change the deployed image?",
          "Changer appVersion change-t-il forcément l’image déployée ?",
        ),
        [
          l("No, the template here reads image.tag", "Non, le template lit ici image.tag"),
          l("Yes, Kubernetes reads appVersion", "Oui, Kubernetes lit appVersion"),
          l("Only when replicas exceed one", "Seulement avec plusieurs réplicas"),
        ],
        0,
        l(
          "Metadata influences rendering only when templates explicitly use it.",
          "Une métadonnée influence le rendu seulement si le template l’utilise explicitement.",
        ),
      ),
      question(
        l(
          "Why keep chart version out of matchLabels?",
          "Pourquoi exclure la version du chart de matchLabels ?",
        ),
        [
          l("Labels cannot contain versions", "Les labels ne peuvent contenir de version"),
          l(
            "The selector should remain stable across package upgrades",
            "Le sélecteur doit rester stable aux mises à jour du paquet",
          ),
          l("Helm ignores all selectors", "Helm ignore tous les sélecteurs"),
        ],
        1,
        l(
          "Deployment selectors are immutable and Services must keep selecting the intended Pods.",
          "Les sélecteurs de Deployment sont immuables et les Services doivent continuer à sélectionner les Pods visés.",
        ),
      ),
      question(
        l("What does a passing helm template prove?", "Que prouve un helm template réussi ?"),
        [
          l("Production availability", "La disponibilité de production"),
          l("Registry image existence", "L’existence de l’image dans le registre"),
          l(
            "Successful local rendering for the supplied inputs",
            "Un rendu local réussi pour les entrées fournies",
          ),
        ],
        2,
        l(
          "Cluster admission and workload behavior require additional evidence.",
          "Admission du cluster et comportement du workload demandent d’autres preuves.",
        ),
      ),
    ),
    h(
      "challenge",
      "Add an environment without copying templates",
      "Ajouter un environnement sans copier les templates",
    ),
    challenge(
      l("A preview values file", "Un fichier de valeurs preview"),
      l(
        "Create preview-values.yaml in a new private temporary directory with three replicas, service port 8085 and a distinct message. Render it and explain why targetPort remains http on container port 8080. Predict which fields change the Pod template.",
        "Créez preview-values.yaml dans un nouveau répertoire temporaire privé avec trois réplicas, un Service sur 8085 et un message distinct. Rendez-le et expliquez pourquoi targetPort reste http sur le port conteneur 8080. Prédisez les champs qui changent le template du Pod.",
      ),
      [
        l(
          "Service port and container target port are separate contracts.",
          "Port du Service et port cible du conteneur sont deux contrats distincts.",
        ),
        l(
          "The message feeds the ConfigMap checksum; replicaCount sits outside spec.template.",
          "Le message alimente le checksum ; replicaCount se trouve hors de spec.template.",
        ),
      ],
      [
        code(
          "bash",
          "LAB_PREVIEW_DIR=$(mktemp -d)\nprintf 'Preview directory: %s\\n' \"$LAB_PREVIEW_DIR\"\ncat > \"$LAB_PREVIEW_DIR/preview-values.yaml\" <<'YAML'\nreplicaCount: 3\nservice:\n  port: 8085\nmessage: Preview configuration\nYAML",
        ),
        code(
          "bash",
          'helm template preview lab/level-3/helm-charts/academy-web --kube-version 1.35.0 -f "$LAB_PREVIEW_DIR/preview-values.yaml"',
        ),
        p(
          "The Service exposes 8085 but forwards to named port http, still 8080 inside nginx. The message changes the checksum and rolls Pods during an upgrade; scaling replicas alone does not create a new template revision. A different release name also yields separate resource names and selectors.",
          "Le Service expose 8085 puis transmet au port nommé http, toujours 8080 dans nginx. Le message change le checksum et renouvelle les Pods lors d’un upgrade ; augmenter seulement les réplicas ne crée pas une révision de template. Un autre nom de release produit également des noms et sélecteurs distincts.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    p(
      "If you installed the optional release, stop port-forward and uninstall it before deleting its namespace. Offline renders require no cluster cleanup. The chart has no PVC, hook Job, external controller or cluster-scoped resource to retain. Keep the printed render/preview directories for inspection, then remove only the files you created there and their now-empty directories.",
      "Si vous avez installé la release optionnelle, arrêtez port-forward puis désinstallez-la avant de supprimer son namespace. Les rendus hors ligne n’exigent aucun nettoyage de cluster. Le chart ne contient ni PVC, hook Job, contrôleur externe ou ressource de cluster à conserver. Gardez les répertoires render/preview affichés pour inspection, puis retirez seulement les fichiers créés et ces répertoires devenus vides.",
    ),
    code(
      "bash",
      "helm uninstall chart-demo --kube-context kind-k8s-ops-lab --namespace lab-charts\nk delete namespace lab-charts",
    ),
  ],
};
