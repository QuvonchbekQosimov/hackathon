import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# .env faylidagi ma'lumotlarni o'qish
load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Bazaga ulanish dvigateli
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Har bir so'rov uchun bazani ochib-yopuvchi funksiya
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()