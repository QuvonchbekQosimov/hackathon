"""Versioned, non-destructive migrations for the existing PostgreSQL database."""
from database import transaction
from security import hash_password

BASE = """
CREATE TABLE IF NOT EXISTS users (id varchar(255) PRIMARY KEY, phone_number varchar(50) UNIQUE NOT NULL, password_hash varchar(255) NOT NULL, role varchar(50) NOT NULL, company_name varchar(255));
CREATE TABLE IF NOT EXISTS products (id varchar(255) PRIMARY KEY, factory_id varchar(255) REFERENCES users(id), name varchar(255), category varchar(100), price numeric(16,2), stock_quantity integer, is_active boolean DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS orders (id varchar(255) PRIMARY KEY, buyer_id varchar(255) REFERENCES users(id), product_id varchar(255) REFERENCES products(id), quantity integer, total_amount numeric(24,2), status varchar(50) DEFAULT 'PENDING');
CREATE TABLE IF NOT EXISTS logistics_trips (id varchar(255) PRIMARY KEY, order_id varchar(255) REFERENCES orders(id), customer_price numeric(16,2), status varchar(50) DEFAULT 'SEARCHING_DRIVER');
CREATE TABLE IF NOT EXISTS bids (id varchar(255) PRIMARY KEY, trip_id varchar(255) REFERENCES logistics_trips(id), driver_id varchar(255) REFERENCES users(id), offered_price numeric(16,2), status varchar(50) DEFAULT 'PENDING');
CREATE TABLE IF NOT EXISTS analytics (id serial PRIMARY KEY, product_id varchar(255) REFERENCES products(id), region varchar(100), year integer, sold_volume double precision);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name varchar(100) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name varchar(100) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email varchar(254) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS address varchar(255) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE products ADD COLUMN IF NOT EXISTS location varchar(255) DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_order varchar(100) DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS contact_phone varchar(50) DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS unit_price numeric(16,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key varchar(100);
CREATE UNIQUE INDEX IF NOT EXISTS order_idempotency_unique ON orders(buyer_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
UPDATE orders o SET unit_price=round((o.total_amount / NULLIF(o.quantity,0))::numeric,2) WHERE unit_price IS NULL;
ALTER TABLE logistics_trips ADD COLUMN IF NOT EXISTS from_location varchar(255) DEFAULT '';
ALTER TABLE logistics_trips ADD COLUMN IF NOT EXISTS to_location varchar(255) DEFAULT '';
ALTER TABLE logistics_trips ADD COLUMN IF NOT EXISTS weight_tons numeric(10,3);
ALTER TABLE logistics_trips ADD COLUMN IF NOT EXISTS assigned_driver_id varchar(255) REFERENCES users(id);
ALTER TABLE logistics_trips ADD COLUMN IF NOT EXISTS accepted_price numeric(16,2);
ALTER TABLE logistics_trips ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE bids ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS month integer;
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS market_price numeric(16,2);
ALTER TABLE products ALTER COLUMN price TYPE numeric(16,2) USING round(price::numeric,2);
ALTER TABLE orders ALTER COLUMN total_amount TYPE numeric(24,2) USING round(total_amount::numeric,2);
ALTER TABLE logistics_trips ALTER COLUMN customer_price TYPE numeric(16,2) USING round(customer_price::numeric,2);
ALTER TABLE bids ALTER COLUMN offered_price TYPE numeric(16,2) USING round(offered_price::numeric,2);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash varchar(64) PRIMARY KEY, user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_events (
 id bigserial PRIMARY KEY, actor_id varchar(255), action varchar(100) NOT NULL,
 entity_id varchar(255), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_factory_idx ON products(factory_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category) WHERE is_active;
CREATE INDEX IF NOT EXISTS orders_buyer_idx ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_product_idx ON orders(product_id);
CREATE INDEX IF NOT EXISTS trips_order_idx ON logistics_trips(order_id);
CREATE INDEX IF NOT EXISTS bids_trip_idx ON bids(trip_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS analytics_region_year_idx ON analytics(region,year,product_id);
CREATE UNIQUE INDEX IF NOT EXISTS bids_driver_trip_unique ON bids(trip_id,driver_id);
CREATE UNIQUE INDEX IF NOT EXISTS trip_active_order_unique ON logistics_trips(order_id) WHERE status <> 'CANCELLED';
"""

def migrate():
    with transaction() as cur:
        cur.execute("SELECT pg_advisory_xact_lock(847231)")
        cur.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz DEFAULT now())")
        cur.execute("SELECT version FROM schema_migrations WHERE version=1")
        if not cur.fetchone():
            cur.execute(BASE)
            # Preserve existing accounts while removing legacy plaintext storage.
            cur.execute("SELECT id, password_hash FROM users WHERE password_hash NOT LIKE 'scrypt$%' AND password_hash NOT LIKE '$argon2id$%'")
            for user in cur.fetchall():
                cur.execute("UPDATE users SET password_hash=%s WHERE id=%s", (hash_password(user['password_hash'] or ''),user['id']))
            for table, name, check in (
                ('products','products_price_positive','price > 0'),
                ('products','products_stock_nonnegative','stock_quantity >= 0'),
                ('orders','orders_quantity_positive','quantity > 0'),
                ('orders','orders_amount_nonnegative','total_amount >= 0'),
                ('users','users_valid_role',"role IN ('BUYER','FACTORY','DRIVER')")):
                # NOT VALID keeps old data available; new writes are constrained.
                cur.execute(f"ALTER TABLE {table} ADD CONSTRAINT {name} CHECK ({check}) NOT VALID")
            cur.execute("INSERT INTO schema_migrations(version) VALUES (1)")
