import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from psycopg2.extras import execute_values
import random
import uuid

# 1. BAZANI (DATABASE) YARATISH UCHUN ASOSIY ULANISH
BASE_CONFIG = {
    "dbname": "postgres", # Asosiy bazaga ulanamiz
    "user": "postgres",
    "password": "Quvonch2006", # <--- PAROLNI O'ZGARTIRING
    "host": "localhost",
    "port": "5432"
}

NEW_DB_NAME = "vido_db"

def create_database_if_not_exists():
    try:
        print("🔍 Baza bor-yo'qligi tekshirilmoqda...")
        conn = psycopg2.connect(**BASE_CONFIG)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT) 
        cur = conn.cursor()
        
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{NEW_DB_NAME}'")
        exists = cur.fetchone()
        
        if not exists:
            print(f"🛠 '{NEW_DB_NAME}' bazasi yaratilmoqda...")
            cur.execute(f"CREATE DATABASE {NEW_DB_NAME}")
            print("✅ Baza muvaffaqiyatli yaratildi!")
        else:
            print(f"ℹ️ '{NEW_DB_NAME}' bazasi allaqachon mavjud.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Baza yaratishda xato: {e}")
        return False
    return True

# 2. YANGI BAZAGA ULANISH SOZLAMASI
DB_CONFIG = {
    "dbname": NEW_DB_NAME,
    "user": "postgres",
    "password": "Quvonch2006", # <--- PAROLNI O'ZGARTIRING (yoki Quvonch2006 qiling)
    "host": "localhost",
    "port": "5432"
}

