import google.generativeai as genai

# O'zingizning haqiqiy API kalitingizni shu yerga yozing
GEMINI_API_KEY = "AIzaSyAEzxjI6l46ktTeLxUtfDZ6Ied7OvOhX1Q"

# Gemini SDK ni sozlash
genai.configure(api_key=GEMINI_API_KEY)

def check_my_models():
    print("🔍 API kalitingiz tekshirilmoqda...\n")
    try:
        # Sizga ruxsat berilgan barcha modellarni ro'yxatdan o'tkazamiz
        available_models = []
        for model in genai.list_models():
            # Bizga asosan chat va matn yaratish (generateContent) ni qo'llab-quvvatlaydigan modellar kerak
            if 'generateContent' in model.supported_generation_methods:
                available_models.append(model)
        
        if not available_models:
            print("❌ Sizning kalitingiz matn yaratuvchi modellarni qo'llab-quvvatlamaydi.")
            return

        print("✅ Siz quyidagi Gemini modellaridan bemalol foydalana olasiz:\n")
        print("-" * 50)
        for m in available_models:
            print(f"🔹 Model ID: {m.name}")
            
    except Exception as e:
        print(f"❌ Xatolik yuz berdi (API kalitingizni tekshiring):\n{str(e)}")

if __name__ == "__main__":
    check_my_models()