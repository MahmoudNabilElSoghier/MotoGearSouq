import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export type ContactNotification = {
  name: string;
  phone: string;
  message: string;
};

export async function sendContactNotification(
  data: ContactNotification
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const to = process.env.CONTACT_EMAIL_TO;
  const from = process.env.CONTACT_EMAIL_FROM || "onboarding@resend.dev";

  if (!to) {
    return { ok: false, error: "CONTACT_EMAIL_TO not configured" };
  }

  try {
    await resend.emails.send({
      from: `MotoGearSouq <${from}>`,
      to,
      subject: `رسالة جديدة من ${data.name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E63946;">رسالة جديدة من موقع MotoGearSouq</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9; width: 30%;"><strong>الاسم</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(data.name)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>الموبايل</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;" dir="ltr">${escapeHtml(data.phone)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9; vertical-align: top;"><strong>الرسالة</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(data.message || "—")}</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 12px;">
            أُرسلت من motogearsouq.com في ${new Date().toLocaleString("ar-EG")}
          </p>
        </div>
      `,
    });
    return { ok: true };
  } catch (err) {
    console.error("Resend error:", err);
    return { ok: false, error: "send failed" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