def generate_data():
    if not create_database_if_not_exists():
        return

    print("⏳ Yangi bazaga ulanilmoqda va jadvallar yozilmoqda...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 3. JADVALLARNI YARATISH (YANGI ARCHITEKTURAGA MOSLASHTIRILDI)
    # Diqqat: TRUNCATE qilib eski test ma'lumotlarini tozalaymiz, aralashib ketmasligi uchun.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            phone_number VARCHAR(50) UNIQUE,
            password_hash VARCHAR(255),
            role VARCHAR(50),
            company_name VARCHAR(255)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(255) PRIMARY KEY,
            factory_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255),
            category VARCHAR(100),
            sub_category VARCHAR(100),
            location VARCHAR(255),
            price FLOAT,
            stock_quantity INTEGER,
            min_order VARCHAR(100),
            contact_phone VARCHAR(50),
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS analytics (
            id SERIAL PRIMARY KEY,
            product_id VARCHAR(255) REFERENCES products(id) ON DELETE CASCADE,
            region VARCHAR(100),
            year INTEGER,
            month INTEGER,
            market_price FLOAT,
            demand_percentage INTEGER,
            sold_volume FLOAT
        );
    """)

    # Eskirgan mock datalarni tozalaymiz
    cur.execute("TRUNCATE TABLE analytics, products CASCADE;")
    print("✅ Jadvallar tayyor! Ma'lumotlar qo'shilmoqda...")

    # 4. ZAVODLAR VA MAHSULOTLAR BAZASI
    raw_products = [
        ("Erkaklar Krossovkasi (Kuzgi)", "Poyabzal", "Sport", "Vodiy Shoes MCHJ", "Andijon vil., Xo'jaobod tumani", 120000, "100 juft", "+998 90 111 22 33", "To'g'ridan-to'g'ri zavoddan yuqori sifatli krossovkalar."),
        ("Ayollar Tuflisi (Klassik)", "Poyabzal", "Klassika", "Sifat Poyabzal", "Toshkent sh., Abu Saxiy bozori", 150000, "50 juft", "+998 93 222 33 44", "Italiya dizayni asosida mahalliy ishlab chiqarish."),
        ("Qishki Etiklar (O'g'il bolalar)", "Poyabzal", "Qishki", "Qo'qon Charm", "Farg'ona vil., Qo'qon erkin iqtisodiy zonasi", 180000, "200 juft", "+998 99 333 44 55", "Sof charmdan tayyorlangan issiq etiklar."),
        ("Armatura (A500C, 12mm)", "Qurilish", "Metall", "Toshkent Metallurgiya", "Toshkent sh., Sergeli sanoat zonasi", 8500000, "10 tonna", "+998 71 444 55 66", "Rossiya standarti asosida ishlab chiqarilgan mustahkam armatura."),
        ("Portlandsment (M400)", "Qurilish", "Qorishma", "Ohangaron Sement", "Toshkent vil., Ohangaron tumani", 950000, "20 tonna", "+998 97 555 66 77", "Yuqori sifatli sement. Qoplangan (50kg)."),
        ("G'isht (Pishgan)", "Qurilish", "G'isht", "Samarqand G'isht Zavodi", "Samarqand vil., Jomboy tumani", 1200, "10 000 dona", "+998 90 666 77 88", "A'lo darajada pishirilgan standart g'ishtlar."),
        ("Konditsioner (12 talik)", "Texnika", "Maishiy", "Artel Zavodi", "Toshkent sh., Rohat aylanmasi", 3200000, "20 dona", "+998 78 777 88 99", "Inverter motorli, 3 yillik kafolatga ega konditsioner."),
        ("Televizor (43 dyuym, Smart)", "Texnika", "Elektronika", "Roison Electronics", "Navoiy vil., Navoiy EIZ", 2400000, "10 dona", "+998 94 888 99 00", "4K formatli Android TV."),
        ("Paxta Mato (100% Cotton)", "To'qimachilik", "Xomashyo", "Buxoro Teks", "Buxoro sh., Sanoat ko'chasi", 15000, "1000 metr", "+998 91 999 00 11", "Kiyim-kechak ishlab chiqarish uchun oliy navli mato."),
        ("Erkaklar Kostyum-Shimi", "To'qimachilik", "Tayyor kiyim", "Samo", "Namangan sh., Chorsu bozori atrofi", 450000, "50 komplekt", "+998 95 000 11 22", "Turkiya bichimi asosida tikilgan sifatli kostyumlar.")
    ]

    # Zavodlarni avtomatik ro'yxatdan o'tkazish (FK xato bermasligi uchun)
    factory_ids = {}
    for i, row in enumerate(raw_products):
        company_name = row[3]
        if company_name not in factory_ids:
            f_id = str(uuid.uuid4())
            factory_ids[company_name] = f_id
            phone = f"+99890{random.randint(1000000, 9999999)}"
            cur.execute("""
                INSERT INTO users (id, phone_number, password_hash, role, company_name)
                VALUES (%s, %s, '12345678', 'FACTORY', %s) ON CONFLICT DO NOTHING
            """, (f_id, phone, company_name))

    # Mahsulotlarni tayyorlash
    products_data = []
    for row in raw_products:
        p_id = str(uuid.uuid4())
        factory_id = factory_ids[row[3]]
        # (id, factory_id, name, category, sub_category, location, price, stock_quantity, min_order, contact_phone, description)
        products_data.append((p_id, factory_id, row[0], row[1], row[2], row[4], row[5], random.randint(100, 5000), row[6], row[7], row[8]))

    insert_products_query = """
        INSERT INTO products (id, factory_id, name, category, sub_category, location, price, stock_quantity, min_order, contact_phone, description)
        VALUES %s RETURNING id, price;
    """
    
    product_records = execute_values(cur, insert_products_query, products_data, fetch=True)
    
    # 5. BIG DATA YARATISH
    print("📊 Yillik AI analitikasi (Big Data) shakllantirilmoqda... Bu bir necha soniya olishi mumkin.")
    
    regions = ["Toshkent", "Andijon", "Buxoro", "Farg'ona", "Jizzax", "Xorazm", "Namangan", "Navoiy", "Qashqadaryo", "Qoraqalpog'iston", "Samarqand", "Sirdaryo", "Surxondaryo", "Toshkent viloyati"]
    years = [2024, 2025, 2026]
    months = list(range(1, 13))

    analytics_data = []

    for p_id, f_price in product_records:
        for region in regions:
            regional_multiplier = random.uniform(0.7, 1.5) 
            for year in years:
                for month in months:
                    season_boost = 1.0
                    if month in [5, 6, 7, 8]: season_boost = random.uniform(1.2, 1.8) 
                    elif month in [11, 12, 1, 2]: season_boost = random.uniform(0.6, 1.3) 
                    
                    market_price = float(f_price * random.uniform(1.15, 1.4)) 
                    demand = int(random.uniform(40, 90) * regional_multiplier)
                    if demand > 100: demand = random.randint(95, 100)
                    
                    sold_volume = float(int(random.uniform(100, 5000) * season_boost * regional_multiplier))

                    analytics_data.append((p_id, region, year, month, market_price, demand, sold_volume))

    insert_analytics_query = """
        INSERT INTO analytics (product_id, region, year, month, market_price, demand_percentage, sold_volume)
        VALUES %s;
    """
    execute_values(cur, insert_analytics_query, analytics_data)

    conn.commit()
    cur.close()
    conn.close()
    print(f"🎉 MUVAFFAQIYATLI! Bazaga {len(analytics_data)} qator tarixiy statistika va mahsulotlar yozildi!")

if __name__ == "__main__":
    generate_data()