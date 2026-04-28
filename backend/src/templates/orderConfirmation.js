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

export function orderConfirmationTemplate({ order, customerName }) {
  const orderId = escapeHtml(order?._id)
  const name = escapeHtml(customerName || order?.address?.fullName || 'Customer')
  const paymentMethod = escapeHtml(order?.paymentMethod || 'Online')
  const addr = order?.address ?? {}
  const addressLine = [
    addr.line1,
    addr.line2,
    addr.landmark,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.pincode,
  ]
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
    .join(', ')

  const items = Array.isArray(order?.products) ? order.products : []
  const rows = items
    .map((p) => {
      const labelParts = [p?.name, p?.size, p?.selectedSize, p?.selectedThickness].filter(Boolean)
      const label = escapeHtml(labelParts.join(' • '))
      const qty = escapeHtml(p?.quantity)
      const price = currencyINR(p?.unitPrice)
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;">${label}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:center;">${qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;">${escapeHtml(price)}</td>
      </tr>`
    })
    .join('')

  return {
    subject: `Order confirmed — ${orderId}`,
    html: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Order Confirmation</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding:28px 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #eef2f7;">
            <tr>
              <td style="background:#0f172a;padding:18px 20px;">
                <div style="font-size:16px;font-weight:700;letter-spacing:.3px;color:#ffffff;">Cozy Foam</div>
                <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">Order confirmation</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 20px;">
                <div style="font-size:18px;font-weight:700;margin:0 0 10px 0;">Thanks ${name}, your order is confirmed.</div>
                <div style="font-size:13px;color:#475569;line-height:1.6;">
                  <div><b>Order ID:</b> ${orderId}</div>
                  <div><b>Total:</b> ${escapeHtml(currencyINR(order?.totalAmount))}</div>
                  <div><b>Payment method:</b> ${paymentMethod}</div>
                  <div><b>Delivery address:</b> ${escapeHtml(addressLine || '—')}</div>
                </div>

                <div style="height:16px;"></div>
                <div style="font-size:14px;font-weight:700;margin-bottom:8px;">Items</div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #eef2f7;border-radius:12px;overflow:hidden;">
                  <thead>
                    <tr style="background:#f8fafc;color:#334155;">
                      <th style="text-align:left;padding:10px 12px;font-size:12px;border-bottom:1px solid #eef2f7;">Product</th>
                      <th style="text-align:center;padding:10px 12px;font-size:12px;border-bottom:1px solid #eef2f7;">Qty</th>
                      <th style="text-align:right;padding:10px 12px;font-size:12px;border-bottom:1px solid #eef2f7;">Unit price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows || `<tr><td colspan="3" style="padding:12px;color:#64748b;">No items found.</td></tr>`}
                  </tbody>
                </table>

                <div style="height:16px;"></div>
                <div style="font-size:12px;color:#64748b;">
                  If you have questions, reply to this email and our support team will help.
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

