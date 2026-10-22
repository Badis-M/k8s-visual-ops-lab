import type { Block, Chapter } from "../types";
import { sharedLabIntroduction } from "../shared-lab-introduction";

export const configmapsSecrets: Chapter = {
  "id": "configmaps-secrets",
  "level": 1,
  "title": {
    "en": "ConfigMaps and Secrets",
    "fr": "ConfigMaps et Secrets"
  },
  "summary": {
    "en": "Separate configuration from images, protect sensitive values and distinguish update mechanisms.",
    "fr": "Séparez configuration et image, protégez les valeurs sensibles et distinguez les mécanismes de mise à jour."
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
        "en": "Supply configuration without rebuilding an image.",
        "fr": "Fournir une configuration sans reconstruire une image."
      },
      {
        "en": "Reference a ConfigMap and Secret from a container.",
        "fr": "Référencer un ConfigMap et un Secret depuis un conteneur."
      },
      {
        "en": "Observe when a change becomes visible.",
        "fr": "Observer quand une modification devient visible."
      }
    ]
  },
  {
    "type": "h2",
    "id": "separate-configuration-from-the-image",
    "text": {
      "en": "Separate configuration from the image",
      "fr": "Séparer la configuration de l’image"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Our container will always run the same image. Its configuration will come from Kubernetes objects: a ConfigMap for the greeting and a Secret for a dummy value.",
      "fr": "Notre conteneur exécutera toujours la même image. Sa configuration viendra d’objets Kubernetes : un ConfigMap pour le message d’accueil et un Secret pour une valeur factice."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "A Secret is not automatically a secure vault. Base64 used in its `data` field is not encryption. Protection depends on access controls and cluster storage configuration, among other factors.",
      "fr": "Un Secret n’est pas un coffre-fort automatique. Le base64 utilisé dans son champ `data` n’est pas du chiffrement. La protection dépend notamment des accès et de la configuration du stockage du cluster."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Use only the supplied dummy value. Do not enter a real password.",
      "fr": "Utilisez uniquement la valeur factice fournie. N’entrez aucun véritable mot de passe."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k get namespace lab-config"
  },
  {
    "type": "p",
    "text": {
      "en": "After confirming `NotFound`, create the objects.",
      "fr": "Après avoir confirmé `NotFound`, créez les objets."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k create namespace lab-config\n\nk -n lab-config create configmap app-settings \\\n  --from-literal=GREETING=Hello\n\nk -n lab-config create secret generic demo-credentials \\\n  --from-literal=password=training-only-not-a-real-secret\n\nk -n lab-config get configmap app-settings\nk -n lab-config describe secret demo-credentials"
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
      "en": "The ConfigMap has one entry. `describe secret` shows a `password` key and its size without displaying the value. This does not mean the value is inaccessible to a user authorized to read the Secret.",
      "fr": "Le ConfigMap possède une entrée. `describe secret` indique une clé `password` et sa taille, sans afficher sa valeur. Cela ne signifie pas que cette valeur serait inaccessible à un utilisateur autorisé à lire le Secret."
    }
  },
  {
    "type": "h2",
    "id": "consume-the-configuration",
    "text": {
      "en": "Consume the configuration",
      "fr": "Consommer la configuration"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "The following Deployment exposes the greeting as the `GREETING` environment variable. The Secret is mounted as a read-only file.",
      "fr": "Le Deployment suivant expose le message comme variable d’environnement `GREETING`. Le Secret est monté en lecture seule dans un fichier."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "The application prints only the greeting and confirmation that the file exists. It does not print the password.",
      "fr": "L’application imprime uniquement le message et la confirmation que le fichier existe. Elle n’affiche pas le mot de passe."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k -n lab-config apply -f - <<'YAML'\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: configured-app\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: configured-app\n  template:\n    metadata:\n      labels:\n        app: configured-app\n    spec:\n      containers:\n        - name: app\n          image: busybox:1.37.0\n          command:\n            - sh\n            - -c\n            - |\n              printf 'Greeting: %s\\n' \"$GREETING\"\n              if [ -s /run/demo/password ]; then\n                printf 'Credential file is present\\n'\n              else\n                printf 'Credential file is missing\\n' >&2\n                exit 1\n              fi\n              sleep 3600\n          env:\n            - name: GREETING\n              valueFrom:\n                configMapKeyRef:\n                  name: app-settings\n                  key: GREETING\n          volumeMounts:\n            - name: credentials\n              mountPath: /run/demo\n              readOnly: true\n      volumes:\n        - name: credentials\n          secret:\n            secretName: demo-credentials\nYAML\n\nk -n lab-config rollout status deployment/configured-app --timeout=120s\nk -n lab-config logs deployment/configured-app"
  },
  {
    "type": "h3",
    "text": {
      "en": "Expected output",
      "fr": "Sortie attendue"
    }
  },
  {
    "type": "code",
    "lang": "text",
    "code": "Greeting: Hello\nCredential file is present",
    "output": true
  },
  {
    "type": "h3",
    "text": {
      "en": "Explanation",
      "fr": "Explication "
    }
  },
  {
    "type": "p",
    "text": {
      "en": "`configMapKeyRef` references a specific key. The volume creates a file for each Secret key. Referenced objects reside in the same namespace as the Pod.",
      "fr": "`configMapKeyRef` référence une clé précise. Le volume crée un fichier pour chaque clé du Secret. Les objets référencés résident dans le même namespace que le Pod."
    }
  },
  {
    "type": "h2",
    "id": "change-the-message",
    "text": {
      "en": "Change the message",
      "fr": "Modifier le message"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Change the ConfigMap, then inspect the existing container environment. You will still see `Hello`: an already injected environment variable is not automatically refreshed.",
      "fr": "Modifiez le ConfigMap, puis interrogez l’environnement du conteneur existant. Vous observerez encore `Hello` : une variable d’environnement déjà injectée n’est pas actualisée automatiquement."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Then recreate the Pods through a Deployment restart and verify the new greeting.",
      "fr": "Recréez ensuite les Pods au moyen d’un redémarrage du Deployment et vérifiez le nouveau message."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k -n lab-config patch configmap app-settings --type=merge \\\n  -p '{\"data\":{\"GREETING\":\"Bonjour\"}}'\n\nk -n lab-config exec deployment/configured-app -- printenv GREETING\n\nk -n lab-config rollout restart deployment/configured-app\nk -n lab-config rollout status deployment/configured-app --timeout=120s\n\nk -n lab-config exec deployment/configured-app -- printenv GREETING\nk -n lab-config logs deployment/configured-app"
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
      "en": "Before restart: `Hello`. Afterwards: `Bonjour`.",
      "fr": "Avant le redémarrage : `Hello`. Après : `Bonjour`."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "ConfigMap/Secret volumes can receive updates after a delay, but the application must reread the files. `subPath` mounts do not receive these updates. This differs from environment-variable injection.",
      "fr": "Les volumes ConfigMap/Secret peuvent recevoir des mises à jour après un délai, mais l’application doit relire les fichiers. Les montages `subPath` ne reçoivent pas ces mises à jour. Ce comportement est distinct de l’injection par variable d’environnement."
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
        "en": "Missing key or object: inspect Pod events and compare names.",
        "fr": "Clé ou objet absent : inspectez les événements du Pod et comparez les noms."
      },
      {
        "en": "New greeting not visible: check how configuration is consumed and whether the Pod was recreated.",
        "fr": "Nouveau message invisible : vérifiez comment la configuration est consommée et si le Pod a été recréé."
      },
      {
        "en": "Secret in Git, logs or screenshots: keep real values out of them; base64 does not protect them.",
        "fr": "Secret dans Git, logs ou capture d’écran : évitez d’y placer de vraies valeurs ; base64 ne les protège pas."
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
      "en": "Add `APP_MODE=training` to the ConfigMap. Inject this key into the Deployment as a second environment variable, without removing `GREETING` or the Secret mount. Verify its value in the new container.",
      "fr": "Ajoutez `APP_MODE=training` au ConfigMap. Injectez cette clé dans le Deployment comme seconde variable d’environnement, sans supprimer `GREETING` ni le montage du Secret. Vérifiez sa valeur dans le nouveau conteneur."
    },
    "hints": [
      {
        "en": "Add the key first, then its reference in `env`.",
        "fr": "Ajoutez d’abord la clé, puis sa référence dans `env`."
      },
      {
        "en": "Changing the Deployment's Pod template triggers a rollout.",
        "fr": "Une modification du modèle de Pod du Deployment déclenche un déploiement."
      }
    ],
    "solution": [
      {
        "type": "code",
        "lang": "bash",
        "code": "k -n lab-config patch configmap app-settings --type=merge \\\n  -p '{\"data\":{\"APP_MODE\":\"training\"}}'\n\nk -n lab-config patch deployment configured-app --type=strategic \\\n  -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"app\",\"env\":[{\"name\":\"APP_MODE\",\"valueFrom\":{\"configMapKeyRef\":{\"name\":\"app-settings\",\"key\":\"APP_MODE\"}}}]}]}}}}'\n\nk -n lab-config rollout status deployment/configured-app --timeout=120s\nk -n lab-config exec deployment/configured-app -- printenv APP_MODE\nk -n lab-config exec deployment/configured-app -- printenv GREETING"
      },
      {
        "type": "p",
        "text": {
          "en": "The outputs are `training`, then `Bonjour`. The strategic merge patch merges container and environment entries by name; it preserves other entries.",
          "fr": "Les sorties sont `training` puis `Bonjour`. Le patch stratégique fusionne les entrées des conteneurs et variables par leur nom ; il préserve les autres entrées."
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
          "en": "Base64 in a Secret provides…",
          "fr": "Le base64 d’un Secret fournit…"
        },
        "options": [
          {
            "en": "Encryption",
            "fr": "Un chiffrement"
          },
          {
            "en": "Encoding",
            "fr": "Un encodage"
          },
          {
            "en": "Authorization",
            "fr": "Une autorisation"
          }
        ],
        "correct": 1,
        "explanation": {
          "en": "Encoding is reversible without a key; it is not cryptographic protection.",
          "fr": "L’encodage est réversible sans clé ; il ne constitue pas une protection cryptographique."
        }
      },
      {
        "question": {
          "en": "A variable sourced from a ConfigMap changes in an existing container…",
          "fr": "Une variable issue d’un ConfigMap est modifiée dans un conteneur existant…"
        },
        "options": [
          {
            "en": "Automatically and immediately",
            "fr": "Automatiquement et immédiatement"
          },
          {
            "en": "On every read",
            "fr": "À chaque lecture"
          },
          {
            "en": "It does not; recreate the container to inject the new value",
            "fr": "Non ; recréez le conteneur pour injecter la nouvelle valeur"
          }
        ],
        "correct": 2,
        "explanation": {
          "en": "Environment injection occurs when the container is created.",
          "fr": "L’injection d’environnement a lieu lors de la création du conteneur."
        }
      },
      {
        "question": {
          "en": "Why avoid printing the password in logs?",
          "fr": "Pourquoi ne pas afficher le mot de passe dans les logs ?"
        },
        "options": [
          {
            "en": "Logs may be viewed or retained elsewhere",
            "fr": "Les logs peuvent être consultés ou conservés ailleurs"
          },
          {
            "en": "Kubernetes forbids all output",
            "fr": "Kubernetes interdit toute sortie"
          },
          {
            "en": "The file would be deleted",
            "fr": "Le fichier serait supprimé"
          }
        ],
        "correct": 0,
        "explanation": {
          "en": "An application can leak a secret even when its storage is properly protected.",
          "fr": "Une application peut divulguer un secret même si son stockage est correctement protégé."
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
    "code": "k delete namespace lab-config"
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
      "en": "Separate configuration from images, protect sensitive values and distinguish update mechanisms.",
      "fr": "Séparez configuration et image, protégez les valeurs sensibles et distinguez les mécanismes de mise à jour."
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
        "en": "https://kubernetes.io/docs/concepts/configuration/configmap/",
        "fr": "https://kubernetes.io/docs/concepts/configuration/configmap/"
      },
      {
        "en": "https://kubernetes.io/docs/concepts/configuration/secret/",
        "fr": "https://kubernetes.io/docs/concepts/configuration/secret/"
      }
    ]
  }
] satisfies Block[])]
};
