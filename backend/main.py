"""BAIS: authenticated catalog, inventory, orders and delivery workflows."""
import logging
import secrets
import time
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from threading import Lock
import psycopg2
from fastapi import FastAPI, Depends, HTTPException, Request, Response, Query, Header
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from config import ALLOWED_ORIGINS, COOKIE_SECURE, SESSION_SECONDS, DATA_MODE, APP_ENV
from database import transaction, close_pool
from migrations import migrate
from security import hash_password, verify_password, public_user, session_hash, needs_rehash
from schemas import Register, Login, ProductCreate, OrderCreate, TripCreate, BidCreate, Profile, ChatRequest, PasswordChange
from ai_service import answer, ai_configured
from body_limit import BodyLimitMiddleware

logger = logging.getLogger('bais')
COOKIE = 'bais_session'
DUMMY_PASSWORD = hash_password('no-valid-account')
_limits = defaultdict(deque)
_limit_lock = Lock()

@asynccontextmanager
async def lifespan(app):
    await run_in_threadpool(migrate)
    yield
    close_pool()

app = FastAPI(title='BAIS Platform API', version='4.0.0', lifespan=lifespan, docs_url='/docs' if APP_ENV != 'production' else None, redoc_url=None)

@app.middleware('http')
async def protection(request: Request, call_next):
    started = time.monotonic()
    request_id = str(uuid.uuid4())
    if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
        origin = request.headers.get('origin')
        if (origin and origin.rstrip('/') not in ALLOWED_ORIGINS) or request.headers.get('sec-fetch-site') == 'cross-site':
            return JSONResponse(status_code=403, content={'detail': "Bu manbadan so'rovga ruxsat yo'q."})
    if request.method != 'OPTIONS':
        group = 'auth' if request.url.path in ('/api/users/login', '/api/users/register') else 'chat' if request.url.path == '/api/chat' else 'api'
        limit = {'auth': 30, 'chat': 6, 'api': 300}[group]
        with _limit_lock:
            now = time.monotonic()
            queue = _limits[(request.client.host if request.client else 'unknown', group)]
            while queue and queue[0] < now - 60:
                queue.popleft()
            allowed = len(queue) < limit
            if allowed:
                queue.append(now)
            if len(_limits) > 10000:
                for key in list(_limits):
                    if not _limits[key] or _limits[key][-1] < now - 60:
                        del _limits[key]
        if not allowed:
            return JSONResponse(status_code=429, content={'detail': "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring."}, headers={'Retry-After': '60'})
    response = await call_next(request)
    for key, value in {'X-Request-ID': request_id, 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Cache-Control': 'no-store'}.items():
        response.headers[key] = value
    logger.info('%s %s %s %.0fms %s', request.method, request.url.path, response.status_code, (time.monotonic() - started) * 1000, request_id)
    return response

app.add_middleware(BodyLimitMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allow_headers=['Content-Type', 'Idempotency-Key'])

@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    detail = ' '.join('.'.join(str(x) for x in e['loc'] if x not in ('body', 'query')) + ': ' + e['msg'].removeprefix('Value error, ') for e in exc.errors())
    return JSONResponse(status_code=422, content={'detail': detail})

@app.exception_handler(psycopg2.IntegrityError)
async def integrity_error(request, exc):
    return JSONResponse(status_code=409, content={'detail': "Ma'lumot boshqa yozuv bilan mos kelmaydi. Sahifani yangilang."})

@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    logger.exception('Request failed: %s %s', request.method, request.url.path)
    return JSONResponse(status_code=503, content={'detail': "Xizmat vaqtincha mavjud emas. Qayta urinib ko'ring."})

def audit(cur, user, action, entity):
    cur.execute('INSERT INTO audit_events(actor_id,action,entity_id) VALUES(%s,%s,%s)', (user['id'], action, entity))

def optional_user(request: Request):
    token = request.cookies.get(COOKIE, '')
    if not token or len(token) > 200:
        return None
    with transaction() as cur:
        cur.execute('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=%s AND s.expires_at>now()', (session_hash(token),))
        return cur.fetchone()

def current_user(request: Request):
    user = optional_user(request)
    if not user:
        raise HTTPException(401, 'Tizimga kiring.')
    return user

def role(user, expected):
    if user['role'] != expected:
        raise HTTPException(403, "Bu amal uchun huquqingiz yo'q.")

def issue_session(cur, user, response):
    token = secrets.token_urlsafe(48)
    cur.execute('DELETE FROM sessions WHERE expires_at<now()')
    cur.execute('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(%s,%s,%s)', (session_hash(token), user['id'], datetime.now(timezone.utc) + timedelta(seconds=SESSION_SECONDS)))
    response.set_cookie(COOKIE, token, max_age=SESSION_SECONDS, httponly=True, secure=COOKIE_SECURE, samesite='lax', path='/')

@app.get('/api/health', tags=['System'])
def health():
    with transaction() as cur:
        cur.execute('SELECT 1')
    return {'status': 'ok', 'version': '4.0.0', 'data_mode': DATA_MODE}

@app.get('/api/capabilities', tags=['System'])
def capabilities():
    return {'ai_configured': ai_configured(), 'ai_fallback': True, 'identity_verification': False, 'payments': False, 'data_mode': DATA_MODE}

@app.post('/api/users/register', status_code=201, tags=['Accounts'])
def register(body: Register, response: Response):
    encoded = hash_password(body.password)
    with transaction() as cur:
        cur.execute('INSERT INTO users(id,phone_number,password_hash,role,company_name) VALUES(%s,%s,%s,%s,%s) ON CONFLICT(phone_number) DO NOTHING RETURNING *', (str(uuid.uuid4()), body.phone_number, encoded, body.role, body.company_name))
        user = cur.fetchone()
        if not user:
            raise HTTPException(409, "Bu telefon raqam ro'yxatdan o'tgan.")
        issue_session(cur, user, response)
        audit(cur, user, 'user.register', user['id'])
    return public_user(user)

@app.post('/api/users/login', tags=['Accounts'])
def login(body: Login, response: Response, request: Request):
    with transaction() as cur:
        cur.execute('SELECT * FROM users WHERE phone_number=%s', (body.phone_number,))
        user = cur.fetchone()
        valid = verify_password(body.password, user['password_hash'] if user else DUMMY_PASSWORD)
        if not user or not valid:
            raise HTTPException(401, 'Telefon raqam yoki parol xato.')
        if needs_rehash(user['password_hash']):
            cur.execute('UPDATE users SET password_hash=%s WHERE id=%s', (hash_password(body.password), user['id']))
        previous = request.cookies.get(COOKIE)
        if previous:
            cur.execute('DELETE FROM sessions WHERE token_hash=%s', (session_hash(previous),))
        issue_session(cur, user, response)
        audit(cur, user, 'user.login', user['id'])
    return public_user(user)

@app.post('/api/users/logout', tags=['Accounts'])
def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE)
    if token:
        with transaction() as cur:
            cur.execute('DELETE FROM sessions WHERE token_hash=%s', (session_hash(token),))
    response.delete_cookie(COOKIE, path='/', httponly=True, secure=COOKIE_SECURE, samesite='lax')
    return {'ok': True}

