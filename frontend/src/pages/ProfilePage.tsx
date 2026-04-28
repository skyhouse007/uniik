import { Helmet } from 'react-helmet-async'
import { UserProfile, useUser } from '@clerk/clerk-react'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</dt>
      <dd className="text-sm text-[rgb(var(--fg))]">{value || '—'}</dd>
    </div>
  )
}

export function ProfilePage() {
  const { user } = useUser()
  const name =
    (user?.fullName ?? [user?.firstName, user?.lastName].filter(Boolean).join(' ')) || '—'
  const email = user?.primaryEmailAddress?.emailAddress ?? '—'
  const phone = user?.primaryPhoneNumber?.phoneNumber ?? '—'
  const address = (user?.publicMetadata?.address as string | undefined) ?? '—'

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Profile — CozyFoam</title>
        <meta name="description" content="Manage your CozyFoam profile and addresses." />
      </Helmet>
      <div>
        <div className="text-xl font-extrabold tracking-tight">Profile</div>
        <div className="mt-1 text-sm text-[rgb(var(--muted))]">Personal details and account settings</div>
      </div>

      <section className="mt-8 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Personal details</h2>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">Information we use for your orders and account.</p>
        <dl className="mt-5 grid gap-4">
          <DetailRow label="Name" value={name} />
          <DetailRow label="Email" value={email} />
          <DetailRow label="Phone" value={phone} />
          <DetailRow label="Address" value={address} />
        </dl>
      </section>

      <div className="mt-8">
        <div className="mb-3 text-sm font-semibold text-[rgb(var(--fg))]">Account settings</div>
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm">
          <UserProfile />
        </div>
      </div>
    </div>
  )
}

