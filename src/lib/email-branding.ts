import { absoluteUrl, BRAND_NAME, SITE_URL } from "@/lib/seo"
import { CONTACT_DISPLAY_EMAIL } from "@/lib/contact"

/** Light square mark for the email footer only. */
export const EMAIL_FOOTER_LOGO_URL = absoluteUrl("/brand/ct-labs-mark-light.png")

/**
 * Wraps outbound HTML with a simple body + footer (light logo + site/contact links).
 * No header brand lockup — keeps the message itself clean.
 *
 * Gmail's circular sender avatar still requires BIMI + DMARC (quarantine/reject)
 * + a Verified Mark Certificate; that cannot be set from HTML.
 */
export function wrapBrandedEmailHtml(innerHtml: string, options?: { preheader?: string }) {
  const preheader = options?.preheader?.trim()
  const preheaderBlock = preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeEmailHtml(preheader)}</div>`
    : ""
  const siteHost = SITE_URL.replace(/^https?:\/\//, "")

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
            <td style="padding:28px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.65;color:#0a1317;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <a href="${SITE_URL}" style="text-decoration:none;">
                      <img
                        src="${EMAIL_FOOTER_LOGO_URL}"
                        alt="${escapeEmailHtml(BRAND_NAME)}"
                        width="40"
                        height="40"
                        style="display:block;width:40px;height:40px;border-radius:8px;border:1px solid #e2e8f0;background:#ffffff;"
                      />
                    </a>
                  </td>
                  <td style="vertical-align:middle;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;line-height:1.5;color:#64748b;">
                    <strong style="color:#0f172a;">${escapeEmailHtml(BRAND_NAME)}</strong><br />
                    <a href="${SITE_URL}" style="color:#0064e0;text-decoration:none;">${escapeEmailHtml(siteHost)}</a>
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
