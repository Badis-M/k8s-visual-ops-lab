import type { Chapter } from "../types";
import { l, h, p, code, note, list, quiz, question, challenge } from "../lesson-kit";
import recovery from "../../../lab/level-4/etcd/isolated-recovery.sh?raw";
import transaction from "../../../lab/level-4/etcd/compare.txt?raw";

export const etcd: Chapter = {
  id: "etcd",
  level: 4,
  minutes: 60,
  title: l(
    "etcd architecture, consistency and recovery",
    "etcd : architecture, cohérence et reprise",
  ),
  summary: l(
    "Reason about quorum, revisions and watches, then restore a synthetic isolated etcd store without touching Kubernetes control-plane data.",
    "Raisonner sur quorum, révisions et watches puis restaurer un etcd synthétique isolé sans toucher aux données du control plane Kubernetes.",
  ),
  prerequisites: ["api-architecture", "backup-dr"],
  related: ["ha", "control-plane-scale", "failure-scenarios"],
  blocks: [
    h(
      "objectives",
      "Separate durability, consistency and availability",
      "Séparer durabilité, cohérence et disponibilité",
    ),
    list(
      l(
        "Compute majority requirements and explain why adding members does not simply multiply write throughput.",
        "Calculer la majorité et expliquer pourquoi ajouter des membres ne multiplie pas simplement le débit d’écriture.",
      ),
      l(
        "Restore an actual snapshot to a different member/data directory and explain the revision-bump requirement for watch consumers.",
        "Restaurer un vrai snapshot vers un autre membre/répertoire et expliquer le besoin d’augmentation de révision pour les consommateurs de watches.",
      ),
    ),
    h(
      "mental-model",
      "An ordered replicated state machine",
      "Une machine à états répliquée ordonnée",
    ),
    p(
      "etcd stores Kubernetes API state behind the API server; application clients normally use Kubernetes APIs rather than writing etcd directly. Raft replicates an ordered log through a leader and requires a majority to commit. Three members tolerate one failed member; five tolerate two. A two-member cluster still needs both and adds no single-failure tolerance over one. Disk latency, leader communication and request load shape write latency. Spreading members across failure domains helps resilience, but excessive network delay can harm the same quorum path.",
      "etcd stocke l’état API derrière le serveur API ; les applications utilisent normalement les API Kubernetes au lieu d’écrire directement dans etcd. Raft réplique un journal ordonné via un leader et exige une majorité pour valider. Trois membres tolèrent une perte, cinq en tolèrent deux. Deux membres exigent encore les deux et n’ajoutent aucune tolérance à une panne simple par rapport à un seul. Latence disque, communication avec le leader et charge déterminent la latence d’écriture. Séparer les domaines de panne aide la résilience mais trop de délai réseau dégrade ce même quorum.",
    ),
    p(
      "A linearizable read provides the current committed view under etcd's consistency guarantees; a serializable read can be served locally with a stale view. MVCC revisions identify store changes, while each key also has creation/modification revisions and a version count. Watches follow changes from a revision; compaction discards old history without being a business-data backup. A client requesting compacted history must relist and resume. Leases expire attached keys and support coordination, but an expired lease alone does not physically stop an old process: external side effects still require fencing.",
      "Une lecture linéarisable fournit la vue courante validée selon les garanties d’etcd ; une lecture sérialisable peut être locale et obsolète. Les révisions MVCC identifient les modifications du magasin ; chaque clé possède aussi révisions de création/modification et nombre de versions. Les watches suivent les changements depuis une révision ; la compaction retire l’historique ancien sans constituer une sauvegarde métier. Un client demandant cet historique doit relister puis reprendre. Les leases expirent les clés associées et aident la coordination, mais leur expiration n’arrête pas physiquement un ancien processus : les effets externes exigent encore du fencing.",
    ),
    h(
      "lab-preparation",
      "A separate store with no Kubernetes connection",
      "Un magasin distinct sans connexion Kubernetes",
    ),
    note(
      "warn",
      l("Only synthetic isolated etcd", "Uniquement un etcd synthétique isolé"),
      l(
        "The learner needs a verified local Docker daemon, Bash, Python 3 and registry access for quay.io/coreos/etcd:v3.6.5. No container is started by the implementation agent. The supplied script refuses existing lab container/volume names, publishes no ports and uses --network none, never host paths, kubeconfigs or /var/lib/etcd. Its HTTP endpoints exist only on each isolated container's loopback; production etcd requires authenticated TLS and access isolation. This example is not a Kubernetes cluster-recovery runbook.",
        "L’apprenant doit disposer d’un Docker local vérifié, Bash, Python 3 et de l’accès à quay.io/coreos/etcd:v3.6.5. L’agent ne démarre aucun conteneur. Le script refuse les noms de conteneurs/volumes existants, ne publie aucun port et utilise --network none, jamais chemins hôte, kubeconfigs ou /var/lib/etcd. Les endpoints HTTP n’existent que sur la boucle locale des conteneurs isolés ; etcd en production exige TLS authentifié et accès isolé. Cet exemple n’est pas une procédure de reprise d’un cluster Kubernetes.",
      ),
    ),
    code(
      "bash",
      'docker context ls\netcd_docker_context=desktop-linux\ndocker --context "$etcd_docker_context" info --format \'{{.Name}}\'\nbash lab/level-4/etcd/isolated-recovery.sh "$etcd_docker_context"',
    ),
    p(
      "desktop-linux is a common Docker Desktop context name, not a universal value. Before running the last command, replace it with your inspected local context if needed. The script creates two tiny independent single-member stores, three named volumes and one snapshot; keep enough local disk/memory for the Docker engine. It is designed to demonstrate persistence and recovery, not majority failover or physical HA.",
      "desktop-linux est un nom courant de Docker Desktop, pas une valeur universelle. Avant la dernière commande, remplacez-le si besoin par votre contexte local examiné. Le script crée deux petits magasins indépendants à un membre, trois volumes nommés et un snapshot ; prévoyez disque/mémoire pour Docker. Il démontre persistance et restauration, pas bascule de majorité ni HA physique.",
    ),
    h(
      "recovery",
      "Read the recovery procedure before running it",
      "Lire la restauration avant exécution",
    ),
    code("bash", recovery, "lab/level-4/etcd/isolated-recovery.sh"),
    p(
      "After collision checks, the script prints a private Ownership marker path and labels created Docker objects with its random run ID. Preserve that exact file, including after partial failure. Cleanup requires the marker and matching labels; a preflight refusal creates no marker and gives no authority to delete pre-existing objects. No automatic cleanup runs on error.",
      "Après contrôle des collisions, le script affiche un chemin Ownership marker privé et étiquette les objets Docker créés avec son identifiant aléatoire de run. Gardez ce fichier exact, y compris après échec partiel. Le nettoyage exige preuve et labels concordants ; un refus de préflight ne crée aucune preuve et n’autorise pas à retirer des objets préexistants. Aucun nettoyage automatique n’est exécuté à l’échec.",
    ),
    p(
      "The source writes blue, etcdctl saves a snapshot, then the source changes to green. etcdutl inspects and restores the snapshot into a new member/data directory with a new cluster token. Expected: the source remains green and the restored store reads blue. That loss of the later write is the selected recovery point, not a restoration bug. Never restore over a live member's data directory and never use force-new-cluster as a casual repair while previous members may still be active.",
      "La source écrit blue, etcdctl sauvegarde le snapshot puis la source passe à green. etcdutl examine et restaure le snapshot dans un nouveau membre/répertoire avec un nouveau token de cluster. Attendu : la source reste green et le magasin restauré lit blue. Perdre l’écriture ultérieure correspond au point de reprise choisi, pas à un défaut de restauration. Ne restaurez jamais sur le répertoire d’un membre actif et n’utilisez pas force-new-cluster comme réparation improvisée si d’anciens membres peuvent encore être actifs.",
    ),
    p(
      "The snapshot hash is checked during restore. --bump-revision and --mark-compacted address a distinct hazard: restored revisions can otherwise move backwards relative to informer/watch clients. Bumping beyond observed historical revisions and marking history compacted forces consumers to rebuild caches rather than trust a stale future. The billion-revision bump is an explicit teaching margin, not a universal sizing rule. In real Kubernetes recovery, derive it from the write rate and snapshot age and follow the distribution's version-specific restoration procedure.",
      "Le hash du snapshot est vérifié à la restauration. --bump-revision et --mark-compacted traitent un autre risque : les révisions restaurées pourraient reculer face aux clients informer/watch. Dépasser les anciennes révisions observées et marquer l’historique compacté force les clients à reconstruire leur cache plutôt qu’à croire un futur périmé. Le milliard ajouté est une marge pédagogique explicite, pas une règle universelle. Pour Kubernetes réel, dimensionnez-le selon débit d’écriture et âge du snapshot, puis suivez la procédure de votre distribution et version.",
    ),
    h(
      "diagnosis",
      "Observe the store before blaming the API server",
      "Observer le magasin avant d’accuser le serveur API",
    ),
    code(
      "bash",
      'docker --context "$etcd_docker_context" exec lab-etcd-source /usr/local/bin/etcdctl endpoint health\ndocker --context "$etcd_docker_context" exec lab-etcd-source /usr/local/bin/etcdctl endpoint status --write-out=table\ndocker --context "$etcd_docker_context" logs lab-etcd-source',
    ),
    p(
      "Health and a current leader do not exclude intermittent disk stalls. In real operations correlate leader changes, peer round-trip latency, WAL fsync/backend commit latency, database size/quota alarms and API-server storage latency. Compaction removes old revisions; defragmentation reclaims backend space and has its own operational cost. Do not delete database files to clear a quota alarm. etcd snapshots contain sensitive API state, potentially including Secrets: encrypt, restrict access and test recovery keys. The snapshot does not contain external PVC file bytes.",
      "Un endpoint sain et un leader courant n’excluent pas des blocages disque intermittents. En exploitation, corrélez changements de leader, latence des pairs, fsync du WAL/commit backend, taille/quota et latence stockage du serveur API. La compaction retire les anciennes révisions ; la défragmentation récupère de l’espace avec son coût opérationnel. Ne supprimez pas les fichiers de base pour lever un quota. Les snapshots contiennent de l’état API sensible, dont potentiellement des Secrets : chiffrez, limitez l’accès et testez les clés de reprise. Ils ne contiennent pas les fichiers des PVC externes.",
    ),
    h("quiz", "State the consistency guarantee", "Exprimer la garantie de cohérence"),
    quiz(
      question(
        l(
          "How many failures can a healthy three-member Raft cluster tolerate while committing writes?",
          "Combien de pertes un cluster Raft sain à trois membres tolère-t-il en validant des écritures ?",
        ),
        [l("Two", "Deux"), l("One", "Une"), l("Three", "Trois")],
        1,
        l(
          "A majority of two must remain mutually reachable; counting running processes alone is insufficient.",
          "Une majorité de deux doit rester joignable mutuellement ; compter les processus actifs ne suffit pas.",
        ),
      ),
      question(
        l(
          "Does compaction create a usable disaster backup?",
          "La compaction crée-t-elle une sauvegarde de reprise ?",
        ),
        [
          l("No, it removes old history", "Non, elle retire l’historique ancien"),
          l("Yes, it exports every volume", "Oui, elle exporte chaque volume"),
          l("Only on the leader", "Seulement sur le leader"),
        ],
        0,
        l(
          "A snapshot with an independently tested restore is a different operation and recovery asset.",
          "Un snapshot et sa restauration testée sont une opération et un actif de reprise distincts.",
        ),
      ),
      question(
        l(
          "Why mark a revision bump compacted?",
          "Pourquoi marquer compactée l’augmentation de révision ?",
        ),
        [
          l("To replicate all PVCs", "Pour répliquer tous les PVC"),
          l("To make TLS optional in production", "Pour rendre TLS optionnel en production"),
          l(
            "To invalidate watch/informer histories after rollback",
            "Pour invalider les historiques watch/informer après retour arrière",
          ),
        ],
        2,
        l(
          "Consumers must relist instead of relying on revisions from the abandoned future.",
          "Les consommateurs doivent relister au lieu de conserver des révisions du futur abandonné.",
        ),
      ),
    ),
    challenge(
      l(
        "Compare and swap without a read/write race",
        "Comparer et écrire sans course lecture/écriture",
      ),
      l(
        "On the synthetic source, atomically replace green with approved only if it is still green. Run the transaction twice and explain why the second takes the failure branch. Do not touch the restored store.",
        "Sur la source synthétique, remplacez atomiquement green par approved seulement si la valeur reste green. Exécutez deux fois la transaction et expliquez la branche d’échec de la seconde. Ne touchez pas au magasin restauré.",
      ),
      [
        l(
          "A client-side get followed by put permits a concurrent change between them.",
          "Un get puis put côté client permet une modification concurrente entre les deux.",
        ),
        l(
          "etcdctl txn reads comparisons, success operations and failure operations from stdin.",
          "etcdctl txn lit comparaisons, actions de réussite et actions d’échec depuis stdin.",
        ),
      ],
      [
        code("text", transaction, "lab/level-4/etcd/compare.txt"),
        code(
          "bash",
          'docker --context "$etcd_docker_context" exec -i lab-etcd-source /usr/local/bin/etcdctl txn < lab/level-4/etcd/compare.txt\ndocker --context "$etcd_docker_context" exec -i lab-etcd-source /usr/local/bin/etcdctl txn < lab/level-4/etcd/compare.txt',
        ),
        p(
          "Expected: the first comparison succeeds and writes approved; the second comparison fails and returns the current value. This demonstrates atomic comparison semantics, not a benchmark or proof of multi-member failover.",
          "Attendu : la première comparaison réussit et écrit approved ; la seconde échoue et retourne la valeur courante. Cela démontre la comparaison atomique, pas un benchmark ni une bascule multi-membre.",
        ),
      ],
    ),
    h("cleanup", "Destroy only the isolated stores", "Détruire seulement les magasins isolés"),
    code(
      "bash",
      'printf "Paste the exact Ownership marker path printed by isolated-recovery.sh: "\nIFS= read -r LAB_ETCD_OWNERSHIP_MARKER\npython3 -m unittest discover -s lab/level-4/etcd -p \'test_*.py\'\nbash lab/level-4/etcd/cleanup.sh "$LAB_ETCD_OWNERSHIP_MARKER"',
    ),
    p(
      "The guard checks all candidates before deletion, removes containers by immutable ID and rechecks volume labels before removing their names. Docker volumes have no UID-conditional delete API: keep this disposable daemon free of concurrent administrative changes during cleanup. After verification, manually remove only the marker's printed temporary directory. No Kubernetes namespace, static Pod, control-plane endpoint or real etcd directory was modified. Preserve actual recovery evidence separately before deleting this disposable data.",
      "Le garde vérifie tous les candidats avant suppression, retire les conteneurs par ID immuable puis revérifie les labels des volumes avant suppression par nom. Docker n’a pas de DELETE conditionné par UID pour les volumes : évitez les modifications administratives concurrentes sur ce daemon jetable pendant le nettoyage. Après vérification, retirez manuellement uniquement le dossier temporaire affiché de la preuve. Aucun namespace, Pod statique, endpoint du control plane ni vrai répertoire etcd n’a été modifié. Conservez séparément les preuves de reprise avant de supprimer ces données jetables.",
    ),
  ],
};
