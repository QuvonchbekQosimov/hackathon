import os
import uuid
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai

# ==========================================
# 1. SOZLAMALAR VA BAZA ULANISHI
# ==========================================
DB_CONFIG = {
    "dbname": "vido_db", 
    "user": "postgres",
    "password": "Quvonch2006", 
    "host": "localhost",
    "port": "5432"
}

GEMINI_API_KEY = "AIzaSyAEzxjI6l46ktTeLxUtfDZ6Ied7OvOhX1Q"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-3.1-flash-lite-preview')

app = FastAPI(title="BAIS Enterprise API 🚀", version="3.0")

# CORS TO'LIQ OCHILDI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            phone_number VARCHAR(50) UNIQUE,
            password_hash VARCHAR(255),
            role VARCHAR(50),
            company_name VARCHAR(255)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(255) PRIMARY KEY,
            factory_id VARCHAR(255),
            name VARCHAR(255),
            category VARCHAR(100),
            price FLOAT,
            stock_quantity INTEGER,
            is_active BOOLEAN DEFAULT TRUE
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(255) PRIMARY KEY,
            buyer_id VARCHAR(255),
            product_id VARCHAR(255),
            quantity INTEGER,
            total_amount FLOAT,
            status VARCHAR(50) DEFAULT 'PENDING'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS logistics_trips (
            id VARCHAR(255) PRIMARY KEY,
            order_id VARCHAR(255),
            customer_price FLOAT,
            status VARCHAR(50) DEFAULT 'SEARCHING_DRIVER'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS bids (
            id VARCHAR(255) PRIMARY KEY,
            trip_id VARCHAR(255),
            driver_id VARCHAR(255),
            offered_price FLOAT,
            status VARCHAR(50) DEFAULT 'PENDING'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS analytics (
            id SERIAL PRIMARY KEY,
            product_id VARCHAR(255),
            region VARCHAR(100),
            year INTEGER,
            sold_volume FLOAT
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

init_db()

# ==========================================
# 3. SCHEMALAR (PYDANTIC)
# ==========================================
class UserAuth(BaseModel):
    phone_number: str
    password: str
    role: Optional[str] = None
    company_name: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    stock_quantity: int

class OrderCreate(BaseModel):
    buyer_id: str
    product_id: str
    quantity: int

class TripCreate(BaseModel):
    order_id: str
    customer_price: float

class BidCreate(BaseModel):
    trip_id: str
    driver_id: str
    offered_price: float

class ChatRequest(BaseModel):
    message: str

# ==========================================
# 4. API MARSHRUTLARI (ROUTERS)
# ==========================================

@app.post("/api/users/register")
def register_user(user: UserAuth):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM users WHERE phone_number = %s", (user.phone_number,))
    if cur.fetchone():
        raise HTTPException(status_code=400, detail="Bu telefon raqam ro'yxatdan o'tgan!")
    
    user_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO users (id, phone_number, password_hash, role, company_name)
        VALUES (%s, %s, %s, %s, %s) RETURNING *
    """, (user_id, user.phone_number, user.password, user.role, user.company_name))
    new_user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(new_user)

@app.post("/api/users/login")
def login_user(user: UserAuth):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM users WHERE phone_number = %s", (user.phone_number,))
    db_user = cur.fetchone()
    cur.close()
    conn.close()
    if not db_user or db_user['password_hash'] != user.password:
        raise HTTPException(status_code=400, detail="Telefon raqam yoki parol xato!")
    return dict(db_user)

# ==============================================================
# BARCHA XATOLAR YECHIMI: MAHSULOT QO'SHISH VA OLISH API
# ==============================================================
@app.post("/api/products")
def create_product(product: ProductCreate, factory_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Zavod borligini tekshiramiz
        cur.execute("SELECT id FROM users WHERE id = %s AND role = 'FACTORY'", (factory_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Zavod topilmadi yoki huquq yo'q!")

        new_id = str(uuid.uuid4())
        
        # Diqqat: Tizim qulamaydi. Barcha bazaga tushadigan qilib moslandi.
        cur.execute("""
            INSERT INTO products (id, factory_id, name, category, price, stock_quantity, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE) RETURNING *
        """, (new_id, factory_id, product.name, product.category, product.price, product.stock_quantity))
        
        new_prod = cur.fetchone()
        conn.commit()
        return dict(new_prod)
    except Exception as e:
        conn.rollback()
        # Endi xato bo'lsa CORS emas, aynan asl xato matni JSON bo'lib qaytadi!
        raise HTTPException(status_code=500, detail=f"Database xatosi: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.get("/api/products")
def get_all_products():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    # Bozorda Zavod nomi ko'rinishi uchun yagona tizim
    cur.execute("""
        SELECT p.*, u.company_name as factory_name 
        FROM products p
        LEFT JOIN users u ON p.factory_id = u.id
        WHERE p.is_active = TRUE
        ORDER BY p.name ASC
    """) 
    products = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(p) for p in products]

@app.get("/api/products/{product_id}")
def get_product_detail(product_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT p.*, u.company_name as factory_name 
        FROM products p
        LEFT JOIN users u ON p.factory_id = u.id
        WHERE p.id = %s
    """, (product_id,))
    product = cur.fetchone()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    cur.execute("SELECT region, SUM(sold_volume) as total_sold FROM analytics WHERE product_id = %s AND year = 2025 GROUP BY region ORDER BY total_sold DESC LIMIT 5", (product_id,))
    top_regions = cur.fetchall()

    cur.execute("SELECT year, SUM(sold_volume) as total_volume FROM analytics WHERE product_id = %s GROUP BY year ORDER BY year", (product_id,))
    yearly_trend = cur.fetchall()

    cur.close()
    conn.close()
    return {"product": dict(product), "top_regions": [dict(r) for r in top_regions], "yearly_trend": [dict(r) for r in yearly_trend]}

@app.post("/api/orders")
def create_new_order(order: OrderCreate):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM products WHERE id = %s", (order.product_id,))
        product = cur.fetchone()
        if not product: raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        if product['stock_quantity'] < order.quantity: raise HTTPException(status_code=400, detail="Omborda buncha mahsulot yo'q!")

        total_amount = product['price'] * order.quantity
        new_id = str(uuid.uuid4())
        
        cur.execute("""
            INSERT INTO orders (id, buyer_id, product_id, quantity, total_amount, status)
            VALUES (%s, %s, %s, %s, %s, 'PENDING') RETURNING *
        """, (new_id, order.buyer_id, order.product_id, order.quantity, total_amount))
        new_order = cur.fetchone()
        
        cur.execute("UPDATE products SET stock_quantity = stock_quantity - %s WHERE id = %s", (order.quantity, order.product_id))
        conn.commit()
        return dict(new_order)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/api/orders")
def get_all_orders():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM orders ORDER BY id DESC")
    orders = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(o) for o in orders]

@app.put("/api/orders/{order_id}/accept")
def accept_order_status(order_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("UPDATE orders SET status = 'ACCEPTED' WHERE id = %s RETURNING *", (order_id,))
    updated_order = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(updated_order)

@app.post("/api/logistics/trips")
def create_new_trip(trip: TripCreate):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    new_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO logistics_trips (id, order_id, customer_price, status)
        VALUES (%s, %s, %s, 'SEARCHING_DRIVER') RETURNING *
    """, (new_id, trip.order_id, trip.customer_price))
    new_trip = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(new_trip)

@app.get("/api/logistics/trips")
def get_all_trips():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM logistics_trips")
    trips = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(t) for t in trips]

@app.post("/api/logistics/bids")
def create_new_bid(bid: BidCreate):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    new_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO bids (id, trip_id, driver_id, offered_price, status)
        VALUES (%s, %s, %s, %s, 'PENDING') RETURNING *
    """, (new_id, bid.trip_id, bid.driver_id, bid.offered_price))
    new_bid = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(new_bid)

@app.get("/api/logistics/trips/{trip_id}/bids")
def get_trip_bids(trip_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM bids WHERE trip_id = %s", (trip_id,))
    bids = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(b) for b in bids]

@app.post("/api/chat")
def ai_chat(req: ChatRequest):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT name, price FROM products LIMIT 5")
    db_data = cur.fetchall()
    cur.close()
    conn.close()

    context_text = "\n".join([f"- Mahsulot: {row['name']}, Narxi: {row['price']} so'm" for row in db_data])

    try:
        prompt = f"""
        Sen 'BAIS' platformasining tahlilchisisan.
        Mijoz savoli: "{req.message}"
        Bozor narxlari: {context_text}
        Qisqa, aniq maslahat ber. Markdown ishlatma.
        """
        response = model.generate_content(prompt)
        reply = response.text
    except Exception as e:
        reply = f"AI xatosi: {str(e)}"
    return {"reply": reply}

@app.get("/api/analysis/{region}")
def get_analysis(region: str):
    return {
        "sector": f"{region} tahlili",
        "chartData": [
            { "name": "Yan", "olingan_2025": 4000, "prognoz_2026": 2400 },
            { "name": "Fev", "olingan_2025": 3000, "prognoz_2026": 1398 }
        ],
        "economics": { "factoryPrice": 120000, "logistics": 15000, "marketPrice": 160000, "profitMargin": 25000 }
    }

@app.get("/api/factories")
def get_factories():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id, company_name as name, 'O\\'zbekiston' as region FROM users WHERE role = 'FACTORY'")
    factories = cur.fetchall()
    cur.close()
    conn.close()
    if not factories:
        return [{"id": "1", "name": "Test Zavod", "region": "Toshkent"}]
    return [dict(f) for f in factories]