import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { welcomeEmailTemplate } from '../templates/welcomeEmail.js'
import { orderConfirmationTemplate } from '../templates/orderConfirmation.js'
import { orderStatusTemplate } from '../templates/orderStatus.js'
import { paymentStatusTemplate } from '../templates/paymentStatus.js'

function mailConfigured() {
  return !!(env.MAIL_HOST && env.MAIL_PORT && env.MAIL_USER && env.MAIL_PASS && env.MAIL_FROM)
}

function createTransport() {
  const port = Number(env.MAIL_PORT)
  const secure = port === 465
  return nodemailer.createTransport({
    host: env.MAIL_HOST,
    port,
    secure,
    auth: {
      user: env.MAIL_USER,
      pass: env.MAIL_PASS,
    },
  })
}

async function sendHtmlMail({ to, subject, html }) {
  if (!mailConfigured()) return { ok: false, skipped: true, reason: 'mail_not_configured' }
  const transporter = createTransport()
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    html,
  })
  return { ok: true }
}

function supportEmailFallback() {
  return env.ADMIN_EMAIL || 'support@cozyfoam.in'
}

export async function sendWelcomeEmail(user) {
  const to = user?.email
  if (!to) return { ok: false, skipped: true, reason: 'missing_recipient' }
  const { subject, html } = welcomeEmailTemplate({
    customerName: user?.name,
    supportEmail: supportEmailFallback(),
  })
  return await sendHtmlMail({ to, subject, html })
}

export async function sendOrderConfirmation(order, customer) {
  const to = customer?.email
  if (!to) return { ok: false, skipped: true, reason: 'missing_recipient' }
  const { subject, html } = orderConfirmationTemplate({
    order,
    customerName: customer?.name,
  })
  return await sendHtmlMail({ to, subject, html })
}

export async function sendOrderStatusUpdate(order, customer) {
  const to = customer?.email
  if (!to) return { ok: false, skipped: true, reason: 'missing_recipient' }
  const { subject, html } = orderStatusTemplate({
    order,
    customerName: customer?.name,
  })
  return await sendHtmlMail({ to, subject, html })
}

export async function sendPaymentStatusUpdate(order, customer) {
  const to = customer?.email
  if (!to) return { ok: false, skipped: true, reason: 'missing_recipient' }
  const { subject, html } = paymentStatusTemplate({ order, customerName: customer?.name })
  return await sendHtmlMail({ to, subject, html })
}

