export const fallbackSceneControls = {
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

export function getIntroStartHeight(sceneControls) {
  return sceneControls.intro?.startHeight ?? fallbackSceneControls.intro.startHeight
}

export function getInitialSceneControls(sceneControls) {
  if (sceneControls.intro?.enabled === false) {
    return sceneControls
  }

  return {
    ...sceneControls,
    cameraHeight: getIntroStartHeight(sceneControls),
  }
}

export function clampValue(value, min, max) {
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

export function getZoomBounds(sceneControls) {
  if (!hasExplicitZoomBounds(sceneControls)) {
    return getAdaptiveZoomBounds(sceneControls)
  }

  const min = Math.max(sceneControls.minDistance ?? 0, 0.1)
  const max = Math.max(sceneControls.maxDistance ?? min + 1, min + 0.1)

  return { min, max }
}

export function zoomToSliderValue(zoom, min, max) {
  const clampedZoom = clampValue(zoom, min, max)
  const minLog = Math.log(min)
  const maxLog = Math.log(max)

  return ((Math.log(clampedZoom) - minLog) / (maxLog - minLog)) * 100
}

export function sliderValueToZoom(sliderValue, min, max) {
  const minLog = Math.log(min)
  const maxLog = Math.log(max)
  const progress = clampValue(sliderValue, 0, 100) / 100

  return Math.exp(minLog + (maxLog - minLog) * progress)
}

export function getSceneControls(sceneConfig) {
  return {
    ...fallbackSceneControls,
    ...(sceneConfig ?? {}),
    intro: {
      ...fallbackSceneControls.intro,
      ...(sceneConfig?.intro ?? {}),
    },
  }
}

export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180
}

export function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI
}

export function roundSceneValue(value, decimals = 2) {
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

export function getCameraPositionFromControls(sceneControls) {
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

export function getTransitionSceneControls(startControls, endControls, progress) {
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

export function formatSceneConfigForClipboard(sceneControls) {
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

export function normalizeDegrees(degrees) {
  if (degrees > 180) {
    return degrees - 360
  }

  if (degrees < -180) {
    return degrees + 360
  }

  return degrees
}
