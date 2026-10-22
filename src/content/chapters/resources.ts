import type { Chapter, Block } from "../types";
import { labContext } from "../lesson-kit";
import manifest from "../../../lab/level-2/resources/containers.yaml?raw";

export const resources: Chapter = {
  id: "resources",
  level: 2,
  minutes: 45,
  title: {
    en: "Resource requests and limits",
    fr: "Requests et limits de ressources",
  },
  summary: {
    en: "Separate scheduling promises from runtime boundaries, diagnose unschedulable workloads and reason about throttling and memory failures.",
    fr: "Distinguer promesses d’ordonnancement et limites d’exécution, diagnostiquer les workloads non ordonnançables et raisonner sur throttling et mémoire.",
  },
  prerequisites: ["pods"],
  related: ["hpa", "vertical-cluster-scaling"],
  blocks: [
    ...([
      {
        type: "h2",
        id: "objectives",
        text: {
          en: "Place workloads without guessing capacity",
          fr: "Placer les workloads sans deviner la capacité",
        },
      },
      {
        type: "p",
        text: {
          en: "You will compare CPU and memory units, explain what the scheduler reserves, inspect a deliberately oversized Pod and choose a safer resource budget. No metrics-server is required for the core exercise: scheduling evidence comes from Pod conditions, Events and node allocatable values. CPU usage measurement needs a separate metrics pipeline.",
          fr: "Vous comparerez les unités CPU et mémoire, expliquerez les réservations du scheduler, examinerez un Pod volontairement trop grand et choisirez un budget plus adapté. L’exercice central ne nécessite pas metrics-server : conditions de Pod, Events et allocatable des nœuds suffisent. Mesurer l’usage CPU nécessite une chaîne de métriques distincte.",
        },
      },
      {
        type: "h2",
        id: "model",
        text: {
          en: "Requests schedule; limits constrain",
          fr: "Les requests ordonnancent, les limits contraignent",
        },
      },
      {
        type: "p",
        text: {
          en: "A CPU request of 50m is 0.05 CPU, not fifty megabytes. Memory uses byte units: 128Mi is 134217728 bytes, whereas 128M is 128000000. The scheduler compares requested resources with node allocatable capacity and existing reservations. It does not generally schedule by live utilization, so an idle node can still reject an over-reserved Pod.",
          fr: "Une request CPU de 50m vaut 0,05 CPU, pas cinquante mégaoctets. La mémoire utilise des octets : 128Mi valent 134217728 octets, contre 128000000 pour 128M. Le scheduler compare les requests à la capacité allocatable et aux réservations existantes. Il n’ordonnance généralement pas selon l’usage instantané : un nœud inactif peut refuser un Pod trop réservé.",
        },
      },
    ] satisfies Block[]),
    ...labContext("lab-resources"),
    ...([
      {
        type: "code",
        lang: "yaml",
        code: manifest,
        title: "lab/level-2/resources/containers.yaml",
      },
      {
        type: "h2",
        id: "runtime",
        text: {
          en: "CPU time and memory pressure fail differently",
          fr: "Temps CPU et pression mémoire échouent différemment",
        },
      },
      {
        type: "p",
        text: {
          en: "A CPU limit typically constrains CPU time through throttling; it does not kill a container for wanting more CPU. A memory limit can result in an OOM kill when enforcement requires it. Node-wide pressure may also evict Pods before an individual container reaches its own limit. Requests influence placement and eviction decisions but are not a private physical memory partition.",
          fr: "Une limite CPU contraint généralement le temps CPU par throttling ; elle ne tue pas un conteneur qui souhaite davantage de CPU. Une limite mémoire peut entraîner un OOM kill lors de son application. Une pression globale peut aussi provoquer des évictions avant qu’un conteneur atteigne sa limite. Les requests influencent placement et éviction sans constituer une partition physique privée.",
        },
      },
      {
        type: "p",
        text: {
          en: "If a limit is set without a request, Kubernetes can default the request to that limit unless admission has supplied another default. LimitRange can set defaults or constrain per-container values; ResourceQuota constrains aggregate namespaced usage. Admission rejection is not a scheduler failure: a rejected object may never become a Pod. For multi-container Pods, inspect the effective aggregate request including init-container behavior and overhead rather than counting only the main process.",
          fr: "Si une limite est définie sans request, Kubernetes peut reprendre la limite comme request, sauf défaut fourni par l’admission. LimitRange impose des valeurs par conteneur ; ResourceQuota limite l’usage agrégé d’un namespace. Un rejet d’admission n’est pas un échec du scheduler : l’objet peut ne jamais devenir un Pod. Pour plusieurs conteneurs, examinez la request effective, avec init containers et overhead, pas seulement le processus principal.",
        },
      },
      {
        type: "h2",
        id: "exercise",
        text: {
          en: "Compare a schedulable and oversized Pod",
          fr: "Comparer un Pod ordonnançable et un Pod trop grand",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-resources apply -f lab/level-2/resources/containers.yaml\nk -n lab-resources get pods -o wide\nk -n lab-resources describe pod too-large\nk get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.allocatable.cpu,MEMORY:.status.allocatable.memory",
      },
      {
        type: "p",
        text: {
          en: "Expected: bounded can become Running; too-large remains Pending with FailedScheduling because 1000 CPUs and 1Ti memory exceed the local node capacity. Read the actual Events: additional taints or node conditions can be reported alongside Insufficient cpu/memory. A bigger cluster does not justify arbitrary requests; the workload should ask for its measured needs.",
          fr: "Attendu : bounded peut devenir Running ; too-large reste Pending avec FailedScheduling car 1000 CPU et 1Ti dépassent les nœuds locaux. Lisez les Events réels : taints et conditions peuvent s’ajouter à Insufficient cpu/memory. Un cluster plus grand ne justifie pas des requests arbitraires ; le workload doit demander ses besoins mesurés.",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-resources get pod bounded -o jsonpath='{.status.qosClass}{\"\\n\"}'\nk describe nodes\nk -n lab-resources get resourcequota,limitrange",
      },
      {
        type: "p",
        text: {
          en: "bounded is Burstable because its CPU/memory requests and limits differ. Guaranteed requires CPU and memory requests equal to limits for every container under the usual per-container rules; BestEffort has neither. QoS is one input to node-pressure handling, not an uptime guarantee. Never infer that a successful kubectl top proves absence of throttling or all short memory spikes.",
          fr: "bounded est Burstable car ses requests et limits diffèrent. Guaranteed nécessite normalement des requests CPU et mémoire égales aux limits pour chaque conteneur ; BestEffort n’en a aucune. La QoS intervient dans la gestion de pression, sans garantir la disponibilité. Un kubectl top réussi ne prouve ni l’absence de throttling ni celle de pics mémoire courts.",
        },
      },
      {
        type: "h2",
        id: "diagnose",
        text: {
          en: "Distinguish Pending, OOM and restart loops",
          fr: "Distinguer Pending, OOM et boucles de redémarrage",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-resources describe pod bounded\nk -n lab-resources get pod bounded -o jsonpath='{.status.containerStatuses[*].lastState}{\"\\n\"}'\nk -n lab-resources get events --sort-by=.metadata.creationTimestamp",
      },
      {
        type: "p",
        text: {
          en: "Pending with FailedScheduling concerns placement; OOMKilled in lastState concerns a terminated container. Exit code 137 alone is not sufficient to establish an OOM cause. CrashLoopBackOff describes delayed restarts and needs logs plus termination details. Raising limits without checking a leak, a sidecar or missing node capacity can hide the problem until the next overload.",
          fr: "Pending avec FailedScheduling concerne le placement ; OOMKilled dans lastState concerne un conteneur terminé. Le seul code 137 ne suffit pas à établir un OOM. CrashLoopBackOff décrit un délai entre redémarrages et nécessite logs et détails de terminaison. Augmenter les limites sans rechercher fuite, sidecar ou capacité peut masquer le problème jusqu’à la surcharge suivante.",
        },
      },
      {
        type: "h2",
        id: "quiz",
        text: {
          en: "Check the boundaries",
          fr: "Vérifier les frontières",
        },
      },
      {
        type: "quiz",
        questions: [
          {
            question: {
              en: "What does the scheduler primarily compare?",
              fr: "Que compare principalement le scheduler ?",
            },
            options: [
              {
                en: "Current CPU percentage only",
                fr: "Uniquement le pourcentage CPU actuel",
              },
              {
                en: "Requests against allocatable capacity",
                fr: "Requests et capacité allocatable",
              },
              {
                en: "Image size",
                fr: "Taille d’image",
              },
            ],
            correct: 1,
            explanation: {
              en: "Placement uses declared demand and constraints, not just current usage.",
              fr: "Le placement utilise la demande déclarée et les contraintes, pas seulement l’usage.",
            },
          },
          {
            question: {
              en: "What is a typical CPU-limit effect?",
              fr: "Quel est un effet typique d’une limite CPU ?",
            },
            options: [
              {
                en: "Throttling",
                fr: "Throttling",
              },
              {
                en: "Immediate OOM kill",
                fr: "OOM kill immédiat",
              },
              {
                en: "A new node",
                fr: "Un nouveau nœud",
              },
            ],
            correct: 0,
            explanation: {
              en: "CPU is time-shared; memory exhaustion has different failure semantics.",
              fr: "Le CPU est partagé en temps ; la mémoire a une autre sémantique de panne.",
            },
          },
          {
            question: {
              en: "Does Guaranteed mean no eviction or outage?",
              fr: "Guaranteed signifie-t-il aucune éviction ni panne ?",
            },
            options: [
              {
                en: "Yes",
                fr: "Oui",
              },
              {
                en: "Only on kind",
                fr: "Seulement sur kind",
              },
              {
                en: "No",
                fr: "Non",
              },
            ],
            correct: 2,
            explanation: {
              en: "QoS is not a promise against node or application failure.",
              fr: "La QoS ne protège pas d’une panne de nœud ou d’application.",
            },
          },
        ],
      },
      {
        type: "challenge",
        title: {
          en: "Repair the oversized declaration",
          fr: "Corriger la déclaration surdimensionnée",
        },
        task: {
          en: "Create a corrected replacement for too-large using 10m/16Mi requests and 100m/32Mi limits. Explain why a one-container replacement is safer than assuming every Pod resource field can be edited in place.",
          fr: "Créez un remplacement corrigé de too-large avec requests 10m/16Mi et limits 100m/32Mi. Expliquez pourquoi remplacer ce Pod isolé est plus simple que supposer tous ses champs modifiables en place.",
        },
        hints: [
          {
            en: "Use a local manifest, do not resize unrelated Pods.",
            fr: "Utilisez un manifeste local sans redimensionner d’autres Pods.",
          },
          {
            en: "The exercise does not rely on optional in-place resize features.",
            fr: "L’exercice ne dépend pas de fonctionnalités de resize en place.",
          },
        ],
        solution: [
          {
            type: "code",
            lang: "bash",
            code: 'LAB_REPAIRED_MANIFEST=$(mktemp)\nk -n lab-resources delete pod too-large\nk -n lab-resources run repaired --image=busybox:1.37.0 --restart=Never --dry-run=client -o yaml -- sleep 3600 > "$LAB_REPAIRED_MANIFEST"',
          },
          {
            type: "p",
            text: {
              en: "Edit the temporary file named by $LAB_REPAIRED_MANIFEST to add resources.requests cpu: 10m, memory: 16Mi and resources.limits cpu: 100m, memory: 32Mi under its container, then apply it. Inspect scheduling Events and QoS again. Choose real production values from representative measurements and load tests, not these teaching numbers.",
              fr: "Dans le fichier temporaire désigné par $LAB_REPAIRED_MANIFEST, ajoutez au conteneur resources.requests cpu: 10m, memory: 16Mi puis resources.limits cpu: 100m, memory: 32Mi, et appliquez-le. Examinez de nouveau Events et QoS. En production, utilisez mesures représentatives et tests de charge, pas ces chiffres pédagogiques.",
            },
          },
          {
            type: "code",
            lang: "bash",
            code: 'k -n lab-resources apply -f "$LAB_REPAIRED_MANIFEST"\nk -n lab-resources wait --for=condition=Ready pod/repaired --timeout=120s\nk -n lab-resources describe pod repaired\nrm -- "$LAB_REPAIRED_MANIFEST"',
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
        code: "k delete namespace lab-resources",
      },
    ] satisfies Block[]),
  ],
};
