import json
import logging
import os
import signal
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace import SpanKind, Status, StatusCode


resource = Resource.create({"service.name": "lab-api"})
collector = os.environ.get("LAB_OTLP_ENDPOINT", "http://collector:4318").rstrip("/")
trace_provider = TracerProvider(resource=resource)
trace_provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{collector}/v1/traces"))
)
trace.set_tracer_provider(trace_provider)
tracer = trace.get_tracer("lab-api")

reader = PeriodicExportingMetricReader(
    OTLPMetricExporter(endpoint=f"{collector}/v1/metrics"),
    export_interval_millis=5000,
)
meter_provider = MeterProvider(resource=resource, metric_readers=[reader])
metrics.set_meter_provider(meter_provider)
meter = metrics.get_meter("lab-api")
requests = meter.create_counter("lab_requests", description="Completed lab HTTP requests")
duration = meter.create_histogram("lab_request_duration", unit="s")

log_provider = LoggerProvider(resource=resource)
log_provider.add_log_record_processor(
    BatchLogRecordProcessor(OTLPLogExporter(endpoint=f"{collector}/v1/logs"))
)
# Avoid feeding exporter-internal errors back into its own telemetry pipeline.
logger = logging.getLogger("lab-api")
logger.setLevel(logging.INFO)
logger.propagate = False
logger.addHandler(LoggingHandler(logger_provider=log_provider))


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        route = self.path if self.path in ("/work", "/fail") else "unmatched"
        status = 503 if route == "/fail" else 200 if route == "/work" else 404
        started = time.perf_counter()
        with tracer.start_as_current_span(f"GET {route}", kind=SpanKind.SERVER) as span:
            span.set_attribute("http.route", route)
            span.set_attribute("http.response.status_code", status)
            if status >= 500:
                span.set_status(Status(StatusCode.ERROR, "Intentional lab failure"))
            body = json.dumps(
                {"status": status, "trace_id": f"{span.get_span_context().trace_id:032x}"}
            ).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            attributes = {"route": route, "status": str(status)}
            requests.add(1, attributes)
            duration.record(time.perf_counter() - started, attributes)
            logger.info("request.completed", extra=attributes)

    def log_message(self, format, *args):
        # Keep the exercise's structured record as the request log.
        return


def stop_server(signum, frame):
    raise SystemExit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, stop_server)
    server = ThreadingHTTPServer(("0.0.0.0", 8000), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        trace_provider.shutdown()
        meter_provider.shutdown()
        log_provider.shutdown()
