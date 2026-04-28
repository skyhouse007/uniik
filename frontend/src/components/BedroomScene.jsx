import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Loader3D } from './three/Loader3D'
import { MattressStack } from './three/MattressPrimitives'

function BedFrame() {
  return (
    <group>
      <mesh position={[0, -0.65, 0]} receiveShadow>
        <boxGeometry args={[3.0, 0.25, 2.2]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.82, 0]} receiveShadow>
        <boxGeometry args={[3.1, 0.08, 2.3]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.45, -1.05]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.6, 0.12]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.55} metalness={0.05} />
      </mesh>
    </group>
  )
}

function CameraRig({ t }) {
  const { camera } = useThree()
  useFrame(() => {
    const x = 2.8 - t * 0.5
    const y = 1.35 + t * 0.15
    const z = 3.4 - t * 0.8
    camera.position.lerp({ x, y, z }, 0.06)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function BedroomScene3D({ t }) {
  const lightPos = useMemo(() => [4, 5, 2], [])
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={lightPos}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-2.5, 1.5, -2]} intensity={0.5} />
      <Suspense fallback={<Loader3D label="Loading room…" />}>
        <group position={[0, 0.05, 0]}>
          <BedFrame />
          <group position={[0, -0.28, 0]}>
            <MattressStack progress={1} exploded={0} />
          </group>
        </group>
        <Environment preset="apartment" />
        <ContactShadows opacity={0.35} scale={10} blur={3} far={12} resolution={512} color="#3d694f" />
      </Suspense>
      <CameraRig t={t} />
      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={7} />
    </>
  )
}

export default function BedroomScene() {
  const [ref, inView] = useInView({ threshold: 0.2 })
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })
  const raw = useTransform(scrollYProgress, [0, 1], [0, 1])
  const spring = useSpring(raw, { stiffness: 120, damping: 28, mass: 0.7 })
  const [t, setT] = useState(0)

  useMemo(() => spring.on('change', (v) => setT(v)), [spring])

  return (
    <section ref={ref} className="bg-[rgb(var(--surface))]">
      <div ref={containerRef} className="container-page py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <div className="text-xs font-semibold text-[rgb(var(--brand))]">Room Preview</div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">See it in a bedroom scene</h2>
          <p className="mt-4 text-sm text-[rgb(var(--muted))]">
            Scroll to gently move the camera. Drag to rotate the view. Built with lightweight geometry for performance.
          </p>
        </motion.div>

        <div className="mt-10 h-[560px] overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-white shadow-sm">
          <Canvas shadows camera={{ position: [2.8, 1.35, 3.4], fov: 38 }}>
            <BedroomScene3D t={t} />
          </Canvas>
        </div>

        <div className="mt-16 h-[90vh]" />
      </div>
    </section>
  )
}

