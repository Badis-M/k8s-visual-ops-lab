import type { Block, Chapter } from "../types";
import { sharedLabIntroduction } from "../shared-lab-introduction";

export const labelsSelectors: Chapter = {
  "id": "labels-selectors",
  "level": 1,
  "title": {
    "en": "Labels, selectors and annotations",
    "fr": "Labels, sélecteurs et annotations"
  },
  "summary": {
    "en": "Use labels to select, annotations to describe, and verify selections before making bulk changes.",
    "fr": "Utilisez les labels pour sélectionner, les annotations pour décrire, et vérifiez les sélections avant toute modification groupée."
  },
  "minutes": 35,
  "prerequisites": [
    "pods",
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
        "en": "Classify resources using labels.",
        "fr": "Classer des ressources avec des labels."
      },
      {
        "en": "Combine selection criteria.",
        "fr": "Combiner des critères de sélection."
      },
      {
        "en": "Distinguish selection metadata from descriptive annotations.",
        "fr": "Distinguer métadonnées de sélection et annotations descriptives."
      }
    ]
  },
  {
    "type": "h2",
    "id": "classify-resources",
    "text": {
      "en": "Classify resources",
      "fr": "Classer les ressources"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "A name identifies a resource; labels let you find it along several dimensions. Classify three Pods by application and environment.",
      "fr": "Un nom identifie une ressource ; les labels permettent de la retrouver selon plusieurs dimensions. Nous allons classer trois Pods par application et environnement."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k get namespace lab-labels"
  },
  {
    "type": "p",
    "text": {
      "en": "After confirming `NotFound`, create the resources.",
      "fr": "Après avoir confirmé `NotFound`, créez les ressources."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k create namespace lab-labels\n\nk -n lab-labels run api-dev \\\n  --image=busybox:1.37.0 --restart=Never \\\n  --labels=app=api,environment=dev -- sleep 3600\n\nk -n lab-labels run api-prod \\\n  --image=busybox:1.37.0 --restart=Never \\\n  --labels=app=api,environment=prod -- sleep 3600\n\nk -n lab-labels run worker-dev \\\n  --image=busybox:1.37.0 --restart=Never \\\n  --labels=app=worker,environment=dev -- sleep 3600\n\nk -n lab-labels wait --for=condition=Ready pod --all --timeout=120s\nk -n lab-labels get pods --show-labels"
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
      "en": "Find all three names and their two labels. These are standalone Pods: no Deployment will recreate them if deleted.",
      "fr": "Retrouvez les trois noms et leurs deux labels. Ici, ce sont des Pods autonomes : aucun Deployment ne les recréera si vous les supprimez."
    }
  },
  {
    "type": "h2",
    "id": "ask-precise-questions",
    "text": {
      "en": "Ask precise questions",
      "fr": "Poser des questions précises"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "A comma between two criteria means AND. Parenthesized expressions support set-based selection. Quotes protect these expressions from shell interpretation.",
      "fr": "Une virgule entre deux critères signifie ET. Les expressions entre parenthèses permettent une sélection par ensemble. Les guillemets protègent ces expressions du shell."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Before each command, predict which names will appear.",
      "fr": "Avant chaque commande, prédisez les noms qui seront affichés."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k -n lab-labels get pods -l app=api\nk -n lab-labels get pods -l 'app=api,environment=dev'\nk -n lab-labels get pods -l 'environment in (dev)'\nk -n lab-labels get pods -L app,environment"
  },
  {
    "type": "h3",
    "text": {
      "en": "Expected results",
      "fr": "Résultats attendus "
    }
  },
  {
    "type": "list",
    "items": [
      {
        "en": "First selection: `api-dev` and `api-prod`.",
        "fr": "Première sélection : `api-dev` et `api-prod`."
      },
      {
        "en": "Second: `api-dev`.",
        "fr": "Deuxième : `api-dev`."
      },
      {
        "en": "Third: `api-dev` and `worker-dev`.",
        "fr": "Troisième : `api-dev` et `worker-dev`."
      },
      {
        "en": "Last: all Pods, with two additional columns.",
        "fr": "Dernière : tous les Pods, avec deux colonnes supplémentaires."
      }
    ]
  },
  {
    "type": "h2",
    "id": "add-information-without-changing-identity",
    "text": {
      "en": "Add information without changing identity",
      "fr": "Ajouter des informations sans changer l’identité"
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Add a team label to the development API, then an annotation describing its educational role.",
      "fr": "Ajoutez un label d’équipe à l’API de développement, puis une annotation décrivant son rôle pédagogique."
    }
  },
  {
    "type": "p",
    "text": {
      "en": "Annotations store metadata that label selectors do not query. Some tools interpret specific annotations, but our annotation has no runtime effect.",
      "fr": "Les annotations stockent des métadonnées que les sélecteurs de labels ne consultent pas. Certains outils interprètent des annotations spécifiques, mais notre annotation n’a aucun effet d’exécution."
    }
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "k -n lab-labels label pod api-dev team=platform\nk -n lab-labels annotate pod api-dev \\\n  academy.example/purpose='Label selection exercise'\n\nk -n lab-labels get pods -l team=platform\nk -n lab-labels get pod api-dev -o yaml"
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
      "en": "`api-dev` appears in the selection. In the YAML, distinguish `metadata.labels` from `metadata.annotations`. Do not put secrets in either.",
      "fr": "`api-dev` apparaît dans la sélection. Dans le YAML, distinguez `metadata.labels` et `metadata.annotations`. N’y placez pas de secrets."
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
        "en": "Empty result: check spelling, case and namespace.",
        "fr": "Résultat vide : vérifiez orthographe, casse et namespace."
      },
      {
        "en": "A label already exists: inspect its value; use `--overwrite` only for an intentional replacement.",
        "fr": "Un label existe déjà : inspectez sa valeur ; utilisez `--overwrite` uniquement si le remplacement est intentionnel."
      },
      {
        "en": "Changing labels on a managed Pod can alter selection by a Service or controller. For a Deployment, normally change the Pod template; its selector is immutable after creation.",
        "fr": "Modifier les labels d’un Pod géré peut modifier sa sélection par un Service ou un contrôleur. Dans un Deployment, modifiez normalement le modèle des Pods ; son sélecteur est immuable après création."
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
      "en": "Assign `team=platform` to both `api` application Pods, then select only the production Pod belonging to that team. Finally remove this label from both Pods.",
      "fr": "Attribuez `team=platform` aux deux Pods de l’application `api`, puis sélectionnez seulement celui de production appartenant à cette équipe. Retirez ensuite ce label des deux Pods."
    },
    "hints": [
      {
        "en": "`label` also accepts a selector.",
        "fr": "`label` accepte aussi un sélecteur."
      },
      {
        "en": "A `-` suffix removes a label.",
        "fr": "Un suffixe `-` retire un label."
      }
    ],
    "solution": [
      {
        "type": "code",
        "lang": "bash",
        "code": "k -n lab-labels label pods -l app=api team=platform --overwrite\nk -n lab-labels get pods -l 'team=platform,environment=prod'\nk -n lab-labels label pods -l app=api team-\nk -n lab-labels get pods -l team=platform"
      },
      {
        "type": "p",
        "text": {
          "en": "The intermediate selection contains `api-prod`. The final selection is empty because the labels were removed.",
          "fr": "La sélection intermédiaire contient `api-prod`. La dernière est vide, car les labels ont été retirés."
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
          "en": "`app=api,environment=dev` means…",
          "fr": "`app=api,environment=dev` signifie…"
        },
        "options": [
          {
            "en": "API or development",
            "fr": "API ou développement"
          },
          {
            "en": "API and development",
            "fr": "API et développement"
          },
          {
            "en": "All Pods",
            "fr": "Tous les Pods"
          }
        ],
        "correct": 1,
        "explanation": {
          "en": "Both criteria must match.",
          "fr": "Les deux critères doivent correspondre."
        }
      },
      {
        "question": {
          "en": "Where should a description not intended for selection go?",
          "fr": "Où placer une description non destinée à la sélection ?"
        },
        "options": [
          {
            "en": "Annotation",
            "fr": "Annotation"
          },
          {
            "en": "Namespace name",
            "fr": "Nom du namespace"
          },
          {
            "en": "Deployment selector",
            "fr": "Sélecteur du Deployment"
          }
        ],
        "correct": 0,
        "explanation": {
          "en": "An annotation is suitable for descriptive metadata.",
          "fr": "L’annotation est adaptée aux métadonnées descriptives."
        }
      },
      {
        "question": {
          "en": "Does adding `team=platform` grant permissions?",
          "fr": "Ajouter `team=platform` accorde-t-il des permissions ?"
        },
        "options": [
          {
            "en": "Yes",
            "fr": "Oui"
          },
          {
            "en": "Only in production",
            "fr": "Seulement en production"
          },
          {
            "en": "No, not by itself",
            "fr": "Non, pas par lui-même"
          }
        ],
        "correct": 2,
        "explanation": {
          "en": "The label classifies the resource; permissions depend on separate rules.",
          "fr": "Le label classe la ressource ; les autorisations dépendent de règles distinctes."
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
    "code": "k delete namespace lab-labels"
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
      "en": "Use labels to select, annotations to describe, and verify selections before making bulk changes.",
      "fr": "Utilisez les labels pour sélectionner, les annotations pour décrire, et vérifiez les sélections avant toute modification groupée."
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
        "en": "https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/",
        "fr": "https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/"
      }
    ]
  }
] satisfies Block[])]
};
