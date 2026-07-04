/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  clampValue,
  degreesToRadians,
  fallbackSceneControls,
  formatSceneConfigForClipboard,
  getCameraPositionFromControls,
  getInitialSceneControls,
  getIntroStartHeight,
  getSceneControls,
  getTransitionSceneControls,
  getZoomBounds,
  roundSceneValue,
} from './sceneControls'

export function useSceneControls({
  carConfig,
  onReady,
  presentationMode,
  sceneConfig,
  sceneGroupKey,
  scenePositionKey,
}) {
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

  return {
    cameraPosition,
    carRotation,
    controlsRef,
    copySceneControls,
    handleModelLoaded,
    isIntroActive,
    orbitLimits,
    resetSceneControls,
    resetViewControlsToZero,
    sceneControls,
    setShowTuner,
    showTuner,
    syncSceneControlsFromOrbit,
    updateSceneControl,
    updateTargetControl,
    zoomBounds,
  }
}
