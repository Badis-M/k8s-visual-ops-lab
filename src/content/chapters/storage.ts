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
import claim from "../../../lab/level-2/storage/claim.yaml?raw";
import writer from "../../../lab/level-2/storage/writer.yaml?raw";
import missingClass from "../../../lab/level-2/storage/missing-class.yaml?raw";

export const storage: Chapter = {
  id: "storage",
  level: 2,
  minutes: 60,
  title: l(
    "PersistentVolumes, PVCs and StorageClasses",
    "PersistentVolumes, PVC et StorageClasses",
  ),
  summary: l(
    "Follow a storage request from PVC to provisioned volume, distinguish Pod persistence from durability, and understand the data deletion boundary.",
    "Suivre une demande de stockage du PVC au volume provisionné, distinguer persistance du Pod et durabilité, et comprendre la frontière de suppression des données.",
  ),
  prerequisites: ["pods", "deployments"],
  related: ["statefulsets", "csi", "backup-dr"],
  blocks: [
    h(
      "objectives",
      "Explain ownership before deleting anything",
      "Comprendre la propriété avant de supprimer",
    ),
    list(
      l(
        "Trace Pod → namespaced PVC → cluster-scoped PV → storage backend.",
        "Retracer Pod → PVC de namespace → PV de cluster → stockage réel.",
      ),
      l(
        "Diagnose Pending claims, prove survival after Pod replacement and predict Delete versus Retain behavior.",
        "Diagnostiquer un PVC Pending, vérifier sa survie au remplacement d’un Pod et prédire Delete ou Retain.",
      ),
    ),
    h(
      "mental-model",
      "A claim is a contract, not a disk",
      "Une demande est un contrat, pas un disque",
    ),
    p(
      "An application names a PersistentVolumeClaim in its namespace. The claim requests a capacity, access modes and a storage class. A PersistentVolume represents the allocated storage at cluster scope and binds to one claim. A StorageClass describes a provisioning policy and its provisioner. Dynamic provisioning creates a suitable PV; with static provisioning an administrator prepares one first. Creating a PVC without a functioning matching provisioner does not create storage by magic.",
      "Une application référence un PersistentVolumeClaim dans son namespace. Cette demande précise une capacité, des modes d’accès et une classe. Un PersistentVolume représente l’allocation à l’échelle du cluster et se lie à une seule demande. Une StorageClass décrit une politique et son provisioner. Le provisionnement dynamique crée un PV adapté ; en statique, un administrateur le prépare au préalable. Créer un PVC sans provisioner compatible fonctionnel ne fabrique pas de stockage par magie.",
    ),
    p(
      "A PVC can outlive its consuming Pod, so a replacement can recover the same files. That is different from surviving the loss of the disk, host or whole cluster. kind's standard local-path storage places data on a particular node container. Its PV affinity keeps the consumer near that data; it does not replicate files to the other worker. This chapter proves continuity across Pod replacement only. Snapshots, backups, replication and restoration need their own mechanisms and verification.",
      "Un PVC peut survivre au Pod qui le consomme : un remplaçant retrouve alors les mêmes fichiers. Cela ne signifie pas survivre à la perte du disque, de l’hôte ou du cluster entier. La classe standard local-path de kind place les données sur un conteneur nœud précis. L’affinité du PV rapproche le consommateur des données ; elle ne réplique pas les fichiers sur l’autre worker. Ce chapitre vérifie uniquement la continuité lors du remplacement d’un Pod. Snapshots, sauvegardes, réplication et restauration demandent leurs propres mécanismes et vérifications.",
    ),
    note(
      "warn",
      l("RWO does not mean one writer process", "RWO ne signifie pas un seul processus écrivain"),
      l(
        "ReadWriteOnce allows read/write mounting on one node; several Pods on that node can still access the same volume. ReadWriteOncePod provides a single-Pod constraint for supported CSI volumes. The lab's local-path provisioner is not that CSI driver. Neither an access-mode name nor replicas: 1 replaces application locking or a safe storage architecture.",
        "ReadWriteOnce autorise le montage en lecture/écriture sur un nœud ; plusieurs Pods de ce nœud peuvent encore accéder au volume. ReadWriteOncePod impose une contrainte d’un seul Pod pour les volumes CSI compatibles. Le provisioner local-path du lab n’est pas ce driver CSI. Un mode d’accès ou replicas: 1 ne remplace ni les verrous applicatifs ni une architecture de stockage sûre.",
      ),
    ),
    ...labContext("lab-storage"),
    h(
      "prerequisites",
      "Verify the storage provider first",
      "Vérifier d’abord le fournisseur de stockage",
    ),
    code(
      "bash",
      "k get storageclass\nk get storageclass standard -o yaml\nk -n local-path-storage get deployments,pods",
    ),
    p(
      "For this kind baseline, verify standard uses rancher.io/local-path, WaitForFirstConsumer and reclaimPolicy: Delete, with a running provisioner. If these differ, stop and adapt the manifest to a reviewed class; do not alter the cluster's default class globally. With WaitForFirstConsumer, a newly created PVC can remain Pending until a schedulable Pod references it. Waiting for Bound before creating that consumer would deadlock your manual procedure.",
      "Pour cette base kind, vérifiez que standard utilise rancher.io/local-path, WaitForFirstConsumer et reclaimPolicy: Delete, avec un provisioner actif. Si ces valeurs diffèrent, adaptez le manifest à une classe examinée ; ne changez pas la classe par défaut du cluster. Avec WaitForFirstConsumer, un nouveau PVC peut rester Pending jusqu’à ce qu’un Pod ordonnançable le référence. Attendre Bound avant de créer ce consommateur bloquerait votre procédure manuelle.",
    ),
    h("manifest", "Read the claim and its consumer", "Lire la demande et son consommateur"),
    code("yaml", claim, "lab/level-2/storage/claim.yaml"),
    code("yaml", writer, "lab/level-2/storage/writer.yaml"),
    {
      type: "fields",
      rows: [
        {
          field: "storageClassName: standard",
          text: l(
            "Selects the inspected kind class explicitly; omitting it would depend on the cluster default.",
            "Sélectionne explicitement la classe kind inspectée ; l’omettre dépendrait de la classe par défaut.",
          ),
        },
        {
          field: "requests.storage: 64Mi",
          text: l(
            "Expresses the claim requirement. Local-path does not enforce a per-volume disk quota, so this is not a safe disk-fill experiment.",
            "Exprime la demande. Local-path n’impose pas de quota disque par volume : ce n’est pas un cadre sûr pour remplir le disque.",
          ),
        },
        {
          field: "strategy.type: Recreate",
          text: l(
            "Avoids an update intentionally overlapping writers in this exercise; it does not guarantee application-level exclusivity under failures.",
            "Évite de faire volontairement coexister des écrivains lors d’une mise à jour ; cela ne garantit pas l’exclusivité applicative face aux pannes.",
          ),
        },
        {
          field: "persistentVolumeClaim.claimName",
          text: l(
            "Must reference a PVC in the same namespace. The application does not name the PV directly.",
            "Doit référencer un PVC du même namespace. L’application ne nomme pas directement le PV.",
          ),
        },
      ],
    },
    h("exercise", "Prove the lifetime boundary", "Vérifier la frontière de durée de vie"),
    steps(
      {
        title: l("Create the claim, then its consumer", "Créer la demande puis son consommateur"),
        code: {
          lang: "bash",
          code: "k -n lab-storage apply -f lab/level-2/storage/claim.yaml\nk -n lab-storage get pvc\nk -n lab-storage apply -f lab/level-2/storage/writer.yaml\nk -n lab-storage rollout status deployment/writer --timeout=120s\nk -n lab-storage get pvc data -o wide\nk get pv",
        },
        explain: l(
          "PVC Pending before the consumer is expected with delayed binding. After the rollout, inspect the specific PV name shown by the claim and its nodeAffinity rather than guessing from a generated identifier.",
          "Le PVC Pending avant le consommateur est attendu avec la liaison différée. Après le rollout, inspectez le PV précis indiqué par la demande et son nodeAffinity, sans deviner son identifiant généré.",
        ),
        expected: {
          text: l(
            "Expected: data becomes Bound and writer becomes ready. The PV's claimRef identifies lab-storage/data.",
            "Attendu : data devient Bound et writer devient prêt. Le claimRef du PV désigne lab-storage/data.",
          ),
        },
      },
      {
        title: l("Write evidence and replace the Pod", "Écrire une preuve et remplacer le Pod"),
        code: {
          lang: "bash",
          code: `k -n lab-storage exec deployment/writer -- sh -ec 'printf "Written before replacement\\n" > /data/message.txt'\nk -n lab-storage get pods -l app=persistent-writer -o 'custom-columns=NAME:.metadata.name,UID:.metadata.uid,NODE:.spec.nodeName'\nk -n lab-storage delete pod -l app=persistent-writer\nk -n lab-storage rollout status deployment/writer --timeout=120s\nk -n lab-storage exec deployment/writer -- cat /data/message.txt\nk -n lab-storage get pods -l app=persistent-writer -o 'custom-columns=NAME:.metadata.name,UID:.metadata.uid,NODE:.spec.nodeName'`,
        },
        explain: l(
          "The controller creates a replacement with a new identity. The initializer inside writer does not overwrite an existing file. Compare the content, Pod UID and bound PVC; a new Pod name alone is insufficient evidence of durability.",
          "Le contrôleur crée un remplaçant avec une nouvelle identité. L’initialisation de writer n’écrase pas un fichier existant. Comparez contenu, UID du Pod et PVC lié ; un nouveau nom de Pod ne suffit pas à prouver la durabilité.",
        ),
        expected: {
          text: l(
            "Expected file: Written before replacement. The same PVC/PV pair remains, normally tied to the same kind node.",
            "Fichier attendu : Written before replacement. La même paire PVC/PV subsiste, normalement attachée au même nœud kind.",
          ),
        },
      },
    ),
    h(
      "diagnosis",
      "Pending is a symptom with several causes",
      "Pending a plusieurs causes possibles",
    ),
    code("yaml", missingClass, "lab/level-2/storage/missing-class.yaml"),
    code(
      "bash",
      "k -n lab-storage apply -f lab/level-2/storage/missing-class.yaml\nk -n lab-storage describe pvc missing-class\nk -n lab-storage get events --sort-by=.metadata.creationTimestamp\nk -n lab-storage delete pvc missing-class",
    ),
    p(
      "The deliberately nonexistent class prevents provisioning. Distinguish it from normal waiting for a consumer. A consumer with incompatible node affinity or excessive requests can also keep delayed provisioning from progressing. For a Bound claim but a stuck Pod, inspect Pod Events for mount failures, backend availability and permissions. Do not fix a bound claim by deleting it blindly: Delete reclaim policy can erase the data. Most binding fields cannot be changed in place; creating a corrected claim requires an explicit data migration plan when data matters.",
      "La classe volontairement inexistante empêche le provisionnement. Distinguez-la de l’attente normale d’un consommateur. Un consommateur à l’affinité incompatible ou trop gourmand peut également bloquer le provisionnement différé. Si le PVC est Bound mais le Pod bloqué, examinez les Events du Pod : montage, disponibilité du stockage et permissions. Ne corrigez pas un PVC lié en le supprimant aveuglément : la politique Delete peut effacer les données. La plupart des champs de liaison sont immuables ; créer une demande corrigée exige une migration explicite lorsque les données comptent.",
    ),
    h("quiz", "Separate persistence from protection", "Distinguer persistance et protection"),
    quiz(
      question(
        l(
          "A PVC is Pending with WaitForFirstConsumer and no Pod exists. What is the next useful action?",
          "Un PVC est Pending avec WaitForFirstConsumer sans Pod existant. Quelle action est utile ?",
        ),
        [
          l(
            "Create its intended consumer and inspect scheduling",
            "Créer son consommateur prévu et inspecter l’ordonnancement",
          ),
          l("Delete the StorageClass", "Supprimer la StorageClass"),
          l("Increase the PVC size randomly", "Augmenter arbitrairement la taille"),
        ],
        0,
        l(
          "Delayed binding coordinates storage topology with the consumer's placement. Pending alone does not prove failure.",
          "La liaison différée coordonne topologie du stockage et placement du consommateur. Pending seul ne prouve pas une panne.",
        ),
      ),
      question(
        l(
          "Does RWO prevent two Pods on the same node from writing?",
          "RWO empêche-t-il deux Pods du même nœud d’écrire ?",
        ),
        [
          l("Yes, it is a database lock", "Oui, c’est un verrou de base de données"),
          l("No, its mount scope is one node", "Non, sa portée de montage est un nœud"),
          l("Only if the PVC is Bound", "Seulement si le PVC est Bound"),
        ],
        1,
        l(
          "RWO is not the RWOP single-Pod constraint and does not implement application concurrency control.",
          "RWO n’est pas la contrainte mono-Pod RWOP et n’implémente pas la concurrence applicative.",
        ),
      ),
      question(
        l(
          "The writer survives Pod replacement. Can you claim recovery after losing the laptop?",
          "writer survit au remplacement du Pod. Peut-on annoncer une récupération après perte du portable ?",
        ),
        [
          l("Yes, Kubernetes copies every PV", "Oui, Kubernetes copie chaque PV"),
          l("Yes, because PVCs are namespaced", "Oui, car les PVC sont dans un namespace"),
          l(
            "No, the exercise has no independent backup",
            "Non, l’exercice n’a pas de sauvegarde indépendante",
          ),
        ],
        2,
        l(
          "The storage remains on the same local host. Durability and disaster recovery require evidence beyond this lifecycle test.",
          "Le stockage reste sur le même hôte local. Durabilité et reprise après sinistre demandent d’autres preuves que ce test de cycle de vie.",
        ),
      ),
    ),
    h(
      "challenge",
      "Predict data deletion before cleanup",
      "Prédire la suppression avant le nettoyage",
    ),
    challenge(
      l("Which object controls the backend?", "Quel objet commande le devenir des données ?"),
      l(
        "Inspect the actual PV backing data. Explain what namespace deletion does when that PV uses Delete, and what changes with Retain. Give a safe recovery plan for a valuable volume without running a destructive experiment.",
        "Inspectez le PV réel derrière data. Expliquez l’effet de la suppression du namespace avec Delete puis avec Retain. Donnez un plan de récupération sûr pour un volume important sans lancer d’expérience destructive.",
      ),
      [
        l(
          "The StorageClass supplies a default to newly provisioned PVs; inspect the current PV itself.",
          "La StorageClass fournit un défaut aux nouveaux PV ; inspectez le PV actuel.",
        ),
        l(
          "Retain preserves allocation but does not automatically bind old data to a fresh claim.",
          "Retain conserve l’allocation mais ne lie pas automatiquement les anciennes données à une nouvelle demande.",
        ),
      ],
      [
        code(
          "bash",
          "LAB_STORAGE_PV=$(k -n lab-storage get pvc data -o jsonpath='{.spec.volumeName}')\nk get pv \"$LAB_STORAGE_PV\" -o yaml",
        ),
        p(
          "Delete normally asks the provisioner to remove its allocated storage after claim deletion. Retain leaves the PV in Released with old claim ownership and data requiring administrator handling. For important data, stop writers, take and verify an independent backup, record claim/PV/backend identity, review the actual retention policy, then follow a backend-specific restore or rebinding procedure. Changing a StorageClass later does not rewrite the policy already stored on this PV.",
          "Delete demande normalement au provisioner de retirer son stockage après suppression du PVC. Retain laisse le PV Released, avec l’ancien rattachement et des données à traiter par l’administrateur. Pour des données importantes, arrêtez les écrivains, réalisez et vérifiez une sauvegarde indépendante, relevez les identités PVC/PV/stockage, examinez la politique réelle puis suivez une restauration ou réassociation propre au backend. Modifier ensuite la StorageClass ne réécrit pas la politique déjà portée par ce PV.",
        ),
      ],
    ),
    h("cleanup", "Delete only the disposable data", "Supprimer seulement les données jetables"),
    note(
      "warn",
      l("This cleanup destroys the exercise file", "Ce nettoyage détruit le fichier de l’exercice"),
      l(
        "The baseline's Delete policy removes the allocated local-path directory. Capture the PV name first, remove the namespace, then inspect that precise PV. If it remains Released or Terminating, inspect policy, Events and provisioner health; do not strip finalizers to force disappearance. A Retain backend needs deliberate administrator cleanup beyond namespace removal.",
        "La politique Delete de la base retire le répertoire local-path alloué. Relevez d’abord le nom du PV, supprimez le namespace puis inspectez ce PV précis. S’il reste Released ou Terminating, examinez politique, Events et provisioner ; ne retirez pas les finalizers pour forcer sa disparition. Un backend Retain nécessite un nettoyage administrateur explicite au-delà du namespace.",
      ),
    ),
    code(
      "bash",
      "LAB_STORAGE_PV=$(k -n lab-storage get pvc data -o jsonpath='{.spec.volumeName}')\nk delete namespace lab-storage\nk get pv \"$LAB_STORAGE_PV\"",
    ),
    p(
      "Expected with successful Delete reclamation: that PV eventually returns NotFound. API deletion and actual backend reclamation can be asynchronous. No storage quota, node-loss recovery, CSI snapshot or restore has been demonstrated by this chapter.",
      "Attendu après une récupération Delete réussie : ce PV finit par retourner NotFound. Suppression API et retrait du stockage réel peuvent être asynchrones. Ce chapitre ne démontre ni quota de stockage, ni récupération après perte de nœud, ni snapshot CSI, ni restauration.",
    ),
  ],
};
