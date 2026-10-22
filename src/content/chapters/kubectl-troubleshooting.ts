import type { Block, Chapter } from "../types";
import { sharedLabIntroduction } from "../shared-lab-introduction";

export const kubectlTroubleshooting: Chapter = {
  "id": "kubectl-troubleshooting",
  "level": 1,
  "title": {
    "en": "Essential kubectl and troubleshooting",
    "fr": "kubectl essentiel et dépannage"
  },
  "summary": {
    "en": "Observe, form a hypothesis, find evidence, correct desired state and verify the result.",
    "fr": "Observez, formulez une hypothèse, cherchez une preuve, corrigez l’état demandé puis vérifiez le résultat."
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
        "en": "Move from a symptom to verifiable evidence.",
        "fr": "Passer d’un symptôme à des éléments vérifiables."
      },
      {
        "en": "Use status, events and logs in a useful order.",
        "fr": "Utiliser état, événements et logs dans un ordre utile."
      },
      {
        "en": "Fix a managed workload at its Deployment.",
        "fr": "Corriger un workload géré au niveau de son Deployment."
      }
    ]
  },
  {
    "type": "h2",
    "id": "observe-before-changing",
    "text": {
      "en": "Observe before changing",
      "fr": "Observer avant de modifier"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "`get` provides an overview. `describe` details a resource and its events. `logs` shows container output. `exec` runs a command in a running container.",
      "fr": "`get` donne une vue d’ensemble. `describe` détaille une ressource et ses événements. `logs` montre les sorties d’un conteneur. `exec` lance une commande dans un conteneur en cours d’exécution."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "No command replaces all the others. A container that never started may have no logs.",
      "fr": "Aucune commande ne remplace toutes les autres. Un conteneur qui n’a jamais démarré peut n’avoir aucun log."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Deliberately create an application that exits with an error. This failure is confined to the training namespace.",
      "fr": "Nous allons créer volontairement une application qui quitte avec une erreur. Cette panne est limitée au namespace d’entraînement."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k get namespace lab-troubleshooting"
  },
  {
    "type": "p",
    "text": {
      "en": "After confirming `NotFound`, create the workload.",
      "fr": "Après avoir confirmé `NotFound`, créez le workload."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k create namespace lab-troubleshooting\n\nk -n lab-troubleshooting apply -f - <<'YAML'\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: broken-app\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: broken-app\n  template:\n    metadata:\n      labels:\n        app: broken-app\n    spec:\n      containers:\n        - name: app\n          image: busybox:1.37.0\n          command:\n            - sh\n            - -c\n            - |\n              printf 'Startup failed: training configuration is invalid\\n' >&2\n              exit 1\nYAML\n\nk -n lab-troubleshooting get deployment broken-app\nk -n lab-troubleshooting get pods -l app=broken-app"
  },
  {
    "type": "h3",
    "text": {
      "en": "Expected observation",
      "fr": "Observation attendue "
    }
  },
  {
    "type": "p",
    "text": {
      "en": "The replica is unavailable. Depending on timing, the Pod may display `Error`, `CrashLoopBackOff` or another transient status. Read the status again after a few seconds.",
      "fr": "La réplique n’est pas disponible. Selon le moment, le Pod peut afficher `Error`, `CrashLoopBackOff` ou un autre état transitoire. Répétez la lecture après quelques secondes."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "`CrashLoopBackOff` describes waiting between repeated restarts; it is not the failure's root cause and is not a Pod phase.",
      "fr": "`CrashLoopBackOff` décrit l’attente entre des redémarrages répétés ; ce n’est pas la cause de la panne et ce n’est pas une phase du Pod."
    }
  },
  {
    "type": "h2",
    "id": "collect-evidence",
    "text": {
      "en": "Collect evidence",
      "fr": "Recueillir des preuves"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Inspect events, then logs. The selector scopes commands to the lab Pods. `--prefix` helps identify where lines came from.",
      "fr": "Observez les événements, puis les logs. Le sélecteur limite les commandes aux Pods du lab. L’option `--prefix` aide à identifier la provenance des lignes."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k -n lab-troubleshooting describe pods -l app=broken-app\n\nk -n lab-troubleshooting logs -l app=broken-app \\\n  --all-containers=true --prefix --tail=50\n\nk -n lab-troubleshooting logs -l app=broken-app \\\n  --all-containers=true --prefix --previous --tail=50\n\nk -n lab-troubleshooting get events \\\n  --sort-by=.metadata.creationTimestamp"
  },
  {
    "type": "h3",
    "text": {
      "en": "Interpretation",
      "fr": "Interprétation "
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Look for `Startup failed: training configuration is invalid`, exit code `1`, the restart count and backoff events.",
      "fr": "Cherchez la sortie `Startup failed: training configuration is invalid`, le code de sortie `1`, le nombre de redémarrages et les événements de backoff."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "`--previous` requests logs from the previous container instance. It may fail if no previous instance is available yet. Events and logs have limited retention.",
      "fr": "`--previous` demande les logs de l’instance précédente du conteneur. Elle peut échouer si aucune instance précédente n’est encore disponible. Les événements et les logs ont une rétention limitée."
    }
  },
  {
    "type": "h2",
    "id": "correct-the-desired-state",
    "text": {
      "en": "Correct the desired state",
      "fr": "Corriger l’état demandé"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Deleting only the Pod would not fix its command: the Deployment would recreate it from the same template. Change the source of the behavior.",
      "fr": "Supprimer seulement le Pod ne corrigerait pas sa commande : le Deployment en recréerait un à partir du même modèle. Modifiez la source du comportement."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "For this lab, replace the failing command with one that confirms startup and stays active for one hour.",
      "fr": "Dans ce lab, remplacez la commande fautive par une commande qui confirme le démarrage et reste active pendant une heure."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k -n lab-troubleshooting patch deployment broken-app --type=strategic \\\n  -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"app\",\"command\":[\"sh\",\"-c\",\"printf \\\"Application started\\\\n\\\"; sleep 3600\"]}]}}}}'\n\nk -n lab-troubleshooting rollout status deployment/broken-app --timeout=120s\nk -n lab-troubleshooting get pods -l app=broken-app\nk -n lab-troubleshooting logs deployment/broken-app --tail=20\nk -n lab-troubleshooting exec deployment/broken-app -- id"
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
      "en": "The rollout succeeds and its Pod becomes ready. Logs show `Application started`. `id` displays the identity of the process executed inside the container, not your computer user.",
      "fr": "Le déploiement réussit et son Pod devient prêt. Les logs montrent `Application started`. `id` affiche l’identité du processus exécuté dans le conteneur, pas celle de votre utilisateur sur l’ordinateur."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "This exercise application has no readiness probe: a ready container therefore does not guarantee correct business behavior.",
      "fr": "Cette application d’exercice n’a pas de sonde de disponibilité : un conteneur prêt ne garantit donc pas une fonction métier correcte."
    }
  },
  {
    "type": "h2",
    "id": "troubleshooting-reference",
    "text": {
      "en": "Troubleshooting reference",
      "fr": "Référence de dépannage"
    }
  },
  {
    "type": "list",
    "items": [
      {
        "en": "`Pending`: inspect scheduling, resources and volumes using `describe`.",
        "fr": "`Pending` : examinez le scheduling, les ressources et les volumes dans `describe`."
      },
      {
        "en": "`ImagePullBackOff`: inspect the image name, registry, network and permissions.",
        "fr": "`ImagePullBackOff` : examinez le nom de l’image, le registre, le réseau et les autorisations."
      },
      {
        "en": "`CreateContainerConfigError`: check referenced ConfigMaps and Secrets, among other configuration.",
        "fr": "`CreateContainerConfigError` : vérifiez notamment les ConfigMaps et Secrets référencés."
      },
      {
        "en": "Restarts: compare current and previous logs with termination state.",
        "fr": "Redémarrages : comparez les logs courants et précédents avec l’état de terminaison."
      },
      {
        "en": "`Forbidden`: check identity and permissions; do not automatically grant administrator access.",
        "fr": "`Forbidden` : vérifiez l’identité et les permissions ; n’accordez pas automatiquement des droits administrateur."
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
      "en": "Without changing the cluster, produce a diagnosis answering four questions:\n1. Which image and command does the Deployment request now?\n2. How many replicas are available?\n3. On which node is the Pod running?\n4. What evidence shows startup succeeded, and what does it not prove?",
      "fr": "Sans modifier le cluster, produisez un diagnostic répondant à quatre questions :\n1. Quelle image et quelle commande le Deployment demande-t-il maintenant ?\n2. Combien de répliques sont disponibles ?\n3. Sur quel nœud tourne le Pod ?\n4. Quels éléments prouvent que le démarrage a réussi, et que ne prouvent-ils pas ?"
    },
    "hints": [
      {
        "en": "YAML describes desired state; `status` describes observed state.",
        "fr": "Le YAML décrit l’état demandé ; `status` décrit l’état observé."
      },
      {
        "en": "Combine YAML, `wide` output and logs.",
        "fr": "Combinez YAML, affichage `wide` et logs."
      }
    ],
    "solution": [
      {
        "type": "code",
        "lang": "bash",
        "code": "k -n lab-troubleshooting get deployment broken-app -o yaml\nk -n lab-troubleshooting get deployment broken-app\nk -n lab-troubleshooting get pods -l app=broken-app -o wide\nk -n lab-troubleshooting logs deployment/broken-app --tail=20"
      },
      {
        "type": "p",
        "text": {
          "en": "The manifest shows the image and corrected command. The Deployment should have one available replica. The `NODE` column identifies its node. Rollout success, Pod status and the startup log agree, but they do not replace a functional test of a real application.",
          "fr": "Le manifest indique l’image et la commande corrigée. Le Deployment doit avoir une réplique disponible. La colonne `NODE` identifie son nœud. La réussite du rollout, l’état du Pod et le log de démarrage concordent, mais ne remplacent pas un test fonctionnel d’une véritable application."
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
          "en": "`CrashLoopBackOff` is…",
          "fr": "`CrashLoopBackOff` est…"
        },
        "options": [
          {
            "en": "The exact root cause",
            "fr": "La cause exacte de la panne"
          },
          {
            "en": "A wait between repeated restarts",
            "fr": "Une attente entre des redémarrages répétés"
          },
          {
            "en": "Proof of a network failure",
            "fr": "Une preuve de panne réseau"
          }
        ],
        "correct": 1,
        "explanation": {
          "en": "You still need to investigate why the container exits.",
          "fr": "Il faut encore rechercher pourquoi le conteneur se termine."
        }
      },
      {
        "question": {
          "en": "Where should you fix the command of a Pod managed by a Deployment?",
          "fr": "Où corriger la commande d’un Pod géré par un Deployment ?"
        },
        "options": [
          {
            "en": "In the Deployment template",
            "fr": "Dans le modèle du Deployment"
          },
          {
            "en": "Only in the existing Pod",
            "fr": "Uniquement dans le Pod existant"
          },
          {
            "en": "In the logs",
            "fr": "Dans les logs"
          }
        ],
        "correct": 0,
        "explanation": {
          "en": "The controller recreates Pods from this template.",
          "fr": "Le contrôleur recrée les Pods à partir de ce modèle."
        }
      },
      {
        "question": {
          "en": "`logs --previous` reads…",
          "fr": "`logs --previous` consulte…"
        },
        "options": [
          {
            "en": "All historical cluster logs",
            "fr": "Tous les logs historiques du cluster"
          },
          {
            "en": "Your computer's files",
            "fr": "Les fichiers de votre ordinateur"
          },
          {
            "en": "Logs from the previous container instance, if available",
            "fr": "Les logs de l’instance précédente du conteneur, si disponibles"
          }
        ],
        "correct": 2,
        "explanation": {
          "en": "This command is not a permanent archival system.",
          "fr": "Cette commande n’est pas un système d’archivage permanent."
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
    "code": "k delete namespace lab-troubleshooting"
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
      "en": "Observe, form a hypothesis, find evidence, correct desired state and verify the result.",
      "fr": "Observez, formulez une hypothèse, cherchez une preuve, corrigez l’état demandé puis vérifiez le résultat."
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
        "en": "https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/",
        "fr": "https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/"
      },
      {
        "en": "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/",
        "fr": "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/"
      }
    ]
  }
] satisfies Block[])]
};
