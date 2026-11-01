import { NextResponse } from "next/server";
import { contactSchema } from "@motogearsouq/shared";
import { sendContactNotification } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Extract IP (Vercel sets x-forwarded-for)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 5 submissions per hour per IP
  const limit = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `عدد المحاولات كبير. حاول تاني بعد ${limit.resetInSeconds} ثانية.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.resetInSeconds),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errors: result.error.flatten().fieldErrors,
          error: "برجاء التحقق من صحة البيانات المدخلة",
        },
        { status: 400 }
      );
    }

    const { name, phone, message } = result.data;

    const dbConfigured = !!process.env.DATABASE_URL;
    const emailConfigured = !!process.env.RESEND_API_KEY;

    let dbOk = false;
    let emailOk = false;
    let emailError = "";

    if (dbConfigured) {
      try {
        const { db } = await import("@/lib/db");
        await db.contactMessage.create({
          data: { name, phone, message: message || null },
        });
        dbOk = true;
      } catch (err) {
        console.error("DB save failed:", err);
      }
    }

    if (emailConfigured) {
      const result = await sendContactNotification({
        name,
        phone,
        message: message || "",
      });
      emailOk = result.ok;
      if (!result.ok) emailError = result.error || "";
    }

    if (!dbOk && !emailOk && (dbConfigured || emailConfigured)) {
      console.error("Contact delivery failed", {
        dbConfigured,
        emailConfigured,
        emailError,
      });
      return NextResponse.json(
        {
          success: false,
          error: "تعذر إرسال الرسالة. حاول مرة أخرى أو تواصل معنا على واتساب.",
        },
        { status: 500 }
      );
    }

    if (!dbConfigured && !emailConfigured) {
      console.warn("CONTACT: no delivery channel configured — message lost:", {
        name,
        phone,
      });
    }

    return NextResponse.json(
      { success: true, message: "تم استلام رسالتك بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
