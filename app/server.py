"""Run the local prediction API and serve the compiled React app."""
import argparse
import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from mimetypes import guess_type
from pathlib import Path
from urllib.parse import unquote, urlsplit

from model import DevBugger

DIST = Path(__file__).resolve().parent / "dist"
MAX_BYTES = 1_048_576


class AppServer(ThreadingHTTPServer):
    def __init__(self, address, models):
        self.models = models
        super().__init__(address, Handler)


class Handler(BaseHTTPRequestHandler):
    def send_bytes(self, status, content, media_type):
        self.send_response(status)
        self.send_header("Content-Type", media_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(content)

    def send_json(self, data, status=HTTPStatus.OK):
        self.send_bytes(status, json.dumps(data).encode(), "application/json; charset=utf-8")

    def do_GET(self):
        route = unquote(urlsplit(self.path).path)
        if route == "/api/status":
            return self.send_json({"ready": True})
        if route == "/api/example":
            return self.send_json(self.server.models.example)
        asset = (DIST / route.lstrip("/")).resolve()
        if route == "/":
            asset = DIST / "index.html"
        if not asset.is_relative_to(DIST) or not asset.is_file():
            return self.send_json({"error": "Page not found."}, HTTPStatus.NOT_FOUND)
        self.send_bytes(HTTPStatus.OK, asset.read_bytes(), guess_type(asset.name)[0] or "application/octet-stream")

    def do_POST(self):
        if urlsplit(self.path).path != "/api/predict":
            return self.send_json({"error": "Page not found."}, HTTPStatus.NOT_FOUND)
        if self.headers.get_content_type() != "application/json":
            return self.send_json({"error": "Send the report as JSON."}, HTTPStatus.UNSUPPORTED_MEDIA_TYPE)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= MAX_BYTES:
                return self.send_json({"error": "Report is empty or too large."}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict) or not all(isinstance(data.get(k), str) for k in ("title", "body", "source")):
                raise ValueError("Supply a title, description and source as text.")
            result = self.server.models.predict(data["title"], data["body"], data["source"])
        except (ValueError, UnicodeError) as exc:
            return self.send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)
        self.send_json(result)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    print("Fitting the notebook's selected models on the original 640 training reports...", flush=True)
    with AppServer(("127.0.0.1", args.port), DevBugger()) as server:
        print(f"DevBugger is ready at http://127.0.0.1:{server.server_port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
