import type { Chapter } from "../types";
import {
  l,
  h,
  p,
  code,
  note,
  list,
  labContext,
  steps,
  quiz,
  question,
  challenge,
} from "../lesson-kit";
import web from "../../../lab/level-3/incidents/web.yaml?raw";

export const incidents: Chapter = {
  id: "incidents",
  level: 3,
  minutes: 60,
  title: l("Troubleshooting production incidents", "Dépanner des incidents de production"),
  summary: l(
    "Practice an incident workflow: measure impact, preserve evidence, test a hypothesis, mitigate the smallest cause and verify user-path recovery.",
    "Pratiquer un incident : mesurer l’impact, préserver les preuves, tester une hypothèse, corriger la cause minimale et vérifier le chemin utilisateur.",
  ),
  prerequisites: ["troubleshooting-2", "rollbacks", "dns"],
  related: ["observability", "backup-dr", "failure-scenarios"],
  blocks: [
    h(
      "objectives",
      "Restore service with a defensible explanation",
      "Rétablir le service avec une explication vérifiable",
    ),
    list(
      l(
        "Distinguish a symptom, a hypothesis, evidence and a mitigation.",
        "Distinguer symptôme, hypothèse, preuve et mitigation.",
      ),
      l(
        "Validate recovery from the failing client path instead of only checking healthy Pods.",
        "Valider la récupération depuis le client en échec plutôt que par les seuls Pods sains.",
      ),
    ),
    p(
      "During an incident the first objective is restoring a user capability while controlling change. State the affected operation, first observed UTC time, error class and measured failure denominator. A green Deployment is only one signal. Assign an incident lead and investigator in a team, keep one concise timeline and pause unrelated releases through the delivery procedure. Do not let several people independently restart infrastructure while evidence is disappearing.",
      "Pendant un incident, l’objectif initial est de rétablir une capacité utilisateur en maîtrisant les changements. Précisez opération touchée, première observation UTC, classe d’erreur et dénominateur des échecs mesurés. Un Deployment vert n’est qu’un signal. En équipe, désignez responsable et enquêteur, gardez une chronologie concise et suspendez les livraisons non liées selon la procédure. Évitez plusieurs redémarrages concurrents de l’infrastructure qui effacent les preuves.",
    ),
    p(
      "A useful hypothesis predicts a distinguishing observation: if the Service selector is wrong, DNS can resolve while ready endpoints are absent and direct Pod access still succeeds. A mitigation reduces impact before every causal detail is known; a root-cause statement needs supporting evidence and alternatives considered. Recovery requires the formerly failing request to work over a representative window, not just one lucky response. The local drill below demonstrates this reasoning, not a recorded production incident.",
      "Une hypothèse utile prédit une observation discriminante : si le sélecteur du Service est faux, DNS peut répondre tandis que les endpoints prêts manquent et que l’accès direct au Pod fonctionne. Une mitigation réduit l’impact avant de connaître tous les détails ; une cause racine exige preuves et alternatives examinées. La récupération nécessite que la requête auparavant en échec fonctionne sur une fenêtre représentative, pas une réponse chanceuse. Le drill local démontre ce raisonnement, pas un incident de production enregistré.",
    ),
    ...labContext("lab-incidents"),
    note(
      "warn",
      l("Failure scope", "Périmètre de panne"),
      l(
        "Only the checkout Service inside lab-incidents is deliberately broken. No node failure, production traffic, global drain or cloud change is involved. Use the runbook in lab/level-3/incidents/runbook.md and record your actual observations. Do not copy Secrets, tokens or full environment dumps into incident notes.",
        "Seul le Service checkout de lab-incidents est volontairement cassé. Aucun nœud, trafic de production, drain global ou cloud n’est concerné. Suivez lab/level-3/incidents/runbook.md et notez vos observations réelles. Ne copiez ni Secrets, tokens ou dumps d’environnement dans vos notes.",
      ),
    ),
    h("baseline", "Establish what healthy means", "Établir ce que signifie sain"),
    code("yaml", web, "lab/level-3/incidents/web.yaml"),
    steps({
      title: l("Verify the client path first", "Vérifier d’abord le chemin client"),
      code: {
        lang: "bash",
        code: "k -n lab-incidents apply -f lab/level-3/incidents/web.yaml\nk -n lab-incidents rollout status deployment/checkout --timeout=120s\nk -n lab-incidents wait --for=condition=Ready pod/client --timeout=120s\nk -n lab-incidents exec client -- wget -T 3 -qO- http://checkout/\nk -n lab-incidents get endpointslices -l kubernetes.io/service-name=checkout\ndate -u '+%Y-%m-%dT%H:%M:%SZ'",
      },
      explain: l(
        "The client Pod traverses cluster DNS and Service forwarding, unlike a Deployment port-forward. Confirm the initial request works and the Service has ready endpoints before injecting anything.",
        "Le client traverse DNS et transmission Service, contrairement au port-forward d’un Deployment. Confirmez une requête initiale réussie et des endpoints prêts avant toute injection.",
      ),
      expected: {
        text: l(
          "Expected: nginx HTML, three ready replicas and corresponding endpoints. Record these actual results as the baseline.",
          "Attendu : HTML nginx, trois réplicas prêts et endpoints correspondants. Notez les résultats réels comme référence.",
        ),
      },
    }),
    h("trigger", "Inject a configuration regression", "Injecter une régression de configuration"),
    code(
      "bash",
      'k -n lab-incidents patch service checkout --type=merge -p \'{"spec":{"selector":{"release":"canary"}}}\'\nk -n lab-incidents get endpointslices -l kubernetes.io/service-name=checkout -o yaml --watch',
    ),
    p(
      "The merge retains app: checkout and adds release: canary; the existing Pods carry release: stable. A Service selector requires every label, so it loses backends after reconciliation even though the Deployment remains available. Stop the watch with Ctrl+C once the EndpointSlices no longer contain selected ready addresses, then run the following request. Service-dataplane updates are asynchronous too: if it still succeeds, observe again and retry before claiming impact. Record the actual error and first observed failure time. In a real incident configuration history would reveal the change instead of the exercise supplying its cause.",
      "Le merge conserve app: checkout et ajoute release: canary ; les Pods portent release: stable. Un sélecteur exige tous ses labels : il perd ses backends après réconciliation alors que le Deployment reste disponible. Arrêtez le watch avec Ctrl+C quand les EndpointSlices ne contiennent plus d’adresses prêtes sélectionnées, puis lancez la requête suivante. Le dataplane converge aussi de façon asynchrone : si elle réussit encore, observez puis réessayez avant de déclarer un impact. Notez l’erreur et l’heure du premier échec réellement constatés. En incident réel, l’historique de configuration révélerait le changement au lieu de connaître la cause injectée.",
    ),
    code(
      "bash",
      "k -n lab-incidents exec client -- wget -T 3 -qO- http://checkout/\ndate -u '+%Y-%m-%dT%H:%M:%SZ'",
    ),
    h(
      "evidence",
      "Test one hypothesis with several layers",
      "Tester une hypothèse sur plusieurs couches",
    ),
    code(
      "bash",
      "k -n lab-incidents get service checkout -o yaml\nk -n lab-incidents get pods -l app=checkout --show-labels -o wide\nk -n lab-incidents get endpointslices -l kubernetes.io/service-name=checkout -o yaml\nk -n lab-incidents get deployment checkout\nk -n lab-incidents rollout history deployment/checkout\nk -n lab-incidents get events --sort-by=.metadata.creationTimestamp\nk -n lab-incidents exec client -- nslookup checkout\nLAB_HEALTHY_POD_IP=$(kubectl --context kind-k8s-ops-lab -n lab-incidents get pods -l app=checkout -o jsonpath='{.items[0].status.podIP}')\nk -n lab-incidents exec client -- wget -T 3 -qO- \"http://$LAB_HEALTHY_POD_IP/\"",
    ),
    p(
      "Expected evidence after convergence: DNS resolves, Pods are ready, direct Pod HTTP works, but EndpointSlices contain no ready selected backends. The selector mismatch explains the failing Service path with fewer assumptions than a cluster-wide CNI outage. Pod restart or image rollback cannot remove a label added to a separate Service object. Preserve the observed selector, labels and timestamps before the targeted mitigation.",
      "Preuves attendues après convergence : DNS répond, Pods prêts, HTTP direct fonctionne, mais les EndpointSlices n’ont aucun backend prêt sélectionné. Le décalage de sélecteur explique le chemin Service en échec avec moins d’hypothèses qu’une panne CNI générale. Redémarrer les Pods ou annuler l’image ne retire pas un label ajouté à un objet Service distinct. Conservez sélecteur, labels et timestamps avant la mitigation ciblée.",
    ),
    h(
      "mitigation",
      "Repair the confirmed selection error",
      "Réparer l’erreur de sélection confirmée",
    ),
    code(
      "bash",
      'k -n lab-incidents patch service checkout --type=json -p \'[{"op":"remove","path":"/spec/selector/release"}]\'\nk -n lab-incidents get endpointslices -l kubernetes.io/service-name=checkout -o yaml --watch',
    ),
    p(
      "Stop the watch with Ctrl+C once three ready backend addresses at port 80 have returned, then measure fresh requests. Ready endpoints describe controller state; the client check independently verifies the converged forwarding path.",
      "Arrêtez le watch avec Ctrl+C après le retour de trois adresses de backends prêts au port 80, puis mesurez de nouvelles requêtes. Les endpoints décrivent l’état du contrôleur ; le contrôle client vérifie séparément le chemin de transmission après convergence.",
    ),
    code(
      "bash",
      "k -n lab-incidents exec client -- sh -c 'passed=0; failed=0; for attempt in 1 2 3 4 5 6 7 8 9 10; do if wget -T 3 -qO- http://checkout/ >/dev/null; then passed=$((passed + 1)); else failed=$((failed + 1)); fi; sleep 1; done; echo \"passed=$passed failed=$failed\"; test \"$failed\" -eq 0'\ndate -u '+%Y-%m-%dT%H:%M:%SZ'",
    ),
    p(
      "Expected once ready endpoints return: ten successes, zero failures. That is the result of this bounded check, not a production SLO. If a request still fails, do not repeat disruptive actions blindly: verify the patch took effect, endpoint convergence and the actual client error. Fix the declared source manifest in the real delivery system so reconciliation does not restore the bad selector. The provided baseline already expresses the intended app-only selector.",
      "Attendu après retour des endpoints prêts : dix réussites, zéro échec. C’est le résultat d’un contrôle borné, pas un SLO de production. Si une requête échoue encore, ne répétez pas des actions perturbatrices : vérifiez application du patch, convergence et erreur client. Corrigez la source déclarative du vrai système de livraison pour éviter le retour du mauvais sélecteur. La base fournie décrit déjà le sélecteur app seul voulu.",
    ),
    h("closure", "Close with evidence and prevention", "Clore avec preuves et prévention"),
    p(
      "Write a short timeline: trigger, first observed impact, decisive test, mitigation and verified recovery. Separate facts from remaining uncertainty; this fixture does not measure all users or retention. Prevention could compare rendered Service selectors with Pod labels in CI, require a canary request through the Service before promotion, and alert on user-visible failures with sufficient traffic. A blame statement or a test that merely confirms Pods exist would not address this regression.",
      "Rédigez une chronologie courte : déclencheur, premier impact observé, test décisif, mitigation et récupération vérifiée. Séparez faits et incertitude ; ce fixture ne mesure pas tous les utilisateurs ni la rétention. La prévention peut comparer sélecteurs Service et labels des Pods en CI, exiger une requête canary via le Service avant promotion, et alerter sur les échecs visibles avec un trafic suffisant. Blâmer une personne ou tester seulement l’existence des Pods ne traite pas cette régression.",
    ),
    h(
      "quiz",
      "Choose evidence over familiar actions",
      "Choisir les preuves plutôt que les réflexes",
    ),
    quiz(
      question(
        l(
          "Why not roll back the Deployment first in this scenario?",
          "Pourquoi ne pas annuler d’abord le Deployment ici ?",
        ),
        [
          l("Rollbacks never work", "Les rollbacks ne fonctionnent jamais"),
          l(
            "The confirmed regression is on a separate Service selector",
            "La régression confirmée concerne le sélecteur d’un Service distinct",
          ),
          l("The Pod name is unchanged", "Le nom du Pod est identique"),
        ],
        1,
        l(
          "A Deployment revision manages its Pod template, not unrelated Service changes.",
          "Une révision de Deployment gère son template, pas les changements d’un Service distinct.",
        ),
      ),
      question(
        l(
          "Which observation most directly validates recovery?",
          "Quelle observation valide le plus directement la récupération ?",
        ),
        [
          l(
            "Fresh successful requests through the formerly failing client path",
            "De nouvelles requêtes réussies via le chemin client auparavant cassé",
          ),
          l("An available Deployment only", "Un Deployment disponible seulement"),
          l("A successful image pull only", "Un téléchargement d’image réussi seulement"),
        ],
        0,
        l(
          "Recovery must address the symptom; component health supports but cannot replace that check.",
          "La récupération doit corriger le symptôme ; la santé des composants aide sans remplacer ce contrôle.",
        ),
      ),
      question(
        l("What should an incident timeline avoid?", "Que faut-il éviter dans la chronologie ?"),
        [
          l("UTC timestamps", "Les timestamps UTC"),
          l("The exact mitigation command", "La commande exacte de mitigation"),
          l(
            "Treating an untested hypothesis as a confirmed cause",
            "Présenter une hypothèse non testée comme cause confirmée",
          ),
        ],
        2,
        l(
          "Record uncertainty explicitly so later decisions can distinguish evidence from assumptions.",
          "Notez explicitement l’incertitude pour distinguer preuves et suppositions dans les décisions suivantes.",
        ),
      ),
    ),
    h(
      "challenge",
      "Investigate another misleading symptom",
      "Enquêter sur un autre symptôme trompeur",
    ),
    challenge(
      l("Healthy Pods, wrong destination port", "Pods sains, mauvais port destination"),
      l(
        "Set checkout's targetPort to 8080. Repeat the incident method without changing Pod labels. Identify which evidence differs from the selector incident, restore the Service and verify recovery.",
        "Passez targetPort de checkout à 8080. Répétez la méthode sans modifier les labels. Identifiez ce qui diffère de l’incident de sélecteur, restaurez le Service et vérifiez la récupération.",
      ),
      [
        l(
          "Endpoints can exist while their advertised destination port is wrong.",
          "Des endpoints peuvent exister avec un port destination incorrect.",
        ),
        l(
          "Compare the EndpointSlice port with nginx's listening port and a direct Pod request.",
          "Comparez le port de l’EndpointSlice à l’écoute nginx et à une requête directe au Pod.",
        ),
      ],
      [
        code(
          "bash",
          'k -n lab-incidents patch service checkout --type=merge -p \'{"spec":{"ports":[{"name":"http","port":80,"targetPort":8080}]}}\'\nk -n lab-incidents get endpointslices -l kubernetes.io/service-name=checkout -o yaml --watch',
        ),
        p(
          "Stop the watch when endpoint addresses remain but their port becomes 8080. The next two requests compare direct Pod port 80 with the broken Service path. Then restore the baseline and stop its watch only once ready endpoints advertise port 80 again. A watch continues until Ctrl+C; do not paste the subsequent check into that running process.",
          "Arrêtez le watch quand les adresses restent présentes mais leur port devient 8080. Les deux requêtes suivantes comparent le port 80 direct au chemin Service cassé. Rétablissez ensuite la base et arrêtez son watch seulement quand les endpoints prêts annoncent de nouveau le port 80. Un watch continue jusqu’à Ctrl+C : ne collez pas le contrôle suivant dans ce processus actif.",
        ),
        code(
          "bash",
          'k -n lab-incidents exec client -- wget -T 3 -qO- "http://$LAB_HEALTHY_POD_IP/"\nk -n lab-incidents exec client -- wget -T 3 -qO- http://checkout/\nk -n lab-incidents apply -f lab/level-3/incidents/web.yaml\nk -n lab-incidents get endpointslices -l kubernetes.io/service-name=checkout -o yaml --watch',
        ),
        code("bash", "k -n lab-incidents exec client -- wget -T 3 -qO- http://checkout/"),
        p(
          "Restoring targetPort: http repairs forwarding after convergence. Record the distinct causal evidence, then rerun the ten-request check. Do not describe both failures as an identical DNS outage.",
          "Rétablir targetPort: http corrige la transmission après convergence. Notez les preuves causales distinctes puis répétez les dix requêtes. Ne décrivez pas ces deux pannes comme une même panne DNS.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code("bash", "k delete namespace lab-incidents"),
    p(
      "Keep your factual timeline as learning evidence if useful. Namespace deletion removes the fixture, not production alerts or external state; none were configured here. Advanced failure scenarios later add controlled failure domains and stronger recovery requirements.",
      "Gardez éventuellement la chronologie factuelle comme preuve d’apprentissage. La suppression retire le fixture, pas des alertes de production ni un état externe ; aucun n’a été configuré ici. Les scénarios avancés ajouteront domaines de panne contrôlés et exigences de récupération plus fortes.",
    ),
  ],
};
