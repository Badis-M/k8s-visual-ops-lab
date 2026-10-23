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
import types from "../../../lab/level-4/custom-controllers/greeting-operator/api/v1alpha1/greeting_types.go?raw";
import makefile from "../../../lab/level-4/custom-controllers/greeting-operator/Makefile?raw";
import manager from "../../../lab/level-4/custom-controllers/greeting-operator/config/manager.yaml?raw";

export const kubebuilderOperator: Chapter = {
  id: "kubebuilder-operator",
  level: 4,
  minutes: 120,
  title: l("Build an Operator with Kubebuilder", "Construire un Operator avec Kubebuilder"),
  summary: l(
    "Connect scaffold, API markers and generated artifacts to the complete shared controller, then build and test without confusing generated files with implemented behavior.",
    "Relier scaffold, marqueurs API et artefacts générés au contrôleur complet partagé, puis construire et tester en distinguant génération et comportement implémenté.",
  ),
  prerequisites: ["custom-controllers", "operators"],
  related: ["admission-webhooks", "api-extension", "platform-engineering"],
  heavy: l(
    "The optional scaffold requires Kubebuilder 4.12.0 and Go 1.25.3+. Compilation downloads dependencies; container building is optional and separate from fake tests.",
    "Le scaffold optionnel demande Kubebuilder 4.12.0 et Go 1.25.3+. La compilation télécharge les dépendances ; l’image reste optionnelle et distincte des tests fake.",
  ),
  blocks: [
    h(
      "objectives",
      "Know which parts a generator can supply",
      "Savoir ce que peut fournir un générateur",
    ),
    list(
      l(
        "Trace typed API markers into deepcopy code and the structural CRD, then review generated changes as an API contract.",
        "Suivre les marqueurs des types vers deepcopy et CRD structurelle puis examiner les changements comme contrat API.",
      ),
      l(
        "Distinguish a CLI scaffold, this complete compact implementation, fake tests and an optional in-cluster deployment.",
        "Distinguer scaffold CLI, implémentation compacte complète, tests fake et déploiement optionnel.",
      ),
    ),
    h(
      "versions",
      "Pin a coherent generator and library family",
      "Fixer une famille cohérente de générateur et bibliothèques",
    ),
    p(
      "Use Kubebuilder 4.12.0 deliberately: its upstream project-v4 example aligns Go 1.25.3, controller-runtime 0.23.1 and Kubernetes libraries 0.35.0. The shared project pins those library versions and controller-gen 0.20.0. The newest CLI is not automatically compatible with an older teaching baseline. Verify installed versions before generating, keep go.sum, and review a dependency/toolchain update separately from a business-logic change. GOTOOLCHAIN=local prevents an unexpected automatic compiler download.",
      "Utilisez volontairement Kubebuilder 4.12.0 : son exemple upstream aligne Go 1.25.3, controller-runtime 0.23.1 et bibliothèques Kubernetes 0.35.0. Le projet partagé fixe ces bibliothèques et controller-gen 0.20.0. La CLI la plus récente n’est pas automatiquement compatible avec une base pédagogique antérieure. Vérifiez les versions, gardez go.sum et examinez séparément changement d’outils et logique métier. GOTOOLCHAIN=local empêche un téléchargement automatique inattendu de compilateur.",
    ),
    h(
      "scaffold",
      "Optional scaffold in a new temporary directory",
      "Scaffold optionnel dans un dossier temporaire neuf",
    ),
    code(
      "bash",
      'kubebuilder version\nGOTOOLCHAIN=local go version\nLAB_REPO_ROOT=$PWD\nLAB_SCAFFOLD_DIR=$(mktemp -d)\ncd "$LAB_SCAFFOLD_DIR"\nkubebuilder init --domain k8svisual.dev --repo example.com/k8s-visual-ops-lab/greeting-operator --plugins go/v4\nkubebuilder create api --group learning --version v1alpha1 --kind Greeting --resource --controller\ncd "$LAB_REPO_ROOT"',
    ),
    p(
      "Inspect the temporary api/, internal/controller/, config/, PROJECT and Makefile. The CLI supplies registration, manager wiring, generation and test/deployment scaffolding; it cannot decide ownership policy, operational readiness or safe recovery. Do not initialize inside this repository or merge scaffold placeholders over the complete implementation. This comparison is optional: the real implementation is already checked into lab/level-4/custom-controllers/greeting-operator and builds independently of the CLI.",
      "Examinez api/, internal/controller/, config/, PROJECT et Makefile temporaires. La CLI fournit enregistrement, manager, génération et structures de tests/déploiement ; elle ne décide ni propriété, ni readiness opérationnelle, ni récupération. N’initialisez pas dans ce dépôt et ne remplacez pas l’implémentation complète par des squelettes. La comparaison est optionnelle : le vrai projet est déjà dans lab/level-4/custom-controllers/greeting-operator et se construit sans CLI.",
    ),
    h(
      "api",
      "Markers declare runtime validation, not runtime logic",
      "Les marqueurs déclarent une validation, pas la logique d’exécution",
    ),
    code(
      "go",
      types,
      "lab/level-4/custom-controllers/greeting-operator/api/v1alpha1/greeting_types.go",
    ),
    p(
      "MinLength, Maximum, default and XValidation markers become CRD schema rules. The metadata name rules keep child Service names and labels valid without a relaxed-name feature gate. object:root produces runtime object support; deepcopy must copy nested maps/slices instead of aliasing mutable memory. subresource:status separates observation updates. None of these comments executes scaling or serves the greeting: that logic lives in the full reconciler from the preceding chapters, which also defends important constraints in fake tests.",
      "MinLength, Maximum, default et XValidation deviennent des règles du schéma. Les règles du nom garantissent Service et labels valides sans option d’assouplissement. object:root fournit le support d’objet runtime ; deepcopy doit copier maps/listes plutôt que partager une mémoire mutable. subresource:status sépare les observations. Aucun commentaire ne réalise le scaling ou le service HTTP : cette logique appartient au réconciliateur complet précédent, qui défend aussi des contraintes importantes en tests fake.",
    ),
    code("makefile", makefile, "lab/level-4/custom-controllers/greeting-operator/Makefile"),
    steps({
      title: l("Regenerate, review, test and build", "Régénérer, examiner, tester et construire"),
      code: {
        lang: "bash",
        code: 'umask 077\nLAB_OPERATOR_BUILD_DIR=$(mktemp -d)\nprintf \'Private build directory: %s\\n\' "$LAB_OPERATOR_BUILD_DIR"\ncd lab/level-4/custom-controllers/greeting-operator\nGOTOOLCHAIN=local GOMAXPROCS=2 make generate\nGOTOOLCHAIN=local GOMAXPROCS=2 go test -p 2 ./...\nGOTOOLCHAIN=local GOMAXPROCS=2 go build -o "$LAB_OPERATOR_BUILD_DIR/greeting-controller" ./cmd\ncd ../../../..\ngit diff -- lab/level-4/crds/greetings.yaml lab/level-4/custom-controllers/greeting-operator/api',
      },
      explain: l(
        "This compact Makefile combines deepcopy and CRD generation in one generate target; a standard scaffold usually separates generate and manifests. It does not apply anything to a cluster. Review changes rather than assuming generated output is harmless: changing defaults, required fields or CEL can break existing clients.",
        "Ce Makefile compact combine deepcopy et CRD dans generate ; un scaffold standard sépare généralement generate et manifests. Il n’applique rien au cluster. Examinez les changements : défauts, champs requis ou CEL peuvent casser des clients.",
      ),
      expected: {
        text: l(
          "Expected: generated files remain consistent with the committed API, fake tests pass and a local binary is produced. These checks do not prove admission, informer delivery or a working Pod.",
          "Attendu : fichiers générés cohérents, tests fake réussis et binaire local produit. Cela ne prouve ni admission, ni livraison informer, ni Pod fonctionnel.",
        ),
      },
    }),
    note(
      "warn",
      l(
        "Tests do not all start the same environment",
        "Tous les tests ne démarrent pas le même environnement",
      ),
      l(
        "The checked-in go test suite uses a fake client and no services. A standard Kubebuilder scaffold may make make test download envtest API-server/etcd binaries and start them. envtest validates real API behavior but includes no kubelet or normal workload controllers. Keep those commands and evidence separate; this lesson never silently turns a unit test into a live-cluster experiment.",
        "Le go test versionné utilise un fake sans service. Un scaffold standard peut faire télécharger et démarrer API server/etcd via make test et envtest. envtest valide une vraie API sans kubelet ni contrôleurs de workloads habituels. Séparez commandes et preuves ; cette leçon ne transforme pas silencieusement un test unitaire en expérience sur cluster.",
      ),
    ),
    ...labContext("lab-operator"),
    h(
      "image",
      "Optional image and scoped in-cluster manager",
      "Image optionnelle et manager ciblé dans le cluster",
    ),
    code("yaml", manager, "lab/level-4/custom-controllers/greeting-operator/config/manager.yaml"),
    code(
      "bash",
      "k apply -f lab/level-4/crds/greetings.yaml\nk wait --for=condition=Established crd/greetings.learning.k8svisual.dev --timeout=60s\ndocker build -t greeting-controller:local lab/level-4/custom-controllers/greeting-operator\nkind load docker-image greeting-controller:local --name k8s-ops-lab\nk apply -f lab/level-4/custom-controllers/greeting-operator/config/rbac.yaml\nk apply -f lab/level-4/custom-controllers/greeting-operator/config/manager.yaml\nk -n lab-operator rollout status deployment/greeting-controller --timeout=180s\nLAB_GREETING_GENERATION=$(k -n lab-operator apply -f lab/level-4/crds/hello.yaml -o jsonpath='{.metadata.generation}')\nk -n lab-operator wait --for=jsonpath='{.status.observedGeneration}'=\"$LAB_GREETING_GENERATION\" greeting/hello --timeout=180s\nk -n lab-operator wait --for=condition=Ready greeting/hello --timeout=180s\nk -n lab-operator get greeting hello -o yaml\nk -n lab-operator logs deployment/greeting-controller --tail=30",
    ),
    p(
      "Perform the shared CRD ownership check before installation. The image is loaded into this named kind cluster and imagePullPolicy: Never avoids accidentally fetching a different image. The scratch runtime contains the static binary, uses UID 65532 and needs its projected ServiceAccount token to reach Kubernetes. Cache scope plus a namespaced Role constrain the normal deployment path. Leader election uses a namespaced Lease; one host still provides no physical HA. Health probes only show process responsiveness. Wait for the exact Greeting generation returned by apply, then Ready, so an old condition cannot validate a new spec. Verify HTTP behavior independently, using port-forward service/hello 8082:8080 if desired.",
      "Effectuez le contrôle de propriété de CRD avant installation. L’image est chargée dans ce cluster kind nommé et imagePullPolicy: Never évite de récupérer une autre image. Le runtime scratch contient le binaire statique, utilise l’UID 65532 et exige son token ServiceAccount projeté. Cache ciblé et Role limitent le parcours normal. L’élection utilise un Lease local ; un hôte ne fournit toujours pas de HA physique. Les probes montrent la réponse du processus. Attendez la génération Greeting exacte retournée par apply puis Ready pour qu’une ancienne condition ne valide pas une nouvelle spec. Vérifiez séparément HTTP avec port-forward service/hello 8082:8080 si utile.",
    ),
    h(
      "diagnosis",
      "Generated structure can still carry a broken contract",
      "Une structure générée peut porter un contrat cassé",
    ),
    p(
      "A compilation error after editing API fields often means deepcopy is stale or module versions differ. A schema mismatch means generation was not reviewed or the wrong CRD was applied. No matches for kind belongs to discovery/installation, Forbidden to RBAC, ReconcileFailed to the reconciler cause, and ImagePullBackOff to workload/runtime diagnosis. Never repair by widening the Role to all resources or disabling schema validation. Binary compilation does not establish Docker cross-architecture compatibility or a real successful deployment; build/load and runtime validation remain learner work.",
      "Une erreur de compilation après évolution des types indique souvent deepcopy périmé ou versions incohérentes. Un schéma différent signale génération non examinée ou mauvaise CRD appliquée. No matches for kind relève de la découverte, Forbidden du RBAC, ReconcileFailed de sa cause et ImagePullBackOff du runtime. N’élargissez pas le Role à tout et ne désactivez pas la validation. Compiler ne prouve ni compatibilité Docker entre architectures ni déploiement réussi ; image et exécution restent à vérifier par l’apprenant.",
    ),
    h("quiz", "Check generator responsibilities", "Vérifier les responsabilités du générateur"),
    quiz(
      question(
        l(
          "What must change when a new API field is added?",
          "Que faut-il mettre à jour avec un nouveau champ API ?",
        ),
        [
          l(
            "Types, generated schema/deepcopy, semantics and tests together",
            "Types, schéma/deepcopy, sémantique et tests ensemble",
          ),
          l("Only a screenshot", "Seulement une capture"),
          l("Only the image name", "Seulement le nom d’image"),
        ],
        0,
        l(
          "A field is a public contract with generated and behavioral consequences.",
          "Un champ est un contrat public aux conséquences générées et comportementales.",
        ),
      ),
      question(
        l(
          "Does Kubebuilder generate the application's safe operational policy?",
          "Kubebuilder génère-t-il la politique opérationnelle sûre de l’application ?",
        ),
        [
          l("Yes, all applications share it", "Oui, elle est identique partout"),
          l(
            "No, scaffolding still needs implemented and reviewed domain logic",
            "Non, le scaffold exige encore une logique métier implémentée et examinée",
          ),
          l("Only if the CLI is newest", "Seulement avec la CLI la plus récente"),
        ],
        1,
        l(
          "A generator cannot infer backup semantics, external side effects or ownership decisions.",
          "Un générateur ne déduit ni sauvegarde, ni effets externes, ni choix de propriété.",
        ),
      ),
      question(
        l(
          "Does envtest run an HTTP workload like a full kind cluster?",
          "envtest exécute-t-il un workload HTTP comme kind ?",
        ),
        [
          l("Yes, it includes every node agent", "Oui, il inclut tous les agents"),
          l("It deploys into your default cloud context", "Il déploie dans votre cloud par défaut"),
          l(
            "No, it starts API-server/etcd without kubelet",
            "Non, il démarre API server/etcd sans kubelet",
          ),
        ],
        2,
        l(
          "Real API semantics and container runtime behavior need different integration layers.",
          "Sémantique API et comportement des conteneurs exigent des niveaux d’intégration distincts.",
        ),
      ),
    ),
    h(
      "challenge",
      "Extend the API without bypassing generated contracts",
      "Étendre l’API sans contourner les contrats générés",
    ),
    challenge(
      l("A bounded field evolution plan", "Plan d’évolution d’un champ borné"),
      l(
        "Design a future messagePrefix field with default empty string and maximum 30 characters. Specify typed markers, generated artifacts, escaping/hash behavior, tests and compatibility. Keep it as a reviewed design exercise rather than modifying the shared implementation during this chapter.",
        "Concevez messagePrefix futur, défaut chaîne vide, maximum trente caractères. Précisez types, génération, échappement/hash, tests et compatibilité. Gardez cet exercice en conception examinée sans modifier l’implémentation partagée.",
      ),
      [
        l(
          "Existing resources must remain valid without the new optional field.",
          "Les ressources existantes doivent rester valides sans le champ optionnel.",
        ),
        l(
          "Compose plain text first, then escape HTML; hash the effective served input.",
          "Composez le texte puis échappez le HTML ; hashez l’entrée effectivement servie.",
        ),
      ],
      [
        code(
          "go",
          '// +kubebuilder:validation:MaxLength=30\n// +kubebuilder:default=""\n// +optional\nMessagePrefix string `json:"messagePrefix,omitempty"`',
        ),
        p(
          "Regenerate deepcopy and CRD, review whether the new bound/default preserves old clients, compose prefix plus message as plain text, then escape once and hash the effective text. Add fake tests for absent prefix, maximum length defense, HTML characters, unchanged-repeat idempotence and a changed-prefix rollout hash. Validate the actual schema through a real API integration layer separately; fake creation alone cannot prove CEL/OpenAPI acceptance.",
          "Régénérez deepcopy et CRD, vérifiez la compatibilité des bornes/défauts, composez préfixe et message en texte puis échappez une fois et hashez ce texte effectif. Ajoutez tests fake d’absence, borne, HTML, idempotence et changement de hash. Validez séparément le schéma via une vraie API : une création fake ne prouve pas l’acceptation CEL/OpenAPI.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Clean the runtime you actually created",
      "Nettoyer seulement l’environnement réellement créé",
    ),
    p(
      "Stop local managers and port-forward if any, then remove the dedicated namespace. Inspect and manually remove the exact LAB_SCAFFOLD_DIR, if created, and LAB_OPERATOR_BUILD_DIR after stopping their processes; they are local only. Keep the shared CRD if other lessons still use it; follow the global instance inventory before removing it. No cluster, manager, Docker build or envtest service was started by the curriculum authoring checks.",
      "Arrêtez managers locaux et port-forward éventuels puis retirez le namespace dédié. Examinez puis retirez les dossiers exacts LAB_SCAFFOLD_DIR, si créé, et LAB_OPERATOR_BUILD_DIR après arrêt de leurs processus ; ils restent locaux. Gardez la CRD partagée si d’autres leçons l’utilisent ; vérifiez l’inventaire global avant retrait. Aucun cluster, manager, build Docker ou service envtest n’a été démarré par les vérifications de rédaction.",
    ),
    code("bash", "k delete namespace lab-operator"),
  ],
};
