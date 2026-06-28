import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import CarModel from './CarModel'

const fallbackSceneControls = {
  cameraAngle: 12,
  cameraHeight: 2.2,
  zoom: 20.5,
  fov: 50,
  carAngle: -36,
  light: 4.1,
  shadow: 0,
  background: '#ffffff',
  target: [0, 0.15, 0],
  minDistance: 0,
  maxDistance: 28,
  intro: {
    enabled: true,
    startHeight: 8,
    duration: 1200,
  },
}

function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3
}

function getIntroStartHeight(sceneControls) {
  return sceneControls.intro?.startHeight ?? fallbackSceneControls.intro.startHeight
}

function getInitialSceneControls(sceneControls) {
  if (sceneControls.intro?.enabled === false) {
    return sceneControls
  }

  return {
    ...sceneControls,
    cameraHeight: getIntroStartHeight(sceneControls),
  }
}

function SliderControl({ label, max, min, onChange, step = 1, suffix = '', value }) {
  return (
    <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#3e3c34]">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="font-black text-[#111]">
          {value}
          {suffix}
        </span>
      </span>
      <input
        className="accent-[#ff3b24]"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  )
}

function getSceneControls(carConfig) {
  return {
    ...fallbackSceneControls,
    ...(carConfig.scene ?? {}),
  }
}

function CarScene({ addOnValues, carColor, carConfig, rimColor, rimType = 'standard', onReady }) {
  const controlsRef = useRef(null)
  const introFrameRef = useRef(null)
  const [showTuner, setShowTuner] = useState(true)
  const defaultSceneControls = useMemo(() => getSceneControls(carConfig), [carConfig])
  const [sceneControls, setSceneControls] = useState(() => getInitialSceneControls(defaultSceneControls))
  const carRotation = useMemo(() => [0, (sceneControls.carAngle * Math.PI) / 180, 0], [sceneControls.carAngle])
  const cameraPosition = useMemo(() => {
    const radians = (sceneControls.cameraAngle * Math.PI) / 180

    return [Math.sin(radians) * sceneControls.zoom, sceneControls.cameraHeight, Math.cos(radians) * sceneControls.zoom]
  }, [sceneControls.cameraAngle, sceneControls.cameraHeight, sceneControls.zoom])

  const updateSceneControl = (key) => (value) => {
    setSceneControls((currentControls) => ({
      ...currentControls,
      [key]: value,
    }))
  }

  const resetSceneControls = () => {
    setSceneControls(defaultSceneControls)
  }

  useEffect(() => {
    if (defaultSceneControls.intro?.enabled === false) {
      return undefined
    }

    const startHeight = getIntroStartHeight(defaultSceneControls)
    const endHeight = defaultSceneControls.cameraHeight
    const duration = defaultSceneControls.intro?.duration ?? fallbackSceneControls.intro.duration
    const startTime = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const cameraHeight = startHeight + (endHeight - startHeight) * easeOutCubic(progress)

      setSceneControls((currentControls) => ({
        ...currentControls,
        cameraHeight,
      }))

      if (progress < 1) {
        introFrameRef.current = requestAnimationFrame(tick)
      }
    }

    introFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (introFrameRef.current) {
        cancelAnimationFrame(introFrameRef.current)
      }
    }
  }, [defaultSceneControls])

  return (
    <>
      <Canvas
        className="relative z-20 h-full w-full"
        dpr={[1, 2]}
        gl={{ antialias: true }}
        shadows="percentage"
      >
        <PerspectiveCamera makeDefault fov={sceneControls.fov} position={cameraPosition} />
        <color args={[sceneControls.background]} attach="background" />
        <ambientLight intensity={0.5} />
        <directionalLight castShadow intensity={sceneControls.light} position={[4, 6, 4]} shadow-mapSize={[2048, 2048]} />
        <spotLight angle={0.45} intensity={1.8} penumbra={0.7} position={[-4, 5, 5]} />

        <Suspense fallback={null}>
          <CarModel
            addOnValues={addOnValues}
            carColor={carColor}
            carConfig={carConfig}
            key={carConfig.modelId}
            onLoaded={onReady}
            rimColor={rimColor}
            rimType={rimType}
            rotation={carRotation}
          />
          <Environment preset="city" />
          <ContactShadows blur={2.6} far={6} opacity={sceneControls.shadow} position={[0, -0.76, 0]} scale={8} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          enablePan={false}
          minDistance={sceneControls.minDistance}
          maxDistance={sceneControls.maxDistance}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 4}
          target={sceneControls.target}
        />
      </Canvas>

      <div
        className="absolute top-4 right-4 z-40 w-[230px] border-[3px] border-[#111] bg-[#fff5dc] p-3 text-[#111] shadow-[6px_6px_0_#111] max-[820px]:top-3 max-[820px]:right-3 max-[820px]:w-[210px]"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-[#111] pb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#e22e1d]">Scene tune</p>
          <button
            className="cursor-pointer border-2 border-[#111] bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#111]"
            onClick={() => setShowTuner((currentValue) => !currentValue)}
            type="button"
          >
            {showTuner ? 'Hide' : 'Show'}
          </button>
        </div>

        {showTuner && (
          <div className="grid gap-3">
            <SliderControl label="Cam angle" max={180} min={-180} onChange={updateSceneControl('cameraAngle')} suffix="°" value={sceneControls.cameraAngle} />
            <SliderControl label="Zoom" max={sceneControls.maxDistance} min={3.2} onChange={updateSceneControl('zoom')} step={0.1} value={sceneControls.zoom} />
            <SliderControl label="Height" max={8} min={0.5} onChange={updateSceneControl('cameraHeight')} step={0.1} value={sceneControls.cameraHeight} />
            <SliderControl label="FOV" max={85} min={20} onChange={updateSceneControl('fov')} suffix="°" value={sceneControls.fov} />
            <SliderControl label="Car angle" max={180} min={-180} onChange={updateSceneControl('carAngle')} suffix="°" value={sceneControls.carAngle} />
            <SliderControl label="Light" max={5} min={0} onChange={updateSceneControl('light')} step={0.1} value={sceneControls.light} />
            <SliderControl label="Shadow" max={1} min={0} onChange={updateSceneControl('shadow')} step={0.05} value={sceneControls.shadow} />
            <button
              className="mt-1 cursor-pointer border-[3px] border-[#111] bg-[#ff3b24] px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0_#111]"
              onClick={resetSceneControls}
              type="button"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default CarScene
