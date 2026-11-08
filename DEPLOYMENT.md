# دليل نشر منصة MotoGearSouq (Render + Vercel + Neon)

يوضح هذا المستند الخطوات التفصيلية لنشر منصة **MotoGearSouq** بالكامل في بيئة الإنتاج باستخدام:
- **Neon**: قاعدة بيانات PostgreSQL السحابية (مع دعم Pooled & Direct Connections).
- **Render**: استضافة Backend (NestJS API) باستخدام Docker.
- **Vercel**: استضافة Frontend (Next.js 15) مع دعم SSR و i18n.

---

## الخطوة الأولى: إعداد قاعدة البيانات على Neon
1. قم بتسجيل الدخول إلى [Neon Console](https://console.neon.tech/).
2. أنشئ مشروعاً جديداً (Project) وليكن باسم `motogearsouq-production`.
3. احصل على سلسلتي الاتصال (Connection Strings):
   - **Pooled Connection String** (تستخدم لـ `DATABASE_URL` أثناء التشغيل لتوفير الاتصالات).
   - **Direct Connection String** (تستخدم لـ `DIRECT_URL` أثناء التهجير `db push` والـ `seed`).

---

## الخطوة الثانية: نشر الـ Backend على Render
1. سجل الدخول إلى [Render Dashboard](https://dashboard.render.com/).
2. اضغط على **New** ثم اختر **Web Service**.
3. اربط مستودع GitHub الخاص بالمشروع (`ELSAAD` / `MotoGearSouq`).
4. قم بضبط الإعدادات التالية:
   - **Name**: `motogearsouq-api`
   - **Region**: اختر الأقرب لجمهورك (مثلاً Frankfurt أو Ohio)
   - **Root Directory**: `apps/api`
   - **Environment**: `Docker`
   - **Branch**: `main`
   - **Instance Type**: Free أو Paid حسب الحاجة
5. أضف متغيرات البيئة التالية (Environment Variables):
   - `DATABASE_URL`: (رابط Neon Pooled)
   - `DIRECT_URL`: (رابط Neon Direct)
   - `JWT_PRIVATE_KEY`: (مفتاح RSA الخاص بصيغة PEM، استبدل الأسطر الجديدة بـ `\n`)
   - `JWT_PUBLIC_KEY`: (مفتاح RSA العام بصيغة PEM)
   - `ADMIN_API_KEY`: (مفتاح آمن لإدارة العمليات والصنفرة)
   - `CORS_ORIGINS`: `https://your-vercel-domain.vercel.app,https://motogearsouq.com`
   - `GOOGLE_CLIENT_ID`: (معرف جوجل OAuth)
   - `GOOGLE_CLIENT_SECRET`: (سر جوجل OAuth)
   - `GOOGLE_CALLBACK_URL`: `https://motogearsouq-api.onrender.com/api/auth/google/callback`
   - `RESEND_API_KEY`: (مفتاح خدمة البريد Resend)
   - `EMAIL_FROM`: `MotoGearSouq <noreply@motogearsouq.com>`
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
6. اضغط **Create Web Service**.

---

## الخطوة الثالثة: نشر الـ Frontend على Vercel
1. سجل الدخول إلى [Vercel Dashboard](https://vercel.com/).
2. اضغط على **Add New...** ثم **Project**.
3. استورد مستودع GitHub الخاص بالمشروع.
4. في إعدادات البناء (Project Settings):
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
5. أضف متغيرات البيئة التالية (Environment Variables):
   - `NEXT_PUBLIC_API_URL`: `https://motogearsouq-api.onrender.com/api`
   - `FRONTEND_URL`: `https://your-project.vercel.app` (أو دومينك الخاص)
6. اضغط **Deploy**.

---

## الخطوة الرابعة: تشغيل قاعدة البيانات وتهجير البيانات (Prisma DB Push & Seed)
بعد نجاح نشر خدمة الـ API على Render:
1. اذهب إلى لوحة تحكم الخدمة على Render (`motogearsouq-api`).
2. افتح **Shell** (عبر متصفح لوحة تحكم Render).
3. قم بتنفيذ أمرين لتهجير وزرع البيانات الأولية:
   ```bash
   npx prisma db push --schema=prisma/schema.prisma
   npx prisma db seed
   ```
4. تأكد من ظهور رسالة النجاح الخاصة بـ Seed لضمان توفر الفروع، الماركات، والمنتجات الأساسية في المتجر.

---

## الخطوة الخامسة: التحقق النهائي
1. افتح رابط موقعك على Vercel (`https://your-project.vercel.app`).
2. تأكد من عمل الشعار، الشريط الترحيبي (TrustBar)، الأقسام، واختيار اللغات (عربي / إنجليزي).
3. اختبر صفحة تسجيل الدخول والاتصال بـ API عبر `https://motogearsouq-api.onrender.com/api/health`.