@app.get('/api/users/me', tags=['Accounts'])
def me(user=Depends(current_user)):
    return public_user(user)

@app.put('/api/users/me', tags=['Accounts'])
def profile(body: Profile, user=Depends(current_user)):
    if user['role'] in ('BUYER', 'FACTORY') and not body.company_name.strip():
        raise HTTPException(422, 'Kompaniya nomini kiriting.')
    with transaction() as cur:
        cur.execute('UPDATE users SET first_name=%s,last_name=%s,company_name=%s,email=%s,address=%s WHERE id=%s RETURNING *', (body.first_name.strip(), body.last_name.strip(), body.company_name.strip(), body.email, body.address.strip(), user['id']))
        result = cur.fetchone()
        audit(cur, user, 'profile.update', user['id'])
    return public_user(result)

@app.post('/api/users/password', tags=['Accounts'])
def change_password(body: PasswordChange, response: Response, user=Depends(current_user)):
    with transaction() as cur:
        cur.execute('SELECT password_hash FROM users WHERE id=%s FOR UPDATE', (user['id'],))
        saved = cur.fetchone()
        if not verify_password(body.current_password, saved['password_hash']):
            raise HTTPException(400, 'Joriy parol noto‘g‘ri.')
        if body.new_password == body.current_password:
            raise HTTPException(422, 'Yangi parol joriy paroldan farq qilishi kerak.')
        cur.execute('UPDATE users SET password_hash=%s WHERE id=%s', (hash_password(body.new_password), user['id']))
        cur.execute('DELETE FROM sessions WHERE user_id=%s', (user['id'],))
        issue_session(cur, user, response)
        audit(cur, user, 'password.change', user['id'])
    return {'ok': True}

