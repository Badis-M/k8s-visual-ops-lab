import type { Block, Chapter } from "../types";
import { sharedLabIntroduction } from "../shared-lab-introduction";

export const namespacesContexts: Chapter = {
  "id": "namespaces-contexts",
  "level": 1,
  "title": {
    "en": "Namespaces and contexts",
    "fr": "Namespaces et contextes"
  },
  "summary": {
    "en": "Identify the context before acting, specify the namespace and verify the scope of the resource you are querying.",
    "fr": "Identifiez le contexte avant d’agir, précisez le namespace et vérifiez la portée de la ressource recherchée."
  },
  "minutes": 35,
  "prerequisites": [
    "setup-kind"
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
        "en": "Identify the cluster targeted by a command.",
        "fr": "Identifier le cluster ciblé par une commande."
      },
      {
        "en": "Distinguish a kubectl context from a namespace.",
        "fr": "Distinguer un contexte kubectl d’un namespace."
      },
      {
        "en": "Explicitly query resources in a namespace.",
        "fr": "Interroger explicitement les ressources d’un namespace."
      }
    ]
  },
  {
    "type": "h2",
    "id": "two-different-scopes",
    "text": {
      "en": "Two different scopes",
      "fr": "Deux portées distinctes"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "A context is a local configuration entry that associates a cluster, an identity and optionally a default namespace. A namespace belongs to the cluster and organizes certain resources.",
      "fr": "Un contexte est une entrée de configuration locale qui associe un cluster, une identité et éventuellement un namespace par défaut. Un namespace appartient au cluster et organise certaines ressources."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Think of an address: the context identifies the building you connect to; the namespace identifies a space inside it. This organization does not by itself create a security boundary.",
      "fr": "Pensez à une adresse : le contexte vous indique à quel bâtiment vous vous connectez ; le namespace désigne un espace dans ce bâtiment. Cette organisation ne crée pas à elle seule une isolation de sécurité."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Inspect your configuration without printing certificates or authentication tokens.",
      "fr": "Examinez votre configuration sans afficher les certificats ni les jetons d’authentification."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "kubectl config current-context\nkubectl config get-contexts\nk config view --minify -o jsonpath='{.contexts[0].context.namespace}{\"\\n\"}'"
  },
  {
    "type": "h3",
    "text": {
      "en": "Result and verification",
      "fr": "Résultat et vérification "
    }
  },
  {
    "type": "p",
    "text": {
      "en": "The first command prints the current context, which may differ from the context selected for `k`. The last command shows the namespace configured in the selected context. An empty result means none is configured; commands that need a namespace normally use `default`.",
      "fr": "La première commande affiche le contexte courant, qui peut différer du contexte choisi pour `k`. La dernière montre le namespace configuré dans le contexte choisi. Une sortie vide signifie qu’aucun namespace n’y est défini ; les commandes qui en ont besoin utilisent alors normalement `default`."
    }
  },
  {
    "type": "h2",
    "id": "identical-names-in-different-namespaces",
    "text": {
      "en": "Identical names in different namespaces",
      "fr": "Des noms identiques dans des namespaces différents"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Create two spaces and a Pod named `demo` in each. A query scoped to one namespace does not show resources from the other.",
      "fr": "Nous allons créer deux espaces et un Pod nommé `demo` dans chacun. Une recherche limitée à un namespace ne montre pas les ressources de l’autre."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k get namespace lab-namespaces-a\nk get namespace lab-namespaces-b"
  },
  {
    "type": "p",
    "text": {
      "en": "After confirming `NotFound` for both namespaces, create the resources.",
      "fr": "Après avoir confirmé `NotFound` pour chacun, créez les ressources."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k create namespace lab-namespaces-a\nk create namespace lab-namespaces-b\n\nk -n lab-namespaces-a run demo \\\n  --image=busybox:1.37.0 --restart=Never -- sleep 3600\n\nk -n lab-namespaces-b run demo \\\n  --image=busybox:1.37.0 --restart=Never -- sleep 3600\n\nk -n lab-namespaces-a wait --for=condition=Ready pod/demo --timeout=120s\nk -n lab-namespaces-b wait --for=condition=Ready pod/demo --timeout=120s\n\nk -n lab-namespaces-a get pods\nk -n lab-namespaces-b get pods"
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
      "en": "Each list contains its own `demo` Pod, ready with `1/1`. Kubernetes distinguishes them by namespace and name.",
      "fr": "Chaque liste contient son propre Pod `demo`, prêt avec `1/1`. Kubernetes les distingue par leur namespace et leur nom."
    }
  },
  {
    "type": "h2",
    "id": "know-what-can-be-namespaced",
    "text": {
      "en": "Know what can be namespaced",
      "fr": "Identifier les ressources associées à un namespace"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Pods belong to namespaces. Nodes represent cluster infrastructure and do not. Use API discovery to inspect this distinction.",
      "fr": "Les Pods sont associés à un namespace. Les nœuds représentent l’infrastructure du cluster et n’en ont pas. Utilisez la découverte de l’API pour observer cette distinction."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k api-resources --namespaced=true\nk api-resources --namespaced=false\nk get pods --all-namespaces --field-selector=metadata.name=demo"
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
      "en": "Find `pods` in the first list and `nodes` in the second. The final command should show both `demo` Pods with their namespaces.",
      "fr": "Repérez `pods` dans la première liste et `nodes` dans la deuxième. La dernière commande doit montrer les deux Pods `demo` et leurs namespaces."
    }
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
        "en": "`No resources found`: check the namespace; this does not mean the entire cluster is empty.",
        "fr": "`No resources found` : vérifiez le namespace utilisé ; ce message ne signifie pas que le cluster entier est vide."
      },
      {
        "en": "`AlreadyExists`: the resource already exists. Inspect it before continuing.",
        "fr": "`AlreadyExists` : la ressource existe déjà. Inspectez-la avant de continuer."
      },
      {
        "en": "`Forbidden`: your identity lacks the requested permission; changing namespaces does not grant permissions.",
        "fr": "`Forbidden` : votre identité n’a pas l’autorisation demandée ; changer de namespace ne donne pas de nouveaux droits."
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
      "en": "Without modifying the current context or its default namespace, show only the `demo` Pod in `lab-namespaces-b`, including its IP address and node name. Then verify that the current context is unchanged.",
      "fr": "Sans modifier le contexte courant ni son namespace par défaut, affichez uniquement le Pod `demo` de `lab-namespaces-b`, avec son adresse IP et le nom de son nœud. Vérifiez ensuite que le contexte courant est resté identique."
    },
    "hints": [
      {
        "en": "The namespace can be supplied to each command.",
        "fr": "Le namespace peut être passé à chaque commande."
      },
      {
        "en": "The `wide` format adds columns.",
        "fr": "Le format `wide` ajoute des colonnes."
      }
    ],
    "solution": [
      {
        "type": "code",
        "lang": "bash",
        "code": "k -n lab-namespaces-b get pod demo -o wide\nkubectl config current-context"
      },
      {
        "type": "p",
        "text": {
          "en": "Compare the context with the value recorded at the beginning. `--context`, used by `k`, selects a target for the command without changing the current context.",
          "fr": "Comparez le contexte avec celui relevé au début. `--context`, utilisé par `k`, sélectionne une cible pour la commande sans changer le contexte courant."
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
          "en": "A kubectl context is…",
          "fr": "Un contexte kubectl est…"
        },
        "options": [
          {
            "en": "A group of Pods",
            "fr": "Un groupe de Pods"
          },
          {
            "en": "A local association of cluster, identity and optional namespace",
            "fr": "Une association locale cluster, identité et namespace optionnel"
          },
          {
            "en": "A cluster node",
            "fr": "Un nœud du cluster"
          }
        ],
        "correct": 1,
        "explanation": {
          "en": "A context configures command targeting; it is not a resource running inside the cluster.",
          "fr": "Le contexte configure la cible des commandes ; ce n’est pas une ressource exécutée dans le cluster."
        }
      },
      {
        "question": {
          "en": "Can two Pods have the same name?",
          "fr": "Deux Pods peuvent-ils porter le même nom ?"
        },
        "options": [
          {
            "en": "Yes, in different namespaces",
            "fr": "Oui, dans des namespaces différents"
          },
          {
            "en": "Yes, in the same namespace",
            "fr": "Oui, dans le même namespace"
          },
          {
            "en": "Never",
            "fr": "Jamais"
          }
        ],
        "correct": 0,
        "explanation": {
          "en": "A Pod name must be unique within its namespace.",
          "fr": "Le nom d’un Pod doit être unique dans son namespace."
        }
      },
      {
        "question": {
          "en": "Does a namespace automatically block network communication?",
          "fr": "Un namespace bloque-t-il automatiquement les communications réseau ?"
        },
        "options": [
          {
            "en": "Yes",
            "fr": "Oui"
          },
          {
            "en": "Only for Pods",
            "fr": "Seulement pour les Pods"
          },
          {
            "en": "No",
            "fr": "Non"
          }
        ],
        "correct": 2,
        "explanation": {
          "en": "Name separation does not replace network policies or authorization.",
          "fr": "La séparation des noms ne remplace pas les politiques réseau ni les autorisations."
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
    "type": "code",
    "lang": "bash",
    "code": "k delete namespace lab-namespaces-a lab-namespaces-b"
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
      "en": "Identify the context before acting, specify the namespace and verify the scope of the resource you are querying.",
      "fr": "Identifiez le contexte avant d’agir, précisez le namespace et vérifiez la portée de la ressource recherchée."
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
        "en": "https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/",
        "fr": "https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/"
      },
      {
        "en": "https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/",
        "fr": "https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/"
      }
    ]
  }
] satisfies Block[])]
};
