"""Explicit, repeatable demo seeding. Existing rows are preserved."""
import json
import random
import uuid
from pathlib import Path
from config import DATA_MODE
from database import transaction
from migrations import migrate
from security import hash_password

def generate_data():
    if DATA_MODE != 'demo':
        raise SystemExit('Demo seeding requires DATA_MODE=demo.')
    migrate()
    rng = random.Random(42)
    rows = json.loads(Path(__file__).with_name('seed_data.json').read_text(encoding='utf-8'))
    regions = ['Toshkent','Andijon','Buxoro',"Farg'ona",'Jizzax','Xorazm','Namangan','Navoiy','Qashqadaryo',"Qoraqalpog'iston",'Samarqand','Sirdaryo','Surxondaryo','Toshkent viloyati']
    added = 0
    with transaction() as cur:
        cur.execute('SELECT pg_advisory_xact_lock(847232)')
        for index, row in enumerate(rows):
            name,category,sub_category,company,location,price,min_order,phone,description=row
            cur.execute("SELECT id FROM users WHERE role='FACTORY' AND company_name=%s ORDER BY id LIMIT 1",(company,))
            factory=cur.fetchone()
            if not factory:
                factory={'id':str(uuid.uuid4())}
                # Unpublished random credentials; users create their own accounts.
                cur.execute("INSERT INTO users(id,phone_number,password_hash,role,company_name) VALUES(%s,%s,%s,'FACTORY',%s)",(factory['id'],f'+99899000{index:04}',hash_password(uuid.uuid4().hex),company))
            cur.execute('SELECT id FROM products WHERE factory_id=%s AND name=%s',(factory['id'],name))
            product=cur.fetchone()
            if not product:
                product={'id':str(uuid.uuid4())}
                cur.execute('INSERT INTO products(id,factory_id,name,category,price,stock_quantity,location,min_order,contact_phone,description) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',(product['id'],factory['id'],name,category,price,rng.randint(100,5000),location,min_order,phone,description))
                added+=1
            cur.execute('SELECT 1 FROM analytics WHERE product_id=%s LIMIT 1',(product['id'],))
            if not cur.fetchone():
                data=[(product['id'],region,year,month,rng.randint(100,5000),round(price*rng.uniform(1.15,1.4),2)) for region in regions for year in (2024,2025) for month in range(1,13)]
                cur.executemany('INSERT INTO analytics(product_id,region,year,month,sold_volume,market_price) VALUES(%s,%s,%s,%s,%s,%s)',data)
    print(f'Demo seed finished. New products: {added}. Existing records preserved.')
if __name__ == '__main__':
    generate_data()
