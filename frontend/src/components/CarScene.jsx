import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center } from '@react-three/drei/core/Center'
import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { Environment } from '@react-three/drei/core/Environment'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { PerspectiveCamera } from '@react-three/drei/core/PerspectiveCamera'
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
    transition: 'orbit',
    useLast: false,
    animateBetweenPositions: true,
  },
}

const hoodClearanceHeightThreshold = 2
const hoodClearanceZoomThreshold = 8
const hoodClearanceMaxLift = 1.2

function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3
}

function easeInOutCubic(progress) {
  if (progress < 0.5) {
    return 4 * progress ** 3
  }

  return 1 - ((-2 * progress + 2) ** 3) / 2
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

function roundZoomBound(value) {
  return Math.round(value * 100) / 100
}

function hasExplicitZoomBounds(sceneControls) {
  const minDistance = sceneControls.minDistance ?? fallbackSceneControls.minDistance
  const maxDistance = sceneControls.maxDistance ?? fallbackSceneControls.maxDistance

  return minDistance > fallbackSceneControls.minDistance || maxDistance < fallbackSceneControls.maxDistance
}

function getAdaptiveZoomBounds(sceneControls) {
  const baseZoom = Math.max(sceneControls.zoom ?? fallbackSceneControls.zoom, 0.1)
  const fov = sceneControls.fov ?? fallbackSceneControls.fov
  const rotationX = sceneControls.maxRotationX ?? fallbackSceneControls.maxRotationX
  const rotationY = sceneControls.maxRotationY ?? fallbackSceneControls.maxRotationY
  const rotationFreedom = ((rotationX / fallbackSceneControls.maxRotationX) + (rotationY / fallbackSceneControls.maxRotationY)) / 2
  const broadViewFactor = clampValue(rotationFreedom, 0, 1)
  const narrowFovFactor = clampValue((fallbackSceneControls.fov - fov) / 30, 0, 1)
  const detailFactor = Math.max(1 - broadViewFactor, narrowFovFactor)
  const minMultiplier = 0.72 + detailFactor * 0.18
  const maxMultiplier = 1.8 - detailFactor * 0.52
  const min = Math.max(roundZoomBound(baseZoom * minMultiplier), 0.1)
  const max = Math.max(roundZoomBound(baseZoom * maxMultiplier), min + 0.1)

  return { max, min }
}

function getZoomBounds(sceneControls) {
  if (!hasExplicitZoomBounds(sceneControls)) {
    return getAdaptiveZoomBounds(sceneControls)
  }

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

function getHoodClearanceLift(startControls, endControls, progress) {
  const lowestCameraHeight = Math.min(startControls.cameraHeight, endControls.cameraHeight)
  const closestZoom = Math.min(startControls.zoom, endControls.zoom)
  const lowHeightFactor = clampValue((hoodClearanceHeightThreshold - lowestCameraHeight) / hoodClearanceHeightThreshold, 0, 1)
  const closeZoomFactor = clampValue((hoodClearanceZoomThreshold - closestZoom) / hoodClearanceZoomThreshold, 0, 1)
  const liftStrength = (lowHeightFactor + closeZoomFactor) / 2

  if (liftStrength === 0) {
    return 0
  }

  const liftCurve = Math.sin(progress * Math.PI) * (1 - progress * 0.18)

  return hoodClearanceMaxLift * liftStrength * liftCurve
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

function getInterpolatedSceneControls(startControls, endControls, progress) {
  const target = interpolateVector(startControls.target, endControls.target, progress)
  const cameraPosition = interpolateVector(
    getCameraPositionFromControls(startControls),
    getCameraPositionFromControls(endControls),
    progress,
  )
  cameraPosition[1] += getHoodClearanceLift(startControls, endControls, progress)
  const cameraControls = getCameraControlsFromPosition(cameraPosition, target)

  return {
    ...endControls,
    ...cameraControls,
    carAngle: interpolateDegrees(startControls.carAngle, endControls.carAngle, progress),
    fov: interpolateValue(startControls.fov, endControls.fov, progress),
    light: interpolateValue(startControls.light, endControls.light, progress),
    shadow: interpolateValue(startControls.shadow, endControls.shadow, progress),
    target,
  }
}

function getControlSpaceInterpolatedSceneControls(startControls, endControls, progress) {
  return {
    ...endControls,
    cameraAngle: interpolateDegrees(startControls.cameraAngle, endControls.cameraAngle, progress),
    cameraHeight: interpolateValue(startControls.cameraHeight, endControls.cameraHeight, progress) + getHoodClearanceLift(startControls, endControls, progress),
    zoom: interpolateValue(startControls.zoom, endControls.zoom, progress),
    carAngle: interpolateDegrees(startControls.carAngle, endControls.carAngle, progress),
    fov: interpolateValue(startControls.fov, endControls.fov, progress),
    light: interpolateValue(startControls.light, endControls.light, progress),
    shadow: interpolateValue(startControls.shadow, endControls.shadow, progress),
    target: interpolateVector(startControls.target, endControls.target, progress),
  }
}

function getSafeMidTransitionControls(startControls, endControls) {
  const [startTargetX, startTargetY, startTargetZ] = startControls.target
  const [endTargetX, endTargetY, endTargetZ] = endControls.target
  const horizontalTargetDistance = Math.hypot(endTargetX - startTargetX, endTargetZ - startTargetZ)
  const safeZoom = Math.max(
    startControls.zoom,
    endControls.zoom,
    horizontalTargetDistance + 2.5,
  )
  const safeHeight = Math.max(
    startControls.cameraHeight,
    endControls.cameraHeight,
    getIntroStartHeight(endControls),
    startTargetY + 1.4,
    endTargetY + 1.4,
  )

  return {
    ...endControls,
    cameraAngle: interpolateDegrees(startControls.cameraAngle, endControls.cameraAngle, 0.5),
    cameraHeight: safeHeight,
    zoom: safeZoom,
    target: interpolateVector(startControls.target, endControls.target, 0.5),
    carAngle: interpolateDegrees(startControls.carAngle, endControls.carAngle, 0.5),
    fov: interpolateValue(startControls.fov, endControls.fov, 0.5),
    light: interpolateValue(startControls.light, endControls.light, 0.5),
    shadow: interpolateValue(startControls.shadow, endControls.shadow, 0.5),
  }
}

function getTransitionSceneControls(startControls, endControls, progress) {
  const transitionType = endControls.intro?.transition ?? fallbackSceneControls.intro.transition

  if (transitionType === 'linear') {
    return getInterpolatedSceneControls(startControls, endControls, easeOutCubic(progress))
  }

  if (transitionType === 'zoom-out-in') {
    const safeMidControls = getSafeMidTransitionControls(startControls, endControls)

    if (progress < 0.5) {
      return getControlSpaceInterpolatedSceneControls(
        startControls,
        safeMidControls,
        easeInOutCubic(progress / 0.5),
      )
    }

    return getControlSpaceInterpolatedSceneControls(
      safeMidControls,
      endControls,
      easeInOutCubic((progress - 0.5) / 0.5),
    )
  }

  return getControlSpaceInterpolatedSceneControls(startControls, endControls, easeOutCubic(progress))
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
    transition: "${sceneControls.intro.transition ?? fallbackSceneControls.intro.transition}",
    useLast: ${Boolean(sceneControls.intro.useLast)},
    animateBetweenPositions: ${sceneControls.intro.animateBetweenPositions ?? fallbackSceneControls.intro.animateBetweenPositions},
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

function SceneModel({ autoSpin = false, baseRotation, centerModel = false, modelProps, spinSpeed = 0.22 }) {
  const groupRef = useRef(null)
  const spinRotationRef = useRef(baseRotation[1])

  useEffect(() => {
    spinRotationRef.current = baseRotation[1]

    if (groupRef.current) {
      groupRef.current.rotation.y = baseRotation[1]
    }
  }, [baseRotation])

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return
    }

    if (!autoSpin) {
      groupRef.current.rotation.y = baseRotation[1]
      return
    }

    spinRotationRef.current += delta * spinSpeed
    groupRef.current.rotation.y = spinRotationRef.current
  })

  const model = <CarModel {...modelProps} rotation={[0, 0, 0]} />

  return (
    <group ref={groupRef} rotation={baseRotation}>
      {centerModel ? <Center disableY>{model}</Center> : model}
    </group>
  )
}

function CarScene({ addOnValues, autoSpin = false, caliperColor, caliperMaterial, carColor, carConfig, centerModel = false, paintMaterial, presentationMode = false, rimColor, rimMaterial, rimType = 'standard', sceneConfig, sceneGroupKey = 'default', scenePositionKey = 'default', sceneTunerTarget, seatOuterColor, seatOuterMaterial, spinSpeed, usePanelSceneTuner = false, onReady }) {
  const controlsRef = useRef(null)
  const introFrameRef = useRef(null)
  const isSceneTransitioningRef = useRef(false)
  const latestSceneControlsRef = useRef(null)
  const previousSceneGroupKeyRef = useRef(null)
  const previousScenePositionKeyRef = useRef(null)
  const [showTuner, setShowTuner] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [isIntroActive, setIsIntroActive] = useState(false)
  const defaultSceneControls = useMemo(() => getSceneControls(sceneConfig ?? carConfig.scene), [carConfig.scene, sceneConfig])
  const [sceneControls, setSceneControls] = useState(() => getInitialSceneControls(defaultSceneControls))
  const zoomBounds = useMemo(() => getZoomBounds(sceneControls), [sceneControls])
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
    latestSceneControlsRef.current = defaultSceneControls
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
          <SliderControl label="FOV" max={120} min={20} onChange={updateSceneControl('fov')} suffix="°" value={sceneControls.fov} />
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
    latestSceneControlsRef.current = sceneControls
  }, [sceneControls])

  useEffect(() => {
    const controls = controlsRef.current

    if (!controls || presentationMode) {
      return
    }

    const [cameraX, cameraY, cameraZ] = cameraPosition
    const [targetX, targetY, targetZ] = sceneControls.target

    controls.object.position.set(cameraX, cameraY, cameraZ)
    controls.target.set(targetX, targetY, targetZ)
    controls.enabled = !isIntroActive
    controls.update()
  }, [cameraPosition, isIntroActive, presentationMode, sceneControls.target])

  useEffect(() => {
    setSceneControls((currentControls) => {
      const nextZoom = roundSceneValue(clampValue(currentControls.zoom, zoomBounds.min, zoomBounds.max))

      if (nextZoom === currentControls.zoom) {
        return currentControls
      }

      return {
        ...currentControls,
        zoom: nextZoom,
      }
    })
  }, [zoomBounds.max, zoomBounds.min])

  useEffect(() => {
    if (introFrameRef.current) {
      cancelAnimationFrame(introFrameRef.current)
    }

    isSceneTransitioningRef.current = false
    setIsIntroActive(false)

    if (!modelReady) {
      return undefined
    }

    const previousSceneGroupKey = previousSceneGroupKeyRef.current
    const previousScenePositionKey = previousScenePositionKeyRef.current
    const lastSceneControls = latestSceneControlsRef.current
    const isPositionChange = previousSceneGroupKey === sceneGroupKey && previousScenePositionKey !== scenePositionKey
    const shouldAnimateBetweenPositions = isPositionChange && defaultSceneControls.intro?.animateBetweenPositions !== false && lastSceneControls

    previousSceneGroupKeyRef.current = sceneGroupKey
    previousScenePositionKeyRef.current = scenePositionKey

    if (defaultSceneControls.intro?.enabled === false && !shouldAnimateBetweenPositions) {
      introFrameRef.current = requestAnimationFrame(() => {
        latestSceneControlsRef.current = defaultSceneControls
        setSceneControls(defaultSceneControls)
      })

      return () => {
        if (introFrameRef.current) {
          cancelAnimationFrame(introFrameRef.current)
        }
      }
    }

    const startControls = shouldAnimateBetweenPositions
      ? lastSceneControls
      : defaultSceneControls.intro?.useLast && lastSceneControls
      ? lastSceneControls
      : {
          ...defaultSceneControls,
          cameraHeight: getIntroStartHeight(defaultSceneControls),
        }
    const endControls = defaultSceneControls
    const duration = defaultSceneControls.intro?.duration ?? fallbackSceneControls.intro.duration
    const startTime = performance.now()

    isSceneTransitioningRef.current = true
    setIsIntroActive(true)

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      setSceneControls(getTransitionSceneControls(startControls, endControls, progress))

      if (progress < 1) {
        introFrameRef.current = requestAnimationFrame(tick)
        return
      }

      latestSceneControlsRef.current = endControls
      isSceneTransitioningRef.current = false
      setIsIntroActive(false)
      setSceneControls(endControls)
    }

    introFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (introFrameRef.current) {
        cancelAnimationFrame(introFrameRef.current)
      }

      isSceneTransitioningRef.current = false
      setIsIntroActive(false)
    }
  }, [defaultSceneControls, modelReady, sceneGroupKey, scenePositionKey])

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
          <SceneModel
            autoSpin={autoSpin}
            baseRotation={carRotation}
            centerModel={centerModel}
            key={carConfig.modelId}
            modelProps={{
              addOnValues,
              caliperColor,
              caliperMaterial,
              carColor,
              carConfig,
              onLoaded: handleModelLoaded,
              paintMaterial,
              rimColor,
              rimMaterial,
              rimType,
              seatOuterColor,
              seatOuterMaterial,
            }}
            spinSpeed={spinSpeed}
          />
          <Environment preset="city" />
          <ContactShadows blur={2.6} far={6} opacity={sceneControls.shadow} position={[0, -0.76, 0]} scale={8} />
        </Suspense>

        {!presentationMode && (
          <>
            <OrbitControls
              ref={controlsRef}
              enableDamping
              enablePan={false}
              minDistance={zoomBounds.min}
              maxDistance={zoomBounds.max}
              maxAzimuthAngle={orbitLimits.maxAzimuthAngle}
              maxPolarAngle={orbitLimits.maxPolarAngle}
              minAzimuthAngle={orbitLimits.minAzimuthAngle}
              minPolarAngle={orbitLimits.minPolarAngle}
              target={sceneControls.target}
            />
            <SceneControlSync controlsRef={controlsRef} onSync={syncSceneControlsFromOrbit} />
          </>
        )}
      </Canvas>

      {!presentationMode && (sceneTunerTarget ? createPortal(sceneTuner, sceneTunerTarget) : !usePanelSceneTuner ? sceneTuner : null)}
    </>
  )
}

export default CarScene