PRODUCT_SELECT = 'SELECT p.*,u.company_name AS factory_name FROM products p JOIN users u ON u.id=p.factory_id'

def catalog_filter(search, category):
    clause = ' WHERE p.is_active=TRUE'
    params = []
    if search:
        clause += ' AND (p.name ILIKE %s OR u.company_name ILIKE %s)'
        params += [f'%{search}%', f'%{search}%']
    if category:
        clause += ' AND p.category=%s'
        params.append(category)
    return clause, params

@app.get('/api/products', tags=['Catalog'])
def products(request: Request, search: str=Query('', max_length=100), category: str=Query('', max_length=100), limit: int=Query(100, ge=1, le=200), offset: int=Query(0, ge=0), mine: bool=False, include_archived: bool=False):
    clause, params = catalog_filter(search, category)
    if include_archived and not mine:
        raise HTTPException(403, 'Arxiv faqat shaxsiy ombor uchun ochiq.')
    if mine:
        user = current_user(request)
        role(user, 'FACTORY')
        clause += ' AND p.factory_id=%s'
        params.append(user['id'])
        if include_archived:
            clause = clause.replace('p.is_active=TRUE', 'TRUE')
    with transaction() as cur:
        cur.execute(PRODUCT_SELECT + clause + ' ORDER BY p.created_at DESC,p.id LIMIT %s OFFSET %s', params + [limit, offset])
        return cur.fetchall()

@app.get('/api/catalog', tags=['Catalog'])
def catalog(search: str=Query('', max_length=100), category: str=Query('', max_length=100), sort: str=Query('newest', pattern='^(newest|price_asc|price_desc|name)$'), page: int=Query(1, ge=1), page_size: int=Query(12, ge=1, le=100)):
    clause, params = catalog_filter(search, category)
    ordering = {'newest': 'p.created_at DESC', 'price_asc': 'p.price ASC', 'price_desc': 'p.price DESC', 'name': 'p.name ASC'}[sort]
    with transaction() as cur:
        cur.execute('SELECT count(*) AS total FROM products p JOIN users u ON u.id=p.factory_id' + clause, params)
        total = cur.fetchone()['total']
        cur.execute(PRODUCT_SELECT + clause + f' ORDER BY {ordering},p.id LIMIT %s OFFSET %s', params + [page_size, (page - 1) * page_size])
        items = cur.fetchall()
        cur.execute('SELECT DISTINCT category FROM products WHERE is_active ORDER BY category')
        categories = [r['category'] for r in cur.fetchall()]
    return {'items': items, 'total': total, 'page': page, 'page_size': page_size, 'categories': categories}

