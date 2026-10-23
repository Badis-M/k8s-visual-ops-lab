import type { Chapter } from "../types";

export const whyKubernetes: Chapter = {
  id: "why-kubernetes",
  level: 1,
  minutes: 35,
  title: { en: "Why Kubernetes exists", fr: "Pourquoi Kubernetes existe" },
  summary: {
    en: "From one container on a laptop to hundreds across machines: the problems orchestration solves, and how containers differ from virtual machines.",
    fr: "D'un conteneur sur un portable à des centaines sur plusieurs machines : les problèmes que résout l'orchestration, et la différence entre conteneurs et machines virtuelles.",
  },
  related: ["architecture", "reconciliation"],
  blocks: [
    {
      type: "h2",
      id: "the-problem",
      text: {
        en: "The problem: running software reliably",
        fr: "Le problème : faire tourner un logiciel de façon fiable",
      },
    },
    {
      type: "p",
      text: {
        en: "Imagine a small API written in Python. On your laptop you start it with one command and it answers requests. Now imagine that this API must serve real users: it must survive a crash at 3 a.m., run on several machines so one hardware failure does not take it down, be updated without downtime, and scale up on Monday morning when traffic triples.",
        fr: "Imaginez une petite API écrite en Python. Sur votre portable, une seule commande la démarre et elle répond. Imaginez maintenant qu'elle doive servir de vrais utilisateurs : survivre à un crash à 3 h du matin, tourner sur plusieurs machines pour qu'une panne matérielle ne l'arrête pas, être mise à jour sans interruption, et monter en charge le lundi matin quand le trafic triple.",
      },
    },
    {
      type: "p",
      text: {
        en: "Each of those requirements is a job someone has to do: restart crashed processes, decide which machine runs what, route traffic only to healthy copies, roll out new versions gradually. Historically this was done with scripts, runbooks and on-call engineers. Kubernetes automates these jobs.",
        fr: "Chacune de ces exigences est un travail à accomplir : redémarrer les processus plantés, décider quelle machine exécute quoi, router le trafic uniquement vers les copies saines, déployer les nouvelles versions progressivement. Historiquement, on le faisait avec des scripts, des procédures et des ingénieurs d'astreinte. Kubernetes automatise ces tâches.",
      },
    },
    {
      type: "h2",
      id: "vms-vs-containers",
      text: { en: "Virtual machines vs containers", fr: "Machines virtuelles vs conteneurs" },
    },
    {
      type: "p",
      text: {
        en: "Before orchestration, we need a unit of packaging. A virtual machine (VM) emulates a full computer: a hypervisor shares physical hardware between several VMs, and each VM boots its own complete operating system kernel. That gives strong isolation, but each VM costs hundreds of megabytes of RAM and takes tens of seconds to boot.",
        fr: "Avant l'orchestration, il faut une unité de packaging. Une machine virtuelle (VM) émule un ordinateur complet : un hyperviseur partage le matériel entre plusieurs VM, et chaque VM démarre son propre noyau de système d'exploitation. L'isolation est forte, mais chaque VM consomme des centaines de mégaoctets de RAM et met des dizaines de secondes à démarrer.",
      },
    },
    {
      type: "p",
      text: {
        en: "A container is not a small VM. It is an ordinary Linux process that the kernel isolates using namespaces (what the process can see: its own filesystem, process tree, network interfaces) and cgroups (what it can use: CPU, memory). All containers on a host share the same kernel. A container image bundles the application with its libraries, which reduces environment differences. OS/kernel, CPU architecture, configuration and storage still matter; startup time depends on the image and application.",
        fr: "Un conteneur n'est pas une petite VM. C'est un processus Linux ordinaire que le noyau isole grâce aux namespaces (ce que le processus voit : son propre système de fichiers, ses processus, ses interfaces réseau) et aux cgroups (ce qu'il peut consommer : CPU, mémoire). Tous les conteneurs d'un hôte partagent le même noyau. Une image de conteneur embarque l'application et ses bibliothèques, ce qui réduit les différences d’environnement. OS/noyau, architecture CPU, configuration et stockage restent déterminants ; le démarrage dépend de l’image et de l’application.",
      },
    },
    { type: "diagram", name: "vm-vs-container" },
    {
      type: "table",
      head: [
        { en: "", fr: "" },
        { en: "Virtual machine", fr: "Machine virtuelle" },
        { en: "Container", fr: "Conteneur" },
      ],
      rows: [
        [
          { en: "Isolation boundary", fr: "Frontière d'isolation" },
          { en: "Hypervisor, separate kernel", fr: "Hyperviseur, noyau séparé" },
          {
            en: "Kernel namespaces + cgroups, shared kernel",
            fr: "Namespaces + cgroups, noyau partagé",
          },
        ],
        [
          { en: "Startup", fr: "Démarrage" },
          { en: "Seconds to minutes", fr: "Secondes à minutes" },
          { en: "Milliseconds to seconds", fr: "Millisecondes à secondes" },
        ],
        [
          { en: "Typical size", fr: "Taille typique" },
          { en: "GBs (full OS)", fr: "Plusieurs Go (OS complet)" },
          { en: "MBs (app + libs)", fr: "Quelques Mo (app + libs)" },
        ],
        [
          { en: "Best for", fr: "Idéal pour" },
          {
            en: "Strong multi-tenant isolation, different OSes",
            fr: "Isolation forte multi-locataires, OS différents",
          },
          {
            en: "Packaging and running many app instances densely",
            fr: "Empaqueter et exécuter de nombreuses instances densément",
          },
        ],
      ],
    },
    {
      type: "callout",
      tone: "info",
      title: { en: "They are complementary", fr: "Ils sont complémentaires" },
      text: {
        en: "In practice Kubernetes nodes are very often VMs (in the cloud) that run many containers. On your machine, kind runs each Kubernetes node itself as a Docker container.",
        fr: "En pratique, les nœuds Kubernetes sont très souvent des VM (dans le cloud) qui exécutent de nombreux conteneurs. Sur votre machine, kind exécute chaque nœud Kubernetes lui-même comme un conteneur Docker.",
      },
    },
    {
      type: "h2",
      id: "docker-to-orchestration",
      text: { en: "From Docker to orchestration", fr: "De Docker à l'orchestration" },
    },
    {
      type: "p",
      text: {
        en: "Docker made it easy to build an image and run a container on one host: `docker run -p 8000:8000 my-api`. But `docker run` is an imperative, single-machine command. If the container dies, nothing brings it back (unless you add a restart policy). If the host dies, everything on it is gone. Docker alone has no notion of “keep three copies running across these five machines and send traffic only to healthy ones”.",
        fr: "Docker a rendu simple la construction d'une image et l'exécution d'un conteneur sur un hôte : `docker run -p 8000:8000 my-api`. Mais `docker run` est une commande impérative, sur une seule machine. Si le conteneur meurt, rien ne le relance (sauf politique de redémarrage). Si l'hôte tombe, tout ce qu'il exécute disparaît. Docker seul n'a pas la notion de « garder trois copies sur ces cinq machines et n'envoyer le trafic qu'aux copies saines ».",
      },
    },
    {
      type: "p",
      text: {
        en: "An orchestrator adds exactly that missing layer:",
        fr: "Un orchestrateur ajoute exactement cette couche manquante :",
      },
    },
    {
      type: "list",
      items: [
        {
          en: "Scheduling — choosing a node whose allocatable capacity can fit a Pod’s declared requests alongside existing reservations; this is not a live CPU-usage check.",
          fr: "Ordonnancement — choisir un nœud dont la capacité allocatable satisfait les requests déclarées du Pod avec les réservations existantes ; ce n’est pas une mesure de l’usage CPU instantané.",
        },
        {
          en: "Self-healing — restarting failed containers and replacing those lost with a dead machine.",
          fr: "Auto-réparation — redémarrer les conteneurs en échec et remplacer ceux perdus avec une machine.",
        },
        {
          en: "Service discovery and load balancing — a stable name and IP in front of changing copies.",
          fr: "Découverte de services et répartition de charge — un nom et une IP stables devant des copies qui changent.",
        },
        {
          en: "Rollouts and rollbacks — replacing versions gradually and undoing bad releases.",
          fr: "Déploiements et retours arrière — remplacer les versions progressivement et annuler une mauvaise release.",
        },
        {
          en: "Scaling — changing the number of copies, manually or automatically.",
          fr: "Mise à l'échelle — changer le nombre de copies, manuellement ou automatiquement.",
        },
        {
          en: "Configuration and secrets — injecting settings without rebuilding images.",
          fr: "Configuration et secrets — injecter des paramètres sans reconstruire les images.",
        },
      ],
    },
    {
      type: "h2",
      id: "what-kubernetes-is",
      text: { en: "So what is Kubernetes?", fr: "Alors, qu'est-ce que Kubernetes ?" },
    },
    {
      type: "p",
      text: {
        en: "Kubernetes is an open-source container orchestrator, originally designed at Google from lessons learned with its internal Borg system and donated to the CNCF in 2015. Its core idea is declarative: you describe the desired state (“I want 3 replicas of image k8s-ops-api:local, reachable on port 80”) as objects stored in an API, and a set of controllers work continuously to make the real world match that description.",
        fr: "Kubernetes est un orchestrateur de conteneurs open source, conçu à l'origine chez Google à partir de l'expérience de son système interne Borg, et confié à la CNCF en 2015. Son idée centrale est déclarative : vous décrivez l'état désiré (« je veux 3 réplicas de l'image k8s-ops-api:local, joignables sur le port 80 ») sous forme d'objets stockés dans une API, et des contrôleurs travaillent en continu pour que la réalité corresponde à cette description.",
      },
    },
    {
      type: "callout",
      tone: "warn",
      title: { en: "What Kubernetes is not", fr: "Ce que Kubernetes n'est pas" },
      text: {
        en: "It does not build your images, it is not a PaaS that deploys source code, and it does not make a badly designed application reliable on its own. It is a platform for building platforms — powerful, but with real operational complexity. For a single small app, a simpler host can be the right choice.",
        fr: "Il ne construit pas vos images, ce n'est pas un PaaS qui déploie du code source, et il ne rend pas fiable à lui seul une application mal conçue. C'est une plateforme pour construire des plateformes — puissante, mais avec une vraie complexité opérationnelle. Pour une seule petite application, un hébergement plus simple peut être le bon choix.",
      },
    },
    {
      type: "h2",
      id: "hands-on",
      text: {
        en: "Hands-on: feel the gap Docker leaves",
        fr: "Pratique : ressentir ce qui manque à Docker",
      },
    },
    {
      type: "p",
      text: {
        en: "This exercise only needs Docker. It demonstrates, on your own machine, the behaviours an orchestrator automates. If Docker is not installed yet, follow the setup chapter first and come back. Confirm that container names web and web-8084 through web-8086 are unused, and local ports are free. Never remove an existing personal container to run this exercise.",
        fr: "Cet exercice ne nécessite que Docker. Il montre, sur votre machine, les comportements qu'un orchestrateur automatise. Si Docker n’est pas installé, suivez le chapitre d’installation puis revenez. Confirmez que les noms web et web-8084 à web-8086 sont libres, ainsi que les ports locaux. Ne supprimez jamais un conteneur personnel pour poursuivre.",
      },
    },
    {
      type: "steps",
      steps: [
        {
          title: { en: "Run a container", fr: "Lancer un conteneur" },
          code: {
            lang: "bash",
            code: "docker run -d --name web -p 127.0.0.1:8083:80 nginx:1.27\ncurl --silent --show-error --fail --retry 5 --retry-connrefused --retry-delay 1 --max-time 3 http://127.0.0.1:8083/ | head -n 4",
          },
          explain: {
            en: "`-d` runs the container in the background, `--name web` gives it a stable name, and `-p 127.0.0.1:8083:80` publishes container port 80 on loopback host port 8083. curl retries connection refusal within a bounded budget because starting the container does not mean nginx is already listening.",
            fr: "`-d` lance le conteneur en arrière-plan, `--name web` lui donne un nom stable et `-p 127.0.0.1:8083:80` publie le port 80 du conteneur sur le port local 8083 de l’hôte. curl réessaie les refus de connexion dans un budget borné : un conteneur démarré n’implique pas que nginx écoute déjà.",
          },
          expected: {
            text: {
              en: "The first lines of the nginx welcome page.",
              fr: "Les premières lignes de la page d'accueil nginx.",
            },
            output: "<!DOCTYPE html>\n<html>\n<head>\n<title>Welcome to nginx!</title>",
          },
        },
        {
          title: { en: "Simulate a crash", fr: "Simuler un crash" },
          code: {
            lang: "bash",
            code: 'docker kill web\ndocker ps --filter name=web\ncurl -s localhost:8083 || echo "service is down"',
          },
          explain: {
            en: "`docker kill` sends SIGKILL to the main process, just like an out-of-memory kill would. Nothing restarts it: the container is stopped and the service is down until a human acts.",
            fr: "`docker kill` envoie SIGKILL au processus principal, comme le ferait un arrêt pour manque de mémoire. Rien ne le relance : le conteneur est arrêté et le service indisponible jusqu'à une intervention humaine.",
          },
          expected: {
            text: {
              en: "An empty `docker ps` list and the message “service is down”.",
              fr: "Une liste `docker ps` vide et le message « service is down ».",
            },
          },
        },
        {
          title: {
            en: "Add a restart policy — and see its limits",
            fr: "Ajouter une politique de redémarrage — et voir ses limites",
          },
          code: {
            lang: "bash",
            code: "docker rm web\ndocker run -d --name web --restart=always -p 127.0.0.1:8083:80 nginx:1.27\nsleep 10  # let Docker consider the container successfully started\ndocker exec web sh -c 'kill 1'\nsleep 2 && docker ps --filter name=web",
          },
          explain: {
            en: "With `--restart=always` the Docker daemon restarts the container when its process exits. That is a tiny piece of self-healing — but it only works on this one host, does not run several copies, does not balance traffic and cannot move the container if the machine dies. Kubernetes generalises this idea to a whole cluster.",
            fr: "Avec `--restart=always`, le démon Docker relance le conteneur quand son processus s'arrête. C'est un petit morceau d'auto-réparation — mais seulement sur cet hôte, sans plusieurs copies, sans répartition du trafic, et sans pouvoir déplacer le conteneur si la machine tombe. Kubernetes généralise cette idée à tout un cluster.",
          },
          expected: {
            text: {
              en: "The container is listed again with a recent “Up” status.",
              fr: "Le conteneur réapparaît avec un statut « Up » récent.",
            },
          },
          mistake: {
            en: "Thinking `docker kill web` will trigger the restart policy: Docker deliberately does not restart a container you stopped manually. Killing the process from inside (`kill 1`) simulates a real crash.",
            fr: "Croire que `docker kill web` déclenchera la politique de redémarrage : Docker ne relance volontairement pas un conteneur arrêté manuellement. Tuer le processus depuis l'intérieur (`kill 1`) simule un vrai crash.",
          },
        },
        {
          title: { en: "Clean up", fr: "Nettoyer" },
          code: { lang: "bash", code: "docker rm -f web" },
          explain: {
            en: "`-f` stops and removes the container in one command.",
            fr: "`-f` arrête et supprime le conteneur en une commande.",
          },
        },
      ],
    },
    {
      type: "challenge",
      title: {
        en: "List the jobs an orchestrator must do",
        fr: "Lister les tâches d'un orchestrateur",
      },
      task: {
        en: "Using only Docker, run three nginx containers on ports 8084–8086. Then write down every manual step you would need to keep exactly three healthy copies reachable behind a single address if one of them crashes and if your machine reboots. Compare your list with the orchestrator responsibilities above.",
        fr: "Avec Docker uniquement, lancez trois conteneurs nginx sur les ports 8084 à 8086. Notez ensuite chaque étape manuelle nécessaire pour garder exactement trois copies saines joignables derrière une adresse unique si l'une plante, puis si votre machine redémarre. Comparez votre liste avec les responsabilités d'un orchestrateur ci-dessus.",
      },
      hints: [
        {
          en: "A shell loop over `8084 8085 8086` saves typing.",
          fr: "Une boucle shell sur `8084 8085 8086` évite de tout taper.",
        },
        {
          en: "Ask yourself: who notices a failure? who decides where the replacement runs? how do clients find the new copy?",
          fr: "Posez-vous la question : qui détecte la panne ? qui décide où tourne le remplaçant ? comment les clients trouvent-ils la nouvelle copie ?",
        },
      ],
      solution: [
        {
          type: "code",
          lang: "bash",
          code: "for p in 8084 8085 8086; do\n  docker run -d --name web-$p -p 127.0.0.1:$p:80 nginx:1.27\ndone\ndocker ps --filter name=web-\n\n# cleanup\ndocker rm -f web-8084 web-8085 web-8086",
        },
        {
          type: "p",
          text: {
            en: "Manual jobs you should have found: monitoring each container (health checking), restarting or recreating failed ones (self-healing), putting a load balancer such as another nginx in front of the three ports and editing its config whenever a copy moves (service discovery), recreating everything after reboot with the right ports (desired state persistence), and repeating all of this across several machines (scheduling). Kubernetes maps these to probes, controllers, Services, etcd and the scheduler — the subject of the next chapter.",
            fr: "Les tâches manuelles à trouver : surveiller chaque conteneur (health checks), redémarrer ou recréer ceux en échec (auto-réparation), placer un répartiteur de charge comme un autre nginx devant les trois ports et modifier sa config dès qu'une copie bouge (découverte de services), tout recréer après un redémarrage avec les bons ports (persistance de l'état désiré), et répéter tout cela sur plusieurs machines (ordonnancement). Kubernetes y répond avec les probes, les contrôleurs, les Services, etcd et le scheduler — le sujet du chapitre suivant.",
          },
        },
      ],
    },
  ],
};
