from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# Foydalanuvchilar jadvali
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    phone_number = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # BUYER, FACTORY, DRIVER
    company_name = Column(String, nullable=True)

# Mahsulotlar jadvali
class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, default=generate_uuid)
    factory_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    category = Column(String)
    price = Column(Float)
    stock_quantity = Column(Integer)
    is_active = Column(Boolean, default=True)

# Buyurtmalar jadvali
class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, default=generate_uuid)
    buyer_id = Column(String, ForeignKey("users.id"))
    product_id = Column(String, ForeignKey("products.id"))
    quantity = Column(Integer)
    total_amount = Column(Float)
    status = Column(String, default="PENDING")

# Logistika (Yuklar) jadvali
class LogisticsTrip(Base):
    __tablename__ = "logistics_trips"
    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String)
    customer_price = Column(Float)
    status = Column(String, default="SEARCHING_DRIVER")

# Auksion (Haydovchi takliflari) jadvali
class Bid(Base):
    __tablename__ = "bids"
    id = Column(String, primary_key=True, default=generate_uuid)
    trip_id = Column(String, ForeignKey("logistics_trips.id"))
    driver_id = Column(String, ForeignKey("users.id"))
    offered_price = Column(Float)
    status = Column(String, default="PENDING")