import os
import google.generativeai as genai
from dotenv import load_dotenv

# .env fayldan kalitni o'qish
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini'ni sozlash
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

def get_fair_price_estimation(from_location: str, to_location: str, weight_tons: float):
    """Gemini orqali yuk tashish uchun adolatli narxni hisoblash"""
    
    prompt = f"""
    Sen O'zbekistondagi logistika va yuk tashish bozori bo'yicha mutaxassis 'Adolatli Hakam' AI san.
    Mijoz quyidagi yukni tashimoqchi:
    - Qayerdan: {from_location}
    - Qayerga: {to_location}
    - Yuk vazni: {weight_tons} tonna
    
    Iltimos, O'zbekistonning hozirgi bozor narxlaridan kelib chiqib:
    1. Taxminiy adolatli narxni so'mda ayt.
    2. Haydovchiga va mijozga qisqacha maslahat ber.
    
    Javobni qisqa, aniq va faqat o'zbek tilida yoz.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"AI bilan bog'lanishda xatolik yuz berdi: {str(e)}"