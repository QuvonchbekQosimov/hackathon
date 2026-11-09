import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).with_name('.env'))
APP_ENV = os.getenv('APP_ENV', 'development')
COOKIE_SECURE = APP_ENV == 'production'
ALLOWED_ORIGINS = [x.strip().rstrip('/') for x in os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if x.strip()]
if APP_ENV == 'development':
    ALLOWED_ORIGINS = list(dict.fromkeys(ALLOWED_ORIGINS + ['http://localhost:8000', 'http://127.0.0.1:8000']))
DB_CONFIG = dict(dbname=os.getenv('DB_NAME', 'vido_db'), user=os.getenv('DB_USER', 'postgres'), password=os.getenv('DB_PASSWORD', ''), host=os.getenv('DB_HOST', 'localhost'), port=int(os.getenv('DB_PORT', '5432')), connect_timeout=5, options='-c statement_timeout=15000 -c idle_in_transaction_session_timeout=15000')
DATABASE_URL = os.getenv('DATABASE_URL')
DATA_MODE = os.getenv('DATA_MODE', 'live')
SESSION_SECONDS = 7 * 24 * 3600
if APP_ENV == 'production' and (not ALLOWED_ORIGINS or any(not origin.startswith('https://') for origin in ALLOWED_ORIGINS)):
    raise RuntimeError('Production requires explicit HTTPS origins.')