@app.get('/api/products/{product_id}', tags=['Catalog'])
def product_detail(product_id: str):
    with transaction() as cur:
        cur.execute(PRODUCT_SELECT + ' WHERE p.id=%s AND p.is_active', (product_id,))
        product = cur.fetchone()
        if not product:
            raise HTTPException(404, 'Mahsulot topilmadi.')
        cur.execute('SELECT region,SUM(sold_volume) AS total_sold FROM analytics WHERE product_id=%s AND year=(SELECT MAX(year) FROM analytics WHERE product_id=%s AND year<EXTRACT(YEAR FROM CURRENT_DATE)) GROUP BY region ORDER BY total_sold DESC LIMIT 5', (product_id, product_id))
        regions = cur.fetchall()
        cur.execute('SELECT year,SUM(sold_volume) AS total_volume FROM analytics WHERE product_id=%s GROUP BY year ORDER BY year', (product_id,))
        trend = cur.fetchall()
    return {'product': product, 'top_regions': regions, 'yearly_trend': trend, 'data_mode': DATA_MODE}

@app.post('/api/products', status_code=201, tags=['Catalog'])
def create_product(body: ProductCreate, user=Depends(current_user)):
    role(user, 'FACTORY')
    ident = str(uuid.uuid4())
    with transaction() as cur:
        cur.execute('INSERT INTO products(id,factory_id,name,category,price,stock_quantity,location,min_order,contact_phone,description) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *', (ident, user['id'], *body.model_dump().values()))
        result = cur.fetchone()
        audit(cur, user, 'product.create', ident)
    return result

@app.put('/api/products/{product_id}', tags=['Catalog'])
def edit_product(product_id: str, body: ProductCreate, user=Depends(current_user)):
    role(user, 'FACTORY')
    with transaction() as cur:
        cur.execute('SELECT * FROM products WHERE id=%s AND factory_id=%s FOR UPDATE', (product_id, user['id']))
        if not cur.fetchone():
            raise HTTPException(404, 'Mahsulot topilmadi.')
        cur.execute('UPDATE products SET name=%s,category=%s,price=%s,stock_quantity=%s,location=%s,min_order=%s,contact_phone=%s,description=%s WHERE id=%s RETURNING *', (*body.model_dump().values(), product_id))
        result = cur.fetchone()
        audit(cur, user, 'product.update', product_id)
    return result

@app.delete('/api/products/{product_id}', tags=['Catalog'])
def archive_product(product_id: str, user=Depends(current_user)):
    role(user, 'FACTORY')
    with transaction() as cur:
        cur.execute('UPDATE products SET is_active=FALSE WHERE id=%s AND factory_id=%s RETURNING id', (product_id, user['id']))
        if not cur.fetchone():
            raise HTTPException(404, 'Mahsulot topilmadi.')
        audit(cur, user, 'product.archive', product_id)
    return {'ok': True}

@app.put('/api/products/{product_id}/restore', tags=['Catalog'])
def restore_product(product_id: str, user=Depends(current_user)):
    role(user, 'FACTORY')
    with transaction() as cur:
        cur.execute('UPDATE products SET is_active=TRUE WHERE id=%s AND factory_id=%s RETURNING id', (product_id, user['id']))
        if not cur.fetchone():
            raise HTTPException(404, 'Mahsulot topilmadi.')
        audit(cur, user, 'product.restore', product_id)
    return {'ok': True}

ORDER_SELECT = 'SELECT o.*,p.name AS product_name,p.factory_id,u.company_name AS factory_name FROM orders o JOIN products p ON p.id=o.product_id JOIN users u ON u.id=p.factory_id'

@app.get('/api/orders', tags=['Orders'])
def orders(user=Depends(current_user), limit: int=Query(100, ge=1, le=200), offset: int=Query(0, ge=0)):
    if user['role'] == 'DRIVER':
        raise HTTPException(403, "Bu amal uchun huquqingiz yo'q.")
    column = 'o.buyer_id' if user['role'] == 'BUYER' else 'p.factory_id'
    with transaction() as cur:
        cur.execute(ORDER_SELECT + f' WHERE {column}=%s ORDER BY o.created_at DESC,o.id LIMIT %s OFFSET %s', (user['id'], limit, offset))
        return cur.fetchall()

