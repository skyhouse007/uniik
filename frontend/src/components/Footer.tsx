import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSiteSettings } from '../api/site'
import footerLogo from '../assets/footerlogo.jpeg'

const FOOTER_CALL_DISPLAY = '9740144811'
const FOOTER_CALL_TEL = '+919740144811'

function IconPhone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

export function Footer() {
  const [contactEmail, setContactEmail] = useState('support@cozyfoam.in')

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => setContactEmail(s.contactEmail || 'support@cozyfoam.in'))
      .catch(() => {})
  }, [])

  return (
    <footer className="mt-auto border-t border-[rgb(var(--border))] bg-[rgb(var(--inverse))] text-[rgb(var(--fg))]">
      <div className="container-page py-14">
        <div className="grid items-start gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-x-8 xl:gap-x-10">
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex w-full max-w-md items-start" aria-label="CozyFoam home">
              <img
                src={footerLogo}
                alt="CozyFoam"
                className="h-24 w-auto max-w-full object-contain object-left sm:h-28 md:h-32"
              />
            </Link>
          </div>

          <div className="lg:justify-self-end">
          <div className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Shop</div>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link className="text-[rgb(var(--fg))] transition hover:text-[rgb(var(--brand))]" to="/products">
                Mattresses
              </Link>
            </li>
            <li>
              <Link className="text-[rgb(var(--fg))] transition hover:text-[rgb(var(--brand))]" to="/categories">
                Categories
              </Link>
            </li>
          </ul>
        </div>
        <div className="lg:justify-self-end">
          <div className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Support</div>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link className="text-[rgb(var(--fg))] transition hover:text-[rgb(var(--brand))]" to="/shipping-policy">
                Shipping & returns
              </Link>
            </li>
            <li>
              <Link
                className="text-[rgb(var(--fg))] transition hover:text-[rgb(var(--brand))]"
                to="/return-refund-policy"
              >
                Returns & refunds
              </Link>
            </li>
            <li>
              <Link className="text-[rgb(var(--fg))] transition hover:text-[rgb(var(--brand))]" to="/warranty-policy">
                Warranty
              </Link>
            </li>
          </ul>
        </div>
        <div className="lg:justify-self-end">
          <div className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Legal</div>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link className="text-[rgb(var(--fg))] transition hover:text-[rgb(var(--brand))]" to="/privacy-policy">
                Privacy
              </Link>
            </li>
            <li>
              <Link className="text-[rgb(var(--fg))] transition hover:text-[rgb(var(--brand))]" to="/terms">
                Terms
              </Link>
            </li>
          </ul>
        </div>
        </div>

        <div className="mt-6" />
      </div>
      <div className="border-t border-[rgb(var(--border))]">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-4 text-sm text-[rgb(var(--muted))]">
          <Link className="transition hover:text-[rgb(var(--brand))]" to="/bulk-order">
            Bulk order
          </Link>
          <span className="text-[rgb(var(--border))]" aria-hidden>
            ·
          </span>
          <Link className="transition hover:text-[rgb(var(--brand))]" to="/track-order">
            Track order
          </Link>
          <span className="text-[rgb(var(--border))]" aria-hidden>
            ·
          </span>
          <a className="transition hover:text-[rgb(var(--brand))]" href={`mailto:${contactEmail}`}>
            Contact
          </a>
          <span className="text-[rgb(var(--border))]" aria-hidden>
            ·
          </span>
          <a
            className="inline-flex items-center gap-2 font-semibold text-[rgb(var(--fg))] transition hover:text-[rgb(var(--brand))]"
            href={`tel:${FOOTER_CALL_TEL}`}
            aria-label={`Call ${FOOTER_CALL_DISPLAY}`}
          >
            <IconPhone className="h-4 w-4" />
            <span className="tabular-nums">{FOOTER_CALL_DISPLAY}</span>
          </a>
        </div>
      </div>
      <div className="border-t border-[rgb(var(--border))]">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-[rgb(var(--muted))] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CozyFoam. All rights reserved.</span>
          <span className="text-[rgb(var(--muted))]">India · Secure checkout</span>
        </div>
      </div>
    </footer>
  )
}
