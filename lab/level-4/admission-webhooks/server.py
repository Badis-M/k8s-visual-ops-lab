"""A deliberately scoped, side-effect-free ConfigMap validator."""

import json
import ssl
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def admit(review):
    if review.get("apiVersion") != "admission.k8s.io/v1":
        raise ValueError("Unsupported AdmissionReview version")
    request = review.get("request", {})
    uid = request.get("uid")
    if not isinstance(uid, str) or not uid:
        raise ValueError("Missing request UID")
    resource = request.get("resource", {})
    if resource.get("group", "") != "" or resource.get("resource") != "configmaps":
        raise ValueError("Unsupported resource")
    if request.get("operation") not in ("CREATE", "UPDATE"):
        raise ValueError("Unsupported operation")
    obj = request.get("object")
    if not isinstance(obj, dict):
        raise ValueError("Missing object")
    labels = obj.get("metadata", {}).get("labels", {})
    owner = labels.get("lab.k8sops.dev/owner")
    allowed = isinstance(owner, str) and bool(owner.strip())
    response = {"uid": uid, "allowed": allowed}
    if not allowed:
        response["status"] = {
            "code": 422,
            "reason": "Invalid",
            "message": "ConfigMaps require a nonempty lab.k8sops.dev/owner label",
        }
    return {
        "apiVersion": "admission.k8s.io/v1",
        "kind": "AdmissionReview",
        "response": response,
    }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200 if self.path == "/healthz" else 404)
        self.end_headers()

    def do_POST(self):
        try:
            if self.path != "/validate":
                self.send_error(404)
                return
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 2 * 1024 * 1024:
                raise ValueError("Invalid body length")
            body = json.loads(self.rfile.read(length))
            payload = json.dumps(admit(body)).encode()
        except (ValueError, TypeError, AttributeError):
            # Do not log incoming objects: admission payloads can contain secrets.
            self.send_error(400, "Invalid admission request")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, _format, *_args):
        # Generic status information is sufficient for this teaching service.
        print("webhook request completed", flush=True)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8443), Handler)
    server.timeout = 3
    tls = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    tls.minimum_version = ssl.TLSVersion.TLSv1_2
    tls.load_cert_chain("/tls/tls.crt", "/tls/tls.key")
    server.socket = tls.wrap_socket(server.socket, server_side=True)
    server.serve_forever()