@app.post('/api/orders', status_code=201, tags=['Orders'])
def create_order(body: OrderCreate, user=Depends(current_user), idempotency_key: str=Header(..., alias='Idempotency-Key', min_length=16, max_length=100)):
    role(user, 'BUYER')
    with transaction() as cur:
        cur.execute('SELECT pg_advisory_xact_lock(hashtextextended(%s,0))', (user['id'] + idempotency_key,))
        cur.execute('SELECT * FROM orders WHERE buyer_id=%s AND idempotency_key=%s', (user['id'], idempotency_key))
        existing = cur.fetchone()
        if existing:
            if existing['product_id'] != body.product_id or existing['quantity'] != body.quantity:
                raise HTTPException(409, 'Takroriy kalit boshqa buyurtma uchun ishlatilgan.')
            return existing
        cur.execute('SELECT * FROM products WHERE id=%s AND is_active FOR UPDATE', (body.product_id,))
        product = cur.fetchone()
        if not product:
            raise HTTPException(404, 'Mahsulot topilmadi.')
        if product['stock_quantity'] < body.quantity:
            raise HTTPException(409, "Omborda yetarli mahsulot yo'q.")
        ident = str(uuid.uuid4())
        cur.execute("INSERT INTO orders(id,buyer_id,product_id,quantity,unit_price,total_amount,status,idempotency_key) VALUES(%s,%s,%s,%s,%s,%s,'PENDING',%s) RETURNING *", (ident, user['id'], body.product_id, body.quantity, product['price'], product['price'] * body.quantity, idempotency_key))
        result = cur.fetchone()
        cur.execute('UPDATE products SET stock_quantity=stock_quantity-%s WHERE id=%s', (body.quantity, body.product_id))
        audit(cur, user, 'order.create', ident)
    return result

def locked_order(cur, ident, user):
    cur.execute('SELECT o.*,p.factory_id FROM orders o JOIN products p ON p.id=o.product_id WHERE o.id=%s FOR UPDATE OF o', (ident,))
    order = cur.fetchone()
    if not order or user['id'] not in (order['buyer_id'], order['factory_id']):
        raise HTTPException(404, 'Buyurtma topilmadi.')
    return order

@app.put('/api/orders/{order_id}/accept', tags=['Orders'])
def accept_order(order_id: str, user=Depends(current_user)):
    role(user, 'FACTORY')
    with transaction() as cur:
        order = locked_order(cur, order_id, user)
        if order['factory_id'] != user['id']:
            raise HTTPException(404, 'Buyurtma topilmadi.')
        if order['status'] != 'PENDING':
            raise HTTPException(409, 'Faqat kutilayotgan buyurtma tasdiqlanadi.')
        cur.execute("UPDATE orders SET status='ACCEPTED' WHERE id=%s RETURNING *", (order_id,))
        result = cur.fetchone()
        audit(cur, user, 'order.accept', order_id)
    return result

@app.put('/api/orders/{order_id}/cancel', tags=['Orders'])
def cancel_order(order_id: str, user=Depends(current_user)):
    with transaction() as cur:
        order = locked_order(cur, order_id, user)
        if order['status'] not in ('PENDING', 'ACCEPTED'):
            raise HTTPException(409, "Bu buyurtmani bekor qilib bo'lmaydi.")
        cur.execute("SELECT id FROM logistics_trips WHERE order_id=%s AND status NOT IN ('SEARCHING_DRIVER','CANCELLED')", (order_id,))
        if cur.fetchone():
            raise HTTPException(409, 'Haydovchi tayinlangan. Avval yetkazishni yakunlang.')
        cur.execute("UPDATE logistics_trips SET status='CANCELLED' WHERE order_id=%s AND status='SEARCHING_DRIVER'", (order_id,))
        cur.execute("UPDATE bids SET status='REJECTED' WHERE trip_id IN (SELECT id FROM logistics_trips WHERE order_id=%s) AND status='PENDING'", (order_id,))
        cur.execute("UPDATE orders SET status='CANCELLED' WHERE id=%s RETURNING *", (order_id,))
        result = cur.fetchone()
        cur.execute('UPDATE products SET stock_quantity=stock_quantity+%s WHERE id=%s', (order['quantity'], order['product_id']))
        audit(cur, user, 'order.cancel', order_id)
    return result

