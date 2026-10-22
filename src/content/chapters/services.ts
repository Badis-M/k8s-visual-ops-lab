import type { Block, Chapter } from "../types";
import { sharedLabIntroduction } from "../shared-lab-introduction";

export const services: Chapter = {
  "id": "services",
  "level": 1,
  "title": {
    "en": "Services and cluster networking basics",
    "fr": "Services et bases du réseau Kubernetes"
  },
  "summary": {
    "en": "Follow the client → Service → backends chain. Verify DNS, selectors and ports separately.",
    "fr": "Suivez la chaîne client → Service → backends. Vérifiez séparément DNS, sélecteur et ports."
  },
  "minutes": 50,
  "prerequisites": [
    "pods",
    "deployments",
    "namespaces-contexts"
  ]
,
  blocks: [...sharedLabIntroduction, ...([
  {
    "type": "h2",
    "id": "learning-objectives",
    "text": {
      "en": "Learning objectives",
      "fr": "Objectifs pédagogiques"
    }
  },
  {
    "type": "list",
    "items": [
      {
        "en": "Expose multiple Pods through an internal Service.",
        "fr": "Exposer plusieurs Pods via un Service interne."
      },
      {
        "en": "Connect labels, selectors, ports and EndpointSlices.",
        "fr": "Relier labels, sélecteur, ports et EndpointSlices."
      },
      {
        "en": "Distinguish an internal network test from port-forwarding.",
        "fr": "Distinguer un test réseau interne d’un port-forward."
      }
    ]
  },
  {
    "type": "h2",
    "id": "a-stable-entry-point",
    "text": {
      "en": "A stable entry point",
      "fr": "Un point d’accès stable"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "A replicated application has multiple Pods. Their addresses can change when they are replaced. A Service provides an entry point independent of any particular Pod name.",
      "fr": "Une application répliquée possède plusieurs Pods. Leurs adresses peuvent changer lorsqu’ils sont remplacés. Un Service fournit un point d’accès qui ne dépend pas du nom d’un Pod particulier."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "In this exercise, the `web` Service selects Pods labelled `app=web`. Its port `80` leads to container port `80`.",
      "fr": "Dans cet exercice, le Service `web` sélectionne les Pods portant le label `app=web`. Son port `80` mène au port `80` des conteneurs."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k get namespace lab-services"
  },
  {
    "type": "p",
    "text": {
      "en": "After confirming `NotFound`, create the namespace and apply the manifest.",
      "fr": "Après avoir confirmé `NotFound`, créez le namespace et appliquez le manifest."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k create namespace lab-services\n\nk -n lab-services apply -f - <<'YAML'\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: web\n  template:\n    metadata:\n      labels:\n        app: web\n    spec:\n      containers:\n        - name: nginx\n          image: nginx:1.28.0\n          ports:\n            - containerPort: 80\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: web\nspec:\n  type: ClusterIP\n  selector:\n    app: web\n  ports:\n    - name: http\n      port: 80\n      targetPort: 80\nYAML\n\nk -n lab-services rollout status deployment/web --timeout=120s\nk -n lab-services get pods -l app=web -o wide\nk -n lab-services get service web"
  },
  {
    "type": "h3",
    "text": {
      "en": "Verification",
      "fr": "Vérification "
    }
  },
  {
    "type": "p",
    "text": {
      "en": "The Deployment should reach two available replicas. The Service has a `CLUSTER-IP` address. This address belongs to the cluster network; it is not a public address.",
      "fr": "Le Deployment doit atteindre deux répliques disponibles. Le Service possède une adresse `CLUSTER-IP`. Cette adresse est destinée au réseau du cluster ; elle n’est pas une adresse publique."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "`containerPort` documents the container port: it does not start the server or expose it by itself.",
      "fr": "`containerPort` documente le port du conteneur : il ne démarre pas le serveur et ne l’expose pas à lui seul."
    }
  },
  {
    "type": "h2",
    "id": "observe-backends-then-send-traffic",
    "text": {
      "en": "Observe backends, then send traffic",
      "fr": "Observer les backends, puis envoyer du trafic"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "EndpointSlices let you inspect the destinations associated with the Service. Compare their addresses with the Pod addresses.",
      "fr": "Les EndpointSlices permettent d’inspecter les destinations associées au Service. Comparez leurs adresses avec celles des Pods."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Then create a client in the same namespace. It will reach `web` using cluster DNS resolution.",
      "fr": "Créez ensuite un client dans le même namespace. Il contactera `web` grâce à la résolution DNS du cluster."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k -n lab-services get endpointslices \\\n  -l kubernetes.io/service-name=web -o wide\n\nk -n lab-services run client \\\n  --image=busybox:1.37.0 --restart=Never -- sleep 3600\n\nk -n lab-services wait --for=condition=Ready pod/client --timeout=120s\nk -n lab-services exec client -- nslookup web\nk -n lab-services exec client -- wget -qO- http://web"
  },
  {
    "type": "h3",
    "text": {
      "en": "Expected result",
      "fr": "Résultat attendu "
    }
  },
  {
    "type": "p",
    "text": {
      "en": "DNS resolution returns the Service address. The HTTP request returns the nginx welcome page HTML. One successful request does not prove that every replica received traffic.",
      "fr": "La résolution DNS renvoie l’adresse du Service. La requête HTTP renvoie la page d’accueil HTML de nginx. Une requête réussie ne prouve pas que chaque réplique a reçu du trafic."
    }
  },
  {
    "type": "h2",
    "id": "access-from-your-computer",
    "text": {
      "en": "Access from your computer",
      "fr": "Accéder depuis votre ordinateur"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Port-forwarding is useful for a local test. It takes a different path from the previous request: for a Service, kubectl selects a target Pod and forwards traffic to it. This test alone therefore does not validate ClusterIP routing.",
      "fr": "Un port-forward est utile pour un test local. Il emprunte un chemin différent de la requête précédente : avec un Service, kubectl choisit un Pod cible et y transfère le trafic. Ce test ne valide donc pas à lui seul le routage via la ClusterIP."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "The command stays active. Open `http://127.0.0.1:8080` in your browser, then stop it with Ctrl+C.",
      "fr": "La commande reste active. Ouvrez `http://127.0.0.1:8080` dans votre navigateur, puis arrêtez-la avec Ctrl+C."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k -n lab-services port-forward --address=127.0.0.1 service/web 8080:80"
  },
  {
    "type": "h2",
    "id": "common-mistakes",
    "text": {
      "en": "Common mistakes",
      "fr": "Erreurs fréquentes"
    }
  },
  {
    "type": "list",
    "items": [
      {
        "en": "No backends: compare the Service selector with the Pod labels.",
        "fr": "Aucun backend : comparez le sélecteur du Service avec les labels des Pods."
      },
      {
        "en": "DNS name not found: check the name and namespace before investigating CoreDNS.",
        "fr": "DNS introuvable : vérifiez le nom et le namespace avant d’examiner CoreDNS."
      },
      {
        "en": "Connection refused: verify that the application listens on `targetPort`.",
        "fr": "Connexion refusée : vérifiez que l’application écoute sur le `targetPort`."
      },
      {
        "en": "Local port already in use: use `8081:80`, then open port 8081.",
        "fr": "Port local occupé : utilisez `8081:80`, puis ouvrez le port 8081."
      }
    ]
  },
  {
    "type": "challenge",
    "title": {
      "en": "Independent challenge",
      "fr": "Défi autonome"
    },
    "task": {
      "en": "Make the Service listen on port `8080`, while keeping nginx on port `80`. Verify the Service from the client Pod without port-forwarding.",
      "fr": "Faites écouter le Service sur le port `8080`, tout en conservant nginx sur le port `80`. Vérifiez le Service depuis le Pod client, sans port-forward."
    },
    "hints": [
      {
        "en": "`port` and `targetPort` represent different sides.",
        "fr": "`port` et `targetPort` ne représentent pas le même côté."
      },
      {
        "en": "The client request must specify the new port.",
        "fr": "La requête du client doit préciser le nouveau port."
      }
    ],
    "solution": [
      {
        "type": "code",
        "lang": "bash",
        "code": "k -n lab-services patch service web --type=merge \\\n  -p '{\"spec\":{\"ports\":[{\"name\":\"http\",\"port\":8080,\"targetPort\":80,\"protocol\":\"TCP\"}]}}'\n\nk -n lab-services get service web\nk -n lab-services exec client -- wget -qO- http://web:8080"
      },
      {
        "type": "p",
        "text": {
          "en": "The Service port changes; the server and `targetPort` stay on 80.",
          "fr": "Le port du Service change ; le serveur et le `targetPort` restent sur 80."
        }
      }
    ]
  },
  {
    "type": "h2",
    "id": "knowledge-check",
    "text": {
      "en": "Knowledge check",
      "fr": "Quiz de connaissances"
    }
  },
  {
    "type": "quiz",
    "questions": [
      {
        "question": {
          "en": "What does this lab's Service select?",
          "fr": "Que sélectionne le Service de ce lab ?"
        },
        "options": [
          {
            "en": "Pods labelled `app=web`",
            "fr": "Les Pods portant `app=web`"
          },
          {
            "en": "All Deployments",
            "fr": "Tous les Deployments"
          },
          {
            "en": "A node named web",
            "fr": "Un nœud nommé web"
          }
        ],
        "correct": 0,
        "explanation": {
          "en": "The selector matches Pod labels within the Service namespace.",
          "fr": "Le sélecteur compare les labels des Pods dans le namespace du Service."
        }
      },
      {
        "question": {
          "en": "The client uses the port of the…",
          "fr": "Le client utilise le port du…"
        },
        "options": [
          {
            "en": "targetPort",
            "fr": "targetPort"
          },
          {
            "en": "Service",
            "fr": "Service"
          },
          {
            "en": "kubelet",
            "fr": "kubelet"
          }
        ],
        "correct": 1,
        "explanation": {
          "en": "`port` is the Service port; `targetPort` identifies the backend port.",
          "fr": "`port` est le port du Service ; `targetPort` désigne le port du backend."
        }
      },
      {
        "question": {
          "en": "Does successful port-forwarding prove ClusterIP routing works?",
          "fr": "Un port-forward réussi prouve-t-il que le routage ClusterIP fonctionne ?"
        },
        "options": [
          {
            "en": "Always",
            "fr": "Toujours"
          },
          {
            "en": "Only with two replicas",
            "fr": "Seulement avec deux répliques"
          },
          {
            "en": "No",
            "fr": "Non"
          }
        ],
        "correct": 2,
        "explanation": {
          "en": "Port-forwarding uses a different path; also test from an in-cluster client.",
          "fr": "Le port-forward utilise un autre chemin ; testez aussi depuis un client dans le cluster."
        }
      }
    ]
  },
  {
    "type": "h2",
    "id": "cleanup",
    "text": {
      "en": "Cleanup",
      "fr": "Nettoyage"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Stop any port-forward before deleting the namespace.",
      "fr": "Arrêtez tout port-forward avant de supprimer le namespace."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k delete namespace lab-services"
  },
  {
    "type": "h2",
    "id": "recap",
    "text": {
      "en": "Recap",
      "fr": "Récapitulatif"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Follow the client → Service → backends chain. Verify DNS, selectors and ports separately.",
      "fr": "Suivez la chaîne client → Service → backends. Vérifiez séparément DNS, sélecteur et ports."
    }
  },
  {
    "type": "h3",
    "text": {
      "en": "Sources",
      "fr": "Sources"
    }
  },
  {
    "type": "list",
    "items": [
      {
        "en": "https://kubernetes.io/docs/concepts/services-networking/service/",
        "fr": "https://kubernetes.io/docs/concepts/services-networking/service/"
      },
      {
        "en": "https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/",
        "fr": "https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/"
      }
    ]
  }
] satisfies Block[])]
};
