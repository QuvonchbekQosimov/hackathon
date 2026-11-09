# BAIS — Savdo va logistika platformasi

React/Vite frontend, FastAPI backend va PostgreSQL. Xaridor, ishlab chiqaruvchi va haydovchi uchun alohida kabinetlar.

## Mahalliy ishga tushirish

Python 3.12+, Node.js 24 va PostgreSQL 18 talab qilinadi.

1. PostgreSQLda loyihaga ajratilgan `vido_db` bazasini yarating.
2. `backend/.env.example` nusxasidan `backend/.env` yarating va baza sozlamalarini kiriting. Kalitlar yoki parollarni Gitga qo'shmang.
3. Backend papkasida:

```powershell
python -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.lock
venv\Scripts\python.exe -c "from migrations import migrate; migrate()"
```

Administrator hisobidan foydalangan bo'lsangiz, ma'lumotlarni saqlagan holda ilova uchun cheklangan hisob yaratish mumkin:

```powershell
venv\Scripts\python.exe setup_local_db.py
```

Namuna katalogi kerak bo'lsa, `DATA_MODE=demo` bilan `venv\Scripts\python.exe seed.py` ni bajaring. Skript mavjud mahsulotlarni va buyurtmalarni tozalamaydi. Statistikalar sun'iy ekanligi interfeysda ko'rsatiladi. Haqiqiy savdo muhiti uchun demo ma'lumotlardan foydalanmang.

4. Frontend papkasida `npm ci` ni bajaring.
5. `Hackaton` papkasida `./Start-Platform.ps1` ni ishga tushiring. U yashirin fon jarayonlarini ishga tushiradi va sog'liq endpointini tekshiradi. Band portlardagi boshqa xizmatlarni to'xtatmaydi.

- Sayt: http://localhost:5173
- API hujjatlari: http://localhost:8000/docs
- Sog'liq: http://localhost:5173/api/health
- Loglar: har xizmat papkasidagi `server.stdout.log` va `server.stderr.log`.

## Foydalanish

`/register` sahifasida telefonni `+998XXXXXXXXX` shaklida kiriting. Parol kamida 8 belgi bo'lishi kerak. Hisob turini yaratilgandan keyin brauzer orqali o'zgartirib bo'lmaydi.

- **Ishlab chiqaruvchi:** mahsulot yaratadi, narx va qoldiqni tahrirlaydi, mahsulotni arxivlaydi/tiklaydi, o'z buyurtmalarini tasdiqlaydi yoki bekor qiladi.
- **Xaridor:** bozorni qidiradi/filtrlaydi, buyurtma beradi, tasdiqlangan buyurtma uchun yuk e'lon qiladi, haydovchi taklifini tanlaydi va mahsulotni olganini tasdiqlaydi.
- **Haydovchi:** ochiq yuklarga narx taklif qiladi. Taklif tanlangandan keyin yo'lga chiqish va yetkazish holatini boshqaradi.
- **Profil:** bazada saqlanadi. Parol yangilanganda boshqa qurilmalardagi barcha sessiyalar bekor qilinadi.

Buyurtmada narx nusxasi saqlanadi; katalog narxi keyinchalik o'zgarsa ham buyurtma summasi o'zgarmaydi. Bekor qilingan buyurtmaning ajratilgan qoldig'i omborga bir marta qaytariladi. Haydovchi tayinlangan buyurtma oddiy bekor qilishga yopiladi.

## Tekshiruv

Frontend papkasida:

```powershell
npm run lint
npm run test
npm run build
npm audit
```

Backend papkasida:

```powershell
venv\Scripts\python.exe verify_api.py
venv\Scripts\python.exe -m pip install pip-audit
venv\Scripts\python.exe -m pip_audit -r requirements.lock
```

API testi vaqtinchalik hisob va yozuvlarni yaratadi va yakunda faqat o'zi yaratgan yozuvlarni tozalaydi. Dastlab namuna katalogi va tarixiy statistika mavjud bo'lishi kerak. Testda Gemini chaqirilmaydi. GitHub Actions konfiguratsiyasi shu tekshiruvlarni alohida test bazasida bajarish uchun yozilgan.

## Docker

