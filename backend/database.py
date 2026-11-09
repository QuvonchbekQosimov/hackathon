"""Bounded PostgreSQL pool and transactions; all routes use this module."""
from contextlib import contextmanager
from threading import Lock
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
from config import DB_CONFIG, DATABASE_URL
_pool = None
_lock = Lock()
def pool():
    global _pool
    with _lock:
        if _pool is None:
            _pool = ThreadedConnectionPool(1, 20, DATABASE_URL, connect_timeout=5) if DATABASE_URL else ThreadedConnectionPool(1, 20, **DB_CONFIG)
    return _pool
@contextmanager
def transaction():
    connection = pool().getconn()
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            yield cursor
        connection.commit()
    except BaseException:
        connection.rollback()
        raise
    finally:
        pool().putconn(connection)
def close_pool():
    global _pool
    with _lock:
        if _pool:
            _pool.closeall()
            _pool = None
