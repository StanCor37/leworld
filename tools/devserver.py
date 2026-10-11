"""Local dev server for LeWorld.

Serves the project folder at http://localhost:8765 and accepts
POST /snap?name=<file> with a PNG data URL body, saving it to tools/snaps/
(used to capture canvas snapshots while working on graphics).
"""
import base64
import http.server
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAPS = os.path.join(ROOT, 'tools', 'snaps')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        m = re.match(r'^/snap\?name=([\w-]+)$', self.path)
        if not m:
            self.send_error(404)
            return
        body = self.rfile.read(int(self.headers.get('Content-Length', 0))).decode()
        data = base64.b64decode(body.split(',', 1)[1])
        os.makedirs(SNAPS, exist_ok=True)
        with open(os.path.join(SNAPS, m.group(1) + '.png'), 'wb') as f:
            f.write(data)
        self.send_response(204)
        self.end_headers()


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    port = int(args[0]) if args else 8765
    lan = '--lan' in sys.argv   # also serve to phones/tablets on the same Wi-Fi
    host = '0.0.0.0' if lan else '127.0.0.1'
    print(f'LeWorld dev server on http://localhost:{port}')
    if lan:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('8.8.8.8', 80))
            print(f'On your phone (same Wi-Fi): http://{s.getsockname()[0]}:{port}')
        except OSError:
            print('Could not detect this computer\'s network address.')
        finally:
            s.close()
    http.server.ThreadingHTTPServer((host, port), Handler).serve_forever()
