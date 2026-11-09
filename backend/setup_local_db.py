"""Replace a superuser app connection with a dedicated role for this database.

Run explicitly after configuring a local administrator connection in .env.
Existing data is preserved; the PostgreSQL administrator password is unchanged.
"""
import secrets
from pathlib import Path
import psycopg2
from psycopg2 import sql
from dotenv import set_key
from config import DB_CONFIG

def configure():
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT rolsuper FROM pg_roles WHERE rolname=current_user')
            if not cur.fetchone()[0]:
                print('Database already uses a non-superuser account.')
                return
            cur.execute('SELECT current_database()')
            database = cur.fetchone()[0]
            role = 'bais_vido_app_' + secrets.token_hex(3)
            password = secrets.token_urlsafe(32)
            cur.execute(sql.SQL('CREATE ROLE {} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD {}').format(sql.Identifier(role), sql.Literal(password)))
            cur.execute(sql.SQL('GRANT CONNECT ON DATABASE {} TO {}').format(sql.Identifier(database), sql.Identifier(role)))
            cur.execute(sql.SQL('GRANT USAGE, CREATE ON SCHEMA public TO {}').format(sql.Identifier(role)))
            for table in ('users','products','orders','logistics_trips','bids','analytics','sessions','audit_events','schema_migrations'):
                cur.execute(sql.SQL('ALTER TABLE {} OWNER TO {}').format(sql.Identifier(table), sql.Identifier(role)))
        conn.commit()
        env_path = str(Path(__file__).with_name('.env'))
        set_key(env_path, 'DB_USER', role)
        set_key(env_path, 'DB_PASSWORD', password)
        print('Dedicated application database role created; local environment updated without printing credentials.')
    except BaseException:
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    configure()
