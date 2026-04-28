import { Html } from '@react-three/drei'

export function Loader3D({ label = 'Loading 3D…' }) {
  return (
    <Html center>
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-white/90 px-4 py-3 text-sm shadow-sm backdrop-blur">
        {label}
      </div>
    </Html>
  )
}

