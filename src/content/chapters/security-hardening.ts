import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import web from "../../../lab/level-3/security-hardening/web.yaml?raw";

export const securityHardening: Chapter = {
  id: "security-hardening",
  level: 3,
  minutes: 60,
  title: l("Kubernetes security hardening", "Durcissement de la sécurité"),
  summary: l(
    "Reduce a workload's privileges from an explicit threat model, verify the runtime contract and diagnose compatibility failures without disabling every control.",
    "Réduire les privilèges d’un workload selon une menace explicite, vérifier le contrat d’exécution et diagnostiquer les incompatibilités sans retirer toutes les protections.",
  ),
  prerequisites: ["rbac", "resources", "network-policies"],
  related: ["pod-security", "rbac-advanced", "admission-webhooks"],
  blocks: [
    h(
      "objectives",
      "Turn a threat into a testable control",
      "Transformer une menace en contrôle vérifiable",
    ),
    list(
      l(
        "Explain what non-root, capability dropping, seccomp and a read-only root filesystem each constrain.",
        "Expliquer ce que limitent non-root, suppression des capabilities, seccomp et racine en lecture seule.",
      ),
      l(
        "Preserve necessary writable paths while keeping API credentials and host access out of an ordinary web workload.",
        "Préserver les chemins d’écriture nécessaires en excluant identifiants API et accès hôte d’un serveur web ordinaire.",
      ),
    ),
    h(
      "threat-model",
      "Assume the web process is compromised",
      "Supposer le processus web compromis",
    ),
    p(
      "Start with the assets and trust boundaries. This web server needs static files, port 8080 and temporary files. It does not need the Kubernetes API, privileged host devices, host networking or a host filesystem mount. If an attacker obtains code execution inside it, reducing permissions limits what that process can change or reach. These controls reduce blast radius; containers still share a host kernel, so they do not prove protection from every kernel exploit or malicious administrator.",
      "Partez des actifs et frontières de confiance. Ce serveur web a besoin de fichiers statiques, du port 8080 et de fichiers temporaires. Il n’a besoin ni de l’API Kubernetes, ni de périphériques privilégiés, ni du réseau hôte, ni d’un montage du système de fichiers hôte. Si un attaquant y exécute du code, réduire les permissions limite ses modifications et accès. Ces contrôles réduisent l’impact ; les conteneurs partagent encore un noyau hôte et ne prouvent pas une protection contre toute faille noyau ou tout administrateur malveillant.",
    ),
    p(
      "runAsNonRoot rejects an effective root identity but does not select a suitable UID for arbitrary images. Here runAsUser/runAsGroup 101 match the image contract. allowPrivilegeEscalation: false prevents gaining privileges through execution mechanisms such as setuid. Dropping ALL capabilities removes ambient Linux powers unnecessary for this server. RuntimeDefault applies the container runtime's seccomp profile; its exact syscall policy depends on the runtime, not the Kubernetes version label alone. None of these controls restricts network egress by itself.",
      "runAsNonRoot refuse une identité root effective mais ne choisit pas un UID adapté à n’importe quelle image. Ici runAsUser/runAsGroup 101 correspondent au contrat de l’image. allowPrivilegeEscalation: false empêche de gagner des privilèges via des mécanismes comme setuid. Retirer ALL des capabilities supprime les pouvoirs Linux inutiles à ce serveur. RuntimeDefault applique le profil seccomp du runtime ; sa politique exacte d’appels système dépend du runtime, pas seulement de la version Kubernetes. Aucun de ces contrôles ne limite à lui seul les sorties réseau.",
    ),
    ...labContext("lab-hardening"),
    h("manifest", "Make the required exception narrow", "Rendre l’exception nécessaire étroite"),
    code("yaml", web, "lab/level-3/security-hardening/web.yaml"),
    p(
      "The unprivileged nginx image listens on 8080 and places PID/cache files under /tmp. A read-only root filesystem therefore remains compatible with a small writable emptyDir at /tmp. fsGroup makes the mounted scratch directory usable by the non-root group. emptyDir is disposable and sizeLimit is not a durable storage guarantee. A broad writable hostPath would change the threat model completely. The image tag is a fixed teaching input, not immutable evidence: production should resolve a reviewed digest, verify provenance and keep a patch process.",
      "L’image nginx non privilégiée écoute sur 8080 et place ses fichiers PID/cache dans /tmp. La racine en lecture seule reste donc compatible avec un petit emptyDir inscriptible sur /tmp. fsGroup rend ce répertoire monté utilisable par le groupe non-root. emptyDir est jetable et sizeLimit ne garantit aucune durabilité. Un vaste hostPath inscriptible changerait totalement la menace. Le tag est une entrée pédagogique fixe, pas une preuve d’immutabilité : en production, résolvez un digest examiné, vérifiez la provenance et conservez un processus de correctifs.",
    ),
    code(
      "bash",
      `k -n lab-hardening apply -f lab/level-3/security-hardening/web.yaml\nk -n lab-hardening rollout status deployment/web --timeout=120s\nk -n lab-hardening exec deployment/web -- sh -c 'id; grep -E "^(CapEff|NoNewPrivs|Seccomp):" /proc/self/status'\nk -n lab-hardening exec deployment/web -- sh -c 'test ! -e /var/run/secrets/kubernetes.io/serviceaccount/token'\nk -n lab-hardening exec deployment/web -- sh -c 'touch /tmp/probe && rm /tmp/probe'\nk -n lab-hardening exec deployment/web -- touch /etc/probe`,
    ),
    p(
      "Expected: UID/GID 101, zero effective capabilities, NoNewPrivs 1, Seccomp 2, no automatically mounted API token and a successful /tmp write. The final /etc write is intentionally refused and exits nonzero. Runtime values are observations to collect, not values this course has measured on your cluster. The token absence does not demonstrate no RBAC grants exist; it demonstrates credentials were not automatically mounted.",
      "Attendu : UID/GID 101, aucune capability effective, NoNewPrivs 1, Seccomp 2, aucun token API monté automatiquement et écriture réussie dans /tmp. L’écriture finale dans /etc est volontairement refusée avec un code non nul. Les valeurs du runtime sont des observations à relever, pas des mesures déjà réalisées par ce cours. L’absence de token ne démontre pas l’absence de droits RBAC ; elle démontre l’absence de montage automatique d’identifiants.",
    ),
    code("bash", "k -n lab-hardening port-forward deployment/web 8081:8080"),
    p(
      "Open http://localhost:8081 and stop forwarding with Ctrl+C. Verify useful behavior alongside restriction: a secure configuration that prevents the workload from serving is not an accepted delivery. Port-forward checks this process directly; it does not validate Service routing, ingress TLS or network isolation.",
      "Ouvrez http://localhost:8081 puis arrêtez avec Ctrl+C. Vérifiez le comportement utile en même temps que les restrictions : une configuration qui empêche le service de fonctionner n’est pas une livraison acceptée. Port-forward contrôle directement ce processus ; il ne valide ni routage Service, ni TLS d’entrée, ni isolation réseau.",
    ),
    h(
      "diagnosis",
      "Fix the smallest incompatible assumption",
      "Corriger la plus petite hypothèse incompatible",
    ),
    p(
      "A CreateContainerConfigError mentioning non-root can mean an image declares a nonnumeric user that the kubelet cannot verify without an explicit UID. A read-only filesystem error identifies an unexpected write path: inspect logs and mount a purpose-specific scratch volume instead of setting the entire root writable. Permission denied on a mount calls for owner/group inspection, not privileged: true. A seccomp denial needs runtime/audit evidence and a narrowly reviewed profile, not an unconfined default. Preserve the failed observation and retest the original request after each change.",
      "Un CreateContainerConfigError lié à non-root peut venir d’une image déclarant un utilisateur non numérique que le kubelet ne peut vérifier sans UID explicite. Une erreur de système de fichiers en lecture seule révèle un chemin d’écriture inattendu : examinez les logs et montez un volume temporaire ciblé plutôt que de rendre toute la racine inscriptible. Permission denied sur un montage demande d’examiner propriétaire et groupe, pas privileged: true. Un refus seccomp exige des preuves runtime/audit et un profil précisément examiné, pas une configuration unconfined par défaut. Conservez l’observation en échec puis retestez la requête initiale après chaque changement.",
    ),
    note(
      "warn",
      l("Workload hardening is one layer", "Le durcissement du workload est une couche"),
      l(
        "Protect control-plane access, RBAC delegation, image supply, Secrets storage/rotation and backup access separately. Enforce NetworkPolicies only with a supporting CNI; default kind does not provide that proof. Resource limits address shared capacity and failure behavior, not authorization. The next chapter uses restricted Pod Security Admission to enforce a subset of this contract, including non-root execution, capability and seccomp requirements. It does not require a read-only root filesystem, disabled API-token mounting or resource limits; enforce those additional requirements through separately reviewed policy.",
        "Protégez séparément accès au control plane, délégation RBAC, chaîne des images, stockage/rotation des Secrets et accès aux sauvegardes. Appliquez les NetworkPolicies avec un CNI compatible ; kind par défaut n’en apporte pas la preuve. Les limites de ressources concernent capacité partagée et comportement en panne, pas l’autorisation. Le chapitre suivant utilise Pod Security Admission restricted pour imposer une partie de ce contrat, dont exécution non root, capabilities et seccomp. Il n’exige ni racine en lecture seule, ni absence de token API monté, ni limites de ressources ; ces exigences supplémentaires demandent une politique examinée séparément.",
      ),
    ),
    h("quiz", "State each control's limit", "Exprimer la limite de chaque contrôle"),
    quiz(
      question(
        l(
          "Why is /tmp writable while the root filesystem is read-only?",
          "Pourquoi /tmp est-il inscriptible avec une racine en lecture seule ?",
        ),
        [
          l("Non-root bypasses filesystem flags", "Non-root contourne les options de montage"),
          l(
            "A separate emptyDir mount supplies that path",
            "Un montage emptyDir distinct fournit ce chemin",
          ),
          l(
            "readOnlyRootFilesystem only affects logs",
            "readOnlyRootFilesystem ne concerne que les logs",
          ),
        ],
        1,
        l(
          "A mount has its own permissions and storage lifecycle; the root image layers remain read-only.",
          "Un montage possède permissions et cycle de vie propres ; les couches racine de l’image restent en lecture seule.",
        ),
      ),
      question(
        l("Does non-root prevent API access?", "Non-root empêche-t-il l’accès à l’API ?"),
        [
          l("Always", "Toujours"),
          l("Only on port 443", "Seulement sur le port 443"),
          l("No; credentials and RBAC are separate", "Non ; identifiants et RBAC sont distincts"),
        ],
        2,
        l(
          "An unprivileged Linux process can still use any accessible credential; avoid unnecessary token mounting and grants.",
          "Un processus Linux non privilégié peut utiliser les identifiants accessibles ; évitez tokens et droits inutiles.",
        ),
      ),
      question(
        l(
          "Why verify HTTP after applying restrictions?",
          "Pourquoi vérifier HTTP après les restrictions ?",
        ),
        [
          l(
            "Controls must preserve the required application behavior",
            "Les contrôles doivent préserver le comportement applicatif requis",
          ),
          l("Ready implies no security risks", "Ready implique l’absence de risques"),
          l(
            "Port-forward verifies all egress policies",
            "Port-forward vérifie toutes les politiques de sortie",
          ),
        ],
        0,
        l(
          "Security and functional acceptance are complementary; neither replaces the other.",
          "Acceptation sécurité et acceptation fonctionnelle sont complémentaires ; aucune ne remplace l’autre.",
        ),
      ),
    ),
    challenge(
      l("Add one writable application cache", "Ajouter un seul cache applicatif inscriptible"),
      l(
        "The application now needs /var/cache/lab. Add a 16Mi emptyDir without weakening root read-only, capabilities or UID settings. Prove that this path works and /etc remains protected.",
        "L’application a désormais besoin de /var/cache/lab. Ajoutez un emptyDir de 16Mi sans affaiblir racine en lecture seule, capabilities ou UID. Prouvez que ce chemin fonctionne et que /etc reste protégé.",
      ),
      [
        l(
          "Add a distinct named volume and matching mount.",
          "Ajoutez un volume nommé distinct et son montage.",
        ),
        l(
          "Use a strategic patch so the existing /tmp volume and mount remain.",
          "Utilisez un strategic patch pour conserver volume et montage /tmp existants.",
        ),
      ],
      [
        code(
          "bash",
          `k -n lab-hardening patch deployment web --type=strategic -p '{"spec":{"template":{"spec":{"volumes":[{"name":"app-cache","emptyDir":{"sizeLimit":"16Mi"}}],"containers":[{"name":"web","volumeMounts":[{"name":"app-cache","mountPath":"/var/cache/lab"}]}]}}}}'\nk -n lab-hardening rollout status deployment/web --timeout=120s\nk -n lab-hardening exec deployment/web -- touch /var/cache/lab/probe\nk -n lab-hardening exec deployment/web -- touch /etc/probe`,
        ),
        p(
          "Expected: the cache write succeeds; /etc still fails. fsGroup also applies to the new supported volume. This proves a scoped exception, not cache persistence: replacing the Pod discards both emptyDirs.",
          "Attendu : l’écriture du cache réussit ; /etc reste refusé. fsGroup s’applique aussi au nouveau volume compatible. Cela prouve une exception ciblée, pas la persistance du cache : remplacer le Pod détruit les deux emptyDirs.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code("bash", "k delete namespace lab-hardening"),
    p(
      "No node or cluster-wide policy was changed. This exercise does not establish production compliance, image vulnerability clearance or resistance to every exploit; it demonstrates a reviewable workload privilege contract.",
      "Aucun nœud ni politique globale n’a été modifié. Cet exercice n’établit ni conformité de production, ni absence de vulnérabilités d’image, ni résistance à toute exploitation ; il démontre un contrat de privilèges du workload vérifiable.",
    ),
  ],
};
