import re
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
class Input(BaseModel):
    model_config = ConfigDict(extra='forbid')
class Login(Input):
    phone_number: str = Field(max_length=30)
    password: str = Field(min_length=8, max_length=128)
    @field_validator('phone_number')
    @classmethod
    def phone(cls, value):
        value = re.sub(r'[\s()-]', '', value)
        if not re.fullmatch(r'\+998\d{9}', value):
            raise ValueError("Telefon +998XXXXXXXXX formatida bo'lishi kerak.")
        return value
class Register(Login):
    role: Literal['BUYER', 'FACTORY', 'DRIVER']
    company_name: str = Field(default='', max_length=255)
    @field_validator('company_name')
    @classmethod
    def company(cls, value, info):
        value = value.strip()
        if info.data.get('role') in ('BUYER', 'FACTORY') and not value:
            raise ValueError('Kompaniya nomini kiriting.')
        return value
class ProductCreate(Input):
    name: str = Field(min_length=2, max_length=255)
    category: str = Field(min_length=2, max_length=100)
    price: Decimal = Field(gt=0, le=1000000000000, max_digits=16, decimal_places=2)
    stock_quantity: int = Field(ge=0, le=1000000000, strict=True)
    location: str = Field(default='', max_length=255)
    min_order: str = Field(default='', max_length=100)
    contact_phone: str = Field(default='', max_length=50)
    description: str = Field(default='', max_length=5000)
    @field_validator('name', 'category')
    @classmethod
    def required_text(cls, value):
        if len(value.strip()) < 2:
            raise ValueError("Kamida ikki belgi kiriting.")
        return value.strip()
class OrderCreate(Input):
    product_id: str = Field(min_length=1, max_length=255)
    quantity: int = Field(gt=0, le=1000000000, strict=True)
class TripCreate(Input):
    order_id: str = Field(min_length=1, max_length=255)
    customer_price: Decimal = Field(gt=0, le=1000000000000, max_digits=16, decimal_places=2)
    from_location: str = Field(min_length=2, max_length=255)
    to_location: str = Field(min_length=2, max_length=255)
    weight_tons: Decimal = Field(gt=0, le=1000, decimal_places=3)
    @field_validator('from_location', 'to_location')
    @classmethod
    def location_text(cls, value):
        if len(value.strip()) < 2:
            raise ValueError('Manzilni kiriting.')
        return value.strip()
class BidCreate(Input):
    trip_id: str = Field(min_length=1, max_length=255)
    offered_price: Decimal = Field(gt=0, le=1000000000000, max_digits=16, decimal_places=2)
class Profile(Input):
    first_name: str = Field(default='', max_length=100)
    last_name: str = Field(default='', max_length=100)
    company_name: str = Field(default='', max_length=255)
    email: str = Field(default='', max_length=254)
    address: str = Field(default='', max_length=255)
    @field_validator('email')
    @classmethod
    def email_format(cls, value):
        value = value.strip()
        if value and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
            raise ValueError("Email manzili noto'g'ri.")
        return value
class ChatMessage(Input):
    role: Literal['user', 'assistant']
    content: str = Field(min_length=1, max_length=1000)

class ChatRequest(Input):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=6)
    @field_validator('message')
    @classmethod
    def message_text(cls, value):
        if not value.strip():
            raise ValueError("Savolni kiriting.")
        return value.strip()

class PasswordChange(Input):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
