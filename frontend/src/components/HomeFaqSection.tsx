import { Link } from 'react-router-dom'

const FAQ_ITEMS = [
  {
    q: 'Is Uniik outdoor furniture really weather-resistant?',
    a: 'We specify finishes, coatings, and materials chosen for Indian sun, humidity, and monsoon cycles—without turning pieces industrial-looking. Care guidelines ship with every order so you get years of calm ownership.',
  },
  {
    q: 'Where do you deliver?',
    a: 'We fulfil orders across India wherever our courier partners service pin codes. At checkout you will see availability for your location and timelines before you pay.',
  },
  {
    q: 'Do I need professional assembly?',
    a: 'Many designs arrive ready to place or need light bolt-on assembly with basic tools. Heavier hospitality installs may benefit from local help—we outline what to expect on each product page.',
  },
  {
    q: 'Can cafés, villas, or hotels order custom layouts?',
    a: 'Yes. Hospitality runs harder than home patios—share terrace drawings or seating counts and we will advise on profiles, quantities, and lead times. Start from Bulk order or your Uniik contact.',
  },
  {
    q: 'How do I clean cushions or metal frames?',
    a: 'Frames generally wipe clean with mild soap and water; cushions vary by textile—avoid harsh bleach unless noted in your care card. We bundle straightforward instructions so daily upkeep stays quick.',
  },
  {
    q: 'What if something arrives damaged?',
    a: 'Inspect on delivery and notify us right away with photos. We will route replacements or corrections according to our shipping and returns policies—linked in the footer for full wording.',
  },
]

export function HomeFaqSection() {
  return (
    <section className="border-t border-neutral-800 bg-black" aria-labelledby="home-faq-heading">
      <div className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Questions</p>
          <h2 id="home-faq-heading" className="mt-2 font-header text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-base text-neutral-400">
            Straight answers about durability, delivery, hospitality projects, and everyday care.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-neutral-700 bg-neutral-950 shadow-sm open:border-neutral-600 open:bg-neutral-950"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-neutral-50 [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <svg
                  viewBox="0 0 24 24"
                  width={20}
                  height={20}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className="border-t border-neutral-800 px-5 pb-4 pt-3 text-sm leading-relaxed text-neutral-400">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-neutral-400">
          Still unsure?{' '}
          <Link to="/bulk-order" className="font-semibold text-neutral-100 underline-offset-4 hover:underline">
            Reach out on bulk order
          </Link>{' '}
          or see{' '}
          <Link to="/shipping-policy" className="font-semibold text-neutral-100 underline-offset-4 hover:underline">
            shipping
          </Link>{' '}
          &amp;{' '}
          <Link to="/return-refund-policy" className="font-semibold text-neutral-100 underline-offset-4 hover:underline">
            returns
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
