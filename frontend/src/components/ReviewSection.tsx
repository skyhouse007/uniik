import type { Review } from '../types/catalog'

export function ReviewSection({ reviews }: { reviews: Review[] }) {
  return (
    <section className="rounded-2xl border border-white/12 bg-black/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[rgb(var(--fg))]">Customer reviews</div>
        <div className="text-xs text-[rgb(var(--muted))]">{reviews.length} reviews</div>
      </div>
      <div className="mt-4 grid gap-3">
        {reviews.length ? (
          reviews.map((r) => (
            <div key={r._id} className="rounded-xl border border-white/10 bg-black/35 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[rgb(var(--fg))]">{r.userName}</div>
                <div className="text-xs text-[rgb(var(--muted))]">{r.rating.toFixed(1)} ★</div>
              </div>
              {r.title ? <div className="mt-1 text-sm text-[rgb(var(--fg))]">{r.title}</div> : null}
              <div className="mt-2 text-sm text-[rgb(var(--muted))]">{r.comment}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-[rgb(var(--muted))]">No reviews yet.</div>
        )}
      </div>
    </section>
  )
}

