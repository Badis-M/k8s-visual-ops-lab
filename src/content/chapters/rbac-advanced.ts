import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import access from "../../../lab/level-3/rbac-advanced/access.yaml?raw";
import extension from "../../../lab/level-3/rbac-advanced/config-extension.yaml?raw";
import forbidden from "../../../lab/level-3/rbac-advanced/forbidden-role.yaml?raw";

export const rbacAdvanced: Chapter = {
  id: "rbac-advanced",
  level: 3,
  minutes: 45,
  title: l("Advanced RBAC design", "Conception RBAC avancée"),
  summary: l(
    "Compose narrowly scoped roles, trace additive grants and prove the limits of aggregation, resourceNames and permission delegation.",
    "Composer des rôles précisément délimités, retracer les droits additifs et prouver les limites d’agrégation, resourceNames et délégation.",
  ),
  prerequisites: ["rbac"],
  related: ["pod-security", "security-hardening", "operators"],
  blocks: [
    h("objectives", "Review a permission graph", "Examiner un graphe de permissions"),
    list(
      l(
        "Separate reusable rule composition from the scope of each binding.",
        "Séparer composition de règles réutilisables et portée de chaque binding.",
      ),
      l(
        "Treat role authorship, binding and impersonation as separate escalation-sensitive permissions.",
        "Traiter création de rôles, binding et impersonation comme des permissions distinctes sensibles à l’élévation.",
      ),
    ),
    h(
      "mental-model",
      "Permission is a path, not one YAML file",
      "Un droit est un chemin, pas un seul fichier YAML",
    ),
    p(
      "An identity can receive rules through several bindings and groups. There is no deny override, so review the union and the indirect paths: creating a Pod can select an accessible ServiceAccount or mount Secrets; exec can reach application credentials; changing namespace admission labels can weaken isolation. Separating deployment identities from role administrators and narrowing namespace scope is often more valuable than inventing an enormous custom role. Kubernetes RBAC does not implement field-level write authorization or arbitrary label-based access filters.",
      "Une identité peut recevoir des règles via plusieurs bindings et groupes. Aucun refus ne prime : examinez donc leur union et les chemins indirects. Créer un Pod peut sélectionner un ServiceAccount accessible ou monter des Secrets ; exec peut exposer des identifiants applicatifs ; modifier les labels d’admission d’un namespace peut affaiblir l’isolation. Séparer identités de déploiement et administrateurs de rôles, puis limiter la portée aux namespaces, est souvent plus utile qu’un gigantesque rôle personnalisé. RBAC ne fournit ni autorisation d’écriture champ par champ ni filtrage d’accès arbitraire par labels.",
    ),
    p(
      "Aggregation composes ClusterRoles selected by labels into an aggregate ClusterRole. The control-plane controller owns its rules field: changing it manually is temporary and misleading. Contributors should use an organization-specific label, not automatically extend built-in admin/edit/view roles without reviewing all their recipients. An aggregate ClusterRole bound with a RoleBinding remains limited to namespaced resources in that binding's namespace. Composition does not require a cluster-wide grant.",
      "L’agrégation compose les ClusterRoles sélectionnés par labels dans un ClusterRole agrégé. Le contrôleur du control plane possède son champ rules : le modifier manuellement est temporaire et trompeur. Les contributeurs doivent utiliser un label propre à l’organisation, sans étendre automatiquement admin/edit/view sans examiner tous leurs bénéficiaires. Un ClusterRole agrégé référencé par RoleBinding reste limité aux ressources namespacées du namespace de ce binding. Composer n’exige pas de droit global.",
    ),
    ...labContext("lab-rbac-advanced"),
    note(
      "warn",
      l("Cluster-scoped definitions, namespaced access", "Définitions globales, accès namespacé"),
      l(
        "Use the disposable administrator and stop if any lab-ops-* ClusterRole below already exists. This exercise creates three custom ClusterRoles, never edits built-in roles and never grants Secret access, bind, escalate or impersonate to the observer. Administrator impersonation is used for testing and needs permission of its own. The scratch role-author grant is only for the controlled delegation test, not a recommended observer permission.",
        "Utilisez l’administrateur jetable et arrêtez-vous si un ClusterRole lab-ops-* ci-dessous existe déjà. Cet exercice crée trois ClusterRoles personnalisés, ne modifie jamais les rôles intégrés et n’accorde à observer ni accès aux Secrets, ni bind, escalate ou impersonate. Les tests utilisent l’impersonation administrateur, qui exige son propre droit. Le droit scratch de création de rôles sert uniquement au test contrôlé de délégation ; ce n’est pas une permission d’observateur recommandée.",
      ),
    ),
    code(
      "bash",
      "k get clusterroles lab-ops-observer lab-ops-pod-observer lab-ops-config-observer --ignore-not-found\nk -n lab-rbac-advanced apply -f lab/level-3/rbac-advanced/access.yaml\nk get clusterrole lab-ops-observer -o yaml",
    ),
    code("yaml", access, "lab/level-3/rbac-advanced/access.yaml"),
    p(
      "Expected after asynchronous aggregation: the aggregate contains Pod get/list/watch. If rules are initially empty, wait and read again before testing; applying a definition is not proof reconciliation completed. The service identity receives a namespaced binding only. The separate scratch Role permits creating Roles but not binding them, and still cannot bypass escalation checks.",
      "Attendu après l’agrégation asynchrone : l’agrégat contient get/list/watch sur les Pods. Si rules est initialement vide, attendez puis relisez avant les tests ; appliquer une définition ne prouve pas la fin de sa réconciliation. L’identité de service reçoit seulement un binding namespacé. Le Role scratch autorise la création de Roles sans permettre leur binding, et ne contourne pas les contrôles d’élévation.",
    ),
    code(
      "bash",
      "k -n lab-rbac-advanced auth can-i list pods --as=system:serviceaccount:lab-rbac-advanced:observer\nk -n default auth can-i list pods --as=system:serviceaccount:lab-rbac-advanced:observer\nk -n lab-rbac-advanced auth can-i get secrets --as=system:serviceaccount:lab-rbac-advanced:observer\nk -n lab-rbac-advanced auth can-i create roles.rbac.authorization.k8s.io --as=system:serviceaccount:lab-rbac-advanced:observer",
    ),
    p(
      "Expected on the clean lab: yes, no, no, yes. The last yes is deliberately insufficient to approve arbitrary Role content. It describes the ordinary create verb, not the additional escalation restriction. Test actual request payloads with server dry-run when validating delegated administration.",
      "Attendu sur le lab propre : yes, no, no, yes. Le dernier yes ne suffit volontairement pas à approuver le contenu de n’importe quel Role. Il décrit le verbe create ordinaire, pas la restriction supplémentaire d’élévation. Testez les payloads réels par dry-run serveur pour valider une délégation d’administration.",
    ),
    h(
      "named-access",
      "resourceNames constrains names, not label selectors",
      "resourceNames contraint les noms, pas les sélecteurs de labels",
    ),
    code("yaml", extension, "lab/level-3/rbac-advanced/config-extension.yaml"),
    code(
      "bash",
      "k apply -f lab/level-3/rbac-advanced/config-extension.yaml\nk get clusterrole lab-ops-observer -o yaml --watch",
    ),
    p(
      "Aggregation is asynchronous. Stop the watch with Ctrl+C only when rules includes the named ConfigMap get/list/watch grant; then run the following authorization checks. Testing immediately after apply can otherwise produce a temporary Forbidden unrelated to the intended resourceNames restriction.",
      "L’agrégation est asynchrone. Arrêtez le watch avec Ctrl+C seulement quand rules inclut le droit get/list/watch sur la ConfigMap nommée, puis lancez les contrôles suivants. Tester immédiatement après apply peut sinon produire un Forbidden temporaire sans rapport avec la restriction resourceNames étudiée.",
    ),
    code(
      "bash",
      "k -n lab-rbac-advanced get configmap release-settings --as=system:serviceaccount:lab-rbac-advanced:observer\nk -n lab-rbac-advanced get configmaps --field-selector=metadata.name=release-settings --as=system:serviceaccount:lab-rbac-advanced:observer\nk -n lab-rbac-advanced get configmaps --as=system:serviceaccount:lab-rbac-advanced:observer",
    ),
    p(
      "Wait until the aggregate includes the ConfigMap rule. Expected: named get and name-filtered list succeed, unfiltered list is refused. A watch needs the same metadata.name field selector. A label selector is not an alternative security boundary. resourceNames cannot restrict top-level create or deletecollection because authorization cannot apply that name filter there; do not add create expecting to constrain it to one new object. Subresource rules need separate analysis.",
      "Attendez que l’agrégat inclue la règle ConfigMap. Attendu : get nommé et list filtré par nom réussissent, list non filtré est refusé. Un watch exige le même field selector metadata.name. Un sélecteur de labels n’est pas une frontière de sécurité équivalente. resourceNames ne peut restreindre create au niveau principal ni deletecollection, car l’autorisation ne peut y appliquer ce filtre de nom ; n’ajoutez pas create en croyant le limiter à un nouvel objet. Les sous-ressources exigent une analyse distincte.",
    ),
    h("delegation", "Prove the escalation boundary", "Prouver la frontière d’élévation"),
    code("yaml", forbidden, "lab/level-3/rbac-advanced/forbidden-role.yaml"),
    code(
      "bash",
      "k -n lab-rbac-advanced create --dry-run=server -f lab/level-3/rbac-advanced/forbidden-role.yaml --as=system:serviceaccount:lab-rbac-advanced:observer\nk -n lab-rbac-advanced auth can-i escalate roles.rbac.authorization.k8s.io --as=system:serviceaccount:lab-rbac-advanced:observer\nk -n lab-rbac-advanced auth can-i bind clusterroles.rbac.authorization.k8s.io/lab-ops-observer --as=system:serviceaccount:lab-rbac-advanced:observer\nk -n lab-rbac-advanced auth can-i impersonate serviceaccounts --as=system:serviceaccount:lab-rbac-advanced:observer",
    ),
    p(
      "Expected: the proposed ConfigMap-update grant is refused even though Role creation is permitted; the observer lacks that permission and lacks escalate. The remaining checks answer no. Role creation/update requires already holding the requested permissions at the target scope or explicit escalate. Creating/updating a binding additionally requires holding the referenced role's permissions or explicit bind, as well as the ordinary binding write verb. impersonate separately permits assuming another identity; it is not normal read access. Do not grant these verbs casually to fix controller startup.",
      "Attendu : la proposition de droit update sur ConfigMap est refusée malgré la permission de créer un Role ; observer ne possède ni ce droit ni escalate. Les autres contrôles répondent no. Créer/modifier un rôle exige de posséder déjà les permissions proposées à la portée cible ou escalate explicite. Créer/modifier un binding exige en plus de posséder les droits du rôle référencé ou bind explicite, ainsi que le verbe normal d’écriture du binding. impersonate permet séparément d’emprunter une autre identité ; ce n’est pas un simple droit de lecture. N’accordez pas ces verbes à la légère pour débloquer un contrôleur.",
    ),
    h("quiz", "Trace the grant", "Retracer le droit"),
    quiz(
      question(
        l(
          "Where do you add rules to an aggregate role?",
          "Où ajouter des règles à un rôle agrégé ?",
        ),
        [
          l(
            "In a selected contributor ClusterRole",
            "Dans un ClusterRole contributeur sélectionné",
          ),
          l("Only by editing the generated rules field", "Uniquement en éditant rules généré"),
          l("In the Pod annotations", "Dans les annotations du Pod"),
        ],
        0,
        l(
          "The aggregation controller owns the aggregate rules; contributor changes are the durable input.",
          "Le contrôleur d’agrégation possède rules dans l’agrégat ; les contributeurs sont l’entrée durable.",
        ),
      ),
      question(
        l(
          "Why can a resourceNames-restricted list be denied?",
          "Pourquoi un list restreint par resourceNames peut-il être refusé ?",
        ),
        [
          l("ConfigMaps cannot be listed", "Les ConfigMaps ne peuvent pas être listés"),
          l(
            "The request omitted its matching metadata.name field selector",
            "La requête omet le field selector metadata.name correspondant",
          ),
          l(
            "Read-only identities always need cluster-admin",
            "Une identité de lecture exige toujours cluster-admin",
          ),
        ],
        1,
        l(
          "Authorization must be able to establish the named restriction from the request.",
          "L’autorisation doit pouvoir établir la restriction de nom depuis la requête.",
        ),
      ),
      question(
        l(
          "Does create on roles authorize granting any permission?",
          "create sur roles autorise-t-il à accorder n’importe quel droit ?",
        ),
        [
          l("Yes, RBAC checks only the URL", "Oui, RBAC ne contrôle que l’URL"),
          l("Yes, inside any namespace", "Oui, dans tout namespace"),
          l(
            "No, escalation checks also constrain role content",
            "Non, les contrôles d’élévation contraignent aussi le contenu",
          ),
        ],
        2,
        l(
          "Ordinary CRUD permission and escalation authorization are separate gates.",
          "Permission CRUD ordinaire et autorisation d’élévation sont deux barrières distinctes.",
        ),
      ),
    ),
    challenge(
      l(
        "Revoke configuration access without deleting the observer",
        "Retirer l’accès configuration sans supprimer l’observateur",
      ),
      l(
        "Remove only the aggregated ConfigMap contribution, prove Pod reads survive, and prove the named ConfigMap is denied. Explain what additional inspection is required if it is still readable.",
        "Retirez seulement la contribution ConfigMap agrégée, prouvez que la lecture des Pods subsiste et que le ConfigMap nommé est refusé. Expliquez l’examen supplémentaire s’il reste lisible.",
      ),
      [
        l(
          "Remove the custom contributor, not a built-in role or the whole aggregate.",
          "Retirez le contributeur personnalisé, pas un rôle intégré ni l’agrégat entier.",
        ),
        l(
          "Wait for reconciliation and account for additive bindings.",
          "Attendez la réconciliation et prenez en compte les bindings additifs.",
        ),
      ],
      [
        code(
          "bash",
          "k delete clusterrole lab-ops-config-observer\nk get clusterrole lab-ops-observer -o yaml --watch",
        ),
        p(
          "Stop the watch with Ctrl+C once the generated ConfigMap rule disappears. Then run these two checks. Deleting the contributor returns before the aggregation controller necessarily removes its copied rule, so an immediate read could still succeed briefly.",
          "Arrêtez le watch avec Ctrl+C quand la règle ConfigMap générée disparaît, puis lancez les deux contrôles suivants. La suppression du contributeur se termine avant le retrait nécessairement effectif de sa règle agrégée ; une lecture immédiate pourrait donc encore réussir brièvement.",
        ),
        code(
          "bash",
          "k -n lab-rbac-advanced auth can-i list pods --as=system:serviceaccount:lab-rbac-advanced:observer\nk -n lab-rbac-advanced get configmap release-settings --as=system:serviceaccount:lab-rbac-advanced:observer",
        ),
        p(
          "After the generated ConfigMap rule disappears, expected results are yes for Pods and Forbidden for the ConfigMap. Continued access means another grant may exist or reconciliation has not completed. Enumerate applicable bindings and groups; a grant cannot be canceled by adding a fictional deny rule.",
          "Une fois la règle ConfigMap générée retirée, les résultats attendus sont yes pour les Pods et Forbidden pour le ConfigMap. Un accès persistant peut venir d’un autre droit ou d’une réconciliation inachevée. Énumérez bindings et groupes applicables ; ajouter une règle de refus fictive n’annule pas un droit.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Remove definitions beyond the namespace",
      "Retirer les définitions au-delà du namespace",
    ),
    code(
      "bash",
      "k delete namespace lab-rbac-advanced\nk delete clusterroles lab-ops-observer lab-ops-pod-observer lab-ops-config-observer --ignore-not-found",
    ),
    p(
      "No ClusterRoleBinding was created. Deleting the namespace removes the delegated Role and bindings but not the custom ClusterRoles; the explicit second command completes cleanup. Human federation, admission field policies and audit retention remain separate platform concerns.",
      "Aucun ClusterRoleBinding n’a été créé. Supprimer le namespace retire le Role délégué et les bindings, pas les ClusterRoles personnalisés ; la seconde commande complète le nettoyage. Fédération humaine, politiques d’admission sur les champs et conservation d’audit restent des sujets distincts.",
    ),
  ],
};
