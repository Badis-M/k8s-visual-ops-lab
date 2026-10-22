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
import schema from "../../../lab/level-4/crds/greetings.yaml?raw";
import sample from "../../../lab/level-4/crds/hello.yaml?raw";
import invalid from "../../../lab/level-4/crds/invalid.yaml?raw";

export const crds: Chapter = {
  id: "crds",
  level: 4,
  minutes: 65,
  title: l(
    "CustomResourceDefinitions: design a real API",
    "CustomResourceDefinitions : concevoir une API réelle",
  ),
  summary: l(
    "Register a namespaced typed resource with structural validation, defaults, CEL constraints and status, while keeping behavior separate from its schema.",
    "Enregistrer une ressource typée avec validation structurelle, défauts, contraintes CEL et statut en séparant schéma et comportement.",
  ),
  prerequisites: ["api-architecture", "controllers-internals"],
  related: ["custom-controllers", "api-extension", "admission-webhooks"],
  blocks: [
    h("objectives", "Specify what the API accepts", "Spécifier ce que l’API accepte"),
    list(
      l(
        "Distinguish a cluster-scoped CRD definition from its namespaced custom resource instances.",
        "Distinguer une définition CRD de cluster de ses instances personnalisées de namespace.",
      ),
      l(
        "Design bounded input fields and a separate observed status; verify rejection without expecting a controller to appear automatically.",
        "Concevoir des entrées bornées et un statut observé distinct ; vérifier un rejet sans attendre l’apparition automatique d’un contrôleur.",
      ),
    ),
    h(
      "model",
      "A new endpoint is not a new operational capability",
      "Un nouvel endpoint n’est pas encore une capacité opérationnelle",
    ),
    p(
      "A CRD registers a resource in the Kubernetes API server. A Greeting object can then be created, read, watched and authorized like other resources. The API server validates and stores it, but does not know how to turn its message into a web service. That behavior belongs to a controller introduced in the next chapters. This separation lets API validation remain useful even when the controller is stopped, while desired and observed state can diverge visibly.",
      "Une CRD enregistre une ressource auprès de l’API server. Un objet Greeting peut ensuite être créé, lu, observé et autorisé comme les autres. Le serveur le valide et le stocke sans savoir convertir son message en service web. Ce comportement appartient au contrôleur des chapitres suivants. Cette séparation garde la validation utile quand le contrôleur est arrêté et rend visible la divergence entre état désiré et observé.",
    ),
    code("yaml", schema, "lab/level-4/crds/greetings.yaml"),
    {
      type: "fields",
      rows: [
        {
          field: "group / versions / names",
          text: l(
            "Define learning.k8svisual.dev/v1alpha1 and the plural REST resource greetings. Exactly one version is marked storage; served controls which representations clients may request.",
            "Définissent learning.k8svisual.dev/v1alpha1 et la ressource REST plurielle greetings. Une seule version porte storage ; served contrôle les représentations accessibles.",
          ),
        },
        {
          field: "scope: Namespaced",
          text: l(
            "Scopes Greeting instances, not the CRD definition itself. Namespace deletion removes those instances; deleting the CRD affects its type across all namespaces.",
            "Limite les instances Greeting, pas leur définition CRD. Supprimer un namespace retire ses instances ; supprimer la CRD affecte le type dans tous les namespaces.",
          ),
        },
        {
          field: "spec.message / replicas / paused",
          text: l(
            "Message is required and bounded; replicas defaults to one and accepts one through three; paused defaults false. Limits are part of the public contract, not frontend-only hints.",
            "message est requis et borné ; replicas vaut un par défaut et accepte un à trois ; paused vaut false. Les bornes sont un contrat public, pas des indications frontend.",
          ),
        },
        {
          field: "subresources.status",
          text: l(
            "Separates status writes from normal desired-state updates and allows separate RBAC on greetings/status. It does not grant a writer permission by itself.",
            "Sépare les écritures de statut des mises à jour désirées et permet un RBAC sur greetings/status. Cela n’accorde pas automatiquement des droits.",
          ),
        },
      ],
    },
    p(
      "The structural OpenAPI schema defines known fields and types so the API can validate, default and prune consistently. CEL bounds metadata.name to fifty characters and a DNS-1035 label starting with a letter, because our controller reuses it for child labels and a Service. Names like hello.world or 123 are rejected before reconciliation rather than relying on optional relaxed Service naming. Validation must be deterministic and bounded; CEL cannot query an external account. Condition lists are maps keyed by type, supporting predictable merging.",
      "Le schéma OpenAPI structurel décrit champs et types pour valider, appliquer des défauts et élaguer de manière cohérente. CEL limite metadata.name à cinquante caractères et à un label DNS-1035 commençant par une lettre : le contrôleur le réutilise pour ses labels et un Service. Des noms comme hello.world ou 123 sont rejetés avant réconciliation sans dépendre d’une option de nommage assoupli. La validation doit être déterministe et bornée ; CEL ne peut interroger un compte externe. Les conditions forment une liste-map indexée par type pour des fusions prévisibles.",
    ),
    ...labContext("lab-crds"),
    h("exercise", "Register, discover and validate", "Enregistrer, découvrir et valider"),
    note(
      "warn",
      l("Installing a type has cluster scope", "Installer un type affecte le cluster"),
      l(
        "Creating this CRD requires administrator authorization. First inspect whether greetings.learning.k8svisual.dev already exists. If it belongs to another project or its schema differs, stop rather than overwrite it. The later controller chapters intentionally share this exact definition; namespace separation does not isolate CRD schema changes.",
        "Créer cette CRD exige des droits administrateur. Vérifiez d’abord si greetings.learning.k8svisual.dev existe. Si elle relève d’un autre projet ou si son schéma diffère, arrêtez plutôt que l’écraser. Les chapitres suivants partagent volontairement cette définition ; des namespaces distincts n’isolent pas ses changements de schéma.",
      ),
    ),
    code("bash", "k get crd greetings.learning.k8svisual.dev"),
    p(
      "NotFound is expected on a fresh disposable cluster. After the ownership check, install the fixture and wait for its Established condition before creating an instance; discovery is asynchronous.",
      "NotFound est attendu sur un cluster jetable neuf. Après contrôle de propriété, installez le fichier et attendez Established avant une instance : la découverte est asynchrone.",
    ),
    steps(
      {
        title: l(
          "Install the schema and create one instance",
          "Installer le schéma puis une instance",
        ),
        code: {
          lang: "bash",
          code: "k apply -f lab/level-4/crds/greetings.yaml\nk wait --for=condition=Established crd/greetings.learning.k8svisual.dev --timeout=60s\nk api-resources --api-group=learning.k8svisual.dev\nk explain greeting.spec --api-version=learning.k8svisual.dev/v1alpha1\nk -n lab-crds apply -f lab/level-4/crds/hello.yaml\nk -n lab-crds get greeting hello -o yaml\nk -n lab-crds get pods",
        },
        explain: l(
          "Inspect stored defaults and the new discovery entry. No Greeting controller is running in this namespace, so creation does not produce a Deployment or a Ready status. The schema alone is working as intended.",
          "Inspectez défauts enregistrés et découverte. Aucun contrôleur Greeting ne tourne ici : la création ne produit donc ni Deployment ni statut Ready. Le schéma seul fonctionne comme prévu.",
        ),
        expected: {
          text: l(
            "Expected: hello exists with replicas 1 and paused false; no generated workload and no controller-produced status. Actual defaults must be read from the server response.",
            "Attendu : hello existe avec replicas 1 et paused false ; aucun workload généré ni statut de contrôleur. Lisez les défauts dans la réponse réelle du serveur.",
          ),
        },
      },
      {
        title: l(
          "Reject invalid desired input without persisting it",
          "Rejeter une entrée invalide sans la persister",
        ),
        code: {
          lang: "bash",
          code: "k -n lab-crds apply --dry-run=server --validate=strict -f lab/level-4/crds/invalid.yaml\nk -n lab-crds get greetings",
        },
        explain: l(
          "The dry-run must fail the minimum replica constraint. A server-side dry-run exercises API validation without storing the object; it still requires a reachable API and authorization. Do not confuse that with a purely local YAML parse.",
          "Le dry-run doit échouer sur la borne minimale. Un dry-run serveur exerce la validation API sans stocker l’objet ; il nécessite encore accès API et autorisation. Cela diffère d’une simple analyse YAML locale.",
        ),
      },
    ),
    code("yaml", invalid, "lab/level-4/crds/invalid.yaml"),
    h(
      "diagnosis",
      "Schema, discovery and reconciliation fail differently",
      "Schéma, découverte et réconciliation échouent différemment",
    ),
    p(
      "No matches for kind can mean the CRD is absent, not Established or requested through an unserved version. Forbidden indicates authorization, not a malformed schema. An Invalid response should identify the precise rejected field or CEL rule. Unknown fields can be pruned or rejected under strict field validation, so a misspelled desired option must never be treated as successfully configured. Empty status after an accepted create is expected without a controller. Adding v1beta1 later does not migrate stored objects by itself; conversion and storage-version migration are separate API-evolution work.",
      "No matches for kind peut signaler une CRD absente, non Established ou une version non servie. Forbidden indique l’autorisation, pas un schéma mal formé. Invalid doit désigner le champ ou la règle CEL rejetée. Les champs inconnus peuvent être élagués ou rejetés en validation stricte : une option mal orthographiée ne doit jamais être considérée configurée. Un statut vide est attendu sans contrôleur. Ajouter v1beta1 ne migre pas seul les objets stockés : conversion et migration de stockage relèvent d’un travail distinct.",
    ),
    h("quiz", "Check the extension boundary", "Vérifier la frontière d’extension"),
    quiz(
      question(
        l(
          "What does creating a CRD automatically provide?",
          "Que fournit automatiquement une CRD ?",
        ),
        [
          l("An API resource with the declared schema", "Une ressource API selon son schéma"),
          l("A complete business controller", "Un contrôleur métier complet"),
          l("An externally backed database", "Une base de données externe"),
        ],
        0,
        l(
          "Behavior requires a reconciler; registration and storage are separate from application operation.",
          "Le comportement exige un réconciliateur ; enregistrement et stockage sont distincts de l’exploitation applicative.",
        ),
      ),
      question(
        l("Why expose a status subresource?", "Pourquoi exposer un sous-endpoint status ?"),
        [
          l("To bypass every RBAC rule", "Pour contourner tout RBAC"),
          l(
            "To separate observed-state updates and permissions from desired input",
            "Pour séparer observation, droits et entrée désirée",
          ),
          l(
            "To make status user-authored desired state",
            "Pour faire du statut une intention utilisateur",
          ),
        ],
        1,
        l(
          "A controller publishes observations through status; the API/RBAC must authorize that write explicitly.",
          "Le contrôleur publie ses observations par status ; API et RBAC doivent autoriser explicitement cette écriture.",
        ),
      ),
      question(
        l("What is the impact of deleting the CRD?", "Quel est l’impact de supprimer la CRD ?"),
        [
          l("Only its YAML source file disappears", "Seul son fichier YAML disparaît"),
          l("Only the current namespace is affected", "Seul le namespace courant est touché"),
          l(
            "The type and its instances across namespaces are removed",
            "Le type et ses instances dans tous les namespaces sont retirés",
          ),
        ],
        2,
        l(
          "A cluster-scoped type definition is not a per-namespace cleanup tool.",
          "Une définition de type globale n’est pas un outil de nettoyage par namespace.",
        ),
      ),
    ),
    h("challenge", "Add a bounded operational option", "Ajouter une option opérationnelle bornée"),
    challenge(
      l("Schema is a compatibility promise", "Le schéma promet une compatibilité"),
      l(
        "Propose an optional retentionDays integer with default 7 and range 1–30. Explain what the API validates, what it does not execute, and how existing instances remain valid. Work on a temporary schema copy rather than modifying the shared live type during this exercise.",
        "Proposez retentionDays entier optionnel, défaut 7, bornes 1–30. Expliquez validation, absence d’exécution et compatibilité des instances existantes. Travaillez sur une copie temporaire sans changer le type partagé réel.",
      ),
      [
        l(
          "Defaulting does not schedule a cleanup job.",
          "Le défaut ne programme pas un nettoyage.",
        ),
        l(
          "A newly required field without a compatibility/defaulting plan can break clients.",
          "Un champ nouvellement obligatoire sans plan de compatibilité/défaut peut casser les clients.",
        ),
      ],
      [
        code(
          "yaml",
          "retentionDays:\n  type: integer\n  format: int32\n  minimum: 1\n  maximum: 30\n  default: 7",
        ),
        p(
          "In the v1alpha1 version, place this field under spec.versions[].schema.openAPIV3Schema.properties.spec.properties, beside message and replicas; keep it out of that spec schema’s required list. The API validates the declared number and can default missing values; it does not delete data after seven days. A controller needs an explicit time model, reconciliation logic and safe cleanup contract. Update typed Go definitions, generated schema, documentation and tests together before publishing such an API change.",
          "Dans la version v1alpha1, placez le champ sous spec.versions[].schema.openAPIV3Schema.properties.spec.properties, à côté de message et replicas, sans l’ajouter au required de ce schéma spec. L’API valide le nombre et peut fournir le défaut ; elle ne supprime aucune donnée après sept jours. Un contrôleur doit porter modèle temporel, logique et nettoyage sûr. Mettez ensemble à jour types Go, schéma généré, documentation et tests avant publication de cette évolution.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Remove instances before a shared definition",
      "Retirer les instances avant une définition partagée",
    ),
    code(
      "bash",
      "k delete namespace lab-crds\nk get greetings.learning.k8svisual.dev --all-namespaces",
    ),
    p(
      "Delete the definition below only if you installed this exact lab type and the preceding inventory contains no instances needed by another chapter. Otherwise leave the shared CRD in place. Definition deletion is destructive beyond the namespace and cannot be reversed merely by restoring its YAML.",
      "Supprimez la définition ci-dessous seulement si vous avez installé ce type exact et si l’inventaire ne contient aucune instance utile à un autre chapitre. Sinon conservez la CRD partagée. Sa suppression dépasse le namespace et restaurer le YAML ne restaure pas ses anciennes instances.",
    ),
    code("bash", "k delete crd greetings.learning.k8svisual.dev"),
  ],
};
