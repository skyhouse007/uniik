import type { Review } from '../types/catalog'

export function ReviewSection({ reviews }: { reviews: Review[] }) {
  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Customer reviews</div>
        <div className="text-xs text-[rgb(var(--muted))]">{reviews.length} reviews</div>
      </div>
      <div className="mt-4 grid gap-3">
        {reviews.length ? (
          reviews.map((r) => (
            <div key={r._id} className="rounded-xl border border-[rgb(var(--border))] p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{r.userName}</div>
                <div className="text-xs text-[rgb(var(--muted))]">{r.rating.toFixed(1)} ★</div>
              </div>
              {r.title ? <div className="mt-1 text-sm">{r.title}</div> : null}
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

