function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function currencyINR(n) {
  const v = Number(n) || 0
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
}

function titleCase(s) {
  const v = String(s ?? '').trim()
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : v
}

export function paymentStatusTemplate({ order }) {
  const orderId = escapeHtml(order?._id)
  const status = titleCase(order?.paymentStatus)
  const method = escapeHtml(order?.paymentMethod || 'Online')
  const amount = escapeHtml(currencyINR(order?.totalAmount))

  return {
    subject: `Payment update — ${orderId}`,
    html: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment Status Update</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding:28px 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #eef2f7;">
            <tr>
              <td style="background:#0f172a;padding:18px 20px;">
                <div style="font-size:16px;font-weight:700;letter-spacing:.3px;color:#ffffff;">Cozy Foam</div>
                <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">Payment status update</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 20px;">
                <div style="font-size:13px;color:#475569;line-height:1.6;">
                  <div><b>Order ID:</b> ${orderId}</div>
                  <div><b>Payment amount:</b> ${amount}</div>
                  <div><b>Payment method:</b> ${method}</div>
                  <div><b>Payment status:</b> ${escapeHtml(status || 'Updated')}</div>
                </div>
                <div style="margin-top:14px;font-size:12px;color:#64748b;">
                  If you need help, reply to this email and we’ll assist you.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;background:#f8fafc;border-top:1px solid #eef2f7;font-size:12px;color:#64748b;">
                © ${new Date().getFullYear()} Cozy Foam.
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

