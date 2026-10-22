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
import access from "../../../lab/level-2/rbac/access.yaml?raw";
import namedConfig from "../../../lab/level-2/rbac/named-config-reader.yaml?raw";

export const rbac: Chapter = {
  id: "rbac",
  level: 2,
  minutes: 55,
  title: l("RBAC, ServiceAccounts and authorization", "RBAC, ServiceAccounts et autorisation"),
  summary: l(
    "Give a workload precisely scoped API access, prove allowed and denied actions, and avoid confusing identity with permission.",
    "Accorder à un workload un accès API précisément délimité, prouver les actions permises et refusées et distinguer identité et permission.",
  ),
  prerequisites: ["namespaces-contexts", "configmaps-secrets"],
  related: ["rbac-advanced", "security-hardening", "pod-security"],
  blocks: [
    h("objectives", "Build an access contract", "Construire un contrat d’accès"),
    list(
      l(
        "Map an identity, an API resource, a verb and a namespace to an authorization decision.",
        "Relier une identité, une ressource API, un verbe et un namespace à une décision d’autorisation.",
      ),
      l(
        "Test the negative cases as carefully as the successful request.",
        "Tester les refus aussi soigneusement que la requête autorisée.",
      ),
    ),
    h(
      "mental-model",
      "Authentication asks who; authorization asks what",
      "L’authentification identifie ; l’autorisation délimite",
    ),
    p(
      "A ServiceAccount is a namespaced workload identity, not a human login and not a permission set. Authentication establishes that identity. RBAC then grants requests through rules. A Role defines permissions inside one namespace; a RoleBinding connects subjects to a Role there. A ClusterRole is reusable and can describe cluster-scoped access, but a RoleBinding referring to it still grants only namespaced access in that binding's namespace. A ClusterRoleBinding has cluster-wide scope.",
      "Un ServiceAccount est une identité de workload liée à un namespace, pas un compte humain ni un ensemble de permissions. L’authentification établit cette identité. RBAC accorde ensuite les requêtes via des règles. Un Role définit des permissions dans un namespace ; un RoleBinding les relie à des sujets. Un ClusterRole est réutilisable et peut décrire un accès aux ressources globales, mais un RoleBinding qui le référence ne donne que des accès aux ressources namespacées dans son namespace. Un ClusterRoleBinding a une portée globale.",
    ),
    p(
      "Permissions are additive: there is no deny rule overriding another grant. Deleting one binding does not revoke equivalent access granted elsewhere. Prefer exact resources and verbs: pods and pods/log are separate resources, the core API group is the empty string, and deployments belong to apps. Reading Secrets exposes credentials; creating Pods can indirectly expose mounted credentials. Do not repair a missing read permission with cluster-admin.",
      "Les permissions s’additionnent : aucune règle de refus ne neutralise un autre droit. Supprimer un binding ne retire pas un accès équivalent accordé ailleurs. Préférez des ressources et verbes précis : pods et pods/log sont distincts, le groupe API principal est la chaîne vide et deployments appartient à apps. Lire des Secrets expose des identifiants ; créer des Pods peut exposer indirectement des identifiants montés. Ne corrigez pas un droit de lecture manquant avec cluster-admin.",
    ),
    ...labContext("lab-rbac"),
    note(
      "warn",
      l("Administrator exercise", "Exercice administrateur"),
      l(
        "Use only the disposable lab administrator identity. Creating bindings and impersonating another identity require their own privileges. A Forbidden impersonation error describes your caller's permission, not the target ServiceAccount's Pod access. Never print or commit a ServiceAccount token for this exercise.",
        "Utilisez seulement l’identité administrateur du lab jetable. Créer des bindings et emprunter une identité exigent leurs propres droits. Un refus Forbidden sur l’impersonation concerne l’appelant, pas l’accès aux Pods du ServiceAccount cible. N’affichez et ne commitez aucun token de ServiceAccount pour cet exercice.",
      ),
    ),
    h("manifest", "Read the smallest grant", "Lire une permission minimale"),
    code("yaml", access, "lab/level-2/rbac/access.yaml"),
    p(
      "The subject namespace names the identity; the binding's namespace defines the grant's location. roleRef cannot be edited to point at another role: replace that binding deliberately. automountServiceAccountToken: false prevents automatic API credentials being mounted in Pods using this account, unless overridden at Pod level. It does not revoke RBAC permissions. A Pod needing the API should use its own ServiceAccount and a projected, short-lived token rather than a copied administrator kubeconfig.",
      "Le namespace du sujet désigne l’identité ; celui du binding délimite l’accès accordé. roleRef ne peut pas être modifié pour désigner un autre rôle : remplacez explicitement ce binding. automountServiceAccountToken: false empêche le montage automatique d’identifiants API dans les Pods utilisant ce compte, sauf surcharge au niveau du Pod. Il ne retire aucun droit RBAC. Un Pod ayant besoin de l’API doit employer son propre ServiceAccount et un token projeté de courte durée plutôt qu’un kubeconfig administrateur copié.",
    ),
    steps(
      {
        title: l("Install and inspect", "Installer et examiner"),
        code: {
          lang: "bash",
          code: "k -n lab-rbac apply -f lab/level-2/rbac/access.yaml\nk -n lab-rbac get serviceaccount,role,rolebinding\nk -n lab-rbac describe rolebinding pod-reader",
        },
        explain: l(
          "Verify both the role reference and the fully qualified subject before testing a request.",
          "Vérifiez la référence du rôle et le sujet complet avant de tester une requête.",
        ),
      },
      {
        title: l("Prove the boundary", "Prouver la limite"),
        code: {
          lang: "bash",
          code: "k -n lab-rbac auth can-i list pods --as=system:serviceaccount:lab-rbac:pod-reader\nk -n lab-rbac auth can-i delete pods --as=system:serviceaccount:lab-rbac:pod-reader\nk -n lab-rbac auth can-i get pods --subresource=log --as=system:serviceaccount:lab-rbac:pod-reader\nk -n default auth can-i list pods --as=system:serviceaccount:lab-rbac:pod-reader\nk -n lab-rbac get pods --as=system:serviceaccount:lab-rbac:pod-reader",
        },
        explain: l(
          "The final request exercises real API authorization; an empty list is still an authorized response. A can-i answer is specific to the tested verb, scope and identity, not a complete security review.",
          "La dernière requête exerce réellement l’autorisation API ; une liste vide reste une réponse autorisée. La réponse de can-i vaut pour le verbe, la portée et l’identité testés, pas pour un audit de sécurité complet.",
        ),
        expected: {
          text: l(
            "Expected in the clean baseline: yes, no, no, no; then an empty Pod list. A no answer exits nonzero intentionally.",
            "Attendu sur la base propre : yes, no, no, no ; puis une liste de Pods vide. Une réponse no retourne volontairement un code non nul.",
          ),
        },
      },
    ),
    h(
      "diagnosis",
      "Diagnose Forbidden without widening access",
      "Diagnostiquer Forbidden sans élargir l’accès",
    ),
    p(
      "A 401 suggests missing or invalid authentication; a 403 means the authenticated request was forbidden. Read the error's user, verb, API group, resource and namespace. Compare them with the binding and rules. If can-i succeeds but the application fails, confirm it uses the same ServiceAccount and namespace; a Pod otherwise uses default. If deleting the binding still leaves access, inspect other bindings and group grants. Do not add wildcards to bypass an unexplained refusal.",
      "Un 401 évoque une authentification absente ou invalide ; un 403 signifie que la requête authentifiée est interdite. Relevez l’utilisateur, le verbe, le groupe API, la ressource et le namespace dans l’erreur. Comparez-les aux règles et au binding. Si can-i réussit mais que l’application échoue, vérifiez son ServiceAccount et son namespace ; à défaut, un Pod utilise default. Si supprimer le binding laisse l’accès actif, recherchez d’autres bindings ou droits de groupe. N’ajoutez pas de jokers pour contourner un refus inexpliqué.",
    ),
    h("quiz", "Reason about authorization", "Raisonner sur l’autorisation"),
    quiz(
      question(
        l(
          "Does get on pods authorize container logs?",
          "get sur pods autorise-t-il les logs des conteneurs ?",
        ),
        [
          l("Yes, logs are part of every Pod read", "Oui, chaque lecture de Pod inclut les logs"),
          l("No, pods/log needs a separate grant", "Non, pods/log exige un droit distinct"),
          l("Only when the Pod is Ready", "Seulement si le Pod est Ready"),
        ],
        1,
        l(
          "Subresources have distinct RBAC resource names; readiness does not grant API access.",
          "Les sous-ressources ont des noms RBAC distincts ; la readiness ne donne aucun accès API.",
        ),
      ),
      question(
        l(
          "Why can access survive removal of a RoleBinding?",
          "Pourquoi un accès peut-il subsister après suppression d’un RoleBinding ?",
        ),
        [
          l("Other grants are additive", "D’autres droits s’additionnent"),
          l(
            "Every token permanently stores all roles",
            "Chaque token mémorise définitivement tous les rôles",
          ),
          l("RBAC has a deny cache", "RBAC possède un cache de refus"),
        ],
        0,
        l(
          "Authorization evaluates applicable rules; another binding may grant the same action.",
          "L’autorisation évalue les règles applicables ; un autre binding peut accorder la même action.",
        ),
      ),
      question(
        l(
          "What does disabling token automount change?",
          "Que change la désactivation du montage automatique du token ?",
        ),
        [
          l("It deletes the ServiceAccount", "Elle supprime le ServiceAccount"),
          l("It revokes every binding", "Elle retire tous les bindings"),
          l(
            "It prevents automatic credential mounting, not existing permissions",
            "Elle empêche le montage automatique d’identifiants, pas les droits existants",
          ),
        ],
        2,
        l(
          "Credential delivery and authorization policy are separate concerns.",
          "La distribution d’identifiants et la politique d’autorisation sont deux sujets distincts.",
        ),
      ),
    ),
    challenge(
      l("Read one configuration object", "Lire un seul objet de configuration"),
      l(
        "Keep Pod read access. Add get on app-settings only, without listing all ConfigMaps or reading Secrets. Prove both the positive and negative cases.",
        "Conservez la lecture des Pods. Ajoutez get sur app-settings uniquement, sans lister tous les ConfigMaps ni lire les Secrets. Prouvez les cas autorisés et refusés.",
      ),
      [
        l(
          "A new narrow Role can be bound to the same identity.",
          "Un nouveau Role limité peut être lié à la même identité.",
        ),
        l(
          "Use resourceNames and only get; do not add list.",
          "Utilisez resourceNames et uniquement get ; n’ajoutez pas list.",
        ),
      ],
      [
        code("yaml", namedConfig, "lab/level-2/rbac/named-config-reader.yaml"),
        code(
          "bash",
          "k -n lab-rbac apply -f lab/level-2/rbac/named-config-reader.yaml\nk -n lab-rbac get configmap app-settings --as=system:serviceaccount:lab-rbac:pod-reader\nk -n lab-rbac auth can-i get configmap/other-settings --as=system:serviceaccount:lab-rbac:pod-reader\nk -n lab-rbac auth can-i list configmaps --as=system:serviceaccount:lab-rbac:pod-reader\nk -n lab-rbac auth can-i get secrets --as=system:serviceaccount:lab-rbac:pod-reader",
        ),
        p(
          "Expected: the named ConfigMap is readable and all three can-i checks answer no. This prevents broad configuration discovery, but the allowed object's own data must still be appropriate for the workload.",
          "Attendu : le ConfigMap nommé est lisible et les trois vérifications can-i répondent no. Cela empêche une découverte globale de la configuration, mais les données de l’objet autorisé doivent rester adaptées au workload.",
        ),
      ],
    ),
    h("cleanup", "Cleanup and scope", "Nettoyage et portée"),
    code("bash", "k delete namespace lab-rbac"),
    p(
      "This lab creates no cluster-scoped grant. Human identity federation and privilege-escalation paths belong to advanced RBAC; permission checks alone do not validate network isolation or Pod security.",
      "Ce lab ne crée aucun droit global. La fédération d’identités humaines et les chemins d’élévation de privilèges relèvent du RBAC avancé ; les vérifications de droits ne valident ni l’isolation réseau ni la sécurité des Pods.",
    ),
  ],
};
