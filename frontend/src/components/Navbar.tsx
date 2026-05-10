import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, useClerk, useUser } from '@clerk/clerk-react'
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type SVGProps } from 'react'
import { useAppSelector } from '../store/hooks'
import { fetchSiteSettings, type SiteSettings } from '../api/site'
import { fetchCategories } from '../api/catalog'
import type { Category } from '../types/catalog'
import uniikLogo from '../assets/uniik.png'

const ANNOUNCEMENT_CALL_DISPLAY = '9740144811'
const ANNOUNCEMENT_CALL_TEL = '+919740144811'

type CategoryNode = {
  id: string
  label: string
  children?: CategoryNode[]
}

function productCategoryHref(id: string) {
  return `/products?category=${encodeURIComponent(id)}`
}

function parentGroupKey(parentId: unknown): string {
  if (parentId == null || parentId === '') return 'root'
  return String(parentId)
}

function sortCategoriesByOrder(a: Category, b: Category) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.name ?? '').localeCompare(String(b.name ?? ''))
}

/** Map keys must be strings — API may send ObjectId-shaped values that break Map.get otherwise. */
function buildCategoryTree(items: Category[]): CategoryNode[] {
  const byParent = new Map<string, Category[]>()
  for (const c of items) {
    const key = parentGroupKey(c.parentId)
    const list = byParent.get(key) ?? []
    list.push(c)
    byParent.set(key, list)
  }
  for (const list of byParent.values()) {
    list.sort(sortCategoriesByOrder)
  }

  function nodeFrom(cat: Category): CategoryNode {
    const id = String(cat._id)
    const kids = byParent.get(id) ?? []
    return {
      id,
      label: String(cat.name ?? ''),
      children: kids.length ? kids.map(nodeFrom) : undefined,
    }
  }

  const roots = byParent.get('root') ?? []
  return roots.map(nodeFrom)
}

/** Each API entry can contain newlines — split so every line is its own announcement (max 12). */
function expandAnnouncementLines(raw: string[]): string[] {
  const out: string[] = []
  for (const line of raw) {
    for (const part of String(line ?? '').split(/\r?\n/)) {
      const t = part.trim()
      if (t) out.push(t)
    }
  }
  return out.slice(0, 12)
}

function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  )
}

function IconBag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M6 8h12l-1 14H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <path d="M10 12c0 1.5 1 2.5 2 2.5s2-1 2-2.5" />
    </svg>
  )
}

function IconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M20.8 6.6a4.5 4.5 0 0 0-6.4 0L12 9l-2.4-2.4a4.5 4.5 0 1 0-6.4 6.4L12 21l8.8-9a4.5 4.5 0 0 0 0-6.4z" />
    </svg>
  )
}

