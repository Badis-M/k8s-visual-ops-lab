import type { Chapter, Block } from "../types";
import { labContext } from "../lesson-kit";
import manifest from "../../../lab/level-2/probes/web.yaml?raw";

export const probes: Chapter = {
  id: "probes",
  level: 2,
  minutes: 45,
  title: {
    en: "Liveness, readiness and startup probes",
    fr: "Probes liveness, readiness et startup",
  },
  summary: {
    en: "Design health signals that distinguish startup, routing eligibility and restart decisions, then observe an intentionally broken readiness check.",
    fr: "Concevoir des signaux distinguant démarrage, routage et redémarrage, puis observer une readiness volontairement cassée.",
  },
  prerequisites: ["pods", "services"],
  related: ["rollout-strategies", "incidents"],
  blocks: [
    ...([
      {
        type: "h2",
        id: "objectives",
        text: {
          en: "Make three different health decisions",
          fr: "Prendre trois décisions de santé distinctes",
        },
      },
      {
        type: "p",
        text: {
          en: "You will predict which probe removes traffic and which one restarts a container, inspect endpoint readiness, and repair a misconfigured path without conflating readiness with process liveness. The experiment uses nginx and a Service, so it requires only the baseline cluster; it does not need metrics-server or an ingress controller.",
          fr: "Vous prédirez quelle probe retire le trafic et laquelle redémarre un conteneur, examinerez les endpoints et corrigerez un chemin erroné sans confondre disponibilité au trafic et vie du processus. L’expérience utilise nginx et un Service : elle ne nécessite ni metrics-server ni contrôleur ingress.",
        },
      },
      {
        type: "h2",
        id: "model",
        text: {
          en: "Startup gates checks, readiness gates routing",
          fr: "Startup conditionne les checks, readiness le routage",
        },
      },
      {
        type: "p",
        text: {
          en: "A startup probe gives slow initialization its own failure budget. Until it succeeds, liveness and readiness do not run for that container. Readiness failure marks the container unready; it does not restart it. Liveness failure after the configured threshold causes the kubelet to restart the container according to the Pod restart policy. Kubernetes is acting on your declared signals, not inferring application correctness.",
          fr: "Une startup probe donne un budget propre à l’initialisation lente. Tant qu’elle ne réussit pas, liveness et readiness ne s’exécutent pas pour ce conteneur. Un échec de readiness le marque non prêt sans le redémarrer. Après le seuil configuré, un échec de liveness provoque son redémarrage par le kubelet selon la politique du Pod. Kubernetes agit sur les signaux déclarés, sans déduire la justesse métier.",
        },
      },
    ] satisfies Block[]),
    ...labContext("lab-probes"),
    ...([
      {
        type: "code",
        lang: "yaml",
        code: manifest,
        title: "lab/level-2/probes/web.yaml",
      },
      {
        type: "h2",
        id: "design",
        text: {
          en: "Choose signals with different failure scope",
          fr: "Choisir des signaux aux périmètres distincts",
        },
      },
      {
        type: "p",
        text: {
          en: "Liveness should detect a condition a restart can fix, such as a deadlocked process. A dependency shared by every replica is usually a poor liveness target: a database outage could restart all callers and amplify the incident. Readiness can depend on ability to serve a request, but a global dependency check that removes every endpoint may be worse than returning a controlled degraded response. Decide deliberately.",
          fr: "La liveness doit détecter une situation qu’un redémarrage peut corriger, comme un processus bloqué. Une dépendance partagée est généralement un mauvais signal : une panne de base peut faire redémarrer tous les clients et amplifier l’incident. La readiness peut refléter la capacité à traiter une requête, mais retirer tous les endpoints face à une dépendance globale peut être pire qu’une réponse dégradée contrôlée.",
        },
      },
      {
        type: "p",
        text: {
          en: "The example uses the same nginx path to make lifecycle behavior observable, not to recommend one endpoint for every application. periodSeconds sets cadence, timeoutSeconds bounds each attempt, and failureThreshold controls consecutive failures before action. Startup here has approximately a 60-second nominal budget (30 × 2), not an exact wall-clock SLA. HTTP success is status 200–399; successThreshold must be 1 for startup and liveness.",
          fr: "L’exemple utilise le même chemin nginx pour observer le cycle de vie, pas pour recommander un endpoint unique partout. periodSeconds fixe la cadence, timeoutSeconds borne un essai et failureThreshold contrôle les échecs consécutifs. Ici startup donne environ 60 secondes nominales (30 × 2), pas un SLA exact. Le succès HTTP vaut 200–399 ; successThreshold doit valoir 1 pour startup et liveness.",
        },
      },
      {
        type: "h2",
        id: "exercise",
        text: {
          en: "Observe healthy endpoints",
          fr: "Observer des endpoints prêts",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-probes apply -f lab/level-2/probes/web.yaml\nk -n lab-probes rollout status deployment/probed --timeout=120s\nk -n lab-probes get pods\nk -n lab-probes get endpointslices -l kubernetes.io/service-name=probed -o yaml",
      },
      {
        type: "p",
        text: {
          en: "Expected: two Ready Pods and EndpointSlice entries with ready: true. The kubelet contacts the Pod directly for HTTP probes; it does not probe through the Service. A successful port-forward is therefore not proof of the ordinary Service data path. Inspect EndpointSlices and, when testing real routing, use a client inside the cluster.",
          fr: "Attendu : deux Pods Ready et des entrées EndpointSlice avec ready: true. Le kubelet contacte directement le Pod pour les probes HTTP, sans passer par le Service. Un port-forward réussi ne prouve donc pas le chemin réseau habituel. Examinez EndpointSlices et utilisez un client interne pour tester réellement le routage.",
        },
      },
      {
        type: "h2",
        id: "failure",
        text: {
          en: "Break readiness without killing the process",
          fr: "Casser la readiness sans tuer le processus",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: 'k -n lab-probes patch deployment probed --type=strategic -p \'{"spec":{"template":{"spec":{"containers":[{"name":"web","readinessProbe":{"httpGet":{"path":"/missing-health","port":80}}}]}}}}\'\nk -n lab-probes get pods\nk -n lab-probes describe deployment probed\nk -n lab-probes get events --sort-by=.metadata.creationTimestamp',
      },
      {
        type: "p",
        text: {
          en: "Changing the template starts a rollout. New replicas should fail readiness with HTTP 404, while old ready replicas can remain because the default rolling strategy protects some availability. Do not conclude that every Service endpoint disappeared: compare old and new Pod readiness and EndpointSlices. New unready Pods should not restart solely because of readiness failure; use their restart counters as evidence.",
          fr: "Modifier le template démarre un rollout. Les nouveaux réplicas doivent échouer en readiness avec HTTP 404, tandis que d’anciens réplicas prêts peuvent rester grâce à la stratégie progressive par défaut. Ne concluez pas que tous les endpoints ont disparu : comparez anciens et nouveaux Pods et EndpointSlices. Les nouveaux Pods ne doivent pas redémarrer pour la seule readiness ; examinez les compteurs.",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-probes get pods -o 'custom-columns=NAME:.metadata.name,READY:.status.containerStatuses[0].ready,RESTARTS:.status.containerStatuses[0].restartCount'\nk -n lab-probes get endpointslices -l kubernetes.io/service-name=probed -o yaml\nk -n lab-probes rollout undo deployment/probed\nk -n lab-probes rollout status deployment/probed --timeout=120s",
      },
      {
        type: "h2",
        id: "diagnostics",
        text: {
          en: "When a probe itself is wrong",
          fr: "Quand la probe est elle-même incorrecte",
        },
      },
      {
        type: "p",
        text: {
          en: "Inspect Events for refusal, timeout, or HTTP failure, then verify container port, path and listening address. An exec probe runs inside the container and needs the referenced binary; shell syntax requires an explicit shell. TCP probes show a connection can open but not that the application can answer correctly. A gRPC probe needs the health protocol and has its own constraints. Increasing initialDelaySeconds cannot fix a wrong path or a listener bound only to loopback.",
          fr: "Les Events distinguent refus, timeout et erreur HTTP ; vérifiez ensuite port, chemin et adresse d’écoute. Une probe exec s’exécute dans le conteneur et nécessite le binaire ; la syntaxe shell exige un shell explicite. TCP prouve l’ouverture d’une connexion, pas la réponse métier. gRPC nécessite son protocole de santé et ses contraintes. Augmenter initialDelaySeconds ne corrige pas un mauvais chemin ni une écoute limitée au loopback.",
        },
      },
      {
        type: "h2",
        id: "quiz",
        text: {
          en: "Explain the action",
          fr: "Expliquer l’action",
        },
      },
      {
        type: "quiz",
        questions: [
          {
            question: {
              en: "What does a readiness failure do by itself?",
              fr: "Que fait un échec de readiness à lui seul ?",
            },
            options: [
              {
                en: "Restarts the container",
                fr: "Redémarre le conteneur",
              },
              {
                en: "Marks it unready for normal Service routing",
                fr: "Le marque non prêt pour le routage habituel",
              },
              {
                en: "Deletes the Deployment",
                fr: "Supprime le Deployment",
              },
            ],
            correct: 1,
            explanation: {
              en: "Readiness changes eligibility; liveness and startup failures can cause restarts.",
              fr: "La readiness change l’éligibilité ; liveness et startup peuvent déclencher un redémarrage.",
            },
          },
          {
            question: {
              en: "When do liveness checks begin with a startup probe?",
              fr: "Quand la liveness commence-t-elle avec une startup probe ?",
            },
            options: [
              {
                en: "After startup succeeds",
                fr: "Après le succès de startup",
              },
              {
                en: "Immediately in parallel",
                fr: "Immédiatement en parallèle",
              },
              {
                en: "After a Service is created",
                fr: "Après création d’un Service",
              },
            ],
            correct: 0,
            explanation: {
              en: "Startup success gates the other probes for that container.",
              fr: "Le succès startup conditionne les autres probes du conteneur.",
            },
          },
          {
            question: {
              en: "Should a shared database outage always fail liveness?",
              fr: "Une panne de base partagée doit-elle toujours faire échouer la liveness ?",
            },
            options: [
              {
                en: "Yes, restart every caller",
                fr: "Oui, redémarrer tous les clients",
              },
              {
                en: "Yes, to add replicas",
                fr: "Oui, pour ajouter des réplicas",
              },
              {
                en: "No, a restart may amplify the outage",
                fr: "Non, les redémarrages peuvent amplifier la panne",
              },
            ],
            correct: 2,
            explanation: {
              en: "Probe design must account for whether a restart can improve the failure.",
              fr: "La conception doit considérer si redémarrer peut améliorer la situation.",
            },
          },
        ],
      },
      {
        type: "challenge",
        title: {
          en: "Budget for a slow start",
          fr: "Prévoir un démarrage lent",
        },
        task: {
          en: "A process normally needs 80 seconds before listening. Configure a nominal 120-second startup allowance with a 5-second cadence, while preserving useful readiness and liveness. Explain why an endpoint path must still be valid.",
          fr: "Un processus demande normalement 80 secondes avant écoute. Configurez une tolérance startup nominale de 120 secondes à cadence de 5 secondes, en conservant readiness et liveness utiles. Expliquez pourquoi le chemin doit rester valide.",
        },
        hints: [
          {
            en: "Threshold times cadence gives the nominal budget.",
            fr: "Seuil multiplié par cadence donne le budget nominal.",
          },
          {
            en: "Changing the allowance does not change HTTP semantics.",
            fr: "Changer la tolérance ne change pas la sémantique HTTP.",
          },
        ],
        solution: [
          {
            type: "code",
            lang: "bash",
            code: 'k -n lab-probes patch deployment probed --type=strategic -p \'{"spec":{"template":{"spec":{"containers":[{"name":"web","startupProbe":{"periodSeconds":5,"failureThreshold":24}}]}}}}\'\nk -n lab-probes rollout status deployment/probed --timeout=180s',
          },
          {
            type: "p",
            text: {
              en: "24 × 5 gives a nominal 120 seconds. Scheduling, pull time and other delays remain separate; use Events to identify them. Keep a valid startup endpoint and avoid probing an external shared dependency as a restart signal.",
              fr: "24 × 5 donne 120 secondes nominales. Placement, téléchargement et autres délais restent distincts ; les Events permettent de les identifier. Gardez un endpoint startup valide et évitez une dépendance externe partagée comme signal de redémarrage.",
            },
          },
        ],
      },
      {
        type: "h2",
        id: "cleanup",
        text: {
          en: "Cleanup",
          fr: "Nettoyage",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k delete namespace lab-probes",
      },
    ] satisfies Block[]),
  ],
};
