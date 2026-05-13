import { Helmet } from 'react-helmet-async'

export function WalletPage() {
  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Wallet — Uniik</title>
        <meta name="description" content="View wallet balance and transaction history." />
      </Helmet>

      <div className="font-header text-xl font-extrabold tracking-tight text-[rgb(var(--fg))]">My wallet</div>
      <div className="mt-1 text-sm text-[rgb(var(--muted))]">Wallet balance and transactions</div>

      <div className="mt-6 rounded-2xl border border-white/12 bg-black/45 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
        <div className="text-sm text-[rgb(var(--muted))]">Current balance</div>
        <div className="mt-2 font-header text-2xl font-extrabold text-[rgb(var(--fg))]">₹0</div>
        <div className="mt-4 text-sm text-[rgb(var(--muted))]">No wallet transactions yet.</div>
      </div>
    </div>
  )
}
