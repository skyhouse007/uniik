import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { Loader3D } from './three/Loader3D'
import { MattressStack } from './three/MattressPrimitives'

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <group position={[0, 0.05, 0]}>
          <MattressStack progress={1} exploded={0} />
        </group>
      )
    }
    return this.props.children
  }
}

function GLB({ url }) {
  const gltf = useGLTF(url)
  return <primitive object={gltf.scene} />
}

function ViewerScene({ modelUrl }) {
  const lightPos = useMemo(() => [4, 5, 2], [])
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={lightPos}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-2.5, 1.5, -2]} intensity={0.6} />

      <Suspense fallback={<Loader3D label="Loading 3D model…" />}>
        <ModelErrorBoundary>
          <group position={[0, 0.05, 0]}>
            {modelUrl ? <GLB url={modelUrl} /> : <MattressStack progress={1} exploded={0} />}
          </group>
        </ModelErrorBoundary>
        <Environment preset="city" />
        <ContactShadows opacity={0.35} scale={9} blur={2.8} far={10} resolution={512} color="#3d694f" />
      </Suspense>

      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={6} />
    </>
  )
}

export default function Product3DViewer({ modelUrl }) {
  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-white shadow-sm">
      <Canvas shadows camera={{ position: [3.0, 1.35, 3.3], fov: 35 }}>
        <ViewerScene modelUrl={modelUrl} />
      </Canvas>
    </div>
  )
}

