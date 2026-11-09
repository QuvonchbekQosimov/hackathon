from config import DATA_MODE
from ai_service import ai_configured
from database import transaction
if __name__ == '__main__':
    with transaction() as cur:
        cur.execute('SELECT count(*) AS count FROM products')
        print('Products:', cur.fetchone()['count'])
    print('Gemini configured:', ai_configured())
    print('Data mode:', DATA_MODE)
