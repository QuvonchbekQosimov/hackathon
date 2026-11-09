# BAIS platformasi — bajarilgan ishlar va tekshiruv

Sana: 2026-10-12. Platforma mahalliy kompyuterda ishga tushirilgan.

## Havolalar

- Frontend: http://localhost:5173
- API hujjatlari: http://localhost:8000/docs
- Health: http://localhost:5173/api/health

## Yakunlangan o'zgarishlar

- Backend yagona PostgreSQL tranzaksiya va connection pool qatlamiga o'tkazildi. Versiyali, mavjud ma'lumotlarni o'chirmaydigan migratsiyalar qo'shildi.
- Mavjud plaintext parollar hashing shakliga o'tkazildi. Yangi hisoblar Argon2id ishlatadi; eski scrypt hashlar muvaffaqiyatli kirishda Argon2idga yangilanadi. Parollar API javobida qaytarilmaydi.
- Haqiqiy HttpOnly/SameSite sessiyalar, logout, sessiya muddati, joriy hisob endpointi, parol almashtirish va boshqa sessiyalarni bekor qilish qo'shildi. Productionda Secure cookie yoqiladi.
- Rol va yozuv egasi har bir himoyalangan amalda serverda tekshiriladi. Buyurtmalar faqat tegishli xaridor va zavodga ochiladi. LocalStorage roliga ishonish olib tashlandi.
- CORS va mutatsiya so'rovlari manbasi cheklangan. Rate limit, 32 kB body limiti, xavfsiz xato javoblari, request ID va amallar auditi qo'shildi.
- Mahalliy backend PostgreSQL superuser hisobidan alohida, tasodifiy parolli, cheklangan ilova hisobiga o'tkazildi. Asosiy PostgreSQL administrator paroli o'zgartirilmadi.
- Pul qiymatlari Decimal/PostgreSQL numeric orqali hisoblanadi. Narx va birlik narxi buyurtmada saqlanadi. Takroriy so'rovlar uchun Idempotency-Key qo'shildi.
- Parallel buyurtmalar omborni ortiqcha sotmasligi tekshirildi. Bekor qilish qoldiqni bir marta qaytaradi.
- To'liq logistika oqimi: tasdiqlangan buyurtma → yuk e'loni → narx takliflari → haydovchini tanlash → yo'lga chiqish → yetkazish → xaridor tasdig'i.
- Mahsulot yaratish, tahrirlash, arxivlash va tiklash; qidiruv, kategoriya, saralash va sahifalash ishlaydi.
- Profil bazada saqlanadi. CSV eksportida formulaga aylanishi mumkin bo'lgan kataklar himoyalanadi.
- Frontend xavfsiz APIga ulandi. Mobil navigatsiya, loading/error/empty holatlar, modallar, klaviatura focus boshqaruvi, himoyalangan kabinet va 404 sahifasi qo'shildi.
- OneID/Premiumning localStorage orqali soxta tasdiqlanishi olib tashlandi. Marketingdagi asossiz xavfsizlik va statistik va'dalar yangilandi.
- Hududiy statistika bazadan o'qiladi, demo ma'lumotlar ochiq belgilangan. +5% ssenariy haqiqiy AI prognozi deb ko'rsatilmaydi.
- Gemini yangi Google Gen AI SDKga o'tkazildi, kalit .env orqali olinadi. Jonli so'rov Gemini rejimida muvaffaqiyatli javob qaytardi. Xizmat ishlamasa, aniq belgilangan baza-summary rejimi bor. Suhbatning cheklangan so'nggi konteksti yuboriladi.
- Seed qayta ishlatishga xavfsiz: mavjud buyurtmalar va katalog tozalanmaydi. Kodda credentiallar yo'q, .env va mahalliy source backuplari Gitdan chiqarilgan.
- Windows ishga tushirish skripti, pinlangan Python dependencies, Docker/nginx konfiguratsiyasi va GitHub Actions tekshiruvlari tayyorlandi.
- Ko'chirilgan virtual muhitning yo'qolgan Python runtime yo'li tiklandi. Startup skripti runtime yo'qligini xizmatlarni ochishdan oldin aniqlaydi va xatoda o'zi ochgan jarayonlarni to'xtatadi.
- Ichki Git omborida kuzatilgan `.env`, virtual muhit va o'rnatilgan paketlar diskda saqlanib, indeksdan chiqarildi. Ichki ombor uchun ham `.gitignore` va CI konfiguratsiyasi qo'shildi.

