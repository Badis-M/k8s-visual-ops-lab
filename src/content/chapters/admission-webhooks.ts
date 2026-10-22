import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import server from "../../../lab/level-4/admission-webhooks/server.py?raw";
import webhook from "../../../lab/level-4/admission-webhooks/webhook.yaml?raw";

export const admissionWebhooks: Chapter = {
  id: "admission-webhooks",
  level: 4,
  minutes: 60,
  title: l("Admission webhooks and policy", "Webhooks d’admission et politiques"),
  summary: l(
    "Implement a real TLS AdmissionReview validator and investigate how a policy dependency changes API availability.",
    "Implémenter un vrai validateur AdmissionReview en TLS et étudier l’effet de cette dépendance sur la disponibilité de l’API.",
  ),
  prerequisites: ["pod-security", "rbac-advanced"],
  related: ["api-extension", "failure-scenarios"],
  blocks: [
    h(
      "objectives",
      "Policy includes an availability contract",
      "Une politique inclut un contrat de disponibilité",
    ),
    list(
      l(
        "Return the correct review UID and decision without side effects or unnecessary API permissions.",
        "Retourner le bon UID et la décision sans effets de bord ni permissions API inutiles.",
      ),
      l(
        "Connect server identity, CA trust, matching scope and failure policy to observable admission behavior.",
        "Relier identité serveur, confiance CA, portée de sélection et failure policy au comportement d’admission observable.",
      ),
    ),
    h(
      "mental-model",
      "Authorization is not the final write check",
      "L’autorisation n’est pas le dernier contrôle d’écriture",
    ),
    p(
      "After authentication and authorization, admission can mutate or validate API requests before persistence. A validating webhook returns allow/deny; a mutating webhook returns patches and creates ordering/idempotency concerns. Prefer built-in declarative policy when it expresses your requirement, reserving network webhooks for logic that needs them. Our validator requires an owner label on ConfigMaps in one labeled lab namespace. This teaching rule does not prove a label's owner is authentic; RBAC and governance must determine who may claim or edit it.",
      "Après authentification et autorisation, l’admission peut modifier ou valider une requête avant persistance. Un webhook validant répond autoriser/refuser ; un webhook mutant retourne des patches et impose des questions d’ordre et d’idempotence. Préférez une politique déclarative intégrée si elle exprime le besoin et réservez les webhooks réseau aux logiques nécessaires. Notre validateur impose un label owner aux ConfigMaps d’un seul namespace de lab étiqueté. Cette règle pédagogique n’authentifie pas le propriétaire déclaré ; RBAC et gouvernance déterminent qui peut le revendiquer ou modifier.",
    ),
    p(
      "The API server calls a TLS Service endpoint using an AdmissionReview envelope, and the response must echo request.uid. A normal denial is HTTP 200 with allowed:false; transport failure or malformed response follows failurePolicy instead. Fail refuses affected requests when the backend cannot answer, while Ignore can admit them without the check. A small timeout bounds added latency, not total application outage. Scope narrowly to avoid making your own certificate rotation, system recovery or every cluster write depend on an unavailable service.",
      "Le serveur API appelle un Service TLS avec une enveloppe AdmissionReview ; la réponse doit recopier request.uid. Un refus normal est HTTP 200 avec allowed:false ; une panne de transport ou réponse malformée relève de failurePolicy. Fail refuse les requêtes concernées sans réponse du backend ; Ignore peut les admettre sans contrôle. Un timeout court borne la latence ajoutée, pas la durée totale d’une panne. Limitez la portée pour ne pas rendre rotation de certificats, récupération système ou toutes les écritures dépendantes d’un service indisponible.",
    ),
    ...labContext("lab-admission"),
    note(
      "warn",
      l("Extra tools and cleanup first", "Outils supplémentaires et nettoyage préalable"),
      l(
        "The learner needs Python 3.13+, OpenSSL 3+ with -addext, Docker and kind. This lesson supplies complete Python stdlib code, unit tests and Docker/manifests; the implementation agent does not start them. Stop if lab-owner-validation already exists. Only label lab-admission. The generated private keys stay in a private temporary directory and Kubernetes Secret, never in Git or terminal output. Certificates expire after two days: this is a lab PKI, not rotation automation.",
        "L’apprenant doit disposer de Python 3.13+, OpenSSL 3+ avec -addext, Docker et kind. Ce cours fournit code Python stdlib complet, tests unitaires, Docker et manifests ; l’agent ne les démarre pas. Arrêtez-vous si lab-owner-validation existe déjà. Étiquetez seulement lab-admission. Les clés privées générées restent dans un répertoire temporaire privé et un Secret Kubernetes, jamais dans Git ni les sorties terminal. Les certificats expirent après deux jours : cette PKI de lab n’automatise pas la rotation.",
      ),
    ),
    code(
      "bash",
      'k get validatingwebhookconfiguration lab-owner-validation --ignore-not-found\npython3 -m unittest discover -s lab/level-4/admission-webhooks -p \'test_*.py\'\ncert_dir=$(mktemp -d)\nbash lab/level-4/admission-webhooks/prepare-tls.sh lab-admission "$cert_dir"\nk -n lab-admission create secret tls webhook-tls --cert="$cert_dir/tls.crt" --key="$cert_dir/tls.key"\ndocker build -t admission-webhook:local lab/level-4/admission-webhooks\nkind load docker-image admission-webhook:local --name k8s-ops-lab\nk -n lab-admission apply -f lab/level-4/admission-webhooks/server.yaml\nk -n lab-admission rollout status deployment/webhook --timeout=120s',
    ),
    h(
      "implementation",
      "Read the actual protocol handler",
      "Lire le véritable gestionnaire de protocole",
    ),
    code("python", server, "lab/level-4/admission-webhooks/server.py"),
    p(
      "The policy function is pure: dry-run and real requests receive identical decisions and no external write occurs, matching sideEffects: None. The server bounds input length, avoids logging objects and returns JSON with the matching UID. No ServiceAccount token or API client is required. The HTTPS readiness probe proves the process answers, but kubelet probe behavior does not prove the API server trusts its certificate. A real server-side dry-run below tests that complete integration path.",
      "La fonction de politique est pure : dry-run et vraie requête reçoivent la même décision sans écriture externe, conformément à sideEffects: None. Le serveur borne la taille d’entrée, ne journalise pas les objets et retourne du JSON avec l’UID correspondant. Aucun token de ServiceAccount ni client API n’est nécessaire. La readiness HTTPS prouve une réponse du processus, mais son comportement ne prouve pas que le serveur API fait confiance au certificat. Le dry-run serveur suivant vérifie ce chemin complet.",
    ),
    code("yaml", webhook, "lab/level-4/admission-webhooks/webhook.yaml (render before applying)"),
    code(
      "bash",
      'ca_bundle=$(cat "$cert_dir/ca-bundle.txt")\nsed "s|CA_BUNDLE_PLACEHOLDER|$ca_bundle|" lab/level-4/admission-webhooks/webhook.yaml > "$cert_dir/webhook.yaml"\nk label namespace lab-admission lab.k8sops.dev/admission=enabled\nk apply -f "$cert_dir/webhook.yaml"\nk -n lab-admission apply --dry-run=server -f lab/level-4/admission-webhooks/valid.yaml\nk -n lab-admission apply --dry-run=server -f lab/level-4/admission-webhooks/invalid.yaml',
    ),
    p(
      "caBundle contains the PEM CA encoded in base64, not the private key. The certificate SAN matches webhook.lab-admission.svc, the identity used by the Service reference. Expected after registration propagates: valid is accepted in dry-run and invalid is denied with the owner message. Neither dry-run creates a ConfigMap. namespaceSelector reduces scope; it is not tenant-proof if users can change the namespace label. Object selectors alone would be bypassable if users could remove the matching object label.",
      "caBundle contient la CA PEM encodée en base64, pas la clé privée. Le SAN correspond à webhook.lab-admission.svc, identité employée par la référence Service. Attendu après propagation : valid est accepté en dry-run et invalid refusé avec le message owner. Aucun dry-run ne crée de ConfigMap. namespaceSelector réduit la portée ; il n’est pas inviolable si les utilisateurs modifient le label du namespace. Un object selector seul serait contournable si l’utilisateur retirait le label de sélection.",
    ),
    h(
      "diagnosis",
      "Separate a rejection from a broken policy service",
      "Séparer refus et service de politique défaillant",
    ),
    code(
      "bash",
      "k -n lab-admission get endpointslices -l kubernetes.io/service-name=webhook\nk -n lab-admission logs deployment/webhook\nk get validatingwebhookconfiguration lab-owner-validation -o yaml",
    ),
    p(
      "A policy message means the validator answered; x509 unknown authority points to CA trust, certificate name mismatch to SANs, and connection refused/no endpoints to service readiness or selectors. A timeout can be network reachability or backend slowness. Never solve TLS errors with insecure verification or solve a critical policy failure by globally switching Ignore without an explicit risk decision. Production needs multiple replicas across real failure domains, certificate rotation with trust overlap, latency/error monitoring and a restricted recovery procedure. This single local process proves none of that HA.",
      "Un message de politique indique une réponse du validateur ; x509 unknown authority pointe la CA, une erreur de nom les SAN, et connection refused/absence d’endpoints la readiness ou les sélecteurs. Un timeout peut venir du réseau ou de la lenteur du backend. Ne corrigez pas TLS par une vérification non sécurisée et ne passez pas globalement une politique critique en Ignore sans décision de risque explicite. En production, il faut plusieurs réplicas sur de vrais domaines de panne, rotation avec chevauchement de confiance, suivi latence/erreurs et procédure de récupération restreinte. Ce processus local unique ne prouve aucune HA.",
    ),
    h("quiz", "Predict the failure path", "Prédire le chemin d’échec"),
    quiz(
      question(
        l(
          "What happens when this backend is unavailable with failurePolicy: Fail?",
          "Que se passe-t-il si ce backend est indisponible avec failurePolicy: Fail ?",
        ),
        [
          l("Matching requests are rejected", "Les requêtes correspondantes sont refusées"),
          l("Every read in the cluster fails", "Toute lecture du cluster échoue"),
          l(
            "The policy automatically mutates the object",
            "La politique modifie automatiquement l’objet",
          ),
        ],
        0,
        l(
          "Only matching admission operations depend on the webhook; reads are outside these rules.",
          "Seules les opérations d’admission sélectionnées en dépendent ; les lectures sont hors de ces règles.",
        ),
      ),
      question(
        l("Why is sideEffects: None honest here?", "Pourquoi sideEffects: None est-il exact ici ?"),
        [
          l("Python prevents side effects", "Python interdit les effets de bord"),
          l(
            "The decision function performs no external mutation",
            "La fonction de décision n’effectue aucune mutation externe",
          ),
          l("dryRun never reaches a webhook", "dryRun n’atteint jamais un webhook"),
        ],
        1,
        l(
          "Dry-run still invokes the service; the implementation must honor the declared contract.",
          "Le dry-run appelle bien le service ; l’implémentation doit respecter le contrat déclaré.",
        ),
      ),
      question(
        l(
          "Which identity must the server certificate cover?",
          "Quelle identité le certificat serveur doit-il couvrir ?",
        ),
        [
          l("The Pod's random name", "Le nom aléatoire du Pod"),
          l("The learner's laptop hostname", "Le nom de l’ordinateur"),
          l("webhook.lab-admission.svc", "webhook.lab-admission.svc"),
        ],
        2,
        l(
          "The API server validates the Service reference's DNS identity against the certificate SAN.",
          "Le serveur API vérifie l’identité DNS de la référence Service via le SAN du certificat.",
        ),
      ),
    ),
    challenge(
      l("Break and recover the dependency", "Casser puis rétablir la dépendance"),
      l(
        "Scale only this lab webhook to zero, show that even a valid ConfigMap dry-run now fails due to transport, then restore one replica and prove admission works again without weakening the policy.",
        "Réduisez seulement ce webhook de lab à zéro, montrez que même le dry-run valide échoue par transport puis rétablissez un réplica et prouvez l’admission sans affaiblir la politique.",
      ),
      [
        l(
          "Existing matching ConfigMaps remain; this is an admission dependency.",
          "Les ConfigMaps existants restent ; c’est une dépendance d’admission.",
        ),
        l(
          "Restore the backend and wait for Ready before repeating the original dry-run.",
          "Rétablissez le backend et attendez Ready avant le dry-run initial.",
        ),
      ],
      [
        code(
          "bash",
          "k -n lab-admission scale deployment/webhook --replicas=0\nk -n lab-admission get endpointslices -l kubernetes.io/service-name=webhook\nk -n lab-admission apply --dry-run=server -f lab/level-4/admission-webhooks/valid.yaml\nk -n lab-admission scale deployment/webhook --replicas=1\nk -n lab-admission rollout status deployment/webhook --timeout=120s\nk -n lab-admission apply --dry-run=server -f lab/level-4/admission-webhooks/valid.yaml",
        ),
        p(
          "Wait until endpoints are absent before the failed probe and present before recovery. Expected: transport error while scaled down, success after recovery. This isolates policy-backend failure from an intentional owner-label denial.",
          "Attendez l’absence d’endpoints avant le test d’échec puis leur présence avant récupération. Attendu : erreur de transport à zéro, réussite après reprise. Cela distingue une panne du backend d’un refus volontaire pour label manquant.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Remove registration before its backend",
      "Retirer l’enregistrement avant son backend",
    ),
    code(
      "bash",
      'k delete validatingwebhookconfiguration lab-owner-validation\nk delete namespace lab-admission\nprintf "Inspect and manually remove private lab certificates: %s\\n" "$cert_dir"',
    ),
    p(
      "Inspect and remove the printed temporary directory, including its CA/server private keys. The explicit cluster-scoped registration cleanup prevents leaving a fail-closed dependency pointing at a deleted Service.",
      "Examinez puis supprimez le répertoire temporaire affiché, clés privées CA/serveur incluses. Retirer explicitement l’enregistrement global évite une dépendance bloquante vers un Service supprimé.",
    ),
  ],
};
