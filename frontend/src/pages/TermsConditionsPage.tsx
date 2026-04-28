import { Helmet } from 'react-helmet-async'

export function TermsConditionsPage() {
  return (
    <div className="container-page py-10">
      <Helmet>
        <title>Terms &amp; Conditions - CozyFoam</title>
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Terms &amp; Conditions</h1>
        <p className="mt-3 text-sm text-[rgb(var(--muted))]">
          By using Cozy Foam website, you agree to the following terms.
        </p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-[rgb(var(--fg))]">
          <section>
            <h2 className="text-lg font-bold">Products</h2>
            <p className="mt-2">Cozy Foam manufactures latex foam mattresses and related sleep products.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Pricing</h2>
            <p className="mt-2">All prices displayed are subject to change without prior notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Orders</h2>
            <p className="mt-2">Orders are confirmed only after successful payment or confirmation from our team.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Delivery Area</h2>
            <p className="mt-2">Currently delivery is available within 30 km radius from Shivaji Nagar, Bangalore.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Delivery Availability</h2>
            <p className="mt-2">Delivery depends on serviceable pincodes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Delivery Charges</h2>
            <p className="mt-2">Some pincodes qualify for free delivery.</p>
            <p className="mt-2">
              Some pincodes may have additional delivery charges depending on location.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Product Information</h2>
            <p className="mt-2">Product dimensions, warranty, and specifications are shown on the product page.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Liability</h2>
            <p className="mt-2">
              Minor variation in product feel or finish may occur as mattresses are manufactured products.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Rights</h2>
            <p className="mt-2">
              Cozy Foam reserves the right to accept, reject, or cancel any order when necessary.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

