"""Start Local Desk quietly, or reuse its running loopback server."""
from pathlib import Path
import subprocess
import sys
from urllib.request import urlopen
import webbrowser

root = Path(__file__).resolve().parent
url = 'http://127.0.0.1:8765/'
try:
    with urlopen(url, timeout=3) as response:
        if b'Local Desk' not in response.read(3000): raise RuntimeError('Port 8765 belongs to another application.')
    webbrowser.open(url)
except (OSError, TimeoutError):
    (root / 'runtime').mkdir(exist_ok=True)
    with (root / 'runtime' / 'server.log').open('ab') as log:
        subprocess.Popen([sys.executable, str(root / 'server.py')], cwd=root, stdout=log, stderr=log, creationflags=0x08000000 if sys.platform == 'win32' else 0)
