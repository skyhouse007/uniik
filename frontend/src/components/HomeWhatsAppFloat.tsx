/**
 * Floating WhatsApp CTA — homepage only by default placement.
 * Optional: VITE_WHATSAPP_PHONE (digits only, with country code) and VITE_WHATSAPP_MESSAGE.
 */
const FALLBACK_PHONE_DIGITS = '911234567890'

function sanitizePhoneDigits(value: string | undefined): string | null {
  if (!value?.trim()) return null
  const d = value.replace(/\D/g, '')
  return d.length >= 10 ? d : null
}

export function HomeWhatsAppFloat() {
  const digits =
    sanitizePhoneDigits(import.meta.env.VITE_WHATSAPP_PHONE) ?? FALLBACK_PHONE_DIGITS
  const message = import.meta.env.VITE_WHATSAPP_MESSAGE?.trim()
  const params = message ? `?text=${encodeURIComponent(message)}` : ''
  const href = `https://wa.me/${digits}${params}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[115] inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_14px_rgba(0,0,0,.35)] ring-4 ring-black/25 transition hover:scale-105 hover:shadow-[0_6px_20px_rgba(0,0,0,.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] md:bottom-8 md:right-8"
      aria-label="Chat with us on WhatsApp"
    >
      {/* WhatsApp mark — simplified monochrome on brand green */}
      <svg viewBox="0 0 24 24" className="size-8" aria-hidden fill="currentColor">
        <path d="M12.04 2C6.58 2 2.2 6.37 2.2 11.82c0 1.93.53 3.74 1.44 5.31L2 22l5.02-1.65a9.73 9.73 0 0 0 5.03 1.38h.01c5.46 0 9.84-4.37 9.84-9.82C21.9 6.37 17.52 2 12.04 2zm-.01 17.71h-.01a8.06 8.06 0 0 1-4.09-1.12l-.29-.17-3.41 1.12 1.15-3.34-.19-.31a8 8 0 0 1-1.24-4.34c0-4.45 3.63-8.06 8.08-8.06 4.44 0 8.06 3.61 8.06 8.06s-3.62 8.06-8.06 8.06zm4.71-6.06c-.25-.13-1.47-.73-1.7-.82-.23-.08-.39-.13-.56.13-.17.25-.62.82-.76.99-.14.17-.29.19-.53.06-.25-.13-1.04-.39-1.98-1.23-.73-.65-1.22-1.45-1.36-1.7-.14-.25-.02-.39.11-.52.11-.11.25-.29.37-.43.13-.14.17-.25.25-.43.09-.17.05-.31-.02-.43-.06-.13-.56-1.36-.77-1.86-.2-.49-.41-.43-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.23.9 2.43 1.02 2.59.13.17 1.77 2.71 4.31 3.82.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.11.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.09-.23-.14-.49-.26z" />
      </svg>
    </a>
  )
}
