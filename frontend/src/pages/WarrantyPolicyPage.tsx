import { Helmet } from 'react-helmet-async'

export function WarrantyPolicyPage() {
  return (
    <div className="container-page py-10">
      <Helmet>
        <title>Warranty Policy - CozyFoam</title>
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Warranty Policy</h1>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-[rgb(var(--fg))]">
          <section>
            <p>
              Warranty is available according to the specific warranty period mentioned on each product page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Warranty Coverage</h2>
            <p className="mt-2">Warranty covers manufacturing defects only.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Warranty Exclusions</h2>
            <p className="mt-2">Warranty does not cover:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Physical damage</li>
              <li>Improper usage</li>
              <li>Normal wear and tear</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold">Warranty Claim</h2>
            <p className="mt-2">Customers must provide:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Order details</li>
              <li>Product photos</li>
              <li>Description of issue</li>
            </ul>
            <p className="mt-2">Warranty review is subject to inspection.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

