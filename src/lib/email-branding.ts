import { absoluteUrl, BRAND_NAME, BRAND_TAGLINE, SITE_URL } from "@/lib/seo"
import { CONTACT_DISPLAY_EMAIL } from "@/lib/contact"

/** Square mark — best for email clients that show a compact brand image. */
export const EMAIL_LOGO_MARK_URL = absoluteUrl("/brand/ct-labs-mark.png")
/** Horizontal lockup — used in the email header strip. */
export const EMAIL_LOGO_LOCKUP_URL = absoluteUrl("/brand/ct-labs-lockup.png")

/**
 * Wraps outbound HTML with a branded header/footer.
 *
 * Note: Gmail's circular sender avatar (the letter "C") is controlled by BIMI + DMARC
 * (quarantine/reject) + a verified mark certificate — not by HTML in the message body.
 * This wrapper puts the real CodeTelemetryLab logo in the email itself so recipients
 * see brand identity when they open the message.
 */
export function wrapBrandedEmailHtml(innerHtml: string, options?: { preheader?: string }) {
  const preheader = options?.preheader?.trim()
  const preheaderBlock = preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeEmailHtml(preheader)}</div>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeEmailHtml(BRAND_NAME)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f6fa;">
  ${preheaderBlock}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fa;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #e2e8f0;background:#ffffff;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img
                  src="${EMAIL_LOGO_LOCKUP_URL}"
                  alt="${escapeEmailHtml(BRAND_NAME)}"
                  width="200"
                  height="56"
                  style="display:block;width:200px;max-width:70%;height:auto;border:0;outline:none;"
                />
              </a>
              <p style="margin:10px 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">
                ${escapeEmailHtml(BRAND_TAGLINE)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.65;color:#0a1317;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img
                      src="${EMAIL_LOGO_MARK_URL}"
                      alt=""
                      width="36"
                      height="36"
                      style="display:block;width:36px;height:36px;border-radius:8px;border:1px solid #e2e8f0;"
                    />
                  </td>
                  <td style="vertical-align:middle;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;line-height:1.5;color:#64748b;">
                    <strong style="color:#0f172a;">${escapeEmailHtml(BRAND_NAME)}</strong><br />
                    <a href="${SITE_URL}" style="color:#0064e0;text-decoration:none;">${escapeEmailHtml(SITE_URL.replace(/^https?:\/\//, ""))}</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:${CONTACT_DISPLAY_EMAIL}" style="color:#0064e0;text-decoration:none;">${escapeEmailHtml(CONTACT_DISPLAY_EMAIL)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

export function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