## Tekshiruv dalillari

- Frontend lint: 0 xato va 0 ogohlantirish.
- Frontend build: o'tdi. Sahifalar lazy-load qilinadi, boshlang'ich JS taxminan 294 kB; dastlabki bitta 752 kB bundle ajratildi.
- Frontend: 7 ta foydalanuvchi oqimi testi. Kabinet himoyasi, login retry, driver registration, qidiruv, takroriy buyurtma kaliti, mahsulot modali va yordamchi suhbat konteksti.
- Backend: 123 ta integratsion tekshiruv o'tdi. Ruxsatlar, session, logout, parol o'zgarishi, ma'lumot izolyatsiyasi, kiritish validatsiyasi, CSRF origin, katta/chunked body, idempotency, race condition, ombor qaytarilishi, mahsulot tiklash, logistika holatlari, yordamchi va rate limitlar.
- Ishlayotgan xizmatlar orqali frontend proxy bilan 19 ta HTTP tekshiruv o'tdi; uch rol bilan to'liq yetkazish zanjiri va Gemini javobi tekshirildi.
- npm audit: 0 ta ma'lum zaiflik. Ilgari topilgan 15 ta dependency zaifligi yangilanishlar bilan yopildi.
- pip-audit (requirements.lock): ma'lum zaiflik topilmadi; 38 ta to'g'ridan-to'g'ri va bilvosita dependency pinlangan.
- pip check: dependency mos kelmasligi topilmadi.
- Start-Platform.ps1 amalda tekshirildi va ikkala xizmatning tayyorligi tasdiqlandi.
- Testlar yaratgan hisoblar va biznes yozuvlari tozalandi; dastlabki katalog saqlandi.

JSON dalillar: backend/api-test-report.json, backend/live-test-report.json, backend/python-audit.json, frontend/npm-audit.json.

## Aniq cheklovlar va tashqi ishlar

1. OneID/SMS orqali shaxsni yoki telefon egasini tasdiqlash, to'lov va Premium uchun haqiqiy provayder integratsiyasi va credentiallar kerak. Hozir bu xizmatlar faol deb ko'rsatilmaydi.
2. Email/SMS orqali unutilgan parolni tiklash hali ulanmagan; kabinet ichida joriy parol bilan almashtirish ishlaydi.
3. Tarixiy bozor statistikasining hozirgi manbasi sun'iy demo dataset. Production uchun tasdiqlangan haqiqiy dataset/import kerak.
4. Ulangan brauzer yo'qligi sabab real browserda vizual tekshiruv bajarilmadi. Frontend testlari jsdom muhitidagi component/oqim testlari; ular real desktop/mobil screenshot tekshiruvini almashtirmaydi.
5. Docker bu kompyuterda mavjud emas: image build va Compose stack hali amalda ishga tushirib tekshirilmagan. GitHub Actions ham masofada bajarilmadi.
6. Haqiqiy hosting/domen/HTTPS, avtomatik backup/tiklash sinovi, monitoring va yuk sinovi operator muhiti bilan yakunlanadi. Hozir ikkala xizmat faqat mahalliy kompyuterda ochiq.
7. Rate limit bitta jarayon xotirasida; ko'p worker yoki server uchun umumiy Redis/gateway limiti kerak. Sessionlarning o'zi PostgreSQLda saqlanadi.
8. Eski commitlarda credentiallar bo'lgan: omborni ulashishdan oldin eski administrator paroli va Gemini kalitini provayderda almashtirish kerak. Ilova endi yangi cheklangan DB hisobidan foydalanadi; Git tarixi qayta yozilmagan.

Bu natija barcha ehtimoliy xatolar yo'qligini yoki productionda yuk sinovidan o'tganini anglatmaydi. Yuqorida tekshirilgan ishlash doirasi va ochiq qolgan integratsiyalar aniq keltirilgan.

Ishga tushirish va foydalanish yo'riqnomasi: README.md.
