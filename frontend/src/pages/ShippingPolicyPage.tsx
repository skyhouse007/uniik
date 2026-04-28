import { Helmet } from 'react-helmet-async'

export function ShippingPolicyPage() {
  return (
    <div className="container-page py-10">
      <Helmet>
        <title>Shipping Policy - CozyFoam</title>
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Shipping Policy</h1>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-[rgb(var(--fg))]">
          <section>
            <h2 className="text-lg font-bold">Delivery Coverage</h2>
            <p className="mt-2">We currently deliver within 30 km radius from Shivaji Nagar, Bangalore.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Delivery Charges</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Selected pincodes receive free delivery.</li>
              <li>Certain pincodes may include delivery charges.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold">Delivery Time</h2>
            <p className="mt-2">
              Delivery timelines are shared during order confirmation and may vary depending on stock and delivery
              schedule.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Delivery Confirmation</h2>
            <p className="mt-2">Customers receive order and delivery status updates through email.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Delivery Delays</h2>
            <p className="mt-2">Unexpected traffic, weather, or operational issues may affect delivery timing.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

