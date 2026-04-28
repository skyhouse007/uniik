import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows, Float } from '@react-three/drei'
import { motion } from 'framer-motion'
import { MattressStack } from './three/MattressPrimitives'
import { Loader3D } from './three/Loader3D'
import { Link } from 'react-router-dom'

function HeroMattress() {
  const group = useRef()
  useFrame((state, dt) => {
    if (!group.current) return
    group.current.rotation.y += dt * 0.12
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.06
  })

  return (
    <group ref={group} position={[0, 0.05, 0]}>
      <Float speed={1.2} floatIntensity={0.35} rotationIntensity={0.25}>
        <MattressStack progress={1} exploded={0} />
      </Float>
    </group>
  )
}

function HeroScene() {
  const lightPos = useMemo(() => [3, 4, 2], [])
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={lightPos}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-2, 1.5, -2]} intensity={0.8} />
      <Suspense fallback={<Loader3D label="Loading mattress…" />}>
        <HeroMattress />
        <Environment preset="city" />
        <ContactShadows opacity={0.35} scale={8} blur={2.5} far={8} resolution={512} color="#3d694f" />
      </Suspense>
    </>
  )
}

export default function Hero3D() {
  return (
    <section className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[rgb(var(--surface))]">
      <div className="absolute inset-0">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute -right-40 top-10 h-[28rem] w-[28rem] rounded-full bg-lime-100/40 blur-3xl" />
      </div>

      <div className="container-page relative grid min-h-[calc(100vh-64px)] gap-10 py-14 lg:grid-cols-2 lg:items-center">
        <div className="max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl font-extrabold tracking-tight text-[rgb(var(--fg))] sm:text-5xl"
          >
            Sleep Better Every Night
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 text-sm leading-6 text-[rgb(var(--muted))] sm:text-base"
          >
            Premium orthopedic mattress engineered for perfect comfort.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <Link
              to="/products"
              className="rounded-2xl bg-[rgb(var(--brand))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Shop Now
            </Link>
            <a
              href="#technology"
              className="rounded-2xl border border-[rgb(var(--border))] bg-white px-5 py-3 text-sm font-semibold text-[rgb(var(--fg))] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Explore Technology
            </a>
          </motion.div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">Cool sleep</div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">Gel-infused foam</div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">Spine support</div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">Orthopedic core</div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">Premium</div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">Soft touch cover</div>
            </div>
          </div>
        </div>

        <div className="relative h-[520px] w-full overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-white/70 shadow-sm backdrop-blur lg:h-[640px]">
          <Canvas shadows camera={{ position: [2.6, 1.4, 3.1], fov: 35 }}>
            <HeroScene />
          </Canvas>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/70 to-transparent" />
        </div>
      </div>
    </section>
  )
}

