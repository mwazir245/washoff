import type { AccountRole } from "../../src/features/auth/model/index.ts";

interface IdentityEmailLayoutInput {
  headingAr: string;
  introAr: string;
  actionLabelAr: string;
  actionUrl: string;
  expiresAt?: string;
  footerHintAr: string;
  recipientName?: string;
}

const formatArabicDateTime = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: true,
      timeZone: "Asia/Riyadh",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const renderEmailLayout = ({
  headingAr,
  introAr,
  actionLabelAr,
  actionUrl,
  expiresAt,
  footerHintAr,
  recipientName,
}: IdentityEmailLayoutInput) => {
  const expiresAtLabel = formatArabicDateTime(expiresAt);
  const greetingAr = recipientName?.trim() ? `مرحبًا ${recipientName}،` : "مرحبًا،";

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${headingAr}</title>
  </head>
  <body style="margin:0;background:#f5f7fa;color:#111827;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(17,24,39,0.05);">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
                <div style="font-size:13px;font-weight:700;color:#c9a24a;letter-spacing:0.04em;">WashOff</div>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.5;color:#111827;">${headingAr}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:2;color:#111827;">${greetingAr}</p>
                <p style="margin:0 0 22px;font-size:16px;line-height:2;color:#374151;">${introAr}</p>
                <div style="margin:0 0 24px;">
                  <a href="${actionUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:14px;font-size:15px;font-weight:700;">
                    ${actionLabelAr}
                  </a>
                </div>
                ${
                  expiresAtLabel
                    ? `<p style="margin:0 0 14px;font-size:14px;line-height:2;color:#6b7280;">تنتهي صلاحية هذا الرابط في: <strong style="color:#111827;">${expiresAtLabel}</strong></p>`
                    : ""
                }
                <div style="border:1px solid #dbeafe;background:#f8fbff;border-radius:16px;padding:16px 18px;">
                  <p style="margin:0 0 10px;font-size:14px;line-height:2;color:#374151;">إذا لم يعمل الزر، استخدم الرابط التالي:</p>
                  <p style="margin:0;font-size:13px;line-height:1.9;color:#2563EB;word-break:break-all;">${actionUrl}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#fcfcfd;">
                <p style="margin:0;font-size:13px;line-height:2;color:#6b7280;">${footerHintAr}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "WashOff",
    headingAr,
    "",
    greetingAr,
    introAr,
    "",
    `${actionLabelAr}: ${actionUrl}`,
    expiresAtLabel ? `تنتهي الصلاحية في: ${expiresAtLabel}` : undefined,
    "",
    footerHintAr,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
};

const resolveRoleLabelAr = (role: AccountRole) => {
  switch (role) {
    case "hotel":
      return "الفندق";
    case "provider":
      return "مزود الخدمة";
    case "admin":
    default:
      return "الإدارة";
  }
};

export const renderActivationEmailTemplate = ({
  recipientName,
  actionUrl,
  expiresAt,
  role,
}: {
  recipientName?: string;
  actionUrl: string;
  expiresAt?: string;
  role: AccountRole;
}) => {
  const subjectAr = "تفعيل حسابك في WashOff";
  const roleLabelAr = resolveRoleLabelAr(role);

  return {
    subjectAr,
    ...renderEmailLayout({
      headingAr: "فعّل حسابك في WashOff",
      introAr: `تم اعتماد ${roleLabelAr} المرتبط بهذا البريد، ويمكنك الآن إكمال تفعيل الحساب للوصول إلى منصة WashOff التشغيلية.`,
      actionLabelAr: "تفعيل الحساب",
      actionUrl,
      expiresAt,
      recipientName,
      footerHintAr:
        "إذا لم تكن أنت صاحب هذا الطلب، يمكنك تجاهل هذه الرسالة بأمان أو التواصل مع إدارة المنصة.",
    }),
  };
};

export const renderPasswordResetEmailTemplate = ({
  recipientName,
  actionUrl,
  expiresAt,
}: {
  recipientName?: string;
  actionUrl: string;
  expiresAt?: string;
}) => {
  const subjectAr = "إعادة ضبط كلمة المرور في WashOff";

  return {
    subjectAr,
    ...renderEmailLayout({
      headingAr: "إعادة ضبط كلمة المرور",
      introAr:
        "تلقينا طلبًا لإعادة ضبط كلمة المرور الخاصة بحسابك في WashOff. استخدم الرابط التالي لتعيين كلمة مرور جديدة بشكل آمن.",
      actionLabelAr: "إعادة ضبط كلمة المرور",
      actionUrl,
      expiresAt,
      recipientName,
      footerHintAr:
        "إذا لم تطلب إعادة ضبط كلمة المرور، تجاهل هذه الرسالة ولن يتم إجراء أي تغيير على حسابك.",
    }),
  };
};
