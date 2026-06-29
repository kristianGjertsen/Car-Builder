import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { createPortal } from 'react-dom'
import CarModel from './CarModel'

const fallbackSceneControls = {
  cameraAngle: 12,
  cameraHeight: 2.2,
  zoom: 20.5,
  fov: 50,
  carAngle: -36,
  maxRotationX: 90,
  maxRotationY: 180,
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
    useLast: false,
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
  const displayValue = Number.isFinite(value) ? roundSceneValue(value) : 0

  return (
    <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#3e3c34]">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="flex items-center gap-1">
          <input
            className="h-7 w-20 rounded-[3px] border border-[#c9d0d8] bg-white px-2 text-right text-[12px] font-black text-[#111] outline-none focus:border-[#1c69d4]"
            max={max}
            min={min}
            onChange={(event) => {
              if (event.target.value === '') {
                return
              }

              onChange(Number(event.target.value))
            }}
            step={step}
            type="number"
            value={displayValue}
          />
          {suffix && <span className="font-black text-[#111]">{suffix}</span>}
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

function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getZoomBounds(sceneControls) {
  const min = Math.max(sceneControls.minDistance ?? 0, 0.1)
  const max = Math.max(sceneControls.maxDistance ?? min + 1, min + 0.1)

  return { min, max }
}

function zoomToSliderValue(zoom, min, max) {
  const clampedZoom = clampValue(zoom, min, max)
  const minLog = Math.log(min)
  const maxLog = Math.log(max)

  return ((Math.log(clampedZoom) - minLog) / (maxLog - minLog)) * 100
}

function sliderValueToZoom(sliderValue, min, max) {
  const minLog = Math.log(min)
  const maxLog = Math.log(max)
  const progress = clampValue(sliderValue, 0, 100) / 100

  return Math.exp(minLog + (maxLog - minLog) * progress)
}

function ZoomSliderControl({ onChange, sceneControls }) {
  const { max, min } = getZoomBounds(sceneControls)
  const sliderValue = zoomToSliderValue(sceneControls.zoom, min, max)
  const displayValue = Number.isFinite(sceneControls.zoom) ? roundSceneValue(sceneControls.zoom) : min

  return (
    <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#3e3c34]">
      <span className="flex items-center justify-between gap-3">
        <span>Zoom</span>
        <input
          className="h-7 w-20 rounded-[3px] border border-[#c9d0d8] bg-white px-2 text-right text-[12px] font-black text-[#111] outline-none focus:border-[#1c69d4]"
          min={0}
          onChange={(event) => {
            if (event.target.value === '') {
              return
            }

            onChange(Number(event.target.value))
          }}
          step={0.01}
          type="number"
          value={displayValue}
        />
      </span>
      <input
        className="accent-[#ff3b24]"
        max={100}
        min={0}
        onChange={(event) => onChange(roundSceneValue(sliderValueToZoom(Number(event.target.value), min, max)))}
        step={0.1}
        type="range"
        value={sliderValue}
      />
    </label>
  )
}

function getSceneControls(sceneConfig) {
  return {
    ...fallbackSceneControls,
    ...(sceneConfig ?? {}),
    intro: {
      ...fallbackSceneControls.intro,
      ...(sceneConfig?.intro ?? {}),
    },
  }
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180
}

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI
}

function roundSceneValue(value, decimals = 2) {
  const multiplier = 10 ** decimals

  return Math.round(value * multiplier) / multiplier
}

function interpolateValue(startValue, endValue, progress) {
  return startValue + (endValue - startValue) * progress
}

function getShortestAngleDelta(startValue, endValue) {
  return ((((endValue - startValue) % 360) + 540) % 360) - 180
}

function interpolateDegrees(startValue, endValue, progress) {
  return startValue + getShortestAngleDelta(startValue, endValue) * progress
}

function interpolateVector(startTarget, endTarget, progress) {
  return endTarget.map((value, index) => interpolateValue(startTarget[index] ?? value, value, progress))
}

function getCameraPositionFromControls(sceneControls) {
  const radians = degreesToRadians(sceneControls.cameraAngle)
  const [targetX, , targetZ] = sceneControls.target

  return [
    targetX + Math.sin(radians) * sceneControls.zoom,
    sceneControls.cameraHeight,
    targetZ + Math.cos(radians) * sceneControls.zoom,
  ]
}

function getCameraControlsFromPosition(cameraPosition, target) {
  const deltaX = cameraPosition[0] - target[0]
  const deltaZ = cameraPosition[2] - target[2]

  return {
    cameraAngle: normalizeDegrees(radiansToDegrees(Math.atan2(deltaX, deltaZ))),
    cameraHeight: cameraPosition[1],
    zoom: Math.hypot(deltaX, deltaZ),
  }
}

function formatSceneConfigForClipboard(sceneControls) {
  return `{
  cameraAngle: ${sceneControls.cameraAngle},
  cameraHeight: ${sceneControls.cameraHeight},
  zoom: ${sceneControls.zoom},
  fov: ${sceneControls.fov},
  carAngle: ${sceneControls.carAngle},
  maxRotationX: ${sceneControls.maxRotationX},
  maxRotationY: ${sceneControls.maxRotationY},
  light: ${sceneControls.light},
  shadow: ${sceneControls.shadow},
  background: "${sceneControls.background}",
  target: [${sceneControls.target.join(', ')}],
  minDistance: ${sceneControls.minDistance},
  maxDistance: ${sceneControls.maxDistance},
  intro: {
    enabled: ${sceneControls.intro.enabled},
    startHeight: ${sceneControls.intro.startHeight},
    duration: ${sceneControls.intro.duration},
    useLast: ${Boolean(sceneControls.intro.useLast)},
  },
}`
}

function normalizeDegrees(degrees) {
  if (degrees > 180) {
    return degrees - 360
  }

  if (degrees < -180) {
    return degrees + 360
  }

  return degrees
}

function SceneControlSync({ controlsRef, onSync }) {
  const { camera } = useThree()

  useEffect(() => {
    const controls = controlsRef.current

    if (!controls) {
      return undefined
    }

    const handleChange = () => {
      const target = controls.target
      const deltaX = camera.position.x - target.x
      const deltaZ = camera.position.z - target.z

      onSync({
        cameraAngle: roundSceneValue(normalizeDegrees(radiansToDegrees(Math.atan2(deltaX, deltaZ))), 1),
        cameraHeight: roundSceneValue(camera.position.y),
        target: [
          roundSceneValue(target.x),
          roundSceneValue(target.y),
          roundSceneValue(target.z),
        ],
        zoom: roundSceneValue(Math.hypot(deltaX, deltaZ)),
      })
    }

    controls.addEventListener('change', handleChange)

    return () => {
      controls.removeEventListener('change', handleChange)
    }
  }, [camera, controlsRef, onSync])

  return null
}

function CarScene({ addOnValues, caliperColor, caliperMaterial, carColor, carConfig, paintMaterial, rimColor, rimMaterial, rimType = 'standard', sceneConfig, sceneTunerTarget, usePanelSceneTuner = false, onReady }) {
  const controlsRef = useRef(null)
  const introFrameRef = useRef(null)
  const isSceneTransitioningRef = useRef(false)
  const latestStableSceneControlsRef = useRef(null)
  const [showTuner, setShowTuner] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const defaultSceneControls = useMemo(() => getSceneControls(sceneConfig ?? carConfig.scene), [carConfig.scene, sceneConfig])
  const [sceneControls, setSceneControls] = useState(() => getInitialSceneControls(defaultSceneControls))
  const carRotation = useMemo(() => [0, (sceneControls.carAngle * Math.PI) / 180, 0], [sceneControls.carAngle])
  const cameraPosition = useMemo(() => getCameraPositionFromControls(sceneControls), [sceneControls])
  const orbitLimits = useMemo(() => {
    const baseCameraPosition = getCameraPositionFromControls(defaultSceneControls)
    const [targetX, targetY, targetZ] = defaultSceneControls.target
    const horizontalDistance = Math.hypot(baseCameraPosition[0] - targetX, baseCameraPosition[2] - targetZ)
    const basePolarAngle = Math.atan2(horizontalDistance, baseCameraPosition[1] - targetY)
    const baseAzimuthAngle = degreesToRadians(defaultSceneControls.cameraAngle)
    const maxRotationX = degreesToRadians(sceneControls.maxRotationX)
    const maxRotationY = degreesToRadians(sceneControls.maxRotationY)

    return {
      maxAzimuthAngle: maxRotationY >= Math.PI ? Infinity : baseAzimuthAngle + maxRotationY,
      maxPolarAngle: Math.min(basePolarAngle + maxRotationX, Math.PI / 2.05),
      minAzimuthAngle: maxRotationY >= Math.PI ? -Infinity : baseAzimuthAngle - maxRotationY,
      minPolarAngle: Math.max(basePolarAngle - maxRotationX, 0.01),
    }
  }, [defaultSceneControls, sceneControls.maxRotationX, sceneControls.maxRotationY])

  const updateSceneControl = (key) => (value) => {
    setSceneControls((currentControls) => ({
      ...currentControls,
      [key]: value,
    }))
  }

  const updateTargetControl = (index) => (value) => {
    setSceneControls((currentControls) => ({
      ...currentControls,
      target: currentControls.target.map((currentValue, currentIndex) => (
        currentIndex === index ? value : currentValue
      )),
    }))
  }

  const syncSceneControlsFromOrbit = useCallback((nextControls) => {
    if (isSceneTransitioningRef.current) {
      return
    }

    setSceneControls((currentControls) => {
      const hasSameTarget = currentControls.target.every((value, index) => value === nextControls.target[index])

      if (
        currentControls.cameraAngle === nextControls.cameraAngle &&
        currentControls.cameraHeight === nextControls.cameraHeight &&
        currentControls.zoom === nextControls.zoom &&
        hasSameTarget
      ) {
        return currentControls
      }

      return {
        ...currentControls,
        ...nextControls,
      }
    })
  }, [])

  const handleModelLoaded = useCallback(() => {
    setModelReady(true)
    onReady?.()
  }, [onReady])

  const resetSceneControls = () => {
    latestStableSceneControlsRef.current = defaultSceneControls
    setSceneControls(defaultSceneControls)
  }

  const resetViewControlsToZero = () => {
    setSceneControls((currentControls) => ({
      ...currentControls,
      cameraAngle: 0,
      cameraHeight: 0,
      carAngle: 0,
      target: [0, 0, 0],
    }))
  }

  const copySceneControls = async () => {
    const sceneConfigForCopy = formatSceneConfigForClipboard(sceneControls)

    try {
      await navigator.clipboard.writeText(sceneConfigForCopy)
      console.log('Scene config copied to clipboard.')
    } catch {
      console.log(sceneConfigForCopy)
    }
  }

  const sceneTuner = (
    <div
      className={sceneTunerTarget ? 'rounded-[3px] border border-[#dfe3e8] bg-[#f8f9fa] p-4' : 'absolute top-4 right-4 z-40 w-[230px] border-[3px] border-[#111] bg-[#fff5dc] p-3 text-[#111] shadow-[6px_6px_0_#111] max-[820px]:top-3 max-[820px]:right-3 max-[820px]:w-[210px]'}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className={sceneTunerTarget ? 'mb-3 flex items-center justify-between gap-3 border-b border-[#dfe3e8] pb-3' : 'mb-3 flex items-center justify-between gap-3 border-b-2 border-[#111] pb-2'}>
        <p className={sceneTunerTarget ? 'text-[12px] font-semibold text-[#60656c]' : 'text-[10px] font-black uppercase tracking-[0.14em] text-[#e22e1d]'}>Scene tune</p>
        <button
          className={sceneTunerTarget ? 'cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-3 py-1.5 text-[12px] font-semibold' : 'cursor-pointer border-2 border-[#111] bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#111]'}
          onClick={() => setShowTuner((currentValue) => !currentValue)}
          type="button"
        >
          {showTuner ? 'Hide' : 'Show'}
        </button>
      </div>

      {showTuner && (
        <div className="grid gap-3">
          <SliderControl label="Cam angle" max={180} min={-180} onChange={updateSceneControl('cameraAngle')} suffix="°" value={sceneControls.cameraAngle} />
          <ZoomSliderControl onChange={updateSceneControl('zoom')} sceneControls={sceneControls} />
          <SliderControl label="Height" max={12} min={-6} onChange={updateSceneControl('cameraHeight')} step={0.1} value={sceneControls.cameraHeight} />
          <SliderControl label="FOV" max={85} min={20} onChange={updateSceneControl('fov')} suffix="°" value={sceneControls.fov} />
          <SliderControl label="Car angle" max={180} min={-180} onChange={updateSceneControl('carAngle')} suffix="°" value={sceneControls.carAngle} />
          <SliderControl label="Max rot X" max={90} min={0} onChange={updateSceneControl('maxRotationX')} suffix="°" value={sceneControls.maxRotationX} />
          <SliderControl label="Max rot Y" max={180} min={0} onChange={updateSceneControl('maxRotationY')} suffix="°" value={sceneControls.maxRotationY} />
          <SliderControl label="Target X" max={15} min={-15} onChange={updateTargetControl(0)} step={0.05} value={sceneControls.target[0]} />
          <SliderControl label="Target Y" max={6} min={-6} onChange={updateTargetControl(1)} step={0.05} value={sceneControls.target[1]} />
          <SliderControl label="Target Z" max={15} min={-15} onChange={updateTargetControl(2)} step={0.05} value={sceneControls.target[2]} />
          <SliderControl label="Light" max={5} min={0} onChange={updateSceneControl('light')} step={0.1} value={sceneControls.light} />
          <SliderControl label="Shadow" max={1} min={0} onChange={updateSceneControl('shadow')} step={0.05} value={sceneControls.shadow} />
          <div className="grid grid-cols-3 gap-2">
            <button
              className={sceneTunerTarget ? 'cursor-pointer rounded-[3px] bg-[#1f2328] px-3 py-2 text-[12px] font-semibold text-white' : 'mt-1 cursor-pointer border-[3px] border-[#111] bg-[#ff3b24] px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0_#111]'}
              onClick={resetSceneControls}
              type="button"
            >
              Reset
            </button>
            <button
              className={sceneTunerTarget ? 'cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-3 py-2 text-[12px] font-semibold' : 'cursor-pointer border-[3px] border-[#111] bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0_#111]'}
              onClick={resetViewControlsToZero}
              type="button"
            >
              Zero view
            </button>
            <button
              className={sceneTunerTarget ? 'cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-3 py-2 text-[12px] font-semibold' : 'cursor-pointer border-[3px] border-[#111] bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0_#111]'}
              onClick={copySceneControls}
              type="button"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )

  useEffect(() => {
    if (!isSceneTransitioningRef.current) {
      latestStableSceneControlsRef.current = sceneControls
    }
  }, [sceneControls])

  useEffect(() => {
    if (introFrameRef.current) {
      cancelAnimationFrame(introFrameRef.current)
    }

    isSceneTransitioningRef.current = false

    if (!modelReady) {
      return undefined
    }

    if (defaultSceneControls.intro?.enabled === false) {
      introFrameRef.current = requestAnimationFrame(() => {
        latestStableSceneControlsRef.current = defaultSceneControls
        setSceneControls(defaultSceneControls)
      })

      return () => {
        if (introFrameRef.current) {
          cancelAnimationFrame(introFrameRef.current)
        }
      }
    }

    const lastSceneControls = latestStableSceneControlsRef.current
    const startControls = defaultSceneControls.intro?.useLast && lastSceneControls
      ? lastSceneControls
      : {
          ...defaultSceneControls,
          cameraHeight: getIntroStartHeight(defaultSceneControls),
    }
    const endControls = defaultSceneControls
    const startCameraPosition = getCameraPositionFromControls(startControls)
    const endCameraPosition = getCameraPositionFromControls(endControls)
    const duration = defaultSceneControls.intro?.duration ?? fallbackSceneControls.intro.duration
    const startTime = performance.now()

    isSceneTransitioningRef.current = true
    setSceneControls(startControls)

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const easedProgress = easeOutCubic(progress)
      const target = interpolateVector(startControls.target, endControls.target, easedProgress)
      const cameraPosition = interpolateVector(startCameraPosition, endCameraPosition, easedProgress)
      const cameraControls = getCameraControlsFromPosition(cameraPosition, target)

      setSceneControls({
        ...endControls,
        ...cameraControls,
        carAngle: interpolateDegrees(startControls.carAngle, endControls.carAngle, easedProgress),
        fov: interpolateValue(startControls.fov, endControls.fov, easedProgress),
        light: interpolateValue(startControls.light, endControls.light, easedProgress),
        shadow: interpolateValue(startControls.shadow, endControls.shadow, easedProgress),
        target,
      })

      if (progress < 1) {
        introFrameRef.current = requestAnimationFrame(tick)
        return
      }

      latestStableSceneControlsRef.current = endControls
      isSceneTransitioningRef.current = false
      setSceneControls(endControls)
    }

    introFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (introFrameRef.current) {
        cancelAnimationFrame(introFrameRef.current)
      }

      isSceneTransitioningRef.current = false
    }
  }, [defaultSceneControls, modelReady])

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
            caliperColor={caliperColor}
            caliperMaterial={caliperMaterial}
            carColor={carColor}
            carConfig={carConfig}
            key={carConfig.modelId}
            onLoaded={handleModelLoaded}
            paintMaterial={paintMaterial}
            rimColor={rimColor}
            rimMaterial={rimMaterial}
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
          maxAzimuthAngle={orbitLimits.maxAzimuthAngle}
          maxPolarAngle={orbitLimits.maxPolarAngle}
          minAzimuthAngle={orbitLimits.minAzimuthAngle}
          minPolarAngle={orbitLimits.minPolarAngle}
          target={sceneControls.target}
        />
        <SceneControlSync controlsRef={controlsRef} onSync={syncSceneControlsFromOrbit} />
      </Canvas>

      {sceneTunerTarget ? createPortal(sceneTuner, sceneTunerTarget) : !usePanelSceneTuner ? sceneTuner : null}
    </>
  )
}

export default CarScene
