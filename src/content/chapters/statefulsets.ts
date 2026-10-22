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
import manifest from "../../../lab/level-2/statefulsets/notebook.yaml?raw";

export const statefulsets: Chapter = {
  id: "statefulsets",
  level: 2,
  minutes: 60,
  title: l(
    "StatefulSets: identity, order and storage",
    "StatefulSets : identité, ordre et stockage",
  ),
  summary: l(
    "Follow a stable ordinal from DNS name to its individual PVC, observe ordered replacement, and separate Kubernetes identity from application replication.",
    "Suivre un ordinal stable du DNS à son PVC individuel, observer le remplacement ordonné et séparer identité Kubernetes et réplication applicative.",
  ),
  prerequisites: ["deployments", "services", "storage"],
  related: ["pdb", "backup-dr", "operators"],
  blocks: [
    h(
      "objectives",
      "Decide when replicas are not interchangeable",
      "Reconnaître des réplicas non interchangeables",
    ),
    list(
      l(
        "Explain why notebook-0 can keep its name and data while its Pod UID changes.",
        "Expliquer pourquoi notebook-0 conserve son nom et ses données malgré un changement d’UID de Pod.",
      ),
      l(
        "Relate a headless Service, ordered rollout and claim template to their distinct responsibilities.",
        "Relier Service headless, rollout ordonné et template de PVC à leurs responsabilités distinctes.",
      ),
    ),
    h(
      "mental-model",
      "A stable slot is not an immortal Pod",
      "Un emplacement stable n’est pas un Pod immortel",
    ),
    p(
      "A Deployment treats replicas as interchangeable workers. A StatefulSet gives each replica an ordinal slot: notebook-0, notebook-1, and so on. Replacing notebook-0 creates a new Pod with a new UID but the same ordinal name, network identity and associated claim. Stability belongs to this contract across replacements, not to the lifetime of the original process. Choose it when software actually uses stable membership or per-replica storage; a stateless HTTP application usually gains no benefit from these constraints.",
      "Un Deployment traite ses réplicas comme des travailleurs interchangeables. Un StatefulSet attribue un emplacement ordinal : notebook-0, notebook-1, etc. Remplacer notebook-0 crée un nouveau Pod avec un autre UID mais le même nom ordinal, l’identité réseau et le PVC associé. La stabilité porte sur ce contrat entre remplacements, pas sur la durée de vie du processus initial. Choisissez-le quand le logiciel utilise réellement une appartenance stable ou un stockage par réplica ; une application HTTP sans état n’y gagne généralement rien.",
    ),
    p(
      "The headless Service has clusterIP: None, so it does not provide the ordinary virtual Service IP. Together with serviceName, it provides DNS identities such as notebook-0.notebook.lab-stateful.svc.cluster.local. That record points to a Pod address, which can change after replacement. Clients must tolerate reconnection and DNS caching. By default readiness affects publication of usable endpoints. Turning on publishNotReadyAddresses is a deliberate peer-discovery decision, not a fix for a broken readiness probe.",
      "Le Service headless porte clusterIP: None : il ne fournit pas l’IP virtuelle habituelle. Avec serviceName, il fournit des identités DNS telles que notebook-0.notebook.lab-stateful.svc.cluster.local. L’enregistrement pointe vers une adresse de Pod qui peut changer au remplacement. Les clients doivent tolérer reconnexion et cache DNS. Par défaut, la readiness influence la publication des endpoints utilisables. Activer publishNotReadyAddresses est un choix explicite de découverte des pairs, pas un correctif à une probe défaillante.",
    ),
    note(
      "warn",
      l(
        "Two Pods do not form a replicated database",
        "Deux Pods ne forment pas une base répliquée",
      ),
      l(
        "StatefulSet creates identities and individual volumes; it does not copy application data, elect a leader, implement consensus or take backups. Our two HTTP servers intentionally store different files. A kind cluster on one laptop also has a shared physical failure domain. This is an identity experiment, not evidence of high availability.",
        "StatefulSet crée des identités et des volumes individuels ; il ne copie pas les données applicatives, n’élit pas de leader, n’implémente pas de consensus et ne sauvegarde rien. Nos deux serveurs HTTP stockent volontairement des fichiers différents. Un cluster kind sur un portable partage aussi un domaine de panne physique. C’est une expérience d’identité, pas une preuve de haute disponibilité.",
      ),
    ),
    ...labContext("lab-stateful"),
    h("storage-check", "Verify the storage prerequisite", "Vérifier le prérequis de stockage"),
    code(
      "bash",
      "k get storageclass standard -o yaml\nk -n local-path-storage get deployments,pods",
    ),
    p(
      "Complete the storage chapter first. The fixture assumes kind's standard local-path class with delayed binding and Delete reclamation. If absent, stop instead of installing a provider into an unknown cluster. Each 64Mi claim uses node-local storage and is not portable to any surviving node. A node failure can leave the ordinal Pending because its volume is unavailable; stable identity does not remove that storage dependency.",
      "Terminez d’abord le chapitre stockage. Le manifest suppose la classe standard local-path de kind, avec liaison différée et récupération Delete. Si elle manque, arrêtez plutôt que d’installer un fournisseur dans un cluster inconnu. Chaque PVC de 64Mi utilise un stockage local au nœud, non transportable vers n’importe quel survivant. Une panne de nœud peut laisser l’ordinal Pending parce que son volume est inaccessible ; l’identité stable n’élimine pas cette dépendance.",
    ),
    h("manifest", "Read one claim per ordinal", "Lire une demande par ordinal"),
    code("yaml", manifest, "lab/level-2/statefulsets/notebook.yaml"),
    {
      type: "fields",
      rows: [
        {
          field: "serviceName: notebook",
          text: l(
            "Connects the Pod subdomain to the headless Service you create separately.",
            "Rattache le sous-domaine des Pods au Service headless que vous créez séparément.",
          ),
        },
        {
          field: "volumeClaimTemplates[].metadata.name: data",
          text: l(
            "Produces data-notebook-0 and data-notebook-1. The volumeMount name matches the template name.",
            "Produit data-notebook-0 et data-notebook-1. Le nom du volumeMount correspond au template.",
          ),
        },
        {
          field: "podManagementPolicy: OrderedReady",
          text: l(
            "Scales up in ordinal order and waits for readiness. Parallel changes scaling behavior, not application replication.",
            "Augmente dans l’ordre des ordinaux en attendant la readiness. Parallel change le scaling, pas la réplication applicative.",
          ),
        },
        {
          field: "persistentVolumeClaimRetentionPolicy",
          text: l(
            "Retain keeps generated claims on set deletion or scale-down. This stable 1.32+ feature is separate from each PV's backend reclaim policy.",
            "Retain conserve les demandes à la suppression du set ou à la réduction. Cette fonction stable depuis 1.32 est distincte de la récupération du backend de chaque PV.",
          ),
        },
      ],
    },
    h(
      "exercise",
      "Observe identity before and after replacement",
      "Observer l’identité avant et après remplacement",
    ),
    steps(
      {
        title: l("Create and compare the replicas", "Créer et comparer les réplicas"),
        code: {
          lang: "bash",
          code: "k -n lab-stateful apply -f lab/level-2/statefulsets/notebook.yaml\nk -n lab-stateful rollout status statefulset/notebook --timeout=180s\nk -n lab-stateful get pods,pvc -o wide\nk -n lab-stateful exec notebook-0 -- cat /data/identity.txt\nk -n lab-stateful exec notebook-1 -- cat /data/identity.txt\nk -n lab-stateful exec notebook-1 -- wget -qO- http://notebook-0.notebook.lab-stateful.svc.cluster.local:8080/identity.txt",
        },
        explain: l(
          "Watch Pods in a second terminal during creation if you want to see the order. The two files identify different creators. The request from notebook-1 resolves notebook-0 through the headless Service, rather than reading notebook-1's local file.",
          "Suivez les Pods dans un second terminal pendant la création pour voir l’ordre. Les deux fichiers identifient des créateurs différents. La requête depuis notebook-1 résout notebook-0 via le Service headless au lieu de lire son fichier local.",
        ),
        expected: {
          text: l(
            "Expected: two ordinal Pod names, two claims, and a DNS request returning notebook-0's file. Retry DNS after readiness if an earlier negative result was cached.",
            "Attendu : deux noms ordinaux, deux demandes et une requête DNS renvoyant le fichier de notebook-0. Réessayez après readiness si une ancienne réponse DNS négative était en cache.",
          ),
        },
      },
      {
        title: l(
          "Replace a Pod without replacing its slot",
          "Remplacer un Pod sans remplacer son emplacement",
        ),
        code: {
          lang: "bash",
          code: "k -n lab-stateful get pod notebook-0 -o jsonpath='{.metadata.uid}{\"\\n\"}'\nk -n lab-stateful delete pod notebook-0\nk -n lab-stateful wait --for=create pod/notebook-0 --timeout=120s\nk -n lab-stateful wait --for=condition=Ready pod/notebook-0 --timeout=120s\nk -n lab-stateful get pod notebook-0 -o jsonpath='{.metadata.uid}{\"\\n\"}'\nk -n lab-stateful exec notebook-0 -- cat /data/identity.txt\nk -n lab-stateful get pvc data-notebook-0 -o wide",
        },
        explain: l(
          "Record the first UID and file timestamp before deletion. The replacement should have a new UID while the initial timestamp and PVC remain. Normal deletion waits for termination. The separate create wait handles the interval before the controller recreates the Pod; Ready can then be awaited. Do not add force deletion to accelerate the exercise.",
          "Relevez le premier UID et l’horodatage du fichier avant suppression. Le remplaçant doit avoir un nouvel UID avec l’horodatage initial et le PVC conservés. La suppression normale attend la terminaison. L’attente create couvre ensuite l’intervalle avant recréation par le contrôleur ; Ready peut alors être attendu. N’ajoutez pas de suppression forcée pour accélérer l’exercice.",
        ),
      },
      {
        title: l(
          "Trigger an ordered template rollout",
          "Déclencher un rollout ordonné du template",
        ),
        code: {
          lang: "bash",
          code: "k -n lab-stateful set env statefulset/notebook RELEASE=two\nk -n lab-stateful rollout status statefulset/notebook --timeout=180s\nk -n lab-stateful get statefulset notebook -o yaml",
        },
        explain: l(
          "RELEASE changes the template without changing the HTTP server. Under the default rolling strategy, higher ordinals update before lower ones, with readiness gating progress. Inspect currentRevision and updateRevision. minReadySeconds adds a brief continuous-ready requirement.",
          "RELEASE change le template sans changer le serveur HTTP. Avec le rolling par défaut, les ordinaux supérieurs sont mis à jour avant les inférieurs et la readiness conditionne la progression. Examinez currentRevision et updateRevision. minReadySeconds ajoute une courte exigence de readiness continue.",
        ),
      },
    ),
    h("diagnosis", "Diagnose the blocked ordinal", "Diagnostiquer l’ordinal bloqué"),
    p(
      "If notebook-1 never appears, first inspect notebook-0: OrderedReady may be waiting for it. If a Pod exists but stays Pending, inspect its PVC and scheduling Events, especially local PV affinity. If DNS fails, verify serviceName, the headless selector, readiness and DNS caching before changing the application. A bad rolling update can block at an unready ordinal. Reverting the template alone may not recover an already broken Pod under StatefulSet's documented rollback behavior; after reverting, deliberately delete only the affected Pod and observe its replacement. Never force-delete a potentially running database member without fencing it: duplicate identity can violate application safety.",
      "Si notebook-1 n’apparaît pas, inspectez d’abord notebook-0 : OrderedReady peut l’attendre. Si un Pod existe mais reste Pending, examinez son PVC et les Events d’ordonnancement, surtout l’affinité du PV local. Si le DNS échoue, vérifiez serviceName, sélecteur headless, readiness et cache DNS avant de modifier l’application. Un mauvais rollout peut se bloquer sur un ordinal non prêt. Rétablir le template seul peut ne pas récupérer le Pod déjà cassé selon le comportement de rollback documenté des StatefulSets ; après rétablissement, supprimez explicitement le seul Pod affecté et observez son remplacement. Ne forcez jamais la suppression d’un membre de base potentiellement actif sans fencing : une identité dupliquée peut compromettre la sûreté applicative.",
    ),
    h("quiz", "Check what remains stable", "Vérifier ce qui reste stable"),
    quiz(
      question(
        l(
          "notebook-0 is replaced. Which statement is correct?",
          "notebook-0 est remplacé. Quelle proposition est correcte ?",
        ),
        [
          l(
            "Name and claim can stay stable while UID changes",
            "Nom et PVC peuvent rester stables tandis que l’UID change",
          ),
          l("The Pod UID is permanent", "L’UID du Pod est permanent"),
          l(
            "All replicas share its PVC by default",
            "Tous les réplicas partagent son PVC par défaut",
          ),
        ],
        0,
        l(
          "The StatefulSet preserves a logical ordinal contract across distinct Pod objects.",
          "Le StatefulSet conserve un contrat ordinal logique entre des objets Pod distincts.",
        ),
      ),
      question(
        l(
          "Why are two independent files not evidence of database replication?",
          "Pourquoi deux fichiers indépendants ne prouvent-ils pas une réplication de base ?",
        ),
        [
          l(
            "StatefulSets cannot use volumes",
            "Les StatefulSets ne peuvent pas utiliser de volumes",
          ),
          l(
            "Application synchronization is not supplied by StatefulSet",
            "La synchronisation applicative n’est pas fournie par StatefulSet",
          ),
          l(
            "The headless Service copies the files between replicas",
            "Le Service headless copie les fichiers entre réplicas",
          ),
        ],
        1,
        l(
          "Stable membership gives software useful building blocks; the software must implement its own consistency and recovery protocol.",
          "L’appartenance stable fournit des briques utiles ; le logiciel doit implémenter son protocole de cohérence et de récupération.",
        ),
      ),
      question(
        l(
          "Scale-down uses Retain. What happens to data-notebook-1?",
          "Une réduction utilise Retain. Que devient data-notebook-1 ?",
        ),
        [
          l("It is copied into data-notebook-0", "Il est copié dans data-notebook-0"),
          l(
            "Its PV policy is automatically set to Retain",
            "La politique de son PV devient automatiquement Retain",
          ),
          l(
            "The PVC stays and can serve ordinal 1 again",
            "Le PVC subsiste et peut resservir à l’ordinal 1",
          ),
        ],
        2,
        l(
          "Claim retention and backend reclaim policy are different controls. Retaining this claim does not change its PV's Delete policy.",
          "Conservation du PVC et récupération du stockage réel sont deux contrôles distincts. Garder ce PVC ne change pas la politique Delete de son PV.",
        ),
      ),
    ),
    h(
      "challenge",
      "Scale without losing ordinal data",
      "Redimensionner sans perdre les données ordinales",
    ),
    challenge(
      l("Bring the second notebook back", "Retrouver le deuxième notebook"),
      l(
        "Record notebook-1's file timestamp, scale down to one replica, inspect retained claims, then scale back to two. Predict and verify its name, UID, PVC and file content. Explain why this is still not a disaster-recovery test.",
        "Relevez l’horodatage du fichier de notebook-1, réduisez à un réplica, inspectez les PVC conservés puis remontez à deux. Prédisez et vérifiez nom, UID, PVC et contenu. Expliquez pourquoi cela ne teste toujours pas une reprise après sinistre.",
      ),
      [
        l(
          "Scale-down removes the highest ordinal first.",
          "La réduction retire d’abord l’ordinal supérieur.",
        ),
        l(
          "Read whenScaled separately from the PV reclaim policy.",
          "Lisez whenScaled séparément de la politique de récupération du PV.",
        ),
      ],
      [
        code(
          "bash",
          "k -n lab-stateful exec notebook-1 -- cat /data/identity.txt\nk -n lab-stateful get pod notebook-1 -o jsonpath='{.metadata.uid}{\"\\n\"}'\nk -n lab-stateful get pvc data-notebook-1 -o wide\nk -n lab-stateful scale statefulset/notebook --replicas=1\nk -n lab-stateful wait --for=delete pod/notebook-1 --timeout=120s\nk -n lab-stateful get pvc\nk -n lab-stateful scale statefulset/notebook --replicas=2\nk -n lab-stateful rollout status statefulset/notebook --timeout=180s\nk -n lab-stateful get pod notebook-1 -o jsonpath='{.metadata.uid}{\"\\n\"}'\nk -n lab-stateful get pvc data-notebook-1 -o wide\nk -n lab-stateful exec notebook-1 -- cat /data/identity.txt",
        ),
        p(
          "The returning ordinal uses data-notebook-1, preserving the original file timestamp. Its UID changes because it is a newly created Pod. No disk, node or laptop was lost, so the experiment proves a control-plane lifecycle property and reuse of existing local storage only.",
          "L’ordinal revenu utilise data-notebook-1 en conservant l’horodatage initial. Son UID change car c’est un nouveau Pod. Aucun disque, nœud ou portable n’a été perdu : l’expérience prouve seulement un comportement de cycle de vie et la réutilisation d’un stockage local existant.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Retention is not a namespace backup",
      "La conservation n’est pas une sauvegarde du namespace",
    ),
    p(
      "Scale to zero first for an ordered shutdown, then record the claim-to-PV mapping. Deleting the namespace still deletes its PVC objects even though the StatefulSet policy says Retain. Under the inspected Delete PV policy, their local-path data is reclaimed. Review that consequence before the following cleanup. Check the recorded PV names afterward; any retained backend needs separate administrator handling.",
      "Réduisez d’abord à zéro pour un arrêt ordonné puis relevez la correspondance PVC/PV. Supprimer le namespace supprime encore ses objets PVC même si la politique StatefulSet dit Retain. Avec les PV Delete inspectés, les données local-path sont récupérées. Examinez cette conséquence avant le nettoyage suivant. Vérifiez ensuite les noms de PV relevés ; un backend conservé nécessite un traitement administrateur distinct.",
    ),
    code(
      "bash",
      "k -n lab-stateful scale statefulset/notebook --replicas=0\nk -n lab-stateful wait --for=delete pod -l app=stateful-notebook --timeout=120s\nk -n lab-stateful get pvc -o custom-columns='CLAIM:.metadata.name,PV:.spec.volumeName'\nk delete namespace lab-stateful",
    ),
  ],
};
