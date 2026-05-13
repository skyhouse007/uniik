import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

export function WishlistPage() {
  const wishlistCount = useAppSelector((s) => s.wishlist.productIds.length)

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Wishlist — Uniik</title>
        <meta name="description" content="View products you saved to your wishlist." />
      </Helmet>

      <div className="font-header text-xl font-extrabold tracking-tight text-[rgb(var(--fg))]">My wishlist</div>
      <div className="mt-1 text-sm text-[rgb(var(--muted))]">
        You have {wishlistCount} item{wishlistCount === 1 ? '' : 's'} saved.
      </div>

      <div className="mt-6 rounded-2xl border border-white/12 bg-black/45 p-6 text-sm text-[rgb(var(--muted))] backdrop-blur-sm">
        Wishlist listing UI can be added here.
        <div className="mt-3">
          <Link to="/products" className="font-semibold text-white underline-offset-4 hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
