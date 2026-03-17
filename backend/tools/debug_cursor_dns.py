from __future__ import annotations

import json
import os
import socket
import ssl
import subprocess
import time
import urllib.request


LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "debug-13921d.log")
SESSION_ID = "13921d"


def _log(hypothesis_id: str, location: str, message: str, data: dict, run_id: str) -> None:
    payload = {
        "sessionId": SESSION_ID,
        "runId": run_id,
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def main() -> None:
    run_id = f"probe-{int(time.time())}"
    host = "agentn.global.api5.cursor.sh"
    url = f"https://{host}/"

    # region agent log
    _log("H1", "backend/tools/debug_cursor_dns.py:40", "Starting DNS/connectivity probe", {"host": host, "url": url}, run_id)
    # endregion

    # DNS resolution test
    try:
        infos = socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
        ips = sorted({info[4][0] for info in infos})
        # region agent log
        _log("H1", "backend/tools/debug_cursor_dns.py:50", "DNS resolved", {"ips": ips, "count": len(ips)}, run_id)
        # endregion
    except Exception as e:
        # region agent log
        _log("H1", "backend/tools/debug_cursor_dns.py:55", "DNS resolution failed", {"error": repr(e)}, run_id)
        # endregion

    # nslookup (Windows resolver view, best effort)
    try:
        p = subprocess.run(
            ["nslookup", host],
            capture_output=True,
            text=True,
            timeout=8,
            check=False,
        )
        # region agent log
        _log(
            "H1",
            "backend/tools/debug_cursor_dns.py:73",
            "nslookup completed",
            {"returncode": p.returncode, "stdout": p.stdout[-2000:], "stderr": p.stderr[-2000:]},
            run_id,
        )
        # endregion
    except Exception as e:
        # region agent log
        _log("H1", "backend/tools/debug_cursor_dns.py:85", "nslookup failed", {"error": repr(e)}, run_id)
        # endregion

    # Node.js DNS lookup (matches Cursor runtime better)
    try:
        p = subprocess.run(
            [
                "node",
                "-e",
                "require('dns').lookup(process.argv[1], (e, a, f)=>{if(e){console.error(String(e));process.exit(2)};console.log(a, f)})",
                host,
            ],
            capture_output=True,
            text=True,
            timeout=8,
            check=False,
        )
        # region agent log
        _log(
            "H1",
            "backend/tools/debug_cursor_dns.py:104",
            "node dns.lookup completed",
            {"returncode": p.returncode, "stdout": p.stdout.strip(), "stderr": p.stderr.strip()[:2000]},
            run_id,
        )
        # endregion
    except Exception as e:
        # region agent log
        _log("H1", "backend/tools/debug_cursor_dns.py:116", "node dns.lookup failed", {"error": repr(e)}, run_id)
        # endregion

    # TCP connect test (443)
    try:
        with socket.create_connection((host, 443), timeout=5) as s:
            # region agent log
            _log("H3", "backend/tools/debug_cursor_dns.py:92", "TCP connect ok", {"peer": s.getpeername()}, run_id)
            # endregion
    except Exception as e:
        # region agent log
        _log("H3", "backend/tools/debug_cursor_dns.py:96", "TCP connect failed", {"error": repr(e)}, run_id)
        # endregion

    # Direct HTTPS probe (best effort)
    try:
        ctx = ssl.create_default_context()
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "IKnowYou-Debug-Probe"})
        with urllib.request.urlopen(req, timeout=5, context=ctx) as resp:
            # region agent log
            _log("H2", "backend/tools/debug_cursor_dns.py:66", "HTTPS request completed", {"status": resp.status, "headers": dict(resp.headers)}, run_id)
            # endregion
    except Exception as e:
        # region agent log
        _log("H2", "backend/tools/debug_cursor_dns.py:71", "HTTPS request failed", {"error": repr(e)}, run_id)
        # endregion


if __name__ == "__main__":
    main()

