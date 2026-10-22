import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import legacy from "../../../lab/level-3/pod-security/legacy.yaml?raw";
import fixed from "../../../lab/level-3/pod-security/fixed-legacy.yaml?raw";

export const podSecurity: Chapter = {
  id: "pod-security",
  level: 3,
  minutes: 35,
  title: l("Pod Security Admission", "Pod Security Admission"),
  summary: l(
    "Stage versioned namespace guardrails, observe warnings and refusal, and distinguish admission from remediation of existing Pods.",
    "Introduire des garde-fous versionnés par namespace, observer avertissements et refus et distinguer admission et correction des Pods existants.",
  ),
  prerequisites: ["security-hardening", "namespaces-contexts"],
  related: ["rbac-advanced", "admission-webhooks"],
  blocks: [
    h("objectives", "Make the guardrail explicit", "Rendre le garde-fou explicite"),
    list(
      l(
        "Choose a policy level separately from its enforce, audit and warn modes.",
        "Choisir un niveau de politique séparément des modes enforce, audit et warn.",
      ),
      l(
        "Pin the standard version and plan compatibility before increasing enforcement.",
        "Épingler la version du standard et préparer la compatibilité avant de renforcer l’application.",
      ),
    ),
    h(
      "mental-model",
      "Standards describe; admission decides",
      "Le standard décrit ; l’admission décide",
    ),
    p(
      "Pod Security Standards define privileged, baseline and restricted profiles. Privileged is unrestricted by these standards; baseline blocks known privilege-escalation patterns while remaining permissive for common workloads; restricted adds stronger requirements such as non-root execution, capability dropping and constrained seccomp. Pod Security Admission is the built-in mechanism that checks these standards using namespace labels. It validates a request; it does not mutate a manifest to make it compliant and does not scan image vulnerabilities.",
      "Pod Security Standards définit les profils privileged, baseline et restricted. Privileged n’apporte pas ces restrictions ; baseline bloque des schémas connus d’élévation tout en restant permissif pour les workloads courants ; restricted ajoute notamment non-root, retrait des capabilities et seccomp contraint. Pod Security Admission est le mécanisme intégré qui contrôle ces standards via des labels de namespace. Il valide une requête ; il ne réécrit pas un manifest pour le rendre conforme et ne recherche pas les vulnérabilités d’image.",
    ),
    p(
      "The three modes are independent. enforce refuses violating Pod requests. warn returns a user-visible warning but permits the request. audit attaches an annotation to the API audit event; observing it requires configured API auditing and access to those logs. It is not a namespace Event visible through kubectl get events. Pin each mode to v1.35 here so an unrelated cluster upgrade does not silently choose a different policy version. Pinning also creates an explicit maintenance obligation when you decide to upgrade that contract.",
      "Les trois modes sont indépendants. enforce refuse les requêtes de Pods non conformes. warn avertit l’appelant mais permet la requête. audit ajoute une annotation à l’événement d’audit API ; l’observer exige une configuration d’audit et l’accès à ses logs. Ce n’est pas un Event de namespace visible via kubectl get events. Épinglez ici chaque mode sur v1.35 pour qu’une mise à jour du cluster ne choisisse pas silencieusement un autre standard. Cela impose aussi une révision explicite lorsque vous déciderez de mettre à jour ce contrat.",
    ),
    ...labContext("lab-psa"),
    h(
      "stage",
      "Enforce baseline, preview restricted",
      "Appliquer baseline, prévisualiser restricted",
    ),
    code(
      "bash",
      "k label namespace lab-psa pod-security.kubernetes.io/enforce=baseline pod-security.kubernetes.io/enforce-version=v1.35 pod-security.kubernetes.io/audit=restricted pod-security.kubernetes.io/audit-version=v1.35 pod-security.kubernetes.io/warn=restricted pod-security.kubernetes.io/warn-version=v1.35\nk get namespace lab-psa --show-labels\nk -n lab-psa apply --dry-run=server -f lab/level-3/pod-security/legacy.yaml",
    ),
    note(
      "warn",
      l("Validate the controller is active", "Vérifier que le contrôleur est actif"),
      l(
        "These labels require active, non-exempt Pod Security admission. The lab expects the default kind control plane. If the later restricted dry-run does not refuse the known violation, stop and inspect admission configuration/exemptions instead of claiming enforcement. Only lab-psa is labeled; no system namespace or global policy is changed.",
        "Ces labels exigent une admission Pod Security active sans exemption applicable. Le lab vise le control plane kind par défaut. Si le dry-run restricted ne refuse pas la violation connue, arrêtez-vous et examinez configuration/exemptions au lieu d’annoncer une protection. Seul lab-psa reçoit ces labels ; aucun namespace système ni politique globale n’est modifié.",
      ),
    ),
    code("yaml", legacy, "lab/level-3/pod-security/legacy.yaml"),
    p(
      "The sleeper deliberately allows privilege escalation while dropping capabilities and using a non-root UID. It is accepted by baseline but violates restricted. Expected from the server dry-run: an allowed request plus a restricted-policy warning naming allowPrivilegeEscalation. No Pod is persisted by this first command. Client dry-run would only build an object and could not prove server-side admission behavior. This is a controlled contrast, not a suggested production exception.",
      "Le conteneur en sommeil autorise volontairement l’élévation tout en retirant les capabilities et utilisant un UID non-root. Il respecte baseline mais viole restricted. Attendu du dry-run serveur : requête permise et avertissement restricted nommant allowPrivilegeEscalation. Aucun Pod n’est conservé par cette première commande. Un dry-run client ne ferait que construire l’objet, sans prouver l’admission serveur. Ce contraste contrôlé n’est pas une exception conseillée pour la production.",
    ),
    code(
      "bash",
      "k -n lab-psa apply -f lab/level-3/pod-security/legacy.yaml\nk -n lab-psa wait --for=condition=Ready pod/legacy --timeout=120s\nk label namespace lab-psa pod-security.kubernetes.io/enforce=restricted --overwrite\nk -n lab-psa get pod legacy\nk -n lab-psa apply --dry-run=server -f lab/level-3/pod-security/rejected-new.yaml",
    ),
    p(
      "Expected: changing the label may warn about existing violations, but the already running legacy Pod is not evicted. The new rejected-new request is refused and exits nonzero because restricted now enforces the missing protection. Admission cannot retroactively restart, quarantine or repair old Pods. A rolling replacement plan is part of rollout safety; switching a label while controllers still generate incompatible Pods can leave the application without replacements during a later node failure.",
      "Attendu : changer le label peut avertir de violations existantes, mais le Pod legacy déjà actif n’est pas expulsé. La nouvelle requête rejected-new est refusée avec un code non nul car restricted impose désormais la protection manquante. L’admission ne redémarre, n’isole et ne corrige pas rétroactivement les anciens Pods. Une stratégie de remplacement progressif fait partie de la sécurité du changement ; changer un label alors que des contrôleurs produisent encore des Pods incompatibles peut empêcher tout remplacement lors d’une panne de nœud ultérieure.",
    ),
    h(
      "controller-boundary",
      "A Deployment can exist while its Pods are refused",
      "Un Deployment peut exister avec ses Pods refusés",
    ),
    p(
      "enforce checks resulting Pods rather than rejecting every parent workload object. warn and audit also inspect Pod templates so users receive earlier feedback. Therefore an accepted Deployment is not proof its ReplicaSet can create Pods. Inspect describe deployment, describe replicaset and FailedCreate Events when replicas remain absent. Check init containers and sidecars too: one missing securityContext can violate the standard even when the main container is correct.",
      "enforce contrôle les Pods résultants plutôt que de refuser tous les objets parents. warn et audit examinent aussi les templates de Pods afin d’avertir plus tôt. Un Deployment accepté ne prouve donc pas que son ReplicaSet peut créer des Pods. Examinez describe deployment, describe replicaset et les Events FailedCreate si les réplicas restent absents. Vérifiez aussi init containers et sidecars : un seul securityContext manquant peut violer le standard même si le conteneur principal est correct.",
    ),
    h(
      "limits",
      "Define what remains outside this standard",
      "Définir ce qui reste hors du standard",
    ),
    p(
      "restricted does not require a read-only root filesystem, image signing, resource limits, allowed registries or network isolation. RBAC still controls who may modify namespace labels; a tenant able to lower their own enforced policy can weaken this boundary. Exceptions should be narrowly governed and reviewed, not granted to every controller identity. Operating-system-specific checks also mean Linux examples should not be copied blindly to Windows workloads.",
      "restricted n’impose ni racine en lecture seule, ni signature d’image, ni limites de ressources, ni registre autorisé, ni isolation réseau. RBAC contrôle encore qui peut modifier les labels du namespace ; un tenant capable d’abaisser sa propre politique affaiblit cette frontière. Gouvernez et examinez précisément les exceptions, sans exempter tous les contrôleurs. Les vérifications dépendant du système imposent aussi de ne pas recopier ces exemples Linux aveuglément vers des workloads Windows.",
    ),
    h("quiz", "Predict the admission result", "Prédire le résultat d’admission"),
    quiz(
      question(
        l(
          "Does changing enforce to restricted evict an existing noncompliant Pod?",
          "Passer enforce à restricted expulse-t-il un Pod existant non conforme ?",
        ),
        [
          l("Yes, immediately", "Oui, immédiatement"),
          l(
            "No; admission is not retroactive eviction",
            "Non ; l’admission n’est pas une expulsion rétroactive",
          ),
          l("Only when audit is enabled", "Seulement si audit est actif"),
        ],
        1,
        l(
          "Plan controlled replacement separately and fix the generating template first.",
          "Préparez séparément le remplacement contrôlé et corrigez d’abord le template générateur.",
        ),
      ),
      question(
        l(
          "Where would the audit mode annotation be recorded?",
          "Où l’annotation du mode audit est-elle enregistrée ?",
        ),
        [
          l("In API audit logs, if configured", "Dans les logs d’audit API, si configurés"),
          l("Always in container stdout", "Toujours dans stdout du conteneur"),
          l("In every DNS reply", "Dans chaque réponse DNS"),
        ],
        0,
        l(
          "A namespace label does not install a log pipeline or guarantee access to API audit events.",
          "Un label de namespace n’installe pas une chaîne de logs et ne garantit pas l’accès aux événements d’audit API.",
        ),
      ),
      question(
        l(
          "Does restricted require readOnlyRootFilesystem?",
          "restricted impose-t-il readOnlyRootFilesystem ?",
        ),
        [
          l("Yes for every Linux container", "Oui pour chaque conteneur Linux"),
          l("Only for nginx", "Seulement pour nginx"),
          l("No, add that control when appropriate", "Non, ajoutez ce contrôle si adapté"),
        ],
        2,
        l(
          "Passing one standard is not equivalent to satisfying all workload-specific hardening requirements.",
          "Respecter un standard ne revient pas à satisfaire tous les besoins de durcissement propres au workload.",
        ),
      ),
    ),
    challenge(
      l("Replace the legacy Pod safely", "Remplacer proprement le Pod legacy"),
      l(
        "Correct the fixture without lowering namespace enforcement. Preflight it server-side, then replace the disposable legacy Pod and verify readiness. Explain why a controller template must be corrected before replacement in a real application.",
        "Corrigez le fichier sans abaisser l’enforcement. Prévalidez-le côté serveur puis remplacez le Pod legacy jetable et vérifiez sa readiness. Expliquez pourquoi le template du contrôleur doit être corrigé avant remplacement pour une vraie application.",
      ),
      [
        l(
          "Set allowPrivilegeEscalation to false; retain non-root, RuntimeDefault and dropped capabilities.",
          "Mettez allowPrivilegeEscalation à false ; gardez non-root, RuntimeDefault et capabilities retirées.",
        ),
        l(
          "Pod securityContext is not generally mutable in place; replace only this disposable Pod.",
          "Le securityContext d’un Pod n’est généralement pas modifiable en place ; remplacez seulement ce Pod jetable.",
        ),
      ],
      [
        code("yaml", fixed, "lab/level-3/pod-security/fixed-legacy.yaml"),
        code(
          "bash",
          "k -n lab-psa apply --dry-run=server -f lab/level-3/pod-security/fixed-legacy.yaml\nk -n lab-psa apply -f lab/level-3/pod-security/fixed-legacy.yaml\nk -n lab-psa wait --for=condition=Ready pod/fixed-legacy --timeout=120s\nk -n lab-psa delete pod legacy\nk get namespace lab-psa --show-labels",
        ),
        p(
          "Expected: the fixed Pod is admitted and becomes Ready while restricted/v1.35 stays enforced. This standalone fixture deliberately has no controller. For a Deployment, update and preflight its template before controlled replacement; deleting managed Pods first would recreate the same invalid specification.",
          "Attendu : le Pod corrigé est admis et devient Ready alors que restricted/v1.35 reste imposé. Ce fichier autonome n’a volontairement pas de contrôleur. Pour un Deployment, corrigez et prévalidez son template avant un remplacement contrôlé ; supprimer d’abord les Pods gérés recréerait la même spécification invalide.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code("bash", "k delete namespace lab-psa"),
    p(
      "The namespace and its labels disappear together. No global admission configuration or exemption was created, and API audit collection was not installed by this lesson.",
      "Le namespace et ses labels disparaissent ensemble. Aucune configuration globale d’admission ni exemption n’a été créée ; ce cours n’a pas installé la collecte d’audit API.",
    ),
  ],
};
