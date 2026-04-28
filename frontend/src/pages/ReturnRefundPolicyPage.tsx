import { Helmet } from 'react-helmet-async'

export function ReturnRefundPolicyPage() {
  return (
    <div className="container-page py-10">
      <Helmet>
        <title>Return &amp; Refund Policy - CozyFoam</title>
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Return &amp; Refund Policy</h1>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-[rgb(var(--fg))]">
          <section>
            <p>
              Returns are accepted only under the following conditions:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Product received is damaged</li>
              <li>Product size delivered is different from ordered size</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold">Return Request</h2>
            <p className="mt-2">Customers must report return issues within 24 hours of delivery.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Verification</h2>
            <p className="mt-2">Returned products are subject to verification by our team.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Refund Process</h2>
            <p className="mt-2">
              Approved refunds are processed to the original payment method within standard banking timelines.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Non-Returnable Cases</h2>
            <p className="mt-2">Returns are not accepted for:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Change of preference</li>
              <li>Comfort preference after usage</li>
              <li>Used or altered products</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