`compose.env.example` nusxasini mahalliy `.env` sifatida saqlab, administrator va ilova uchun **alohida** tasodifiy parollar kiriting. `docker compose --env-file .env up --build -d` bilan ishga tushiring. Sayt http://localhost:8080 da ochiladi. Baza va API tashqi portlarga chiqarilmaydi; ilova alohida, superuser bo'lmagan DB hisobidan ishlaydi. Yangi Docker bazasi bo'sh bo'ladi.

Compose konfiguratsiyasi mahalliy tekshirish uchun loopback manzilida xizmat qiladi. Internetga chiqarishda HTTPS terminatsiyasi, haqiqiy domen va `APP_ENV=production`, `ALLOWED_ORIGINS=https://sizning-domeningiz` sozlamalari kerak. Bunda sessiya cookie-si `Secure` bo'ladi. Backend konteynerining forwarded headerlarni qabul qilishi uning faqat ichki tarmoqdan nginx orqali ochilishi bilan bog'liq; backend portini internetga chiqarmang. Yana bir proxy qo'shilsa, mijoz IP manzilini faqat ishonchli proxydan uzatishni sozlang.

Hozir rate limit bitta backend jarayonida saqlanadi. Ko'p worker yoki bir nechta serverga o'tishda Redis/gateway orqali umumiy cheklov kerak. Avtomatik seed productionda ishlatilmaydi.

## Tashqi xizmatlar

- **Gemini:** haqiqiy kalitni `backend/.env` dagi `GEMINI_API_KEY` ga kiriting va backendni qayta ishga tushiring. Kalit bo'lmasa yoki xizmat ishlamasa, yordamchi bazadagi katalog/shaxsiy ko'rsatkichlarni qaytaradi va rejimni ochiq belgilaydi. Bu erkin AI suhbatining o'rnini to'liq bosmaydi.
- **OneID/SMS tasdiqlash:** provayder shartnomasi va credentiallar talab qilinadi; hozir ulangan emas. Telefon formatini tekshirish telefon egasini tasdiqlash hisoblanmaydi.
- **To'lov/Premium:** bank/payment provayderi ulanmagan; summa to'lov bajarilganini anglatmaydi. UI soxta to'lov yoki OneID tasdig'ini bermaydi.
- **Parolni unutish:** tasdiqlangan email/SMS tiklash kanali hali ulanmagan. Profil ichida joriy parol bilan almashtirish ishlaydi.

## Ishlab chiqarish muhitiga chiqarish

Haqiqiy domen, server va tashqi xizmat hisoblari bilan quyidagilar bajarilishi kerak: HTTPS, cheklangan tarmoq ruxsatlari, alohida DB credentiallari, zarur bo'lsa DB TLS, muntazam backup va **tiklash sinovi**, monitoring/alertlar, haqiqiy biznes statistikasi importi, browserda mobil/desktop vizual qabul tekshiruvi. Docker va GitHub Actions bu ish joyida ishga tushirib sinovdan o'tkazilmagan: Docker va ulangan brauzer mavjud emas.

Ichki Git omborida ilgari `.env` kuzatilgan. U endi indeksdan chiqarilgan, mahalliy fayl saqlangan. Eski commitlarda qolgan DB parollari va API kalitlarini omborni ulashish yoki productionga chiqarishdan oldin provayderda almashtiring. Hozir ilova uchun yangi, cheklangan DB hisobi yaratilgan; eski administrator paroli va Gemini kalitini almashtirish alohida operator ishidir. Git tarixini bu o'zgarishlar qayta yozmaydi.

PostgreSQL backup uchun administrator belgilagan credentiallar bilan `pg_dump -Fc -f backup.dump vido_db` ishlatiladi. Tiklashni asosiy bazada emas, alohida tekshiruv bazasida sinang. Backup fayllarini shifrlangan, kirishi cheklangan joyda saqlang.

## Foydalanilgan rasmiy hujjatlar

- [FastAPI sessiya cookie-lari](https://fastapi.tiangolo.com/advanced/response-cookies/)
- [Google Gen AI Python SDK](https://googleapis.github.io/python-genai/)
- [GitHub setup-node](https://github.com/actions/setup-node)
- [GitHub setup-python](https://github.com/actions/setup-python)
- [PostgreSQL Docker image, volume va init skriptlari](https://github.com/docker-library/docs/blob/master/postgres/README.md)
