"""Quiet local readiness probe; exit 0 only when frontend and API are ready."""
import sys
import requests

try:
    with requests.Session() as session:
        session.trust_env = False
        response = session.get('http://127.0.0.1:5173/api/health', timeout=1)
        response.raise_for_status()
        sys.exit(0 if response.json().get('status') == 'ok' else 1)
except (requests.RequestException, ValueError):
    sys.exit(1)
