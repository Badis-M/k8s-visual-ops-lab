import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import server from "../../../lab/level-4/api-extension/server.py?raw";
import crd from "../../../lab/level-4/api-extension/crd.yaml?raw";

export const apiExtension: Chapter = {
  id: "api-extension",
  level: 4,
  minutes: 50,
  title: l("API extension and conversion", "Extension d’API et conversion"),
  summary: l(
    "Serve two equivalent custom-resource schemas through a tested TLS converter while preserving identity, metadata and round-trip meaning.",
    "Servir deux schémas équivalents via un convertisseur TLS testé, en préservant identité, métadonnées et sens de l’aller-retour.",
  ),
  prerequisites: ["crds", "admission-webhooks"],
  related: ["api-architecture", "kubebuilder-operator"],
  blocks: [
    h(
      "objectives",
      "Separate representation from persistence",
      "Séparer représentation et persistance",
    ),
    list(
      l(
        "Explain served versions, the single storage version and actual stored-version migration.",
        "Expliquer versions servies, version de stockage unique et migration réelle des versions stockées.",
      ),
      l(
        "Test a reversible field rename without confusing conversion with admission validation or reconciliation.",
        "Tester un renommage réversible sans confondre conversion, validation d’admission et réconciliation.",
      ),
    ),
    h("mental-model", "One resource, several API views", "Une ressource, plusieurs vues API"),
    p(
      "A CRD can serve several versions while exactly one is the storage version for new writes. A client reading another served version needs an equivalent representation. With conversion strategy None, Kubernetes mainly changes apiVersion; it does not understand that size and replicas have the same meaning. A conversion webhook performs that transformation. It is called on read/write paths needing conversion, not only when a user deliberately migrates an object. Its outage can therefore block API reads and deletes, unlike a narrowly matched admission validator.",
      "Une CRD peut servir plusieurs versions mais une seule est la version de stockage des nouvelles écritures. Lire une autre version servie exige une représentation équivalente. Avec la stratégie None, Kubernetes change surtout apiVersion ; il ne sait pas que size et replicas ont le même sens. Un webhook de conversion réalise cette transformation. Il intervient sur les chemins de lecture/écriture qui l’exigent, pas seulement lors d’une migration volontaire. Sa panne peut donc bloquer lectures et suppressions, contrairement à un validateur d’admission précisément sélectionné.",
    ),
    p(
      "The ConversionReview response must preserve request UID, input order, object kind and object identity. Do not perform business side effects, contact an external inventory or generate a new name while converting. Our schemas deliberately encode the same integer as v1.spec.size and v2.spec.replicas, so a lossless mapping exists. When a newer schema adds information an older one cannot represent, inventing a default during downgrade can silently destroy meaning; design an explicit round-trip strategy or restrict incompatible evolution before shipping it.",
      "La réponse ConversionReview doit préserver UID de requête, ordre des entrées, kind et identité des objets. N’effectuez pas d’effet métier, ne consultez pas un inventaire externe et ne générez pas un nouveau nom pendant conversion. Nos schémas représentent volontairement le même entier par v1.spec.size et v2.spec.replicas : une conversion sans perte est possible. Si un schéma récent ajoute une information absente de l’ancien, inventer une valeur par défaut à la rétroconversion peut détruire le sens ; concevez un aller-retour explicite ou limitez cette évolution avant livraison.",
    ),
    ...labContext("lab-conversion"),
    note(
      "warn",
      l("A separate service and CRD", "Un service et une CRD distincts"),
      l(
        "Use Python 3.13+, OpenSSL 3+, Docker and the disposable kind cluster. Stop if gadgets.workshops.k8sops.dev already exists. This exercise installs its own converter; it does not alter other CRDs. Reuse the certificate-generation helper from the admission chapter, which only generates local files and supports this exact namespace. Keep the backend alive until all custom resources and the CRD are cleaned up.",
        "Utilisez Python 3.13+, OpenSSL 3+, Docker et le cluster kind jetable. Arrêtez-vous si gadgets.workshops.k8sops.dev existe déjà. Cet exercice installe son propre convertisseur sans modifier d’autres CRD. Réutilisez le générateur de certificats du chapitre admission, qui ne fait que créer des fichiers locaux et accepte précisément ce namespace. Gardez le backend actif jusqu’au nettoyage de toutes les ressources personnalisées et de la CRD.",
      ),
    ),
    code(
      "bash",
      'k get crd gadgets.workshops.k8sops.dev --ignore-not-found\npython3 -m unittest discover -s lab/level-4/api-extension -p \'test_*.py\'\nconversion_certs=$(mktemp -d)\nbash lab/level-4/admission-webhooks/prepare-tls.sh lab-conversion "$conversion_certs"\nk -n lab-conversion create secret tls webhook-tls --cert="$conversion_certs/tls.crt" --key="$conversion_certs/tls.key"\ndocker build -t conversion-webhook:local lab/level-4/api-extension\nkind load docker-image conversion-webhook:local --name k8s-ops-lab\nk -n lab-conversion apply -f lab/level-4/api-extension/server.yaml\nk -n lab-conversion rollout status deployment/webhook --timeout=120s',
    ),
    h("converter", "Read and test both directions", "Lire et tester les deux directions"),
    code("python", server, "lab/level-4/api-extension/server.py"),
    p(
      "deepcopy preserves metadata and status while the converter renames only one spec field. Identity conversion also returns a copy. Batch conversion preserves the request order and fails the entire result if one object cannot be represented; it never returns a partial successful list. Unit tests cover both directions, identity conversion, mixed-version batches, input immutability and invalid counts/versions. Schema validation owns normal user-input constraints; defensive converter failures guard malformed inputs, not a substitute business-policy mechanism.",
      "deepcopy conserve métadonnées et status tandis que le convertisseur renomme un seul champ spec. La conversion vers la même version retourne aussi une copie. Un lot conserve l’ordre et échoue entièrement si un objet est irreprésentable ; il ne retourne jamais une liste partiellement réussie. Les tests couvrent les deux directions, l’identité, les lots mixtes, l’absence de mutation et les comptes/versions invalides. Le schéma valide normalement les entrées utilisateur ; les refus défensifs du convertisseur protègent des entrées malformées sans remplacer une politique métier.",
    ),
    code("yaml", crd, "lab/level-4/api-extension/crd.yaml (render before applying)"),
    code(
      "bash",
      'conversion_ca=$(cat "$conversion_certs/ca-bundle.txt")\nsed "s|CA_BUNDLE_PLACEHOLDER|$conversion_ca|" lab/level-4/api-extension/crd.yaml > "$conversion_certs/crd.yaml"\nk apply -f "$conversion_certs/crd.yaml"\nk wait --for=condition=Established crd/gadgets.workshops.k8sops.dev --timeout=60s\nk -n lab-conversion apply -f lab/level-4/api-extension/gadget-v1.yaml\nk get --raw /apis/workshops.k8sops.dev/v1/namespaces/lab-conversion/gadgets/demo\nk get --raw /apis/workshops.k8sops.dev/v2/namespaces/lab-conversion/gadgets/demo\nk get crd gadgets.workshops.k8sops.dev -o jsonpath=\'{.status.storedVersions}\'',
    ),
    p(
      "Expected: the v1 view contains size:3, the v2 view replicas:3, and both retain name/namespace/UID and the workshop annotation. Newly written data is stored as v1. Reading v2 does not rewrite stored data. The preferred kubectl discovery version may be v2; explicit raw API paths remove that ambiguity. The typed schemas intentionally permit only equivalent count fields, so unknown-field pruning must be considered before promising preservation of arbitrary future data.",
      "Attendu : la vue v1 contient size:3, la vue v2 replicas:3 ; toutes deux conservent nom/namespace/UID et annotation workshop. Les nouvelles données sont stockées en v1. Lire v2 ne réécrit pas les données stockées. La découverte kubectl peut préférer v2 ; les chemins API explicites retirent l’ambiguïté. Les schémas typés n’autorisent volontairement que les champs équivalents ; le pruning doit être étudié avant de promettre la conservation de n’importe quelle donnée future.",
    ),
    h(
      "migration",
      "A storage flag is not a completed migration",
      "Un flag storage n’est pas une migration terminée",
    ),
    p(
      "Changing storage:true to v2 affects subsequent writes; existing objects can remain stored as v1. status.storedVersions records versions that may still exist. A safe migration keeps conversion available, rewrites every object with concurrency/error handling, verifies completion and only then removes obsolete stored-version status and eventually stops serving the old API. Blindly patching storedVersions to hide v1 does not migrate data. Aggregated API servers via APIService are another extension path with their own authentication, discovery and availability responsibilities; this CRD exercise does not install one.",
      "Passer storage:true à v2 concerne les écritures suivantes ; des objets existants peuvent rester en v1. status.storedVersions indique les versions pouvant encore exister. Une migration sûre garde la conversion disponible, réécrit chaque objet avec gestion de concurrence/erreurs, vérifie la fin puis retire l’ancien statut et éventuellement l’ancienne API servie. Modifier aveuglément storedVersions pour cacher v1 ne migre aucune donnée. Les serveurs agrégés via APIService constituent une autre extension, avec responsabilités d’authentification, découverte et disponibilité ; cet exercice CRD n’en installe pas.",
    ),
    h(
      "diagnosis",
      "Debug representation before the controller",
      "Diagnostiquer la représentation avant le contrôleur",
    ),
    code(
      "bash",
      "k -n lab-conversion logs deployment/webhook\nk -n lab-conversion get endpointslices -l kubernetes.io/service-name=webhook\nk describe crd gadgets.workshops.k8sops.dev",
    ),
    p(
      "A TLS error points to CA/SAN/expiry; a successful HTTP response with wrong UID or reordered objects still violates the protocol. Missing fields may come from schema pruning rather than reconciliation. Conversion latency affects listing many resources, so keep it deterministic and cheap. A healthy application controller cannot repair a broken conversion endpoint if the API cannot deliver its objects. Production requires capacity, rotation and compatible schema evolution tests, not just a passing single-object example.",
      "Une erreur TLS oriente vers CA/SAN/expiration ; une réponse HTTP réussie avec mauvais UID ou ordre incorrect viole encore le protocole. Des champs manquants peuvent venir du pruning plutôt que de la réconciliation. La latence de conversion affecte les listes volumineuses : gardez-la déterministe et peu coûteuse. Un contrôleur applicatif sain ne répare pas un endpoint de conversion si l’API ne lui livre plus les objets. En production, capacité, rotation et tests d’évolution sont nécessaires au-delà d’un seul exemple réussi.",
    ),
    h("quiz", "Reason about persisted versions", "Raisonner sur les versions persistées"),
    quiz(
      question(
        l(
          "Does reading v2 migrate a v1-stored object?",
          "Lire v2 migre-t-il un objet stocké en v1 ?",
        ),
        [
          l("No, it returns a converted view", "Non, cela retourne une vue convertie"),
          l("Yes, every read rewrites etcd", "Oui, toute lecture réécrit etcd"),
          l("Only if kubectl uses YAML", "Seulement si kubectl utilise YAML"),
        ],
        0,
        l(
          "Storage migration requires subsequent writes and verified completion.",
          "La migration exige des écritures ultérieures et une fin vérifiée.",
        ),
      ),
      question(
        l("Can conversion assign a new UID?", "La conversion peut-elle attribuer un nouvel UID ?"),
        [
          l("Yes, versions are different objects", "Oui, les versions sont des objets distincts"),
          l("No, identity must remain stable", "Non, l’identité doit rester stable"),
          l("Only when size changes", "Seulement si size change"),
        ],
        1,
        l(
          "Versions are representations of the same resource, not independent copies.",
          "Les versions représentent la même ressource, pas des copies indépendantes.",
        ),
      ),
      question(
        l(
          "Why is None insufficient for this field rename?",
          "Pourquoi None ne suffit-il pas à ce renommage ?",
        ),
        [
          l("None always disables CRDs", "None désactive toujours les CRD"),
          l("It cannot serve any version", "Il ne sert aucune version"),
          l(
            "Changing apiVersion does not map size to replicas",
            "Changer apiVersion ne transforme pas size en replicas",
          ),
        ],
        2,
        l(
          "Equivalent semantics across distinct schemas requires an actual conversion function.",
          "Des sens équivalents entre schémas distincts exigent une vraie fonction de conversion.",
        ),
      ),
    ),
    challenge(
      l("Write through v2 and verify v1", "Écrire par v2 et vérifier v1"),
      l(
        "Change replicas to four through the explicit v2 resource endpoint. Read v1 and prove size is four while identity remains stable. Do not change the storage flag or patch storedVersions.",
        "Passez replicas à quatre via la ressource v2 explicite. Relisez v1 et prouvez size à quatre avec identité stable. Ne changez ni storage ni storedVersions.",
      ),
      [
        l(
          "kubectl accepts a resource.version.group form for a version-specific patch.",
          "kubectl accepte resource.version.group pour un patch versionné.",
        ),
        l(
          "The write is converted back to the configured storage representation.",
          "L’écriture est reconvertie vers la représentation de stockage configurée.",
        ),
      ],
      [
        code(
          "bash",
          `k -n lab-conversion patch gadgets.v2.workshops.k8sops.dev demo --type=merge -p '{"spec":{"replicas":4}}'\nk get --raw /apis/workshops.k8sops.dev/v1/namespaces/lab-conversion/gadgets/demo\nk get --raw /apis/workshops.k8sops.dev/v2/namespaces/lab-conversion/gadgets/demo`,
        ),
        p(
          "Expected: v1 size:4 and v2 replicas:4 on the same UID. This proves a bidirectional update path, not a migration of every object or backward compatibility of a future controller.",
          "Attendu : size:4 en v1 et replicas:4 en v2 sur le même UID. Cela prouve un chemin d’écriture bidirectionnel, pas une migration globale ni la compatibilité d’un futur contrôleur.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Keep conversion available during cleanup",
      "Garder la conversion disponible pendant le nettoyage",
    ),
    code(
      "bash",
      'k -n lab-conversion delete gadgets.workshops.k8sops.dev --all\nk delete crd gadgets.workshops.k8sops.dev\nk delete namespace lab-conversion\nprintf "Inspect and manually remove private conversion certificates: %s\\n" "$conversion_certs"',
    ),
    p(
      "Deleting a CRD deletes its custom resources; the exercise therefore uses a dedicated group and checks for existing ownership first. Remove the printed private certificate directory manually after verifying cluster cleanup. No APIService, global trust root or external certificate controller was installed.",
      "Supprimer une CRD supprime ses ressources ; le groupe dédié et le contrôle de propriété initial sont donc essentiels. Retirez manuellement le répertoire privé de certificats après vérification du nettoyage. Aucun APIService, racine de confiance globale ou contrôleur externe de certificats n’a été installé.",
    ),
  ],
};
