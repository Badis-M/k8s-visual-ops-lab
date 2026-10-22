"""Render an opinionated workload contract; never contact a cluster."""
import argparse
import json
import re

TIERS = {
    "small": {"requests": {"cpu": "50m", "memory": "32Mi"}, "limits": {"cpu": "250m", "memory": "128Mi"}},
    "medium": {"requests": {"cpu": "100m", "memory": "64Mi"}, "limits": {"cpu": "500m", "memory": "256Mi"}},
}


def dns_label(value):
    if not isinstance(value, str) or len(value) > 63 or not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", value):
        raise ValueError("Expected a DNS label of 1-63 lowercase letters, digits or internal hyphens")
    return value


def render(name, owner, tier, environment, namespace="lab-platform"):
    name, owner, namespace = map(dns_label, [name, owner, namespace])
    if not name[0].isalpha():
        raise ValueError("The Service name must start with a lowercase letter on the baseline cluster")
    if not namespace.startswith("lab-"):
        raise ValueError("This teaching renderer only accepts isolated lab-* namespaces")
    if tier not in TIERS or environment not in {"dev", "prod"}:
        raise ValueError("Unsupported tier or environment")
    labels = {"app.kubernetes.io/name": name, "app.kubernetes.io/managed-by": "lab-platform-renderer", "platform.example.com/owner": owner}
    selector = {"app.kubernetes.io/name": name}
    metadata = {"name": name, "namespace": namespace, "labels": labels}
    container = {
        "name": "web", "image": "nginxinc/nginx-unprivileged:1.28.0-alpine",
        "ports": [{"name": "http", "containerPort": 8080}],
        "resources": TIERS[tier],
        "securityContext": {"allowPrivilegeEscalation": False, "readOnlyRootFilesystem": True, "capabilities": {"drop": ["ALL"]}},
        "readinessProbe": {"httpGet": {"path": "/", "port": "http"}, "periodSeconds": 3},
        "livenessProbe": {"httpGet": {"path": "/", "port": "http"}, "periodSeconds": 10},
        "volumeMounts": [{"name": "temporary", "mountPath": "/tmp"}],
    }
    items = [
        {"apiVersion": "v1", "kind": "Namespace", "metadata": {"name": namespace}},
        {"apiVersion": "v1", "kind": "ResourceQuota", "metadata": {"name": "platform-budget", "namespace": namespace}, "spec": {"hard": {"requests.cpu": "1", "requests.memory": "1Gi", "limits.cpu": "2", "limits.memory": "2Gi", "pods": "10"}}},
        {"apiVersion": "apps/v1", "kind": "Deployment", "metadata": metadata, "spec": {
            "replicas": 2 if environment == "prod" else 1,
            "selector": {"matchLabels": selector}, "template": {"metadata": {"labels": labels}, "spec": {
                "automountServiceAccountToken": False,
                "securityContext": {"runAsNonRoot": True, "runAsUser": 101, "runAsGroup": 101, "seccompProfile": {"type": "RuntimeDefault"}},
                "containers": [container], "volumes": [{"name": "temporary", "emptyDir": {"sizeLimit": "64Mi"}}],
            }},
        }},
        {"apiVersion": "v1", "kind": "Service", "metadata": metadata, "spec": {"selector": selector, "ports": [{"name": "http", "port": 80, "targetPort": "http"}]}},
    ]
    return {"apiVersion": "v1", "kind": "List", "items": items}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True)
    parser.add_argument("--owner", required=True)
    parser.add_argument("--tier", choices=sorted(TIERS), default="small")
    parser.add_argument("--environment", choices=["dev", "prod"], default="dev")
    parser.add_argument("--namespace", default="lab-platform")
    args = parser.parse_args()
    try:
        result = render(args.name, args.owner, args.tier, args.environment, args.namespace)
    except ValueError as error:
        parser.error(str(error))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