@app.put('/api/orders/{order_id}/complete', tags=['Orders'])
def complete_order(order_id: str, user=Depends(current_user)):
    role(user, 'BUYER')
    with transaction() as cur:
        order = locked_order(cur, order_id, user)
        if order['buyer_id'] != user['id'] or order['status'] != 'ACCEPTED':
            raise HTTPException(409, 'Buyurtma hali qabul qilishga tayyor emas.')
        cur.execute("SELECT status FROM logistics_trips WHERE order_id=%s AND status<>'CANCELLED'", (order_id,))
        trip = cur.fetchone()
        if trip and trip['status'] != 'DELIVERED':
            raise HTTPException(409, 'Yetkazib berish hali yakunlanmagan.')
        cur.execute("UPDATE orders SET status='DELIVERED' WHERE id=%s RETURNING *", (order_id,))
        result = cur.fetchone()
        audit(cur, user, 'order.complete', order_id)
    return result

TRIP_SELECT = 'SELECT t.*,p.name AS product_name,o.buyer_id,p.factory_id,o.quantity FROM logistics_trips t JOIN orders o ON o.id=t.order_id JOIN products p ON p.id=o.product_id'

@app.get('/api/logistics/trips', tags=['Logistics'])
def trips(user=Depends(current_user), limit: int=Query(100, ge=1, le=200), offset: int=Query(0, ge=0)):
    condition = "(t.status='SEARCHING_DRIVER' OR t.assigned_driver_id=%s)" if user['role'] == 'DRIVER' else 'o.buyer_id=%s' if user['role'] == 'BUYER' else 'p.factory_id=%s'
    with transaction() as cur:
        cur.execute(TRIP_SELECT + f' WHERE {condition} ORDER BY t.created_at DESC,t.id LIMIT %s OFFSET %s', (user['id'], limit, offset))
        rows = cur.fetchall()
        if user['role'] == 'DRIVER':
            for row in rows:
                cur.execute('SELECT offered_price,status FROM bids WHERE trip_id=%s AND driver_id=%s', (row['id'], user['id']))
                row['my_bid'] = cur.fetchone()
    return rows

@app.post('/api/logistics/trips', status_code=201, tags=['Logistics'])
def create_trip(body: TripCreate, user=Depends(current_user)):
    role(user, 'BUYER')
    with transaction() as cur:
        order = locked_order(cur, body.order_id, user)
        if order['buyer_id'] != user['id'] or order['status'] != 'ACCEPTED':
            raise HTTPException(409, 'Buyurtma avval zavod tomonidan tasdiqlanishi kerak.')
        ident = str(uuid.uuid4())
        cur.execute('INSERT INTO logistics_trips(id,order_id,customer_price,from_location,to_location,weight_tons) VALUES(%s,%s,%s,%s,%s,%s) RETURNING *', (ident, body.order_id, body.customer_price, body.from_location.strip(), body.to_location.strip(), body.weight_tons))
        result = cur.fetchone()
        audit(cur, user, 'trip.create', ident)
    return result

@app.post('/api/logistics/bids', status_code=201, tags=['Logistics'])
def create_bid(body: BidCreate, user=Depends(current_user)):
    role(user, 'DRIVER')
    with transaction() as cur:
        cur.execute('SELECT * FROM logistics_trips WHERE id=%s FOR UPDATE', (body.trip_id,))
        trip = cur.fetchone()
        if not trip:
            raise HTTPException(404, 'Yuk topilmadi.')
        if trip['status'] != 'SEARCHING_DRIVER':
            raise HTTPException(409, 'Bu auksion yopilgan.')
        cur.execute('INSERT INTO bids(id,trip_id,driver_id,offered_price) VALUES(%s,%s,%s,%s) ON CONFLICT(trip_id,driver_id) DO UPDATE SET offered_price=EXCLUDED.offered_price RETURNING *', (str(uuid.uuid4()), body.trip_id, user['id'], body.offered_price))
        result = cur.fetchone()
        audit(cur, user, 'bid.submit', result['id'])
    return result

