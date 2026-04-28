function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function welcomeEmailTemplate({ customerName, supportEmail }) {
  const name = escapeHtml(customerName || 'Customer')
  const support = escapeHtml(supportEmail || 'support@cozyfoam.in')
  return {
    subject: 'Welcome to Cozy Foam',
    html: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Welcome to Cozy Foam</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding:28px 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #eef2f7;">
            <tr>
              <td style="background:#0f172a;padding:18px 20px;">
                <div style="font-size:16px;font-weight:700;letter-spacing:.3px;color:#ffffff;">Cozy Foam</div>
                <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">Comfort you can trust</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 20px;">
                <div style="font-size:18px;font-weight:700;margin:0 0 10px 0;">Hi ${name},</div>
                <div style="font-size:14px;line-height:1.6;color:#334155;">
                  Welcome to <b>Cozy Foam</b>. Your account is ready—you're all set to explore our products and place orders with a smooth checkout experience.
                </div>
                <div style="height:14px;"></div>
                <div style="font-size:14px;line-height:1.6;color:#334155;">
                  Need help? Reply to this email or reach us at <a href="mailto:${support}" style="color:#2563eb;text-decoration:none;">${support}</a>.
                </div>
                <div style="height:18px;"></div>
                <div style="font-size:12px;color:#64748b;">
                  Thank you for choosing Cozy Foam.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;background:#f8fafc;border-top:1px solid #eef2f7;font-size:12px;color:#64748b;">
                © ${new Date().getFullYear()} Cozy Foam. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  }
}