function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden
      {...props}
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function IconPhone(props: SVGProps<SVGSVGElement>) {
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

/** Top nav category that should show Compare inside its mega menu (name from catalog). */
function isMattressNavCategory(cat: Pick<CategoryNode, 'label'>): boolean {
  const n = String(cat.label ?? '')
    .trim()
    .toLowerCase()
  return n === 'mattress' || n === 'mattresses' || (n.includes('mattress') && n.length < 24)
}

function MegaMenuPanel({ cat }: { cat: CategoryNode }) {
  const subs = cat.children ?? []
  const showCompare = isMattressNavCategory(cat)
  const baseUrl = useMemo(() => {
    const b = import.meta.env.BASE_URL || '/'
    return b.endsWith('/') ? b : `${b}/`
  }, [])

  const subImageSrc = useCallback(
    (label: string): string | null => {
      if (!showCompare) return null
      const l = String(label ?? '').trim().toLowerCase()
      if (l.includes('organic')) return `${baseUrl}images/catimg/organic.png`
      if (l.includes('hybrid')) return `${baseUrl}images/catimg/hybrid.png`
      if (l.includes('ortho')) return `${baseUrl}images/catimg/ortho.png`
      if (l.includes('compare')) return `${baseUrl}images/catimg/compare.png`
      return null
    },
    [baseUrl, showCompare],
  )

  if (subs.length === 0) {
    return (
      <div>
        <div className="px-4 py-6 sm:px-8">
          {showCompare ? (
            <div className="mb-4">
              <Link
                to="/compare"
                className="text-sm font-semibold text-[rgb(var(--brand))] hover:underline"
              >
                Compare mattresses
              </Link>
              <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">Compare Organic, Hybrid & Ortho at a glance.</p>
            </div>
          ) : null}
          <Link
            to={productCategoryHref(cat.id)}
            className="text-sm font-semibold text-[rgb(var(--brand))] hover:underline"
          >
            Shop all {cat.label}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-10 gap-y-10 px-8 py-8 sm:grid-cols-3 lg:grid-cols-4">
        {subs.map((sub) => (
          <div key={sub.id} className="min-w-0">
            <div className="border-b border-[rgb(var(--brand))]/20 pb-2">
              <Link
                to={productCategoryHref(sub.id)}
                className={[
                  'inline-flex max-w-full flex-col items-start gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--brand))] transition hover:opacity-80',
                ].join(' ')}
              >
                {subImageSrc(sub.label) ? (
                  <div className="flex h-32 w-full items-end sm:h-36 md:h-40">
                    <img
                      src={subImageSrc(sub.label)!}
                      alt=""
                      className={[
                        String(sub.label ?? '')
                          .trim()
                          .toLowerCase()
                          .includes('hybrid')
                          ? 'h-24 sm:h-28 md:h-32'
                          : 'h-20 sm:h-24 md:h-28',
                        'w-auto max-w-full object-contain object-left',
                      ].join(' ')}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}
                {sub.label}
              </Link>
            </div>
            {sub.children?.length ? (
              <ul className="mt-3 space-y-2">
                {sub.children.map((node) => (
                  <li key={node.id}>
                    {node.children?.length ? (
                      <div>
                        <span className="text-sm font-medium text-[rgb(var(--fg))]">{node.label}</span>
                        <ul className="ml-2 mt-1.5 space-y-1.5 border-l border-[rgb(var(--border))] pl-3">
                          {node.children.map((leaf) => (
                            <li key={leaf.id}>
                              <Link
                                to={productCategoryHref(leaf.id)}
                                className="text-sm text-[rgb(var(--muted))] transition hover:text-[rgb(var(--brand))]"
                              >
                                {leaf.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <Link
                        to={productCategoryHref(node.id)}
                        className="text-sm text-[rgb(var(--muted))] transition hover:text-[rgb(var(--brand))]"
                      >
                        {node.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3">
                <Link to={productCategoryHref(sub.id)} className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--brand))]">
                  View all →
                </Link>
              </p>
            )}
          </div>
        ))}

        {showCompare ? (
          <div className="min-w-0">
            <div className="border-b border-[rgb(var(--brand))]/20 pb-2">
              <Link
                to="/compare"
                className="inline-flex max-w-full flex-col items-start gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--brand))] transition hover:opacity-80"
              >
                <div className="flex h-32 w-full items-end sm:h-36 md:h-40">
                  <img
                    src={`${baseUrl}images/catimg/compare.png`}
                    alt=""
                    className="h-32 w-auto max-w-full -mb-4 object-contain object-left sm:h-36 md:h-40"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                Compare
              </Link>
            </div>
            <p className="mt-3">
              <Link to="/compare" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--brand))]">
                View all →
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function Navbar() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const location = useLocation()
  const DEFAULT_ANNOUNCEMENTS = useMemo(
    () => [
      'Natural latex & breathable foams — sleep closer to nature',
      'Free shipping on all orders',
      '100-night trial on select mattresses',
    ],
    [],
  )
  const [announcements, setAnnouncements] = useState<string[]>(DEFAULT_ANNOUNCEMENTS)
  const [announcementIndex, setAnnouncementIndex] = useState(0)
  const [announcementRotationPaused, setAnnouncementRotationPaused] = useState(false)
  const [contactEmail, setContactEmail] = useState('support@cozyfoam.in')
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([])
  const [openMegaId, setOpenMegaId] = useState<string | null>(null)
  const [megaTopPx, setMegaTopPx] = useState(0)
  const [useHoverMega, setUseHoverMega] = useState(true)
  const headerRef = useRef<HTMLElement | null>(null)
  const accountRef = useRef<HTMLDivElement | null>(null)
  const phoneRef = useRef<HTMLDivElement | null>(null)
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accountCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phoneCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const megaAnchorRef = useRef<HTMLDivElement | null>(null)
  const itemCount = useAppSelector((s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0))
  const wishlistCount = useAppSelector((s) => s.wishlist.productIds.length)
  const cartLabel = useMemo(() => (itemCount > 99 ? '99+' : String(itemCount)), [itemCount])
  const wishlistLabel = useMemo(() => (wishlistCount > 99 ? '99+' : String(wishlistCount)), [wishlistCount])
  const customerName = user?.fullName ?? user?.firstName ?? 'Customer'
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (location.pathname !== '/search') return
    const q = new URLSearchParams(location.search).get('q') ?? ''
    setSearchQuery(q)
  }, [location.pathname, location.search])

  useEffect(() => {
    let alive = true
    function applySiteSettings(s: SiteSettings) {
      if (!alive) return
      const fromApi = (s.announcements ?? []).map((x) => String(x ?? '').trim()).filter(Boolean)
      const fromList = fromApi.length ? expandAnnouncementLines(fromApi) : []
      const legacyText = s.announcementText?.trim()
      const fromLegacy = legacyText ? expandAnnouncementLines([legacyText]) : []
      const lines = fromList.length ? fromList : fromLegacy
      const next = lines.length ? lines : DEFAULT_ANNOUNCEMENTS
      setAnnouncements(next)
      setAnnouncementIndex(0)
      setContactEmail(s.contactEmail || 'support@cozyfoam.in')
    }
    function loadSiteSettings() {
      fetchSiteSettings().then(applySiteSettings).catch(() => {})
    }
    loadSiteSettings()
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadSiteSettings()
    }
    document.addEventListener('visibilitychange', onVisible)
    fetchCategories()
      .then((items) => alive && setCategoryTree(buildCategoryTree(items)))
      .catch(() => {})
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [DEFAULT_ANNOUNCEMENTS])

  useEffect(() => {
    if (announcements.length <= 1 || announcementRotationPaused) return
    const id = window.setInterval(() => {
      setAnnouncementIndex((i) => (i + 1) % announcements.length)
    }, 5500)
    return () => clearInterval(id)
  }, [announcements, announcementRotationPaused])

  const activeAnnouncementIndex =
    announcements.length > 0 ? announcementIndex % announcements.length : 0
  const activeAnnouncementText = announcements[activeAnnouncementIndex] ?? ''

  useEffect(() => {
    return () => {
      if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current)
      if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current)
      if (phoneCloseTimer.current) clearTimeout(phoneCloseTimer.current)
    }
  }, [])

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const sync = () => {
      const h = el.offsetHeight
      if (typeof document !== 'undefined' && h > 0) {
        document.documentElement.style.setProperty('--site-header-height', `${h}px`)
      }
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [categoryTree.length, announcements.length])

  const updateMegaTop = useCallback(() => {
    const el = megaAnchorRef.current
    if (!el) return
    setMegaTopPx(Math.round(el.getBoundingClientRect().bottom))
  }, [])

  useLayoutEffect(() => {
    updateMegaTop()
    window.addEventListener('resize', updateMegaTop)
    return () => window.removeEventListener('resize', updateMegaTop)
  }, [updateMegaTop, categoryTree.length])

  useLayoutEffect(() => {
    if (!openMegaId) return
    updateMegaTop()
    window.addEventListener('scroll', updateMegaTop, true)
    return () => window.removeEventListener('scroll', updateMegaTop, true)
  }, [openMegaId, updateMegaTop])

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setUseHoverMega(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const openMegaCat = useMemo(
    () => (openMegaId ? categoryTree.find((c) => c.id === openMegaId) ?? null : null),
    [categoryTree, openMegaId],
  )

  useEffect(() => {
    if (!openMegaId) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (headerRef.current?.contains(t)) return
      setOpenMegaId(null)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [openMegaId])

  useEffect(() => {
    if (!accountMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (accountRef.current?.contains(t)) return
      setAccountMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [accountMenuOpen])

  useEffect(() => {
    if (!mobileNavOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  function openAccountMenu() {
    if (accountCloseTimer.current) {
      clearTimeout(accountCloseTimer.current)
      accountCloseTimer.current = null
    }
    setAccountMenuOpen(true)
  }

  function scheduleCloseAccountMenu() {
    accountCloseTimer.current = setTimeout(() => {
      setAccountMenuOpen(false)
      accountCloseTimer.current = null
    }, 200)
  }

  function openMegaMenu(id: string) {
    if (megaCloseTimer.current) {
      clearTimeout(megaCloseTimer.current)
      megaCloseTimer.current = null
    }
    setOpenMegaId(id)
  }

  function scheduleCloseMegaMenu() {
    megaCloseTimer.current = setTimeout(() => {
      setOpenMegaId(null)
      megaCloseTimer.current = null
    }, 180)
  }

  function openPhoneMenu() {
    if (phoneCloseTimer.current) {
      clearTimeout(phoneCloseTimer.current)
      phoneCloseTimer.current = null
    }
    setPhoneMenuOpen(true)
  }

  function scheduleClosePhoneMenu() {
    phoneCloseTimer.current = setTimeout(() => {
      setPhoneMenuOpen(false)
      phoneCloseTimer.current = null
    }, 200)
  }

  const closeMobile = () => setMobileNavOpen(false)
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = searchQuery.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  const categoryTriggerClass = (open: boolean) =>
    [
      'inline-flex items-center whitespace-nowrap border-b-2 border-transparent pb-0.5 text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[rgb(var(--fg))] transition lg:text-[11px]',
      'hover:border-current/25 hover:text-[rgb(var(--muted))]',
      open ? 'border-[rgb(var(--fg))]' : '',
    ].join(' ')

  return (
    <>
      <header
        ref={headerRef}
        className="font-header relative z-40 overflow-visible border-b border-[rgb(var(--border))] bg-page-gradient shadow-[0_1px_0_rgba(255,255,255,0.06)]"
      >
      <div
        className="font-ui relative flex min-h-[2rem] items-center justify-center overflow-hidden bg-[rgb(var(--hero))] px-3 py-0.5 text-center text-[11px] font-medium tracking-[0.02em] text-[rgb(var(--fg))] sm:min-h-[2.125rem] sm:text-[12px]"
        onMouseEnter={() => setAnnouncementRotationPaused(true)}
        onMouseLeave={() => setAnnouncementRotationPaused(false)}
      >
        <div className="relative z-10 w-full px-2 py-1 sm:px-3">
          <div
            className="mx-auto flex min-h-0 max-w-[min(44rem,calc(100%-10.5rem))] items-center justify-center py-0.5 text-center font-medium tracking-wide sm:max-w-[min(56rem,calc(100%-12.5rem))]"
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              key={announcementIndex}
              className="announcement-bar-item inline-block max-w-full leading-snug"
            >
              {activeAnnouncementText}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="container-page relative flex h-[160px] flex-nowrap items-center gap-2 sm:gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center lg:gap-5">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[rgb(var(--fg))] md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <IconMenu />
          </button>

          <div className="hidden min-w-0 md:flex md:max-w-2xl md:justify-self-start md:self-center">
            <form onSubmit={handleSearchSubmit} className="w-full min-w-0">
              <label htmlFor="nav-search" className="sr-only">
                Search products
              </label>
              <div className="flex h-11 items-center rounded-none border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4">
                <svg
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="shrink-0 text-[rgb(var(--muted))]"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  id="nav-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-transparent px-3 text-sm text-[rgb(var(--fg))] outline-none placeholder:text-[rgb(var(--muted))]"
                />
              </div>
            </form>
          </div>

          <Link
            to="/"
            className="absolute left-1/2 flex min-w-0 -translate-x-1/2 items-center justify-center md:static md:translate-x-0 md:justify-self-center"
            onClick={closeMobile}
          >
            <div className="flex h-[4.5rem] w-52 shrink-0 items-center sm:w-60 md:h-[6.5rem] md:w-80 lg:h-[7.5rem] lg:w-96 xl:h-[8.5rem] xl:w-[28rem]">
              <img src={uniikLogo} alt="Uniik" className="-mt-1 h-full w-full object-contain object-center md:object-center" />
            </div>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2 self-center md:ml-0 md:justify-self-end">
            <div className="flex items-center gap-0 sm:gap-0.5">
              <Link
                to="/wishlist"
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--muted))]"
                aria-label={`Wishlist, ${wishlistCount} items`}
              >
                <IconHeart />
                {wishlistCount > 0 ? (
                  <span className="absolute right-1 top-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-[rgb(var(--brand))] px-1 text-[10px] font-semibold text-white">
                    {wishlistLabel}
                  </span>
                ) : null}
              </Link>

              <div
                ref={phoneRef}
                className="relative"
                onMouseEnter={useHoverMega ? openPhoneMenu : undefined}
                onMouseLeave={useHoverMega ? scheduleClosePhoneMenu : undefined}
              >
                <button
                  type="button"
                  aria-expanded={phoneMenuOpen}
                  aria-haspopup="true"
                  aria-label={`Call ${ANNOUNCEMENT_CALL_DISPLAY}`}
                  className={[
                    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--muted))]',
                    phoneMenuOpen ? 'bg-[rgb(var(--surface))]' : '',
                  ].join(' ')}
                  onClick={() => {
                    if (!useHoverMega) {
                      setPhoneMenuOpen((o) => !o)
                    }
                  }}
                >
                  <IconPhone />
                </button>

                <div
                  className={[
                    'absolute right-0 top-full z-[110] w-56 pt-2',
                    phoneMenuOpen ? 'block' : 'hidden',
                  ].join(' ')}
                  onMouseEnter={useHoverMega ? openPhoneMenu : undefined}
                  onMouseLeave={useHoverMega ? scheduleClosePhoneMenu : undefined}
                >
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--inverse))] p-3 shadow-xl ring-1 ring-black/5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                      Call now
                    </div>
                    <a
                      href={`tel:${ANNOUNCEMENT_CALL_TEL}`}
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--surface))] px-3 py-2 text-sm font-semibold text-[rgb(var(--brand))] transition hover:opacity-80"
                    >
                      <IconPhone className="h-4 w-4" />
                      <span className="tabular-nums tracking-wide">{ANNOUNCEMENT_CALL_DISPLAY}</span>
                    </a>
                  </div>
                </div>
              </div>

              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    aria-label="Sign in"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--muted))]"
                  >
                    <IconUser />
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <div
                  ref={accountRef}
                  className="relative"
                  onMouseEnter={useHoverMega ? openAccountMenu : undefined}
                  onMouseLeave={useHoverMega ? scheduleCloseAccountMenu : undefined}
                >
                  <button
                    type="button"
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="true"
                    aria-label={`Account, ${customerName}`}
                    className={[
                      'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--muted))]',
                      accountMenuOpen ? 'bg-[rgb(var(--surface))]' : '',
                    ].join(' ')}
                    onClick={() => {
                      if (!useHoverMega) {
                        setAccountMenuOpen((o) => !o)
                      }
                    }}
                  >
                    <IconUser />
                  </button>
                  <div
                    className={[
                      'absolute right-0 top-full z-[110] w-72 pt-2',
                      accountMenuOpen ? 'block' : 'hidden',
                    ].join(' ')}
                    onMouseEnter={useHoverMega ? openAccountMenu : undefined}
                    onMouseLeave={useHoverMega ? scheduleCloseAccountMenu : undefined}
                  >
                    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--inverse))] p-4 shadow-xl ring-1 ring-black/5">
                      <div className="truncate text-sm font-semibold text-[rgb(var(--brand))]">{customerName}</div>
                      <div className="mt-3 grid gap-2 text-sm text-[rgb(var(--fg))]">
                        <Link to="/orders" className="hover:text-[rgb(var(--brand))]">
                          Orders
                        </Link>
                        <Link to="/track-order" className="hover:text-[rgb(var(--brand))]">
                          Track my order
                        </Link>
                        <Link to="/wallet" className="hover:text-[rgb(var(--brand))]">
                          Wallet
                        </Link>
                        <Link to="/profile" className="font-medium hover:text-[rgb(var(--brand))]">
                          Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => void signOut()}
                          className="text-left text-red-600 hover:text-red-700"
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </SignedIn>

              <Link
                to="/cart"
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--muted))]"
                aria-label={`Shopping bag, ${itemCount} items`}
              >
                <IconBag />
                {itemCount > 0 ? (
                  <span className="absolute right-0.5 top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-[rgb(var(--accent-sale))] px-1 text-[10px] font-semibold text-white">
                    {cartLabel}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div ref={megaAnchorRef} className="hidden border-t border-[rgb(var(--border))] md:block">
        <div className="container-page relative">
          <nav
            className="relative z-0 flex min-h-0 min-w-0 items-center justify-center overflow-x-auto overflow-y-visible py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="All categories"
          >
            <div className="mx-auto flex w-max min-w-0 flex-nowrap items-center gap-x-6 px-1 lg:gap-x-8">
              {categoryTree.length ? (
                categoryTree.map((cat) => {
                  const open = openMegaId === cat.id
                  return (
                    <div
                      key={cat.id}
                      className="relative flex shrink-0 items-center"
                      style={{ zIndex: open ? 50 : undefined }}
                      onMouseEnter={useHoverMega ? () => openMegaMenu(cat.id) : undefined}
                      onMouseLeave={useHoverMega ? scheduleCloseMegaMenu : undefined}
                    >
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-haspopup="true"
                        className={categoryTriggerClass(open)}
                        onClick={() => {
                          if (!useHoverMega) {
                            setOpenMegaId((cur) => (cur === cat.id ? null : cat.id))
                            requestAnimationFrame(() => updateMegaTop())
                          }
                        }}
                      >
                        {cat.label}
                      </button>
                    </div>
                  )
                })
              ) : (
                <Link
                  to="/categories"
                  className="inline-flex items-center whitespace-nowrap text-sm font-semibold leading-none text-[rgb(var(--brand))] underline-offset-4 hover:underline lg:text-lg"
                >
                  Shop all
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
      </header>

      {openMegaCat ? (
        <div
          className="fixed inset-x-0 z-[100] box-border px-3 pt-1 pb-4 sm:px-4 md:px-6 lg:px-8"
          style={{ top: Math.max(0, megaTopPx - 6) }}
          onMouseEnter={useHoverMega ? () => openMegaMenu(openMegaCat.id) : undefined}
          onMouseLeave={useHoverMega ? scheduleCloseMegaMenu : undefined}
        >
          <div className="mx-auto max-h-[min(78dvh,36rem)] w-full max-w-7xl overflow-y-auto overflow-x-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--inverse))] text-[rgb(var(--fg))] shadow-2xl ring-1 ring-black/5">
            <MegaMenuPanel cat={openMegaCat} />
          </div>
        </div>
      ) : null}

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[120] bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <div className="fixed left-0 top-0 z-[121] flex h-full w-[min(20rem,88vw)] flex-col bg-[rgb(var(--inverse))] shadow-2xl md:hidden">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3">
              <span className="text-sm font-bold tracking-tight text-[rgb(var(--brand))]">Menu</span>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-xl leading-none text-[rgb(var(--brand))] hover:bg-[rgb(var(--surface))]"
                aria-label="Close menu"
                onClick={closeMobile}
              >
                ×
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="Mobile">
              {categoryTree.length ? (
                categoryTree.map((cat) => (
                  <Fragment key={cat.id}>
                    <Link
                      to={cat.children?.length ? `/categories/${cat.id}` : productCategoryHref(cat.id)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-[rgb(var(--brand))] hover:bg-[rgb(var(--surface))]"
                      onClick={closeMobile}
                    >
                      {cat.label}
                    </Link>
                    {isMattressNavCategory(cat) ? (
                      <Link
                        to="/compare"
                        className="ml-4 rounded-lg border-l-2 border-[rgb(var(--brand))]/40 py-2 pl-3 text-sm font-medium text-[rgb(var(--brand))] hover:bg-[rgb(var(--surface))]"
                        onClick={closeMobile}
                      >
                        Compare mattresses
                      </Link>
                    ) : null}
                  </Fragment>
                ))
              ) : (
                <Link
                  to="/categories"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[rgb(var(--brand))] hover:bg-[rgb(var(--surface))]"
                  onClick={closeMobile}
                >
                  Shop all
                </Link>
              )}
              <Link
                to="/categories"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[rgb(var(--brand))] hover:bg-[rgb(var(--surface))]"
                onClick={closeMobile}
              >
                Explore
              </Link>
              <Link
                to="/products"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[rgb(var(--accent-sale))] hover:bg-[rgb(var(--surface))]"
                onClick={closeMobile}
              >
                Sale
              </Link>
              <div className="my-2 border-t border-[rgb(var(--border))]" />
              <Link
                to="/bulk-order"
                className="rounded-lg px-3 py-2 text-sm text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface))]"
                onClick={closeMobile}
              >
                Bulk order
              </Link>
              <Link
                to="/track-order"
                className="rounded-lg px-3 py-2 text-sm text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface))]"
                onClick={closeMobile}
              >
                Track order
              </Link>
              <a
                href={`mailto:${contactEmail}`}
                className="rounded-lg px-3 py-2 text-sm text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface))]"
                onClick={closeMobile}
              >
                Contact
              </a>
            </nav>
          </div>
        </>
      ) : null}
    </>
  )
}
