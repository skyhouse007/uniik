import { Helmet } from 'react-helmet-async'

export function PrivacyPolicyPage() {
  return (
    <div className="container-page py-10">
      <Helmet>
        <title>Privacy Policy - CozyFoam</title>
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[rgb(var(--muted))]">
          At Cozy Foam, we value your privacy and are committed to protecting your personal information.
        </p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-[rgb(var(--fg))]">
          <section>
            <h2 className="text-lg font-bold">Information We Collect</h2>
            <p className="mt-2">We may collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[rgb(var(--fg))]">
              <li>Name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Delivery address</li>
              <li>Order details</li>
              <li>Payment information required for order processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold">How We Use Your Information</h2>
            <p className="mt-2">Your information is used to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Process and deliver orders</li>
              <li>Send order confirmation and status emails</li>
              <li>Provide customer support</li>
              <li>Improve our products and services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold">Authentication</h2>
            <p className="mt-2">
              Customer login and account authentication are securely managed through Clerk authentication services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Payment Security</h2>
            <p className="mt-2">
              Payments are processed through secure payment gateway partners. Cozy Foam does not store sensitive card
              or banking details on its servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Data Storage</h2>
            <p className="mt-2">Our platform uses:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Frontend hosting on Vercel</li>
              <li>Backend hosting on Render</li>
              <li>Database storage on MongoDB</li>
            </ul>
            <p className="mt-2">These services use secure infrastructure for data protection.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Communication</h2>
            <p className="mt-2">Customers may receive transactional emails related to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Welcome emails</li>
              <li>Order confirmations</li>
              <li>Order status updates</li>
              <li>Payment status updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold">Data Sharing</h2>
            <p className="mt-2">
              We do not sell or share customer data with third parties except for logistics and payment processing
              necessary for order fulfillment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Contact</h2>
            <p className="mt-2">
              For privacy-related concerns, contact:{' '}
              <a className="font-semibold text-[rgb(var(--brand))] underline-offset-2 hover:underline" href="mailto:support@cozyfoam.in">
                support@cozyfoam.in
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

