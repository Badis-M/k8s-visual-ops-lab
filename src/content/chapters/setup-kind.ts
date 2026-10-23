import type { Chapter } from "../types";

export const setupKind: Chapter = {
  id: "setup-kind",
  level: 1,
  minutes: 40,
  title: {
    en: "Install kubectl and create a kind cluster",
    fr: "Installer kubectl et créer un cluster kind",
  },
  summary: {
    en: "Set up a free, disposable, reproducible Kubernetes cluster on Linux, macOS or Windows (WSL2) using Docker and kind.",
    fr: "Mettre en place un cluster Kubernetes gratuit, jetable et reproductible sur Linux, macOS ou Windows (WSL2) avec Docker et kind.",
  },
  related: ["architecture", "pods"],
  heavy: {
    en: "A single-node kind cluster needs roughly 2 CPU cores, 4 GB of free RAM and ~5 GB of disk for images.",
    fr: "Un cluster kind mononœud demande environ 2 cœurs CPU, 4 Go de RAM libre et ~5 Go de disque pour les images.",
  },
  blocks: [
    {
      type: "h2",
      id: "tools",
      text: { en: "The toolchain and why", fr: "Les outils et pourquoi" },
    },
    {
      type: "fields",
      rows: [
        {
          field: "Docker",
          text: {
            en: "Builds images and runs containers. kind uses it to run Kubernetes nodes as containers.",
            fr: "Construit les images et exécute les conteneurs. kind s'en sert pour exécuter les nœuds Kubernetes comme conteneurs.",
          },
        },
        {
          field: "kind",
          text: {
            en: "“Kubernetes IN Docker”: creates conformant clusters in seconds, deletes them just as fast. Perfect for learning and CI.",
            fr: "« Kubernetes IN Docker » : crée des clusters conformes en quelques secondes, et les supprime aussi vite. Idéal pour apprendre et pour la CI.",
          },
        },
        {
          field: "kubectl",
          text: {
            en: "The command-line client of the Kubernetes API. Works with any cluster: kind, cloud or on-prem.",
            fr: "Le client en ligne de commande de l'API Kubernetes. Fonctionne avec tout cluster : kind, cloud ou on-prem.",
          },
        },
      ],
    },
    {
      type: "callout",
      tone: "info",
      title: { en: "Windows users", fr: "Utilisateurs Windows" },
      text: {
        en: "Use Ubuntu on WSL2 and run every command inside the Ubuntu terminal. Install Docker Desktop with the WSL2 backend and enable integration for your Ubuntu distribution (Settings → Resources → WSL integration), or install Docker Engine directly inside Ubuntu. Then follow the Linux instructions.",
        fr: "Utilisez Ubuntu sous WSL2 et lancez toutes les commandes dans le terminal Ubuntu. Installez Docker Desktop avec le backend WSL2 et activez l'intégration pour votre distribution Ubuntu (Settings → Resources → WSL integration), ou installez Docker Engine directement dans Ubuntu. Suivez ensuite les instructions Linux.",
      },
    },
    { type: "h2", id: "install", text: { en: "Install the tools", fr: "Installer les outils" } },
    { type: "h3", text: { en: "1. Docker", fr: "1. Docker" } },
    {
      type: "p",
      text: {
        en: "macOS / Windows: install Docker Desktop from docker.com. Linux: follow the official Docker Engine guide for your distribution. Membership in the docker group grants root-equivalent daemon access; choose it deliberately or follow the official rootless setup. The following optional commands apply only to a Linux Docker Engine installation:",
        fr: "macOS / Windows : installez Docker Desktop depuis docker.com. Linux : suivez le guide officiel Docker Engine de votre distribution. Le groupe docker accorde des droits équivalents à root sur le daemon ; choisissez-le explicitement ou utilisez la configuration rootless officielle. Les commandes optionnelles suivantes concernent uniquement Docker Engine sous Linux :",
      },
    },
    {
      type: "code",
      lang: "bash",
      code: "sudo usermod -aG docker $USER\nnewgrp docker          # or log out and back in\ndocker run --rm hello-world",
    },
    { type: "h3", text: { en: "2. kubectl", fr: "2. kubectl" } },
    {
      type: "code",
      lang: "bash",
      title: "Linux / WSL2 (amd64)",
      code: 'curl -fLO https://dl.k8s.io/release/v1.35.0/bin/linux/amd64/kubectl\ncurl -fLO https://dl.k8s.io/release/v1.35.0/bin/linux/amd64/kubectl.sha256\nprintf "%s  kubectl\\n" "$(cat kubectl.sha256)" | sha256sum --check &&\n  sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl\n# Stop if download, checksum or installation fails.\nrm kubectl kubectl.sha256\nkubectl version --client',
    },
    {
      type: "code",
      lang: "bash",
      title: "macOS (Homebrew)",
      code: "brew install kubectl\nkubectl version --client",
    },
    {
      type: "p",
      text: {
        en: "On ARM Linux replace amd64 with arm64 in both binary and checksum URLs. This lesson pins kubectl 1.35.0 to match Kubernetes 1.35.0. Homebrew installs its current version: inspect kubectl version --client and kind version, and stop if they do not match this teaching baseline; use the official versioned binaries instead.",
        fr: "Sur Linux ARM, remplacez amd64 par arm64 dans les URL du binaire et du checksum. Ce cours fixe kubectl 1.35.0 pour Kubernetes 1.35.0. Homebrew installe sa version courante : vérifiez kubectl version --client et kind version, et arrêtez-vous en cas d’écart avec cette base ; utilisez alors les binaires officiels versionnés.",
      },
    },
    { type: "h3", text: { en: "3. kind", fr: "3. kind" } },
    {
      type: "code",
      lang: "bash",
      title: "Linux / WSL2 (amd64)",
      code: "curl -fLO https://github.com/kubernetes-sigs/kind/releases/download/v0.31.0/kind-linux-amd64\ncurl -fLO https://github.com/kubernetes-sigs/kind/releases/download/v0.31.0/kind-linux-amd64.sha256sum\nsha256sum --check kind-linux-amd64.sha256sum && sudo install -m 0755 kind-linux-amd64 /usr/local/bin/kind\n# Stop if download, checksum or installation fails.\nkind version",
    },
    {
      type: "code",
      lang: "bash",
      title: "macOS (Homebrew)",
      code: "brew install kind\nkind version",
    },
    {
      type: "callout",
      tone: "tip",
      title: {
        en: "Pin versions for reproducibility",
        fr: "Figez les versions pour la reproductibilité",
      },
      text: {
        en: "Use kind 0.31.0 and Kubernetes 1.35.0 deliberately. Download the binary matching your OS/architecture and verify the official release checksum before installation. The optional three-node example needs more resources and does not share the advanced chapters’ cluster name k8s-ops-lab; follow lab/README.md for those chapters.",
        fr: "Utilisez volontairement kind 0.31.0 et Kubernetes 1.35.0. Téléchargez le binaire de votre OS/architecture et vérifiez le checksum officiel avant installation. L’exemple optionnel à trois nœuds demande plus de ressources et son nom diffère du cluster avancé k8s-ops-lab ; suivez lab/README.md pour ces chapitres.",
      },
    },
    {
      type: "h2",
      id: "create-cluster",
      text: { en: "Create your lab cluster", fr: "Créer votre cluster de lab" },
    },
    {
      type: "steps",
      steps: [
        {
          title: { en: "Create the cluster", fr: "Créer le cluster" },
          why: {
            en: "kind starts a container that runs kubelet, containerd and the control plane components inside it.",
            fr: "kind démarre un conteneur qui exécute le kubelet, containerd et les composants du control plane.",
          },
          code: {
            lang: "bash",
            code: "kind get clusters\n# Continue only if k8s-lab is absent.\nkind create cluster --name k8s-lab --image kindest/node:v1.35.0",
          },
          explain: {
            en: "`--name` lets you run several clusters side by side. kind writes credentials into the selected kubeconfig (normally `~/.kube/config`; KUBECONFIG can change this) and switches its current context to `kind-k8s-lab`.",
            fr: "`--name` permet de faire tourner plusieurs clusters côte à côte. kind écrit les identifiants dans le kubeconfig choisi (normalement `~/.kube/config` ; KUBECONFIG peut changer ce chemin) et y sélectionne le contexte `kind-k8s-lab`.",
          },
          expected: {
            text: { en: "A final line similar to:", fr: "Une dernière ligne similaire à :" },
            output:
              'Set kubectl context to "kind-k8s-lab"\nYou can now use your cluster with:\n\nkubectl cluster-info --context kind-k8s-lab',
          },
          mistake: {
            en: "“Cannot connect to the Docker daemon”: Docker is not running, or (Linux) your user is not in the docker group yet.",
            fr: "« Cannot connect to the Docker daemon » : Docker n'est pas lancé ou (Linux) votre utilisateur n'est pas encore dans le groupe docker.",
          },
        },
        {
          title: { en: "Verify connectivity", fr: "Vérifier la connexion" },
          code: {
            lang: "bash",
            code: "kubectl config current-context\nkubectl --context kind-k8s-lab cluster-info\nkubectl --context kind-k8s-lab get nodes",
          },
          explain: {
            en: "`current-context` confirms which cluster kubectl targets — check it before every destructive command. `cluster-info` shows the API server URL (a localhost port mapped into the node container).",
            fr: "`current-context` confirme le cluster ciblé par kubectl — vérifiez-le avant toute commande destructive. `cluster-info` affiche l'URL de l'API server (un port localhost mappé vers le conteneur du nœud).",
          },
          expected: {
            text: {
              en: "The node shows `Ready` (it can take ~30 s while the CNI starts).",
              fr: "Le nœud est `Ready` (cela peut prendre ~30 s le temps que le CNI démarre).",
            },
            output:
              "NAME                    STATUS   ROLES           AGE   VERSION\nk8s-lab-control-plane   Ready    control-plane   45s   v1.3x.x",
          },
        },
        {
          title: { en: "See the node is a container", fr: "Voir que le nœud est un conteneur" },
          code: {
            lang: "bash",
            code: "docker ps --filter name=k8s-lab\ndocker exec k8s-lab-control-plane crictl ps",
          },
          explain: {
            en: "`crictl` is the CLI for CRI runtimes; inside the node it lists the containers containerd runs — the control plane itself.",
            fr: "`crictl` est la CLI des runtimes CRI ; dans le nœud, elle liste les conteneurs exécutés par containerd — le control plane lui-même.",
          },
        },
      ],
    },
    {
      type: "h2",
      id: "multi-node",
      text: { en: "Optional: a multi-node cluster", fr: "Optionnel : un cluster multi-nœuds" },
    },
    {
      type: "p",
      text: {
        en: "Later chapters on scheduling and DaemonSets are clearer with real worker nodes. save the next block as kind-multi.yaml in your current directory before running the creation command. Do not reuse an existing k8s-multi cluster:",
        fr: "Les chapitres sur l'ordonnancement et les DaemonSets sont plus parlants avec de vrais workers. enregistrez le bloc suivant dans kind-multi.yaml dans votre répertoire courant avant la commande de création. Ne réutilisez pas un cluster k8s-multi existant :",
      },
    },
    {
      type: "code",
      lang: "yaml",
      title: "kind-multi.yaml",
      code: "kind: Cluster\napiVersion: kind.x-k8s.io/v1alpha4\nnodes:\n  - role: control-plane\n  - role: worker\n  - role: worker",
    },
    {
      type: "code",
      lang: "bash",
      code: "kind create cluster --name k8s-multi --image kindest/node:v1.35.0 --config kind-multi.yaml\nkubectl --context kind-k8s-multi get nodes",
    },
    {
      type: "callout",
      tone: "warn",
      title: { en: "Resources", fr: "Ressources" },
      text: {
        en: "Each node is a container with its own kubelet and containerd: count roughly +1 GB RAM per worker.",
        fr: "Chaque nœud est un conteneur avec son kubelet et son containerd : comptez environ +1 Go de RAM par worker.",
      },
    },
    {
      type: "callout",
      tone: "warn",
      title: {
        en: "Delete only clusters you created",
        fr: "Supprimer seulement vos clusters d’exercice",
      },
      text: {
        en: "Deleting a cluster destroys all its namespaces and local data. Keep k8s-lab while other beginner chapters use it; delete k8s-multi or scratch only if you created them for these optional exercises.",
        fr: "Supprimer un cluster détruit tous ses namespaces et données locales. Gardez k8s-lab pour les autres cours débutants ; retirez k8s-multi ou scratch seulement si vous les avez créés pour ces exercices optionnels.",
      },
    },
    {
      type: "h2",
      id: "cleanup",
      text: { en: "Cleanup and contexts", fr: "Nettoyage et contextes" },
    },
    {
      type: "code",
      lang: "bash",
      code: "kind get clusters\nkubectl config get-contexts\nkind delete cluster --name k8s-multi",
    },
    {
      type: "challenge",
      title: { en: "Two clusters, one kubectl", fr: "Deux clusters, un kubectl" },
      task: {
        en: "Create a second cluster named `scratch`. Deploy nginx in `scratch` only, then switch back to `k8s-lab` and prove nginx is not there. Finally delete `scratch` and confirm your context is valid.",
        fr: "Créez un second cluster nommé `scratch`. Déployez nginx uniquement dans `scratch`, revenez sur `k8s-lab` et prouvez que nginx n'y est pas. Supprimez enfin `scratch` et vérifiez que votre contexte est valide.",
      },
      hints: [
        {
          en: "`kubectl config use-context <name>` switches; `--context` targets one command.",
          fr: "`kubectl config use-context <nom>` bascule ; `--context` cible une seule commande.",
        },
        {
          en: "kind context names are prefixed with `kind-`.",
          fr: "Les contextes kind sont préfixés par `kind-`.",
        },
      ],
      solution: [
        {
          type: "code",
          lang: "bash",
          code: "kind get clusters\n# Continue only if scratch is absent.\nkind create cluster --name scratch --image kindest/node:v1.35.0\nkubectl --context kind-scratch create deployment web --image=nginx:1.27\nkubectl --context kind-scratch get deployment web\nkubectl config use-context kind-k8s-lab\nkubectl --context kind-k8s-lab get deployment web  # expected NotFound in an otherwise empty lab\nkubectl --context kind-scratch get deployment web\nkind delete cluster --name scratch\nkubectl config current-context",
        },
        {
          type: "p",
          text: {
            en: "Each cluster has its own API server and etcd: objects never leak between them. A context is just a named (cluster, user, namespace) triple in your kubeconfig. Deleting a kind cluster also removes its context; if it was the current one, switch explicitly.",
            fr: "Chaque cluster a son propre API server et son etcd : les objets ne passent jamais de l'un à l'autre. Un contexte est simplement un triplet nommé (cluster, utilisateur, namespace) dans votre kubeconfig. Supprimer un cluster kind supprime aussi son contexte ; s'il était courant, basculez explicitement.",
          },
        },
      ],
    },
  ],
};
