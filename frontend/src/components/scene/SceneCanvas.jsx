import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center } from '@react-three/drei/core/Center'
import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { Environment } from '@react-three/drei/core/Environment'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { PerspectiveCamera } from '@react-three/drei/core/PerspectiveCamera'
import CarModel from '../CarModel'
import { normalizeDegrees, radiansToDegrees, roundSceneValue } from './sceneControls'

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

function SceneCanvas({
  addOnValues,
  autoSpin,
  caliperColor,
  caliperMaterial,
  cameraPosition,
  carColor,
  carConfig,
  carRotation,
  centerModel,
  controlsRef,
  handleModelLoaded,
  orbitLimits,
  paintMaterial,
  presentationMode,
  rimColor,
  rimMaterial,
  rimType,
  sceneControls,
  seatOuterColor,
  seatOuterMaterial,
  spinSpeed,
  syncSceneControlsFromOrbit,
  zoomBounds,
}) {
  return (
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
  )
}

export default SceneCanvas
