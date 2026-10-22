# Checkout request failure

Scope: disposable namespace `lab-incidents`, context `kind-k8s-ops-lab`. Every expected result is a hypothesis to verify, not a recorded production incident.

1. Declare impact: failing path, first observed UTC time, error class, measured count/denominator. Assign incident lead and investigator; record changes before applying them. Pause unrelated releases through the team's delivery procedure.
2. Reproduce from `client`, not only with an application port-forward. `kubectl --context kind-k8s-ops-lab -n lab-incidents exec client -- wget -T 3 -qO- http://checkout/` verifies Pod -> Service -> backend.
3. Observe desired/live changes: inspect Service selector and targetPort, Deployment rollout history, Pod labels/readiness, EndpointSlices and timestamp-sorted Events. Do not export Secrets or full environment values into incident notes.
4. Test hypotheses independently: resolve `checkout`; compare `Service.spec.selector` with Pod labels; request a ready Pod IP directly. If direct Pod access works and the Service has no ready endpoints, investigate selection/readiness before CNI changes. A single test is insufficient to declare cluster-wide impact.
5. Mitigate the smallest confirmed cause. In this drill only, remove the injected Service `release` selector with the documented JSON patch. Do not restart all Pods: that cannot repair a wrong Service selector. Record the exact command/time and preserve pre-change fields first.
6. Verify recovery with ten fresh Service requests, ready EndpointSlices and unchanged healthy replicas. A Deployment rollback does not undo unrelated Service or configuration changes. Observe over a representative period before declaring recovery in a real incident.
7. Close the drill: record trigger, impact, evidence supporting the cause, uncertainty, mitigation and prevention owner. Add a contract test comparing production Service selectors to rendered Pod labels. Never invent a production duration or success rate from this local drill.

Cleanup: `kubectl --context kind-k8s-ops-lab delete namespace lab-incidents`. Local notes are not a log archive or incident-management system.
