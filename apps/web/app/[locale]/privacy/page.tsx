import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { company } from "@/lib/config";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | MotoGearSouq",
  description:
    "كيف نجمع بياناتك وكيف نستخدمها عند تواصلك مع موقع MotoGearSouq.",
};

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main id="main-content" className="flex-1 py-16 md:py-24">
      <Container size="md">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          سياسة الخصوصية
        </h1>
        <p className="text-muted mb-12">آخر تحديث: {lastUpdated}</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-fg mb-3">مقدمة</h2>
            <p className="text-muted leading-relaxed">
              نحن في MotoGearSouq، الشريك الرقمي الرسمي لشركة السعد للدراجات النارية نحترم خصوصيتك. توضح هذه السياسة
              ما نجمعه من بيانات عند استخدامك لموقعنا وكيف نستخدمها ونحميها.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">
              البيانات التي نجمعها
            </h2>
            <p className="text-muted leading-relaxed">
              نجمع البيانات التي ترسلها بنفسك عبر نموذج التواصل فقط: اسمك،
              رقم موبايلك، ونص رسالتك (اختياري). لا نجمع أي بيانات أخرى عبر
              هذا الموقع.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">
              كيف نستخدم البيانات
            </h2>
            <p className="text-muted leading-relaxed">
              نستخدم بياناتك للتواصل معك وردّ على استفسارك فقط. لا نستخدمها
              لأي غرض تسويقي دون موافقتك.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">
              مشاركة البيانات
            </h2>
            <p className="text-muted leading-relaxed">
              لا نشارك بياناتك مع أي طرف ثالث، ولا نبيعها، ولا نستخدمها خارج
              نطاق الرد على تواصلك معنا.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">
              ملفات تعريف الارتباط (Cookies)
            </h2>
            <p className="text-muted leading-relaxed">
              قد نستخدم Google Analytics لفهم زيارات الموقع بشكل عام (أرقام
              مجمّعة فقط دون تعريفك الشخصي). يمكنك تعطيل الكوكيز من إعدادات
              متصفحك في أي وقت.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">حقوقك</h2>
            <p className="text-muted leading-relaxed">
              يحق لك في أي وقت طلب حذف بياناتك التي أرسلتها إلينا. يكفي
              مراسلتنا على البريد الإلكتروني أدناه وسننفذ الطلب دون تعقيد.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">التواصل</h2>
            <p className="text-muted leading-relaxed">
              لأي استفسار حول هذه السياسة أو بياناتك، تواصل معنا على:{" "}
              <a href={`mailto:${company.email}`} className="text-accent hover:underline" dir="ltr">
                {company.email}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:underline"
          >
            <span aria-hidden="true">←</span> العودة للرئيسية
          </Link>
        </div>
      </Container>
    </main>
  );
}
