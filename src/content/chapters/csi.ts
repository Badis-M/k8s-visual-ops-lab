import type { Chapter } from "../types";
import { l, h, p, code, note, list, quiz, question, challenge } from "../lesson-kit";
import snapshotCycle from "../../../lab/level-4/csi/snapshot-cycle.sh?raw";
import cleanup from "../../../lab/level-4/csi/cleanup.sh?raw";

export const csi: Chapter = {
  id: "csi",
  level: 4,
  minutes: 65,
  title: l("CSI and storage architecture", "CSI et architecture du stockage"),
  summary: l(
    "Map provisioning, attachment and node mounts to CSI components, verify the actual driver, and conditionally restore a snapshot into a new PVC.",
    "Relier provisionnement, attachement et montage aux composants CSI, vérifier le vrai driver puis restaurer conditionnellement un snapshot vers un nouveau PVC.",
  ),
  prerequisites: ["storage", "statefulsets", "backup-dr"],
  related: ["scheduling", "cri", "failure-scenarios"],
  heavy: l(
    "The restore branch requires a separately installed compatible CSI driver with snapshot support, CRDs, snapshot controller and matching classes. Default kind local-path cannot perform it.",
    "La restauration exige un driver CSI compatible déjà installé avec snapshots, CRD, contrôleur snapshot et classes correspondantes. Le local-path kind par défaut ne la réalise pas.",
  ),
  blocks: [
    h(
      "objectives",
      "Follow the storage operation, not just the PVC",
      "Suivre l’opération de stockage, pas seulement le PVC",
    ),
    list(
      l(
        "Locate failures in provisioning, attachment, staging/publishing or application writes.",
        "Localiser les échecs de provisionnement, attachement, staging/publishing ou écriture applicative.",
      ),
      l(
        "Verify a real restored file from a new claim instead of calling snapshot creation a backup test.",
        "Vérifier un vrai fichier restauré dans une nouvelle claim au lieu de nommer la création du snapshot test de sauvegarde.",
      ),
    ),
    p(
      "CSI standardizes storage RPCs between an orchestrator and a driver. Kubernetes API objects express desired storage; external sidecars translate relevant objects into driver calls. The external-provisioner drives CreateVolume and PV creation, an external-attacher may drive ControllerPublishVolume for attachment, and kubelet calls node operations such as NodeStageVolume and NodePublishVolume through the node plugin. Some drivers do not require attachment or staging, so absence of a VolumeAttachment is not automatically a fault.",
      "CSI standardise les RPC entre orchestrateur et driver. Les objets Kubernetes expriment le stockage désiré ; des sidecars traduisent ces objets en appels. external-provisioner pilote CreateVolume et la création du PV, external-attacher peut piloter ControllerPublishVolume pour l’attachement, puis kubelet appelle NodeStageVolume et NodePublishVolume via le plugin du nœud. Certains drivers n’exigent ni attachement ni staging : l’absence de VolumeAttachment n’est donc pas automatiquement une panne.",
    ),
    p(
      "RPC retries are normal under timeouts and restarts, so CSI operations have idempotency requirements keyed by operation identity and parameters. That does not make application writes transactional. CSIDriver describes driver behavior, CSINode records node registration/capabilities, and a CSI PV identifies spec.csi.driver plus volumeHandle. The latter is the backend's volume identity, not the PVC name. StorageClass.provisioner alone is not proof of CSI: other external provisioners also create PVs.",
      "Les reprises RPC sont normales avec délais et redémarrages ; CSI impose donc l’idempotence selon identité et paramètres de l’opération. Cela ne rend pas transactionnelles les écritures applicatives. CSIDriver décrit le comportement, CSINode l’enregistrement/capacités par nœud, et un PV CSI porte spec.csi.driver et volumeHandle. Ce dernier identifie le volume backend, pas la claim. StorageClass.provisioner seul ne prouve pas CSI : d’autres provisionneurs externes créent aussi des PV.",
    ),
    h(
      "inventory",
      "Begin with an honest baseline inventory",
      "Commencer par un inventaire honnête",
    ),
    code(
      "bash",
      "kubectl --context kind-k8s-ops-lab get storageclasses -o custom-columns=NAME:.metadata.name,PROVISIONER:.provisioner,BINDING:.volumeBindingMode,RECLAIM:.reclaimPolicy\nkubectl --context kind-k8s-ops-lab get csidrivers,csinodes\nkubectl --context kind-k8s-ops-lab get crd volumesnapshots.snapshot.storage.k8s.io volumesnapshotcontents.snapshot.storage.k8s.io\nkubectl --context kind-k8s-ops-lab get volumesnapshotclasses\nkubectl --context kind-k8s-ops-lab get volumeattachments",
    ),
    note(
      "warn",
      l(
        "Stop the restore branch when prerequisites are missing",
        "Arrêter la restauration sans ses prérequis",
      ),
      l(
        "Default kind uses a local-path provisioner, not a CSI snapshot driver. Empty CSIDriver lists or missing snapshot CRDs are expected there. Do not create fake CRDs/classes or rename local-path to pretend support. Continue with architecture/diagnosis on that baseline; execute the optional cycle only on a disposable, separately prepared compatible CSI environment using the explicit context. No driver is installed by this lesson or agent.",
        "Kind utilise par défaut un provisionneur local-path, pas un driver CSI de snapshots. CSIDriver vide ou CRD absentes y sont attendus. Ne créez pas de fausses CRD/classes et ne renommez pas local-path pour simuler le support. Continuez architecture/diagnostic sur cette base ; le cycle optionnel exige un environnement CSI compatible préparé séparément, avec contexte explicite. Aucun driver n’est installé par ce cours ou l’agent.",
      ),
    ),
    p(
      "For a real CSI environment, inspect the driver's documented Kubernetes 1.35 support, controller/node plugin health, provisioner and snapshotter versions, and snapshot capability. Snapshot CRDs and the common snapshot controller are additional dependencies; a VolumeSnapshotClass selects a driver but cannot implement it. Python 3 with its standard library is also required for the ownership guard. Use an existing free local evaluation environment with a reviewed topology/lifecycle, never paid cloud storage or a shared production class.",
      "Avec un vrai CSI, examinez support documenté de Kubernetes 1.35, santé des plugins controller/node, versions du provisionneur/snapshotter et capacité snapshot. CRD et contrôleur commun sont des dépendances supplémentaires ; VolumeSnapshotClass sélectionne un driver sans l’implémenter. Python 3 et sa bibliothèque standard sont aussi nécessaires au garde de propriété. Utilisez une évaluation locale gratuite avec topologie/cycle de vie examinés, jamais stockage cloud payant ni classe de production partagée.",
    ),
    h(
      "restore",
      "Run a complete conditional snapshot cycle",
      "Exécuter un cycle conditionnel complet",
    ),
    p(
      "The script accepts two actual class names and refuses an existing lab-csi namespace, a non-CSI provisioner, mismatched drivers or retained-data policies. After preflight it creates a namespace with exercise/run labels and records the UID returned by that create operation in a private local ownership marker. It then creates a source claim/writer, stops the writer, waits for a ready snapshot, restores into a different PVC and compares the copied file. Both class deletion/reclaim policies must be Delete. Inspect the script first.",
      "Le script accepte deux vrais noms de classes et refuse namespace lab-csi existant, provisionneur non CSI, drivers différents ou rétention. Après préflight, il crée un namespace avec labels d’exercice/run et consigne l’UID retourné par cette création dans une preuve locale privée. Il crée ensuite claim/writer, arrête ce dernier, attend un snapshot prêt, restaure un autre PVC et compare le fichier copié. Les politiques de suppression/récupération doivent être Delete. Lisez le script au préalable.",
    ),
    code("bash", snapshotCycle, "lab/level-4/csi/snapshot-cycle.sh"),
    code(
      "bash",
      'read -r LAB_CSI_STORAGE_CLASS\nread -r LAB_CSI_SNAPSHOT_CLASS\nbash lab/level-4/csi/snapshot-cycle.sh "$LAB_CSI_STORAGE_CLASS" "$LAB_CSI_SNAPSHOT_CLASS"',
    ),
    p(
      "Enter the reviewed StorageClass and matching VolumeSnapshotClass at each read. Preserve the exact Ownership marker path printed by the script: cleanup requires that file. Expected only with the required components: distinct source/restored volumes, a ready snapshot and reader returning snapshot-marker-v1. A timeout is failure evidence requiring inspection, not proof of restoration. Objects remain for diagnosis; no automatic deletion runs on failure. A preflight refusal creates no ownership marker and authorizes no cleanup of an existing namespace.",
      "Saisissez les classes examinées à chaque read. Conservez le chemin Ownership marker exact affiché : le nettoyage exige ce fichier. Attendu seulement avec les composants requis : volumes source/restauré distincts, snapshot prêt et reader retournant snapshot-marker-v1. Un timeout est un échec à examiner, pas une preuve de restauration. Les objets restent pour diagnostic, sans suppression automatique à l’échec. Un refus de préflight ne crée aucune preuve et n’autorise aucun nettoyage d’un namespace existant.",
    ),
    h("diagnosis", "Locate the failed RPC boundary", "Localiser la frontière RPC en échec"),
    code(
      "bash",
      "kubectl --context kind-k8s-ops-lab -n lab-csi get pvc,pods,volumesnapshot -o wide\nkubectl --context kind-k8s-ops-lab -n lab-csi describe pvc source-data\nkubectl --context kind-k8s-ops-lab -n lab-csi describe pod reader\nkubectl --context kind-k8s-ops-lab -n lab-csi get events --sort-by=.metadata.creationTimestamp\nkubectl --context kind-k8s-ops-lab get pv,volumeattachments",
    ),
    p(
      "Pending PVC with WaitForFirstConsumer can be normal until a consumer is schedulable. ProvisioningFailed suggests driver/backend/capacity parameters; FailedAttachVolume points toward controller attachment/topology; FailedMount can involve node registration, staging, publishing or permissions. Use the actual driver's controller/node logs only after identifying its objects; never dump storage credentials. A ready snapshot can still be crash-consistent rather than application-consistent, and snapshots in the same backend are not independent disaster recovery copies.",
      "Un PVC Pending avec WaitForFirstConsumer peut attendre normalement un consommateur plaçable. ProvisioningFailed suggère driver/backend/capacité ; FailedAttachVolume concerne attachement/topologie ; FailedMount peut impliquer enregistrement, staging, publishing ou permissions. Examinez les vrais logs du driver après identification, sans exporter d’identifiants stockage. Un snapshot prêt peut être cohérent après crash sans cohérence applicative ; dans le même backend, il n’est pas une copie indépendante de reprise après sinistre.",
    ),
    h("quiz", "Separate the storage contracts", "Séparer les contrats de stockage"),
    quiz(
      question(
        l(
          "Does a StorageClass provisioner name prove CSI?",
          "Un nom de provisionneur prouve-t-il CSI ?",
        ),
        [
          l("Yes, any external provisioner is CSI", "Oui, tout provisionneur externe est CSI"),
          l("Only if its name contains storage", "Seulement si son nom contient storage"),
          l(
            "No; inspect driver registration and the PV's CSI source",
            "Non ; examinez enregistrement et source CSI du PV",
          ),
        ],
        2,
        l(
          "Local-path provisioning is a counterexample: dynamic PV creation does not imply the CSI interface.",
          "Local-path est un contre-exemple : créer dynamiquement un PV n’implique pas CSI.",
        ),
      ),
      question(
        l(
          "What proves this exercise restored data?",
          "Qu’est-ce qui prouve la restauration de cet exercice ?",
        ),
        [
          l(
            "The original writer still reads its file",
            "Le writer original lit encore son fichier",
          ),
          l(
            "A new PVC/reader returns the expected marker",
            "Un nouveau PVC/reader retourne le marqueur attendu",
          ),
          l("The snapshot class exists", "La classe de snapshot existe"),
        ],
        1,
        l(
          "The restored consumer must read the copy, not the still-existing source volume.",
          "Le consommateur restauré doit lire la copie, pas le volume source toujours présent.",
        ),
      ),
      question(
        l(
          "Does CSI idempotency make database transactions atomic?",
          "L’idempotence CSI rend-elle les transactions atomiques ?",
        ),
        [
          l(
            "No, application consistency remains separate",
            "Non, la cohérence applicative reste distincte",
          ),
          l("Always", "Toujours"),
          l("Only with ReadWriteOnce", "Seulement avec ReadWriteOnce"),
        ],
        0,
        l(
          "Storage RPC retry safety does not establish application-level transactional semantics.",
          "La sécurité des reprises RPC ne définit pas les transactions applicatives.",
        ),
      ),
    ),
    h(
      "challenge",
      "Prove source and restored volume identities differ",
      "Prouver que source et volume restauré diffèrent",
    ),
    challenge(
      l("Not accidentally reading the source", "Ne pas relire accidentellement la source"),
      l(
        "After a successful optional cycle, identify the PV behind each PVC and inspect both CSI volumeHandles. Confirm reader mounts restored-data. Explain why source and restored claims being Bound alone is insufficient.",
        "Après un cycle réussi, identifiez le PV de chaque PVC et leurs volumeHandle CSI. Confirmez que reader monte restored-data. Expliquez pourquoi deux claims Bound ne suffisent pas.",
      ),
      [
        l(
          "PVC.spec.volumeName identifies its PV; Pod volumes identify the mounted claim.",
          "PVC.spec.volumeName identifie le PV ; les volumes du Pod indiquent la claim montée.",
        ),
        l(
          "Inspect spec.csi.driver and volumeHandle on those exact PVs.",
          "Examinez spec.csi.driver et volumeHandle de ces PV précis.",
        ),
      ],
      [
        code(
          "bash",
          "LAB_SOURCE_PV=$(kubectl --context kind-k8s-ops-lab -n lab-csi get pvc source-data -o jsonpath='{.spec.volumeName}')\nLAB_RESTORED_PV=$(kubectl --context kind-k8s-ops-lab -n lab-csi get pvc restored-data -o jsonpath='{.spec.volumeName}')\nkubectl --context kind-k8s-ops-lab get pv \"$LAB_SOURCE_PV\" \"$LAB_RESTORED_PV\" -o custom-columns=NAME:.metadata.name,DRIVER:.spec.csi.driver,HANDLE:.spec.csi.volumeHandle\nkubectl --context kind-k8s-ops-lab -n lab-csi get pod reader -o jsonpath='{.spec.volumes[*].persistentVolumeClaim.claimName}{\"\\n\"}'\nkubectl --context kind-k8s-ops-lab -n lab-csi exec reader -- cat /data/marker.txt",
        ),
        p(
          "Expected: distinct PVs/handles for this clone-style restore, reader references restored-data and the copied marker matches. Bound records allocation; the mounted claim and readback establish that the copy is usable. Protect volume handles as infrastructure metadata when sharing diagnostics.",
          "Attendu : PV/handles distincts pour cette restauration en copie, reader vise restored-data et le marqueur correspond. Bound constate l’allocation ; claim montée et relecture établissent que la copie est exploitable. Traitez les handles comme métadonnées d’infrastructure dans les diagnostics partagés.",
        ),
      ],
    ),
    h("cleanup", "Clean up only the recorded run", "Nettoyer uniquement le run enregistré"),
    code("bash", cleanup, "lab/level-4/csi/cleanup.sh"),
    code(
      "bash",
      'printf "Paste the exact Ownership marker path printed by snapshot-cycle.sh: "\nIFS= read -r LAB_CSI_OWNERSHIP_MARKER\nbash lab/level-4/csi/cleanup.sh "$LAB_CSI_OWNERSHIP_MARKER"\nkubectl --context kind-k8s-ops-lab get namespace lab-csi --ignore-not-found\nkubectl --context kind-k8s-ops-lab get pv,volumesnapshotcontents',
    ),
    p(
      "ownership.py refuses a missing/public marker, changed namespace UID or different exercise/run labels before deletion. Its DELETE also carries UID and resourceVersion preconditions, so replacement between inspection and deletion is rejected by the API. Namespace controllers remove the owned consumers/storage objects; protection finalizers and Delete policies govern asynchronous backend cleanup. Inspect the two exercise PVs/snapshot content without deleting shared objects or removing finalizers. Keep the private marker until cleanup is verified, then remove only its printed temporary directory manually. Inventory alone or refused preflight requires no namespace deletion.",
      "ownership.py refuse preuve absente/publique, UID différent ou labels d’exercice/run différents avant suppression. DELETE porte aussi des préconditions UID et resourceVersion : l’API refuse un remplacement entre lecture et suppression. Les contrôleurs retirent les consommateurs/objets de stockage du namespace détenu ; finalizers et politiques Delete gouvernent le nettoyage backend asynchrone. Examinez les deux PV/contenu snapshot sans supprimer d’objet partagé ni retirer de finalizer. Gardez la preuve privée jusqu’à vérification, puis retirez manuellement uniquement son répertoire temporaire affiché. Inventaire seul ou préflight refusé n’exige aucune suppression de namespace.",
    ),
  ],
};
