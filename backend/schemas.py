from pydantic import BaseModel
from typing import Optional

# Users
class UserCreate(BaseModel):
    phone_number: str
    password: str
    role: str
    company_name: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    phone_number: str
    role: str
    company_name: Optional[str]
    class Config:
        from_attributes = True

# Products
class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    stock_quantity: int

class ProductResponse(ProductCreate):
    id: str
    factory_id: str
    is_active: bool
    class Config:
        from_attributes = True

# Orders
class OrderCreate(BaseModel):
    buyer_id: str
    product_id: str
    quantity: int

# Logistics
class TripCreate(BaseModel):
    order_id: str
    customer_price: float

class BidCreate(BaseModel):
    trip_id: str
    driver_id: str
    offered_price: float

class BidResponse(BidCreate):
    id: str
    status: str
    class Config:
        from_attributes = True
# Agar List import qilinmagan bo'lsa, fayl tepasiga shuni qo'shing:
from typing import List, Optional
from pydantic import BaseModel

# ... mavjud kodlaringiz ...

# MAHSULOTLAR UCHUN ASOSIY SCHEMA
class ProductResponse(BaseModel):
    id: int
    factory_id: Optional[int] = None
    name: str
    category: Optional[str] = None
    price: float
    stock_quantity: int
    is_active: bool

    class Config:
        from_attributes = True

# BIG DATA PAGINATSIYASI UCHUN (Xatolikni yechuvchi qism)
class ProductListResponse(BaseModel):
    total: int
    items: List[ProductResponse]