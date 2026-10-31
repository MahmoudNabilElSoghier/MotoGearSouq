import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "الشروط والأحكام | MotoGearSouq",
  description:
    "شروط وأحكام استخدام موقع MotoGearSouq ومحافظتنا على حقوق الملكية الفكرية.",
};

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main id="main-content" className="flex-1 py-16 md:py-24">
      <Container size="md">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          الشروط والأحكام
        </h1>
        <p className="text-muted mb-12">آخر تحديث: {lastUpdated}</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-fg mb-3">قبول الشروط</h2>
            <p className="text-muted leading-relaxed">
              باستخدامك لهذا الموقع فإنك توافق على هذه الشروط والأحكام. إذا
              كنت لا توافق على أي بند منها، يرجى عدم استخدام الموقع.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">
              استخدام الموقع
            </h2>
            <p className="text-muted leading-relaxed">
              يُعرض الموقع لعرض منتجاتنا وخدماتنا والتعريف بفروعنا. لا يُسمح
              باستخدام الموقع لأي غرض غير مشرع أو يخالف هذه الشروط.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">
              الملكية الفكرية
            </h2>
            <p className="text-muted leading-relaxed">
              جميع محتويات الموقع من نصوص وصور وشعارات وعلامات تجارية مملوكة
              لـMotoGearSouq أو مرخصة لها. لا يجوز نسخ أو إعادة نشر
              أي محتوى دون إذن كتابي مسبق.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">
              حدود المسؤولية
            </h2>
            <p className="text-muted leading-relaxed">
              نبذل جهدنا لتحديث المعلومات بدقة، لكن الموقع يُقدَّم &quot;كما
              هو&quot; دون ضمانات. لا نتحمل مسؤولية أي أخطاء في البيانات أو
              انقطاع الخدمة أو أي أضرار غير مباشرة ناتجة عن استخدام الموقع.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">
              الروابط الخارجية
            </h2>
            <p className="text-muted leading-relaxed">
              قد يحتوي الموقع على روابط لمواقع أخرى (مثل واتساب ووسائل
              التواصل). لا نتحكم في هذه المواقع ولا نتحمل مسؤولية محتواها.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">التعديلات</h2>
            <p className="text-muted leading-relaxed">
              يحق لنا تعديل هذه الشروط في أي وقت دون إشعار مسبق، ويسري
              التعديل فور نشره على هذه الصفحة.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-fg mb-3">
              القانون المعمول به
            </h2>
            <p className="text-muted leading-relaxed">
              تخضع هذه الشروط لقوانين جمهورية مصر العربية، وأي نزوج يُرجع
              إلى الجهات المختصة في مصر.
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