@app.get('/api/logistics/trips/{trip_id}/bids', tags=['Logistics'])
def trip_bids(trip_id: str, user=Depends(current_user)):
    with transaction() as cur:
        cur.execute(TRIP_SELECT + ' WHERE t.id=%s', (trip_id,))
        trip = cur.fetchone()
        if not trip or user['id'] not in (trip['buyer_id'], trip['factory_id']):
            raise HTTPException(404, 'Yuk topilmadi.')
        cur.execute('SELECT b.*,u.company_name,u.first_name,u.last_name FROM bids b JOIN users u ON u.id=b.driver_id WHERE trip_id=%s ORDER BY offered_price,created_at', (trip_id,))
        return cur.fetchall()

@app.put('/api/logistics/bids/{bid_id}/accept', tags=['Logistics'])
def accept_bid(bid_id: str, user=Depends(current_user)):
    role(user, 'BUYER')
    with transaction() as cur:
        cur.execute('SELECT b.*,t.order_id FROM bids b JOIN logistics_trips t ON t.id=b.trip_id WHERE b.id=%s', (bid_id,))
        bid = cur.fetchone()
        if not bid:
            raise HTTPException(404, 'Taklif topilmadi.')
        order = locked_order(cur, bid['order_id'], user)
        if order['buyer_id'] != user['id'] or order['status'] != 'ACCEPTED':
            raise HTTPException(409, 'Buyurtma faol emas.')
        cur.execute('SELECT * FROM logistics_trips WHERE id=%s FOR UPDATE', (bid['trip_id'],))
        if cur.fetchone()['status'] != 'SEARCHING_DRIVER':
            raise HTTPException(409, 'Haydovchi allaqachon tanlangan.')
        cur.execute('SELECT * FROM bids WHERE id=%s', (bid_id,))
        bid = cur.fetchone()
        cur.execute("UPDATE logistics_trips SET status='ASSIGNED',assigned_driver_id=%s,accepted_price=%s WHERE id=%s RETURNING *", (bid['driver_id'], bid['offered_price'], bid['trip_id']))
        result = cur.fetchone()
        cur.execute("UPDATE bids SET status=CASE WHEN id=%s THEN 'ACCEPTED' ELSE 'REJECTED' END WHERE trip_id=%s", (bid_id, bid['trip_id']))
        audit(cur, user, 'bid.accept', bid_id)
    return result

def driver_transition(ident, user, before, after):
    role(user, 'DRIVER')
    with transaction() as cur:
        cur.execute('SELECT * FROM logistics_trips WHERE id=%s AND assigned_driver_id=%s FOR UPDATE', (ident, user['id']))
        trip = cur.fetchone()
        if not trip:
            raise HTTPException(404, 'Yuk topilmadi.')
        if trip['status'] != before:
            raise HTTPException(409, 'Yuk holati bu amalga mos emas.')
        cur.execute('UPDATE logistics_trips SET status=%s WHERE id=%s RETURNING *', (after, ident))
        result = cur.fetchone()
        audit(cur, user, 'trip.' + after.lower(), ident)
    return result

@app.put('/api/logistics/trips/{trip_id}/start', tags=['Logistics'])
def start_trip(trip_id: str, user=Depends(current_user)):
    return driver_transition(trip_id, user, 'ASSIGNED', 'IN_TRANSIT')

@app.put('/api/logistics/trips/{trip_id}/deliver', tags=['Logistics'])
def deliver_trip(trip_id: str, user=Depends(current_user)):
    return driver_transition(trip_id, user, 'IN_TRANSIT', 'DELIVERED')

