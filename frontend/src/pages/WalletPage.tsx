import { Helmet } from 'react-helmet-async'

export function WalletPage() {
  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Wallet - CozyFoam</title>
        <meta name="description" content="View wallet balance and transaction history." />
      </Helmet>

      <div className="text-xl font-extrabold tracking-tight">My wallet</div>
      <div className="mt-1 text-sm text-[rgb(var(--muted))]">Wallet balance and transactions</div>

      <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-white p-6">
        <div className="text-sm text-[rgb(var(--muted))]">Current Balance</div>
        <div className="mt-2 text-2xl font-extrabold">Rs. 0</div>
        <div className="mt-4 text-sm text-[rgb(var(--muted))]">No wallet transactions yet.</div>
      </div>
    </div>
  )
}
