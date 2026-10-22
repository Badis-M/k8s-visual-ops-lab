"""Synthetic dependency health without an external service or privileged fault."""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def response_for(path, ready):
    if path == "/live":
        return 200, "process alive\n"
    if path in ("/ready", "/"):
        return (200, "dependency available\n") if ready else (503, "synthetic dependency unavailable\n")
    return 404, "not found\n"


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            ready = Path("/config/ready").read_text().strip() == "true"
        except OSError:
            ready = False
        status, body = response_for(self.path, ready)
        payload = body.encode()
        self.send_response(status)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
