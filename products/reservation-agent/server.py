"""Local HTTP API. Demo only: no authentication or production hardening."""
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from agent import connect, seed, book, decide

ROOT = Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_POST(self):
        if self.path != "/api/agent":
            self.send_error(404)
            return
        try:
            size = int(self.headers.get("Content-Length","0"))
            if size < 1 or size > 4096:
                raise ValueError("Invalid request size")
            data = json.loads(self.rfile.read(size))
            if not isinstance(data,dict):
                raise ValueError("Expected JSON object")
            result = decide(data)
            if result is None:
                with connect() as db:
                    seed(db)
                    result = book(db,data.get("guest"),data.get("party"),data.get("starts_at"))
            status = 200
        except (ValueError,TypeError,json.JSONDecodeError) as exc:
            status,result = 400,{"status":"error","message":str(exc)}
        except Exception:
            status,result = 500,{"status":"error","message":"Internal error"}
        body = json.dumps(result).encode()
        self.send_response(status)
        self.send_header("Content-Type","application/json")
        self.send_header("Cache-Control","no-store")
        self.send_header("Content-Length",str(len(body)))
        self.end_headers()
        self.wfile.write(body)

if __name__ == "__main__":
    print("Local demo: http://127.0.0.1:8765")
    ThreadingHTTPServer(("127.0.0.1",8765),Handler).serve_forever()
