import { foundationLab } from "../foundation-lab";
import { h, code } from "../lesson-kit";
import type { Chapter } from "../types";

export const pods: Chapter = {
  id: "pods",
  level: 1,
  minutes: 50,
  title: { en: "Pods: the smallest deployable unit", fr: "Pods : la plus petite unité déployable" },
  summary: {
    en: "What a Pod really is, its YAML anatomy, lifecycle phases and container states, and how to debug one that won't start.",
    fr: "Ce qu'est vraiment un Pod, l'anatomie de son YAML, ses phases et états de conteneur, et comment déboguer un Pod qui ne démarre pas.",
  },
  prerequisites: ["setup-kind", "architecture"],
  related: ["deployments", "reconciliation"],
  blocks: [
    {
      type: "h2",
      id: "what-is-a-pod",
      text: { en: "What is a Pod?", fr: "Qu'est-ce qu'un Pod ?" },
    },
    {
      type: "p",
      text: {
        en: "Kubernetes does not schedule containers directly; it schedules Pods. A Pod is a group of one or more containers that are always placed on the same node and share a network namespace (one IP address, one `localhost`, one port space) and, optionally, volumes. Most Pods have a single application container; extra containers are helpers that must live next to it (log shippers, proxies).",
        fr: "Kubernetes n'ordonnance pas directement des conteneurs, mais des Pods. Un Pod est un groupe d'un ou plusieurs conteneurs toujours placés sur le même nœud, partageant un namespace réseau (une IP, un `localhost`, un espace de ports) et éventuellement des volumes. La plupart des Pods ont un seul conteneur applicatif ; les conteneurs additionnels sont des assistants qui doivent vivre à côté (envoi de logs, proxys).",
      },
    },
    {
      type: "p",
      text: {
        en: "Pods are ephemeral and disposable. They are never “moved” or “repaired”: when a managed Pod must be replaced after node loss or deletion, its controller can create a brand-new Pod with a new UID; a StatefulSet may reuse the name and the network may reuse an IP. That is why you rarely create bare Pods in practice — you create Deployments that create Pods for you. But understanding the Pod itself is essential for debugging.",
        fr: "Les Pods sont éphémères et jetables. On ne les « déplace » ni ne les « répare » jamais : lorsqu’un Pod géré doit être remplacé après perte de nœud ou suppression, son contrôleur peut créer un tout nouveau Pod avec un nouvel UID ; un StatefulSet peut réutiliser le nom et le réseau peut réattribuer une IP. C'est pourquoi on crée rarement des Pods nus en pratique — on crée des Deployments qui les créent. Mais comprendre le Pod lui-même est indispensable pour déboguer.",
      },
    },
    {
      type: "h2",
      id: "anatomy",
      text: { en: "Anatomy of a Pod manifest", fr: "Anatomie d'un manifeste de Pod" },
    },
    {
      type: "code",
      lang: "yaml",
      title: "pod.yaml",
      code: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: hello\n  labels:\n    app: hello\nspec:\n  containers:\n    - name: web\n      image: nginx:1.27\n      ports:\n        - containerPort: 80\n      env:\n        - name: GREETING\n          value: "bonjour"\n      resources:\n        requests:\n          cpu: 50m\n          memory: 64Mi\n        limits:\n          memory: 128Mi\n  restartPolicy: Always',
    },
    {
      type: "fields",
      rows: [
        {
          field: "apiVersion / kind",
          text: {
            en: "Which API group/version and type this object belongs to. Pods are in the core group, hence just `v1`.",
            fr: "Le groupe/version d'API et le type de l'objet. Les Pods sont dans le groupe core, d'où simplement `v1`.",
          },
        },
        {
          field: "metadata.name",
          text: {
            en: "Unique within the namespace. Pods created by controllers get generated names.",
            fr: "Unique dans le namespace. Les Pods créés par des contrôleurs reçoivent des noms générés.",
          },
        },
        {
          field: "metadata.labels",
          text: {
            en: "Key/value tags. Services and ReplicaSets select Pods by label, never by name.",
            fr: "Étiquettes clé/valeur. Services et ReplicaSets sélectionnent les Pods par label, jamais par nom.",
          },
        },
        {
          field: "spec.containers[].image",
          text: {
            en: "The image to run. Always pin a tag (avoid `latest`) for a deliberate version; only an image digest fixes immutable content.",
            fr: "L'image à exécuter. Fixez toujours un tag (évitez `latest`) pour choisir une version ; seul un digest fixe un contenu immuable.",
          },
        },
        {
          field: "ports[].containerPort",
          text: {
            en: "Informational: documents which port the process listens on. It does not open or publish anything by itself.",
            fr: "Informatif : documente le port d'écoute du processus. Il n'ouvre ni ne publie rien par lui-même.",
          },
        },
        {
          field: "env",
          text: {
            en: "Environment variables injected into the process. Later you'll source them from ConfigMaps and Secrets.",
            fr: "Variables d'environnement injectées dans le processus. Plus tard, elles viendront de ConfigMaps et de Secrets.",
          },
        },
        {
          field: "resources.requests",
          text: {
            en: "What the scheduler reserves on a node. `50m` = 0.05 CPU core.",
            fr: "Ce que le scheduler réserve sur un nœud. `50m` = 0,05 cœur CPU.",
          },
        },
        {
          field: "resources.limits",
          text: {
            en: "CPU limits normally throttle CPU time. Memory enforcement is reactive: when the kernel cannot reclaim enough memory within the limit, it can OOM-kill a process. Inspect termination details rather than inferring the cause from an exit code alone.",
            fr: "Une limite CPU réduit normalement le temps CPU disponible par throttling. La mémoire est régulée de façon réactive : si le noyau ne peut pas en récupérer assez dans la limite, il peut tuer un processus par OOM. Examinez la terminaison sans déduire sa cause du seul code de sortie.",
          },
        },
        {
          field: "restartPolicy",
          text: {
            en: "`Always` (default), `OnFailure` or `Never`: what the kubelet does when a container exits. It restarts containers in place; it never recreates the Pod.",
            fr: "`Always` (défaut), `OnFailure` ou `Never` : ce que fait le kubelet quand un conteneur s'arrête. Il redémarre les conteneurs sur place ; il ne recrée jamais le Pod.",
          },
        },
      ],
    },
    {
      type: "h2",
      id: "lifecycle",
      text: {
        en: "Lifecycle: phases and container states",
        fr: "Cycle de vie : phases et états des conteneurs",
      },
    },
    {
      type: "p",
      text: {
        en: "A Pod has a high-level `status.phase`, and each container has its own state. Most debugging happens at the container level, where the `reason` field tells you what went wrong.",
        fr: "Un Pod a une phase globale `status.phase`, et chaque conteneur a son propre état. L'essentiel du débogage se fait au niveau du conteneur, où le champ `reason` indique le problème.",
      },
    },
    { type: "diagram", name: "pod-lifecycle" },
    {
      type: "table",
      head: [
        { en: "You see", fr: "Vous voyez" },
        { en: "It usually means", fr: "Cela signifie souvent" },
        { en: "Look at", fr: "Regardez" },
      ],
      rows: [
        [
          { en: "Pending", fr: "Pending" },
          {
            en: "Not scheduled yet (no node fits) or images still pulling",
            fr: "Pas encore planifié (aucun nœud ne convient) ou images en téléchargement",
          },
          { en: "`kubectl describe pod` → Events", fr: "`kubectl describe pod` → Events" },
        ],
        [
          { en: "ErrImagePull / ImagePullBackOff", fr: "ErrImagePull / ImagePullBackOff" },
          {
            en: "Wrong image name/tag, private registry, or (kind) image not loaded",
            fr: "Nom/tag d'image faux, registre privé, ou (kind) image non chargée",
          },
          { en: "Events, the `image:` field", fr: "Events, le champ `image:`" },
        ],
        [
          { en: "CrashLoopBackOff", fr: "CrashLoopBackOff" },
          {
            en: "The process starts then exits repeatedly; kubelet backs off between restarts",
            fr: "Le processus démarre puis s'arrête en boucle ; le kubelet espace les redémarrages",
          },
          { en: "`kubectl logs --previous`", fr: "`kubectl logs --previous`" },
        ],
        [
          { en: "OOMKilled", fr: "OOMKilled" },
          {
            en: "The kernel killed a process for memory exhaustion; inspect the container limit and node memory pressure",
            fr: "Le noyau a tué un processus par manque de mémoire ; inspectez la limite du conteneur et la pression mémoire du nœud",
          },
          { en: "`lastState.terminated.reason`", fr: "`lastState.terminated.reason`" },
        ],
      ],
    },
    ...foundationLab("lab-pods"),
    {
      type: "h2",
      id: "lab",
      text: {
        en: "Lab: create, inspect, break and fix a Pod",
        fr: "Lab : créer, inspecter, casser et réparer un Pod",
      },
    },
    {
      type: "steps",
      steps: [
        {
          title: { en: "Create the Pod", fr: "Créer le Pod" },
          code: {
            lang: "bash",
            code: "k apply -f pod.yaml\nk wait --for=condition=Ready pod/hello --timeout=120s\nk get pod hello -o wide",
          },
          explain: {
            en: "Save the manifest above as `pod.yaml`. `-o wide` shows the Pod IP and the node it was scheduled on.",
            fr: "Enregistrez le manifeste ci-dessus sous `pod.yaml`. `-o wide` affiche l'IP du Pod et le nœud choisi.",
          },
          expected: {
            text: {
              en: "`hello` is `1/1 Running` with an IP like 10.244.0.x.",
              fr: "`hello` est `1/1 Running` avec une IP de type 10.244.0.x.",
            },
          },
        },
        {
          title: { en: "Inspect it", fr: "L'inspecter" },
          code: {
            lang: "bash",
            code: "k describe pod hello\nk logs hello\nk exec -it hello -- sh -c 'echo $GREETING; hostname'",
          },
          explain: {
            en: "`describe` is a human summary including Events — your first debugging reflex. `logs` prints stdout/stderr of the container. `exec` runs a command inside it; `--` separates kubectl flags from the command.",
            fr: "`describe` donne un résumé lisible avec les Events — votre premier réflexe de débogage. `logs` affiche stdout/stderr du conteneur. `exec` exécute une commande dedans ; `--` sépare les options kubectl de la commande.",
          },
          expected: {
            text: {
              en: "`bonjour` and the hostname `hello`.",
              fr: "`bonjour` et le hostname `hello`.",
            },
          },
        },
        {
          title: { en: "Reach it without a Service", fr: "L'atteindre sans Service" },
          code: {
            lang: "bash",
            code: "k port-forward pod/hello 8081:80\n# in another terminal\ncurl -s localhost:8081 | grep title",
          },
          explain: {
            en: "`port-forward` tunnels a local port to the Pod through the API server. Great for debugging; not a way to expose apps (that's Services). After the curl check in the second terminal, stop the foreground tunnel with Ctrl+C in the first terminal before continuing.",
            fr: "`port-forward` crée un tunnel d'un port local vers le Pod via l'API server. Idéal pour déboguer ; pas pour exposer une app (c'est le rôle des Services). Après curl dans le second terminal, arrêtez le tunnel avec Ctrl+C dans le premier avant de poursuivre.",
          },
          expected: {
            text: {
              en: "`<title>Welcome to nginx!</title>`",
              fr: "`<title>Welcome to nginx!</title>`",
            },
          },
        },
        {
          title: { en: "Break it: a bad image", fr: "Le casser : une mauvaise image" },
          code: {
            lang: "bash",
            code: "k run broken --image=nginx:does-not-exist\nk get pod broken\nk describe pod broken | tail -n 8",
          },
          explain: {
            en: "`kubectl run` creates a bare Pod quickly. Repeat get to observe the status move from ErrImagePull to ImagePullBackOff, and read the exact registry error in Events.",
            fr: "`kubectl run` crée rapidement un Pod nu. Répétez get pour observer le statut passer d'ErrImagePull à ImagePullBackOff, et lisez l'erreur exacte du registre dans les Events.",
          },
          expected: {
            text: {
              en: 'An event like `Failed to pull image "nginx:does-not-exist" … not found`.',
              fr: 'Un événement du type `Failed to pull image "nginx:does-not-exist" … not found`.',
            },
          },
        },
        {
          title: { en: "Break it: a crashing process", fr: "Le casser : un processus qui plante" },
          code: {
            lang: "bash",
            code: "k run crasher --image=busybox:1.36 -- sh -c 'echo starting; exit 1'\nsleep 30; k get pod crasher\nk logs crasher --previous",
          },
          explain: {
            en: "The container exits with code 1; `restartPolicy: Always` restarts it with exponential back-off (10s, 20s, 40s… up to 5 min). `--previous` shows logs of the last terminated instance.",
            fr: "Le conteneur sort avec le code 1 ; `restartPolicy: Always` le relance avec un délai exponentiel (10 s, 20 s, 40 s… jusqu'à 5 min). `--previous` montre les logs de la dernière instance terminée.",
          },
          expected: {
            text: {
              en: "`CrashLoopBackOff` with a RESTARTS count increasing, and `starting` in the logs.",
              fr: "`CrashLoopBackOff` avec un compteur RESTARTS croissant, et `starting` dans les logs.",
            },
          },
          mistake: {
            en: "Deleting and recreating the Pod hoping it fixes itself. Read the logs first: a crash loop is almost always an application or configuration error.",
            fr: "Supprimer et recréer le Pod en espérant que ça passe. Lisez d'abord les logs : une boucle de crash est presque toujours une erreur d'application ou de configuration.",
          },
        },
        {
          title: { en: "Clean up", fr: "Nettoyer" },
          code: { lang: "bash", code: "k delete pod hello broken crasher" },
          explain: {
            en: "Bare Pods are gone for good once deleted — nothing recreates them. Compare with the Deployments chapter.",
            fr: "Les Pods nus disparaissent définitivement une fois supprimés — rien ne les recrée. Comparez avec le chapitre Deployments.",
          },
        },
      ],
    },
    {
      type: "challenge",
      title: { en: "Two containers, one network", fr: "Deux conteneurs, un réseau" },
      task: {
        en: "Write a Pod named `duo` with two containers: `web` (nginx:1.27) and `probe` (busybox:1.36) running `sleep 3600`. From inside `probe`, fetch the nginx page using `localhost`. Explain why it works.",
        fr: "Écrivez un Pod `duo` avec deux conteneurs : `web` (nginx:1.27) et `probe` (busybox:1.36) qui exécute `sleep 3600`. Depuis `probe`, récupérez la page nginx via `localhost`. Expliquez pourquoi cela fonctionne.",
      },
      hints: [
        {
          en: 'Use `command: ["sleep", "3600"]` for the busybox container.',
          fr: 'Utilisez `command: ["sleep", "3600"]` pour le conteneur busybox.',
        },
        {
          en: "`kubectl exec duo -c probe -- …` picks the container.",
          fr: "`kubectl exec duo -c probe -- …` choisit le conteneur.",
        },
      ],
      solution: [
        {
          type: "code",
          lang: "yaml",
          title: "duo.yaml",
          code: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: duo\nspec:\n  containers:\n    - name: web\n      image: nginx:1.27\n    - name: probe\n      image: busybox:1.36\n      command: ["sleep", "3600"]',
        },
        {
          type: "code",
          lang: "bash",
          code: "k apply -f duo.yaml\nk wait --for=condition=Ready pod/duo --timeout=120s\nk exec duo -c probe -- wget -qO- localhost:80 | grep title\nk delete pod duo",
        },
        {
          type: "p",
          text: {
            en: "Both containers join the same network namespace, created by the Pod's sandbox (the “pause” container). They share one IP and one loopback interface, so `localhost:80` inside `probe` reaches nginx in `web`. This is exactly how sidecars such as service-mesh proxies work — and why two containers in one Pod cannot both listen on the same port.",
            fr: "Les deux conteneurs rejoignent le même namespace réseau, créé par le sandbox du Pod (le conteneur « pause »). Ils partagent une IP et une interface loopback, donc `localhost:80` dans `probe` atteint nginx dans `web`. C'est exactement ainsi que fonctionnent les sidecars comme les proxys de service mesh — et pourquoi deux conteneurs d'un même Pod ne peuvent pas écouter sur le même port.",
          },
        },
      ],
    },
    h("cleanup", "Finish this isolated exercise", "Terminer cet exercice isolé"),
    code("bash", "k delete namespace lab-pods"),
  ],
};
