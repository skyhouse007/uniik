import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useMemo, useState } from 'react'

const COLORS = {
  cover: '#f8fafc',
  gel: '#93c5fd',
  memory: '#f5e6b8', // perforated latex foam look
  support: '#bfdbfe',
  base: '#60a5fa',
}

function makePerforationBumpTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = 'rgb(128,128,128)'
  ctx.fillRect(0, 0, size, size)

  const spacing = 44
  const dotRadius = 10
  const softness = 6

  for (let y = spacing / 2; y < size; y += spacing) {
    for (let x = spacing / 2; x < size; x += spacing) {
      const g = ctx.createRadialGradient(x, y, Math.max(1, dotRadius - softness), x, y, dotRadius)
      g.addColorStop(0, 'rgb(30,30,30)')
      g.addColorStop(1, 'rgb(128,128,128)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2.2, 1.8)
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

function useOptionalTexture(url, { repeat = [1, 1] } = {}) {
  const [tex, setTex] = useState(null)
  useEffect(() => {
    if (!url) {
      setTex(null)
      return
    }
    let alive = true
    const loader = new THREE.TextureLoader()
    loader.load(
      url,
      (t) => {
        if (!alive) return
        t.wrapS = THREE.RepeatWrapping
        t.wrapT = THREE.RepeatWrapping
        t.repeat.set(repeat[0], repeat[1])
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 4
        setTex(t)
      },
      undefined,
      () => alive && setTex(null),
    )
    return () => {
      alive = false
    }
  }, [repeat, url])
  return tex
}

function Layer({
  color,
  y,
  height,
  width = 2.4,
  depth = 1.8,
  radius = 0.08,
  material,
  ...props
}) {
  return (
    <RoundedBox
      args={[width, height, depth]}
      radius={radius}
      smoothness={6}
      position={[0, y, 0]}
      castShadow
      receiveShadow
      {...props}
    >
      <meshStandardMaterial
        color={color}
        roughness={material?.roughness ?? 0.35}
        metalness={material?.metalness ?? 0.05}
        envMapIntensity={material?.envMapIntensity ?? 0.6}
        map={material?.map ?? null}
        bumpMap={material?.bumpMap ?? null}
        bumpScale={material?.bumpScale ?? 0}
        normalMap={material?.normalMap ?? null}
        normalScale={material?.normalScale ?? new THREE.Vector2(1, 1)}
        transparent={!!material?.transparent}
        opacity={material?.opacity ?? 1}
      />
    </RoundedBox>
  )
}

export function MattressStack({
  progress = 0,
  exploded = 0,
  showLabels = false,
  onLayerRef,
  textureUrls,
}) {
  // progress: 0..1 reveals layers
  // exploded: 0..1 separates layers
  const reveal = (threshold) => Math.max(0, Math.min(1, (progress - threshold) / 0.15))
  const lift = (idx) => exploded * (0.18 + idx * 0.22)

  const coverH = 0.08
  const gelH = 0.16
  const memoryH = 0.22
  const supportH = 0.24
  const baseH = 0.28

  const total = coverH + gelH + memoryH + supportH + baseH
  const baseY = -total / 2

  const yCover = baseY + baseH + supportH + memoryH + gelH + coverH / 2
  const yGel = baseY + baseH + supportH + memoryH + gelH / 2
  const yMemory = baseY + baseH + supportH + memoryH / 2
  const ySupport = baseY + baseH + supportH / 2
  const yBase = baseY + baseH / 2

  const visibleCover = reveal(0.05)
  const visibleGel = reveal(0.20)
  const visibleMemory = reveal(0.35)
  const visibleSupport = reveal(0.50)
  const visibleBase = reveal(0.65)

  const sx = (v) => 0.001 + v * 0.999

  // Optional textures (serve from /public/textures/*). If you don't provide latexBump, we generate it.
  const coverMap = useOptionalTexture(textureUrls?.coverMap, { repeat: [1, 1] })
  const latexBumpOverride = useOptionalTexture(textureUrls?.latexBump, { repeat: [2, 2] })
  const latexBump = useMemo(() => {
    if (latexBumpOverride) return latexBumpOverride
    if (typeof document === 'undefined') return null
    return makePerforationBumpTexture()
  }, [latexBumpOverride])

  const materials = useMemo(() => {
    return {
      cover: {
        map: coverMap,
        roughness: 0.75,
        metalness: 0.02,
        envMapIntensity: 0.4,
        bumpScale: 0.02,
      },
      gel: {
        roughness: 0.25,
        metalness: 0.04,
        envMapIntensity: 0.9,
        transparent: true,
        opacity: 0.92,
      },
      memory: {
        roughness: 0.55,
        metalness: 0.02,
        envMapIntensity: 0.55,
      },
      support: {
        roughness: 0.6,
        metalness: 0.02,
        envMapIntensity: 0.5,
      },
      base: {
        roughness: 0.45,
        metalness: 0.02,
        envMapIntensity: 0.6,
      },
      latex: {
        // Use the perforated reference as a bump pattern for a “punch hole” feel
        bumpMap: latexBump,
        bumpScale: latexBump ? 0.06 : 0,
        roughness: 0.78,
        metalness: 0.02,
        envMapIntensity: 0.25,
      },
    }
  }, [coverMap, latexBump])

  return (
    <group>
      <group scale={[sx(visibleBase), sx(visibleBase), sx(visibleBase)]}>
        <Layer
          color={COLORS.base}
          material={materials.base}
          y={yBase - lift(4)}
          height={baseH}
          width={2.45}
          depth={1.85}
          radius={0.1}
          ref={(r) => onLayerRef?.('Spring Base', r)}
        />
      </group>

      <group scale={[sx(visibleSupport), sx(visibleSupport), sx(visibleSupport)]}>
        <Layer
          color={COLORS.support}
          material={materials.support}
          y={ySupport - lift(3)}
          height={supportH}
          width={2.42}
          depth={1.82}
          ref={(r) => onLayerRef?.('Support Foam', r)}
        />
      </group>

      <group scale={[sx(visibleMemory), sx(visibleMemory), sx(visibleMemory)]}>
        <Layer
          color={COLORS.memory}
          material={materials.latex}
          y={yMemory - lift(2)}
          height={memoryH}
          width={2.4}
          depth={1.8}
          ref={(r) => onLayerRef?.('Memory Foam', r)}
        />
      </group>

      <group scale={[sx(visibleGel), sx(visibleGel), sx(visibleGel)]}>
        <Layer
          color={COLORS.gel}
          material={materials.gel}
          y={yGel - lift(1)}
          height={gelH}
          width={2.38}
          depth={1.78}
          ref={(r) => onLayerRef?.('Cooling Gel Foam', r)}
        />
      </group>

      <group scale={[sx(visibleCover), sx(visibleCover), sx(visibleCover)]}>
        <Layer
          color={COLORS.cover}
          material={materials.cover}
          y={yCover - lift(0)}
          height={coverH}
          width={2.38}
          depth={1.78}
          radius={0.12}
          ref={(r) => onLayerRef?.('Top Cover', r)}
        />
      </group>
    </group>
  )
}

