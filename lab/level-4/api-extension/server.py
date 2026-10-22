"""Lossless field renaming for two deliberately equivalent Gadget schemas."""

import copy
import json
import ssl
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

GROUP = "workshops.k8sops.dev"
VERSIONS = (f"{GROUP}/v1", f"{GROUP}/v2")


def convert_object(obj, desired):
    source = obj.get("apiVersion")
    if source not in VERSIONS or desired not in VERSIONS or obj.get("kind") != "Gadget":
        raise ValueError("Unsupported Gadget version or kind")
    source_key = "size" if source.endswith("/v1") else "replicas"
    target_key = "size" if desired.endswith("/v1") else "replicas"
    spec = obj.get("spec", {})
    value = spec.get(source_key)
    if type(value) is not int or not 1 <= value <= 10:
        raise ValueError("Gadget count must be an integer from 1 to 10")
    result = copy.deepcopy(obj)
    if source_key != target_key:
        if target_key in spec:
            raise ValueError("Ambiguous field representation")
        result["spec"][target_key] = result["spec"].pop(source_key)
    result["apiVersion"] = desired
    return result


def convert_review(review):
    if review.get("apiVersion") != "apiextensions.k8s.io/v1":
        raise ValueError("Unsupported ConversionReview version")
    request = review.get("request", {})
    uid = request.get("uid")
    if not isinstance(uid, str) or not uid:
        raise ValueError("Missing request UID")
    response = {"uid": uid}
    try:
        desired = request.get("desiredAPIVersion")
        objects = request.get("objects")
        if desired not in VERSIONS or not isinstance(objects, list) or not objects:
            raise ValueError("Unsupported target or missing objects")
        converted = [convert_object(obj, desired) for obj in objects]
        response.update(result={"status": "Success"}, convertedObjects=converted)
    except (ValueError, TypeError, AttributeError):
        response["result"] = {"status": "Failure", "message": "Gadget conversion cannot preserve the input contract"}
    return {"apiVersion": "apiextensions.k8s.io/v1", "kind": "ConversionReview", "response": response}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200 if self.path == "/healthz" else 404)
        self.end_headers()

    def do_POST(self):
        try:
            if self.path != "/convert":
                self.send_error(404)
                return
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 2 * 1024 * 1024:
                raise ValueError("Invalid body length")
            payload = json.dumps(convert_review(json.loads(self.rfile.read(length)))).encode()
        except (ValueError, TypeError, AttributeError):
            self.send_error(400, "Invalid conversion request")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, _format, *_args):
        # Never log full custom resources or admission payloads.
        print("conversion request completed", flush=True)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8443), Handler)
    tls = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    tls.minimum_version = ssl.TLSVersion.TLSv1_2
    tls.load_cert_chain("/tls/tls.crt", "/tls/tls.key")
    server.socket = tls.wrap_socket(server.socket, server_side=True)
    server.serve_forever()
