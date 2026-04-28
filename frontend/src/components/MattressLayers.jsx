import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Html } from '@react-three/drei'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { MattressStack } from './three/MattressPrimitives'
import { Loader3D } from './three/Loader3D'

function Labels({ exploded }) {
  const labels = [
    { name: 'Top Cover', y: 0.55 },
    { name: 'Cooling Gel Foam', y: 0.25 },
    { name: 'Memory Foam', y: -0.05 },
    { name: 'Support Foam', y: -0.35 },
    { name: 'Spring Base', y: -0.68 },
  ]
  return (
    <group>
      {labels.map((l, idx) => (
        <Html key={l.name} position={[1.55 + exploded * 0.5, l.y - exploded * (0.18 + idx * 0.22), 0]} transform>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-white/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
            {l.name}
          </div>
        </Html>
      ))}
    </group>
  )
}

function StoryMattress({ progress, exploded }) {
  const group = useRef()
  useFrame((state) => {
    if (!group.current) return
    // Step 1: rotate more as we scroll
    group.current.rotation.y = progress * Math.PI * 0.65
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.04
  })

  return (
    <group ref={group} position={[0, 0.05, 0]}>
      <MattressStack progress={progress} exploded={exploded} />
      {exploded > 0.05 ? <Labels exploded={exploded} /> : null}
    </group>
  )
}

function StoryScene({ progress, exploded }) {
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
      <pointLight position={[-2.5, 1.8, -2]} intensity={0.7} />
      <Suspense fallback={<Loader3D label="Loading layers…" />}>
        <StoryMattress progress={progress} exploded={exploded} />
        <Environment preset="city" />
        <ContactShadows opacity={0.35} scale={9} blur={2.8} far={10} resolution={512} color="#3d694f" />
      </Suspense>
    </>
  )
}

export default function MattressLayers() {
  const [ref, inView] = useInView({ threshold: 0.25, triggerOnce: false })
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })

  // Map scroll to narrative progress (5 steps)
  const raw = useTransform(scrollYProgress, [0, 1], [0, 1])
  const progress = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.6 })

  const [explodedOn, setExplodedOn] = useState(false)
  const explodedRaw = useTransform(progress, (v) => (explodedOn ? Math.min(1, Math.max(0, (v - 0.25) * 1.2)) : 0))
  const exploded = useSpring(explodedRaw, { stiffness: 140, damping: 26, mass: 0.7 })

  // Snapshot scalar for R3F props (framer springs are MotionValues)
  const [p, setP] = useState(0)
  const [e, setE] = useState(0)
  useMemo(() => {
    const unsub1 = progress.on('change', (v) => setP(v))
    const unsub2 = exploded.on('change', (v) => setE(v))
    return () => {
      unsub1()
      unsub2()
    }
  }, [progress, exploded])

  return (
    <section id="technology" ref={ref} className="bg-white">
      <div ref={containerRef} className="container-page py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <div className="text-xs font-semibold text-[rgb(var(--brand))]">Technology</div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Mattress layers, revealed on scroll</h2>
          <p className="mt-4 text-sm text-[rgb(var(--muted))]">
            Scroll to see the build come alive: the cover lifts, then gel, memory, support, and base appear in sequence.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[420px_1fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-sm"
          >
            <div className="text-sm font-semibold">Story steps</div>
            <ol className="mt-4 space-y-3 text-sm text-[rgb(var(--muted))]">
              <li>1. Mattress rotates</li>
              <li>2. Top cover lifts</li>
              <li>3. Cooling gel foam appears</li>
              <li>4. Memory foam appears</li>
              <li>5. Support + base appear</li>
            </ol>

            <button
              onClick={() => setExplodedOn((v) => !v)}
              className="mt-6 w-full rounded-2xl bg-[rgb(var(--brand))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {explodedOn ? 'Close exploded view' : 'View Inside Mattress'}
            </button>

            <div className="mt-4 text-xs text-[rgb(var(--muted))]">
              Tip: keep scrolling while exploded view is on to animate layer spacing.
            </div>
          </motion.div>

          <div className="relative h-[520px] overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-white shadow-sm">
            <Canvas shadows camera={{ position: [3.1, 1.45, 3.25], fov: 35 }}>
              <StoryScene progress={p} exploded={e} />
            </Canvas>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>

        <div className="mt-16 h-[120vh]" />
      </div>
    </section>
  )
}