@app.get('/api/dashboard', tags=['Analytics'])
def dashboard(user=Depends(current_user)):
    with transaction() as cur:
        if user['role'] == 'DRIVER':
            cur.execute("SELECT count(*) AS total,count(*) FILTER(WHERE status='DELIVERED') AS completed,COALESCE(sum(accepted_price) FILTER(WHERE status='DELIVERED'),0) AS revenue FROM logistics_trips WHERE assigned_driver_id=%s", (user['id'],))
        else:
            condition = 'o.buyer_id=%s' if user['role'] == 'BUYER' else 'p.factory_id=%s'
            cur.execute("SELECT count(*) AS total,count(*) FILTER(WHERE o.status='DELIVERED') AS completed,count(*) FILTER(WHERE o.status='PENDING') AS pending,COALESCE(sum(total_amount) FILTER(WHERE o.status='DELIVERED'),0) AS revenue FROM orders o JOIN products p ON p.id=o.product_id WHERE " + condition, (user['id'],))
        summary = cur.fetchone()
        if user['role'] == 'FACTORY':
            cur.execute('SELECT count(*) AS products,COALESCE(sum(stock_quantity),0) AS stock FROM products WHERE factory_id=%s AND is_active', (user['id'],))
            summary.update(cur.fetchone())
    return summary

@app.get('/api/analysis/{region}', tags=['Analytics'])
def analysis(region: str):
    months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
    with transaction() as cur:
        cur.execute('SELECT DISTINCT region FROM analytics ORDER BY region')
        regions = [r['region'] for r in cur.fetchall()]
        if region not in regions:
            raise HTTPException(404, 'Hudud statistikasi mavjud emas.')
        cur.execute('SELECT MAX(year) AS year FROM analytics WHERE region=%s AND year<EXTRACT(YEAR FROM CURRENT_DATE)', (region,))
        year = cur.fetchone()['year']
        if not year:
            raise HTTPException(404, 'Tarixiy statistika mavjud emas.')
        cur.execute('SELECT month,sum(sold_volume) AS volume FROM analytics WHERE region=%s AND year=%s GROUP BY month ORDER BY month', (region, year))
        values = {r['month']: float(r['volume'] or 0) for r in cur.fetchall()}
        chart = [{'name': name, 'actual': values.get(i + 1, 0), 'estimate': round(values.get(i + 1, 0) * 1.05, 2)} for i, name in enumerate(months)]
        cur.execute('SELECT avg(p.price) AS factory_price,avg(a.market_price) AS market_price FROM analytics a JOIN products p ON p.id=a.product_id WHERE a.region=%s AND a.year=%s', (region, year))
        economics = cur.fetchone()
    factory, market = float(economics['factory_price'] or 0), float(economics['market_price'] or 0)
    return {'sector': f'{region} bozor statistikasi', 'year': year, 'regions': regions, 'chartData': chart, 'economics': {'factoryPrice': round(factory, 2), 'marketPrice': round(market, 2), 'grossDifference': round(market - factory, 2)}, 'data_mode': DATA_MODE, 'forecast_method': 'Tarixiy hajm +5% ssenariysi; kafolatlangan prognoz emas.'}

@app.get('/api/factories', tags=['Catalog'])
def factories(limit: int=Query(100, ge=1, le=200)):
    with transaction() as cur:
        cur.execute("SELECT id,company_name AS name,address AS region FROM users WHERE role='FACTORY' ORDER BY company_name LIMIT %s", (limit,))
        return cur.fetchall()

@app.post('/api/chat', tags=['Assistant'])
def chat(body: ChatRequest, request: Request):
    user = optional_user(request)
    with transaction() as cur:
        cur.execute('SELECT name,price,stock_quantity FROM products WHERE is_active ORDER BY name LIMIT 10')
        products = cur.fetchall()
    return answer(body.message, products, dashboard(user) if user else {}, DATA_MODE, body.history)
