import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import data from "../../../lab/level-3/backup-dr/data.yaml?raw";
import capture from "../../../lab/level-3/backup-dr/capture.sh?raw";
import restore from "../../../lab/level-3/backup-dr/restore.sh?raw";
import verify from "../../../lab/level-3/backup-dr/verify.sh?raw";

export const backupDr: Chapter = {
  id: "backup-dr",
  level: 3,
  minutes: 50,
  title: l("Backups and disaster recovery", "Sauvegardes et reprise après sinistre"),
  summary: l(
    "Restore a consistent synthetic dataset into a separate PVC, verify bytes and business meaning, and relate the result to realistic RPO/RTO boundaries.",
    "Restaurer un jeu de données synthétique cohérent dans un PVC distinct, vérifier octets et sens métier et relier le résultat aux limites réelles RPO/RTO.",
  ),
  prerequisites: ["storage", "statefulsets"],
  related: ["incidents", "etcd", "csi", "ha"],
  blocks: [
    h(
      "objectives",
      "A recovery claim needs a restore",
      "Une affirmation de reprise exige une restauration",
    ),
    list(
      l(
        "Identify configuration, API state, application data and external dependencies as separate recovery assets.",
        "Identifier configuration, état API, données applicatives et dépendances externes comme des actifs distincts.",
      ),
      l(
        "Measure a restore drill and prove what data point it recovers rather than calling a successful upload a backup guarantee.",
        "Mesurer un exercice de restauration et prouver le point de données retrouvé, sans assimiler un téléversement réussi à une garantie de sauvegarde.",
      ),
    ),
    h(
      "mental-model",
      "Recover an application contract, not only objects",
      "Rétablir un contrat applicatif, pas seulement des objets",
    ),
    p(
      "Git can preserve reviewed manifests but not the bytes in a PVC. An etcd snapshot protects Kubernetes API state, including sensitive objects, but not arbitrary external volume data. A storage snapshot may share the same failed backend and may capture a database between related writes. Application-native dumps, write quiescence or coordinated backup hooks are needed when consistency spans files or services. Tools such as Velero orchestrate API and volume protection with provider-specific mechanisms; installing the CLI alone supplies neither a backend nor a tested restore.",
      "Git peut préserver des manifests examinés, pas les octets d’un PVC. Un snapshot etcd protège l’état API Kubernetes, objets sensibles inclus, pas les données arbitraires de volumes externes. Un snapshot stockage peut partager le backend défaillant et capturer une base entre plusieurs écritures liées. Dumps natifs applicatifs, suspension des écritures ou hooks coordonnés sont nécessaires si la cohérence traverse fichiers ou services. Des outils comme Velero orchestrent la protection API et volumes avec des mécanismes propres aux fournisseurs ; installer le CLI ne fournit ni backend ni restauration testée.",
    ),
    p(
      "RPO is the maximum tolerable data loss expressed as time; RTO is the maximum tolerable time to restore the required service. A backup every hour does not automatically meet a one-hour RPO if jobs fail unnoticed or snapshots are inconsistent. Recovery time includes detection, access to credentials/keys, provisioning, restore, validation and traffic recovery. Set targets from business impact, then measure the full process. A tiny local file drill is useful evidence for a procedure, not proof a production database meets the same targets.",
      "RPO est la perte de données temporelle maximale tolérée ; RTO est le délai maximal toléré pour rétablir le service requis. Une sauvegarde horaire ne garantit pas un RPO d’une heure si des tâches échouent sans alerte ou produisent des snapshots incohérents. La reprise inclut détection, accès aux identifiants/clés, provisionnement, restauration, validation et retour du trafic. Définissez les objectifs selon l’impact métier puis mesurez tout le processus. Un exercice sur petit fichier local étaye une procédure, pas les mêmes objectifs pour une base de production.",
    ),
    ...labContext("lab-backup-source"),
    note(
      "warn",
      l("Scope and storage prerequisites", "Portée et prérequis stockage"),
      l(
        "Use only synthetic orders and the disposable kind lab. Inspect standard: expect rancher.io/local-path, WaitForFirstConsumer and Delete reclaim policy. The same manifest creates independent PVCs in two namespaces; no live volume is overwritten. Local host tar, shasum and Bash are required; BusyBox provides tar/sha256sum inside the Pod. This is an application-file backup, not a database or CSI snapshot procedure.",
        "Utilisez uniquement des données de commandes commerciales fictives dans le lab kind jetable. Examinez standard : rancher.io/local-path, WaitForFirstConsumer et reclaim policy Delete sont attendus. Le même manifest crée des PVC indépendants dans deux namespaces ; aucun volume actif n’est écrasé. L’hôte doit disposer de tar, shasum et Bash ; BusyBox fournit tar/sha256sum dans le Pod. Il s’agit d’une sauvegarde de fichier applicatif, pas d’une procédure de snapshot CSI ou de base de données.",
      ),
    ),
    h("source", "Create a small consistent source", "Créer une petite source cohérente"),
    code("yaml", data, "lab/level-3/backup-dr/data.yaml"),
    code(
      "bash",
      "k get storageclass standard -o yaml\nk -n lab-backup-source apply -f lab/level-3/backup-dr/data.yaml\nk -n lab-backup-source wait --for=condition=Ready pod/data --timeout=120s\nk -n lab-backup-source exec -i data -- sh -eu < lab/level-3/backup-dr/seed.sh\nk -n lab-backup-source exec -i data -- sh -eu < lab/level-3/backup-dr/verify.sh",
    ),
    p(
      "Expected: two orders totaling 30. The seed script refuses to overwrite an existing file. After seeding, there is no background writer: this explicit quiescence makes the single-file capture coherent. Do not generalize a tar of changing database files into a valid hot backup. Each sleep lasts two hours; the Pod's default restartPolicy: Always then restarts its container while preserving the PVC. If an exec meets that restart, wait for Ready and retry the interrupted check rather than reseeding or deleting storage.",
      "Attendu : deux commandes totalisant 30. Le script de seed refuse d’écraser un fichier existant. Après initialisation, aucun processus n’écrit en arrière-plan : cette suspension explicite rend cohérente la capture du fichier unique. Ne généralisez pas un tar de fichiers de base en cours de modification en sauvegarde à chaud valide. Chaque sleep dure deux heures ; restartPolicy: Always, valeur par défaut du Pod, redémarre ensuite le conteneur en conservant le PVC. Si un exec coïncide avec ce redémarrage, attendez Ready puis reprenez le contrôle interrompu sans réinitialiser les données ni supprimer le stockage.",
    ),
    h(
      "capture",
      "Capture bytes and a verification contract",
      "Capturer les octets et leur contrat de vérification",
    ),
    code(
      "bash",
      `umask 077\nbackup_dir=$(mktemp -d)\nbash lab/level-3/backup-dr/capture.sh "$backup_dir"\ncat "$backup_dir/captured-at.txt"\ntar -tf "$backup_dir/orders.tar"\nk -n lab-backup-source exec data -- sh -c 'printf "A003,25\\n" >> /data/orders.csv; sync'`,
    ),
    code("bash", capture, "lab/level-3/backup-dr/capture.sh"),
    p(
      "The script uses a partial filename until capture succeeds, checks the frozen source checksum, then records archive integrity. The last command adds a third order after the recovery point: recovering this backup should lose that later write intentionally. Keep backup_dir in the same shell. The private local directory is outside Git, but still shares the host's failure domain. Real backups need encrypted independent storage, retention/immutability, separate deletion permissions and tested key access. A checksum detects corruption; it is not an authenticity guarantee if an attacker can replace both archive and checksum.",
      "Le script utilise un nom partiel jusqu’à réussite, vérifie le checksum de la source figée puis enregistre l’intégrité de l’archive. La dernière commande ajoute une troisième commande après le point de reprise : restaurer cette sauvegarde doit volontairement perdre cette écriture ultérieure. Gardez backup_dir dans le même shell. Le répertoire local privé est hors de Git mais partage encore le domaine de panne de l’hôte. De vraies sauvegardes exigent stockage indépendant chiffré, rétention/immutabilité, droits de suppression séparés et accès aux clés testé. Un checksum détecte une corruption ; il n’authentifie pas si l’attaquant peut remplacer archive et checksum.",
    ),
    h("restore", "Restore into an independent target", "Restaurer dans une cible indépendante"),
    code(
      "bash",
      'restore_started=$(date +%s)\nk create namespace lab-backup-restore\nk -n lab-backup-restore apply -f lab/level-3/backup-dr/data.yaml\nk -n lab-backup-restore wait --for=condition=Ready pod/data --timeout=120s\nbash lab/level-3/backup-dr/restore.sh "$backup_dir"\nk -n lab-backup-restore exec -i data -- sh -eu < lab/level-3/backup-dr/verify.sh\nprintf \'Restore drill duration: %s seconds\\n\' "$(($(date +%s) - restore_started))"\nk -n lab-backup-source get pvc data -o wide\nk -n lab-backup-restore get pvc data -o wide',
    ),
    code("bash", "k -n lab-backup-source exec data -- cat /data/orders.csv"),
    code("bash", restore, "lab/level-3/backup-dr/restore.sh"),
    code("bash", verify, "lab/level-3/backup-dr/verify.sh"),
    p(
      "Expected: distinct volume bindings, matching restored-file checksum, two orders totaling 30 in the target, and the original source still containing the third order. The restore script checks archive integrity before any target request and refuses an already populated target file. Functional verification is stronger than Pod Ready: it checks the application's data meaning. The measured duration covers this drill's provisioning/restore/verification interval, not detection or real traffic recovery; report that boundary instead of labeling it a complete production RTO.",
      "Attendu : volumes liés distincts, checksum du fichier restauré identique, deux commandes totalisant 30 dans la cible et troisième commande toujours présente dans la source. Le script vérifie l’archive avant toute requête cible et refuse un fichier cible déjà présent. La vérification fonctionnelle dépasse Pod Ready : elle contrôle le sens des données. La durée mesurée couvre provisionnement/restauration/vérification de cet exercice, pas détection ni retour du vrai trafic ; indiquez cette limite au lieu d’en faire un RTO de production complet.",
    ),
    h("diagnosis", "Separate recovery failures", "Séparer les échecs de reprise"),
    p(
      "A Pending PVC needs class/provisioner/topology evidence, not a retry of tar. Permission denied needs mount ownership inspection, not disabling non-root globally. A missing tar utility means the chosen transfer method is unsupported. A checksum failure stops recovery before accepting data; investigate corruption or the wrong backup point. Correct bytes with a failed business query indicate the wrong consistency point or incompatible application/schema. API-object recovery must separately account for CRDs, version compatibility, RBAC, DNS, certificates, Secrets and encryption keys. Do not dump real Secrets into Git or logs to make a manifest export look complete.",
      "Un PVC Pending exige des preuves sur classe/provisioner/topologie, pas une relance de tar. Permission denied exige d’examiner le propriétaire du montage, pas de retirer non-root partout. L’absence de tar signifie que le transfert choisi n’est pas compatible. Un échec de checksum arrête la reprise avant acceptation ; cherchez corruption ou mauvais point de sauvegarde. Des octets corrects avec requête métier en échec indiquent incohérence ou incompatibilité application/schéma. La reprise des objets API doit traiter séparément CRD, versions, RBAC, DNS, certificats, Secrets et clés de chiffrement. Ne versez pas de vrais Secrets dans Git ou les logs pour rendre un export de manifests apparemment complet.",
    ),
    h("quiz", "Define the recovery boundary", "Définir la frontière de reprise"),
    quiz(
      question(
        l(
          "Does exporting a PVC object preserve its file contents?",
          "Exporter l’objet PVC conserve-t-il ses fichiers ?",
        ),
        [
          l("Yes, storage bytes are in YAML", "Oui, les octets sont dans le YAML"),
          l(
            "No, object metadata and volume data are separate assets",
            "Non, métadonnées et données du volume sont distinctes",
          ),
          l("Only when the claim is Bound", "Seulement si le claim est Bound"),
        ],
        1,
        l(
          "A claim requests storage; its API representation is not an archive of the storage backend.",
          "Un claim demande du stockage ; sa représentation API n’archive pas le backend.",
        ),
      ),
      question(
        l(
          "Why should the third order be absent after this restore?",
          "Pourquoi la troisième commande doit-elle être absente après restauration ?",
        ),
        [
          l(
            "It was written after the selected recovery point",
            "Elle a été écrite après le point de reprise choisi",
          ),
          l("RWO removes the newest row", "RWO retire la dernière ligne"),
          l(
            "tar automatically replicates later writes",
            "tar réplique automatiquement les écritures ultérieures",
          ),
        ],
        0,
        l(
          "The missing later write demonstrates data-loss exposure; a successful restore does not promise zero RPO.",
          "L’écriture ultérieure absente démontre l’exposition à la perte ; une restauration réussie ne promet pas un RPO nul.",
        ),
      ),
      question(
        l(
          "What does a successful checksum fail to prove?",
          "Que ne prouve pas un checksum réussi ?",
        ),
        [
          l(
            "That the bytes match the recorded digest",
            "Que les octets correspondent au digest enregistré",
          ),
          l("That the file can be read", "Que le fichier est lisible"),
          l(
            "Application consistency and recovery of every dependency",
            "Cohérence applicative et reprise de toutes les dépendances",
          ),
        ],
        2,
        l(
          "Integrity is one acceptance criterion; business queries and dependency recovery are additional tests.",
          "L’intégrité est un critère ; requêtes métier et reprise des dépendances sont des tests supplémentaires.",
        ),
      ),
    ),
    challenge(
      l(
        "Detect a corrupted copy before touching the target",
        "Détecter une copie corrompue avant de toucher la cible",
      ),
      l(
        "Make a disposable copy of the archive bundle, append corruption only to that copy and prove restore.sh fails on integrity before attempting a target write. Keep the original backup intact.",
        "Copiez le jeu de sauvegarde dans un répertoire jetable, ajoutez une corruption uniquement à la copie et prouvez que restore.sh échoue sur l’intégrité avant toute écriture cible. Préservez l’original.",
      ),
      [
        l(
          "The checksum file expects the basename orders.tar; copy the complete bundle.",
          "Le fichier de checksum attend le nom orders.tar ; copiez le jeu complet.",
        ),
        l(
          "Integrity checking is the first action after local path checks in restore.sh.",
          "La vérification d’intégrité précède tout accès cible dans restore.sh.",
        ),
      ],
      [
        code(
          "bash",
          'corrupt_dir=$(mktemp -d)\ncp "$backup_dir/orders.tar" "$backup_dir/orders.tar.sha256" "$backup_dir/orders.sha256" "$corrupt_dir/"\nprintf "corruption\\n" >> "$corrupt_dir/orders.tar"\nbash lab/level-3/backup-dr/restore.sh "$corrupt_dir"',
        ),
        p(
          "Expected: checksum mismatch and nonzero exit before any kubectl call. Do not regenerate the checksum to hide the failure. This tests the local rejection path only; it does not simulate ransomware resistance, malicious archive authenticity or remote storage recovery.",
          "Attendu : checksum incorrect et sortie non nulle avant tout appel kubectl. Ne régénérez pas le checksum pour masquer l’échec. Cela teste seulement le refus local, pas la résistance aux rançongiciels, l’authenticité d’une archive hostile ni la reprise d’un stockage distant.",
        ),
      ],
    ),
    h("cleanup", "Delete only disposable copies", "Supprimer seulement les copies jetables"),
    code(
      "bash",
      'k delete namespace lab-backup-source lab-backup-restore\nprintf "Backup directories to inspect and remove manually: %s %s\\n" "$backup_dir" "${corrupt_dir:-not-created}"',
    ),
    p(
      "Namespace deletion destroys these lab PVCs and, with the inspected Delete policy, their local backing data. Inspect the printed private host directories and remove them manually after acceptance; the commands do not delete an arbitrary variable-expanded path. A production recovery plan must retain its independent backup copies and the evidence of the restore test.",
      "Supprimer les namespaces détruit les PVC du lab et, avec la politique Delete examinée, leurs données locales. Examinez les répertoires privés affichés puis supprimez-les manuellement après validation ; ces commandes n’effacent pas un chemin arbitraire construit depuis une variable. Un plan réel doit conserver ses copies indépendantes et les preuves du test de restauration.",
    ),
  ],
};
