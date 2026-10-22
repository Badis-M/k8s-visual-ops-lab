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
import chart from "../../../lab/level-3/helm-releases/release-demo/Chart.yaml?raw";
import releaseTwo from "../../../lab/level-3/helm-releases/release-two.yaml?raw";
import broken from "../../../lab/level-3/helm-releases/broken.yaml?raw";

export const helmReleases: Chapter = {
  id: "helm-releases",
  level: 3,
  minutes: 65,
  title: l("Helm dependencies, upgrades and releases", "Dépendances Helm, upgrades et releases"),
  summary: l(
    "Lock a local dependency, inspect effective values, and recover a failed delivery without confusing manifest rollback with data restoration.",
    "Verrouiller une dépendance locale, inspecter les valeurs effectives et récupérer une livraison échouée sans confondre retour des manifests et restauration des données.",
  ),
  prerequisites: ["helm-charts", "rollbacks"],
  related: ["gitops", "backup-dr", "incidents"],
  blocks: [
    h(
      "objectives",
      "Make release inputs reproducible",
      "Rendre les entrées de release reproductibles",
    ),
    list(
      l(
        "Explain Chart.yaml versus Chart.lock and inspect the exact values used by a revision.",
        "Distinguer Chart.yaml et Chart.lock puis inspecter les valeurs exactes d’une révision.",
      ),
      l(
        "Use explicit upgrade inputs, bounded readiness waits and a rollback policy appropriate to the failure.",
        "Utiliser des entrées explicites d’upgrade, une attente bornée et une politique de retour adaptée à la panne.",
      ),
    ),
    h(
      "dependencies",
      "Package selection and artifact trust are separate",
      "Sélection du paquet et confiance dans l’artefact sont distinctes",
    ),
    p(
      "A parent chart can compose dependencies rather than duplicate templates. This parent pins academy-web 0.1.0 from the preceding chapter and exposes it under alias web. The dependency condition web.enabled controls whether it renders at all. Inside the subchart, .Values is scoped to that chart: parent web.replicaCount becomes its replicaCount. Aliasing also changes the effective chart name to web, so release delivery produces resources named delivery-web in this example.",
      "Un chart parent peut composer des dépendances sans dupliquer les templates. Ce parent fixe academy-web 0.1.0 du chapitre précédent sous l’alias web. La condition web.enabled contrôle son inclusion. Dans le sous-chart, .Values est limitée à ce chart : web.replicaCount du parent devient replicaCount. L’alias change aussi le nom effectif du chart en web : la release delivery produit donc ici des ressources delivery-web.",
    ),
    code("yaml", chart, "lab/level-3/helm-releases/release-demo/Chart.yaml"),
    p(
      "dependency update resolves the declaration and writes Chart.lock; dependency build reconstructs charts/ using an existing lock. Without a lock, build behaves like update, so check the file instead of assuming reproducibility. This fixture uses a local file dependency and needs no chart registry. Commit the dependency source and lock together when publishing your work, and change the package version when its contract changes. The lock's dependency selection is not a cryptographic review of mutable local contents; remote artifacts additionally require trusted distribution, digest/provenance verification and access controls.",
      "dependency update résout la déclaration et écrit Chart.lock ; dependency build reconstruit charts/ avec un verrou existant. Sans verrou, build se comporte comme update : vérifiez le fichier au lieu de présumer la reproductibilité. Cet exemple utilise une dépendance locale sans registre. À la publication de votre travail, versionnez ensemble source et verrou et changez la version du paquet lorsque son contrat évolue. Le verrou de sélection ne constitue pas une revue cryptographique d’un contenu local mutable ; les artefacts distants demandent aussi distribution de confiance, vérification de digest/provenance et contrôle d’accès.",
    ),
    code(
      "bash",
      "helm version --short\nhelm dependency build lab/level-3/helm-releases/release-demo --skip-refresh\nhelm dependency list lab/level-3/helm-releases/release-demo\nhelm lint lab/level-3/helm-releases/release-demo --kube-version 1.35.0\nhelm template delivery lab/level-3/helm-releases/release-demo --namespace lab-releases --kube-version 1.35.0 -f lab/level-3/helm-releases/release-two.yaml",
    ),
    h(
      "values",
      "State exactly which values survive an upgrade",
      "Expliciter les valeurs conservées lors d’un upgrade",
    ),
    code("yaml", releaseTwo, "lab/level-3/helm-releases/release-two.yaml"),
    p(
      "Values form an input history, not just a command-line convenience. Later -f files override earlier ones and command-line setters can override files. This lesson uses --reset-values plus a complete reviewed environment override so stale settings do not survive accidentally. --reuse-values deliberately carries previous overrides forward and can hide a removed setting. Choose the policy; do not rely on implicit upgrade behavior. Use --set-string for literal strings that resemble booleans or numbers.",
      "Les valeurs constituent un historique d’entrées, pas une simple commodité CLI. Les fichiers -f ultérieurs remplacent les précédents et les setters CLI peuvent les remplacer. Cette leçon utilise --reset-values avec une surcharge d’environnement complète et examinée pour éviter des réglages périmés. --reuse-values conserve volontairement les surcharges précédentes et peut masquer une ancienne option. Choisissez cette politique explicitement. Utilisez --set-string pour des chaînes ressemblant à des nombres ou booléens.",
    ),
    note(
      "warn",
      l(
        "Release storage contains sensitive material",
        "Le stockage des releases peut contenir des données sensibles",
      ),
      l(
        "Helm commonly stores release records in namespace Secrets. Values, rendered manifests, debug output and release history can expose embedded credentials; base64 is not encryption. This exercise contains no secrets. Prefer references to separately managed secrets rather than putting passwords into chart values, shell history or a Git repository.",
        "Helm stocke généralement les releases dans des Secrets de namespace. Valeurs, manifests rendus, sorties debug et historique peuvent exposer des identifiants intégrés ; base64 n’est pas un chiffrement. Cet exercice ne contient aucun secret. Préférez des références à des secrets gérés séparément aux mots de passe dans les valeurs, l’historique shell ou Git.",
      ),
    ),
    ...labContext("lab-releases"),
    h(
      "exercise",
      "Deliver, observe and deliberately fail",
      "Livrer, observer puis échouer volontairement",
    ),
    steps(
      {
        title: l(
          "Install the initial successful revision",
          "Installer la première révision réussie",
        ),
        code: {
          lang: "bash",
          code: "helm install delivery lab/level-3/helm-releases/release-demo --kube-context kind-k8s-ops-lab --namespace lab-releases --wait --timeout 120s\nhelm history delivery --kube-context kind-k8s-ops-lab --namespace lab-releases\nhelm get values delivery --all --kube-context kind-k8s-ops-lab --namespace lab-releases\nk -n lab-releases get deployment delivery-web",
        },
        explain: l(
          "Record the successful revision and effective subchart values. Helm --wait follows readiness contracts; it does not establish business correctness or a successful user journey.",
          "Relevez la révision réussie et les valeurs effectives du sous-chart. --wait suit les contrats de readiness ; il n’établit ni justesse métier ni parcours utilisateur réussi.",
        ),
        expected: {
          text: l(
            "Expected: a deployed release with one ready replica and message Release one in its ConfigMap.",
            "Attendu : release deployed avec un réplica prêt et message Release one dans sa ConfigMap.",
          ),
        },
      },
      {
        title: l("Upgrade using explicit inputs", "Mettre à jour avec des entrées explicites"),
        code: {
          lang: "bash",
          code: "helm upgrade delivery lab/level-3/helm-releases/release-demo --kube-context kind-k8s-ops-lab --namespace lab-releases --reset-values -f lab/level-3/helm-releases/release-two.yaml --wait --timeout 120s\nhelm history delivery --kube-context kind-k8s-ops-lab --namespace lab-releases\nk -n lab-releases get deployment,configmap -l app.kubernetes.io/instance=delivery",
        },
        explain: l(
          "The message changes the configuration checksum, while the desired population becomes two. Inspect both the new ConfigMap and Pod template rather than trusting the CLI's exit code alone.",
          "Le message modifie le checksum et l’effectif désiré passe à deux. Inspectez ConfigMap et template de Pod plutôt que de vous fier uniquement au code de retour CLI.",
        ),
      },
      {
        title: l(
          "Fail a rollout with bounded automatic recovery",
          "Échouer un rollout avec récupération automatique bornée",
        ),
        code: {
          lang: "bash",
          code: "helm upgrade delivery lab/level-3/helm-releases/release-demo --kube-context kind-k8s-ops-lab --namespace lab-releases --reset-values -f lab/level-3/helm-releases/release-two.yaml -f lab/level-3/helm-releases/broken.yaml --rollback-on-failure --timeout 60s\nhelm history delivery --kube-context kind-k8s-ops-lab --namespace lab-releases\nhelm status delivery --kube-context kind-k8s-ops-lab --namespace lab-releases\nk -n lab-releases get deployment,pods",
        },
        explain: l(
          "The first command is expected to fail because the deliberately missing tag cannot become ready. Helm 4's --rollback-on-failure enables a readiness wait and attempts to recover the previous successful release. Inspect the resulting history and workload; recovery can fail too.",
          "La première commande doit échouer : le tag volontairement absent ne peut devenir prêt. --rollback-on-failure de Helm 4 active l’attente de readiness et tente de rétablir la release réussie précédente. Inspectez historique et workload ; la récupération peut également échouer.",
        ),
        expected: {
          text: l(
            "Expected after successful recovery: valid image restored and release-two configuration retained; history includes the failed attempt and recovery rather than erasing them.",
            "Attendu après récupération réussie : image valide rétablie et configuration release-two conservée ; l’historique inclut échec et récupération sans les effacer.",
          ),
        },
      },
    ),
    code("yaml", broken, "lab/level-3/helm-releases/broken.yaml"),
    h("diagnosis", "Recover the right layer", "Récupérer au bon niveau"),
    p(
      "Render or schema errors happen before useful API changes; fix the inputs. A stalled workload needs Pod Events and readiness investigation. Immutable selector errors need a planned identity or resource migration, not --force-replace as a reflex. A manifest rollback reapplies a past desired configuration as a new release revision; it does not undo an external API call, completed migration or database write. Hooks and CRDs have their own lifecycle caveats. Stateful upgrades need a data compatibility and restore strategy before delivery begins.",
      "Les erreurs de rendu ou schéma surviennent avant des modifications API utiles : corrigez les entrées. Un workload bloqué exige Events et inspection de readiness. Une erreur de sélecteur immuable exige une migration planifiée, pas le réflexe --force-replace. Un rollback réapplique une ancienne configuration comme nouvelle révision ; il n’annule ni appel externe, ni migration achevée, ni écriture en base. Hooks et CRD ont leurs propres limites de cycle de vie. Une mise à jour avec état exige une stratégie de compatibilité et restauration avant la livraison.",
    ),
    h("quiz", "Reason about revisions and dependencies", "Raisonner sur révisions et dépendances"),
    quiz(
      question(
        l(
          "What does dependency build do without Chart.lock?",
          "Que fait dependency build sans Chart.lock ?",
        ),
        [
          l("It behaves like dependency update", "Il se comporte comme dependency update"),
          l("It proves artifact authenticity", "Il prouve l’authenticité des artefacts"),
          l("It contacts the Kubernetes scheduler", "Il contacte le scheduler Kubernetes"),
        ],
        0,
        l(
          "A missing lock removes the intended selection boundary; inspect and version the resolved input.",
          "Un verrou absent retire la frontière de sélection prévue ; inspectez et versionnez les entrées résolues.",
        ),
      ),
      question(
        l(
          "Why can --reuse-values surprise a reviewer?",
          "Pourquoi --reuse-values peut-il surprendre une revue ?",
        ),
        [
          l("It deletes every default", "Il supprime tous les défauts"),
          l(
            "Earlier overrides may survive even when absent from the new file",
            "Des surcharges précédentes peuvent survivre malgré leur absence du nouveau fichier",
          ),
          l("It always changes the release name", "Il change toujours le nom de release"),
        ],
        1,
        l(
          "Upgrade policy determines the effective value set, so the current override file alone may not describe reality.",
          "La politique d’upgrade détermine les valeurs effectives ; le fichier actuel seul peut donc ne pas décrire la réalité.",
        ),
      ),
      question(
        l(
          "A rollback succeeds after an incompatible database migration. Is recovery proven?",
          "Un rollback réussit après une migration incompatible. La récupération est-elle prouvée ?",
        ),
        [
          l("Yes, Helm restores every byte", "Oui, Helm restaure chaque octet"),
          l("Yes, if the revision number increases", "Oui, si le numéro de révision augmente"),
          l(
            "No, manifest and data recovery are separate",
            "Non, récupération des manifests et des données sont distinctes",
          ),
        ],
        2,
        l(
          "Application/data compatibility and an independently tested restoration remain necessary.",
          "Compatibilité applicative/des données et restauration testée indépendamment restent nécessaires.",
        ),
      ),
    ),
    h(
      "challenge",
      "Restore the initial configuration explicitly",
      "Rétablir explicitement la configuration initiale",
    ),
    challenge(
      l("A rollback creates a new revision", "Un rollback crée une nouvelle révision"),
      l(
        "After inspecting history, restore the initial successful revision from this isolated release. Verify message, replicas and history. Explain why the resulting revision number is new, and why rolling back is not equivalent to uninstalling and reinstalling.",
        "Après inspection de l’historique, rétablissez la première révision réussie de cette release isolée. Vérifiez message, effectif et historique. Expliquez le nouveau numéro de révision et pourquoi ce retour n’équivaut pas à désinstaller puis réinstaller.",
      ),
      [
        l(
          "In a fresh exercise the initial revision is 1; verify rather than assuming if you reused a namespace.",
          "Dans un exercice neuf, la révision initiale est 1 ; vérifiez si vous avez réutilisé un namespace.",
        ),
        l(
          "A rollback itself is a new delivery event.",
          "Un rollback constitue lui-même une nouvelle livraison.",
        ),
      ],
      [
        code(
          "bash",
          "helm rollback delivery 1 --kube-context kind-k8s-ops-lab --namespace lab-releases --wait --timeout 120s\nhelm history delivery --kube-context kind-k8s-ops-lab --namespace lab-releases\nhelm get values delivery --all --kube-context kind-k8s-ops-lab --namespace lab-releases\nk -n lab-releases get deployment delivery-web",
        ),
        p(
          "The desired population returns to one and the message to Release one. The rollback creates a new revision whose inputs reproduce revision 1; it does not reset the current revision number to 1. History retention is bounded separately: --history-max defaults to 10 for upgrade and rollback, so older records may be removed. Helm history is not an immutable audit archive. Uninstall instead deletes release-owned resources and has different retention consequences, especially for charts with stateful storage or hooks.",
          "L’effectif revient à un et le message à Release one. Le rollback crée une nouvelle révision reproduisant les entrées de la première ; il ne remet pas le numéro courant à 1. La rétention est limitée séparément : --history-max vaut 10 par défaut pour upgrade et rollback, donc d’anciens enregistrements peuvent disparaître. L’historique Helm n’est pas une archive d’audit immuable. Désinstaller supprime les ressources de la release et possède d’autres conséquences de rétention, surtout avec stockage ou hooks.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code(
      "bash",
      "helm uninstall delivery --kube-context kind-k8s-ops-lab --namespace lab-releases\nk delete namespace lab-releases",
    ),
    p(
      "The generated charts/ archive is ignored and can be rebuilt from local source plus lock. No repository, registry, external controller, PVC or migration service was needed. Rendering and lint results remain distinct from executing this optional Kubernetes release sequence.",
      "L’archive générée dans charts/ est ignorée et reconstructible depuis source locale et verrou. Aucun dépôt de charts, registre, contrôleur externe, PVC ou service de migration n’était nécessaire. Rendu et lint restent distincts de l’exécution optionnelle de cette séquence Kubernetes.",
    ),
  ],
};
