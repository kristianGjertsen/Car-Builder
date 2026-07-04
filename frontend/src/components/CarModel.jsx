import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei/core/Gltf'
import {
  carBuilderPartKey,
  cloneMaterials,
  createColoredMaterial,
  getMaterialNames,
  getOriginalMaterial,
  matchesConfigPart,
} from './scene/modelParts'

function CarModel({
  addOnValues = {},
  carColor,
  carConfig,
  caliperColor,
  caliperMaterial,
  paintMaterial,
  seatOuterColor,
  seatOuterMaterial,
  rimColor = '#0d0d0f',
  rimMaterial: selectedRimMaterial,
  rimType = 'standard',
  rotation = [0, -Math.PI / 5, 0],
  onLoaded,
}) {
  const { scene: gltfScene } = useGLTF(carConfig.modelPath)
  const scene = useMemo(() => {
    const clonedScene = gltfScene.clone(true)

    clonedScene.traverse((object) => {
      if (!object.isMesh) {
        return
      }

      object.userData = {
        ...object.userData,
        [carBuilderPartKey]: undefined,
        originalMaterialNames: getMaterialNames(object.material),
        originalMaterial: cloneMaterials(object.material),
      }
    })

    return clonedScene
  }, [gltfScene])

  const paintMaterialConfig = useMemo(() => paintMaterial ?? carConfig.paint?.material ?? {}, [carConfig.paint, paintMaterial])
  const caliperMaterialConfig = useMemo(() => caliperMaterial ?? carConfig.calipers?.material ?? {}, [caliperMaterial, carConfig.calipers])
  const seatOuterMaterialConfig = useMemo(() => seatOuterMaterial ?? carConfig.seatOuter?.material ?? {}, [carConfig.seatOuter, seatOuterMaterial])

  const rimMaterial = useMemo(
    () => {
      const rimMaterialConfig = selectedRimMaterial ?? carConfig.rims?.material ?? {}

      return new THREE.MeshStandardMaterial({
        color: rimColor,
        metalness: rimType === 'matte' ? 0.55 : (rimMaterialConfig.metalness ?? 0.85),
        roughness: rimType === 'matte' ? 0.55 : (rimMaterialConfig.roughness ?? 0.22),
        envMapIntensity: rimMaterialConfig.envMapIntensity ?? 1,
        side: THREE.DoubleSide,
      })
    },
    [carConfig.rims, rimColor, rimType, selectedRimMaterial],
  )

  useEffect(() => {
    const missing = {
      body: true,
      rims: true,
      calipers: !carConfig.calipers,
      seatOuter: !carConfig.seatOuter,
    }
    const missingAddOns = Object.fromEntries((carConfig.addOns ?? []).map((addOn) => [addOn.id, true]))

    scene.traverse((object) => {
      if (!object.isMesh) {
        return
      }

      object.castShadow = true
      object.receiveShadow = true

      // These mesh/group names must match the names exported from Blender into the GLB model.
      // Once a mesh is matched, we mark it in userData so later color changes still work after the material is replaced.
      const isBody =
        object.userData[carBuilderPartKey] === 'body' ||
        matchesConfigPart(object, carConfig.paint)
      const isRim =
        object.userData[carBuilderPartKey] === 'rims' ||
        matchesConfigPart(object, carConfig.rims)
      const isCaliper =
        object.userData[carBuilderPartKey] === 'calipers' ||
        matchesConfigPart(object, carConfig.calipers)
      const isSeatOuter =
        object.userData[carBuilderPartKey] === 'seatOuter' ||
        matchesConfigPart(object, carConfig.seatOuter)

      if (isBody) {
        object.userData[carBuilderPartKey] = 'body'
        object.material = createColoredMaterial(getOriginalMaterial(object), carColor, paintMaterialConfig)
        missing.body = false
      }

      if (isRim) {
        object.userData[carBuilderPartKey] = 'rims'
        object.material = rimMaterial
        missing.rims = false
      }

      if (isCaliper) {
        object.userData[carBuilderPartKey] = 'calipers'
        object.material = createColoredMaterial(getOriginalMaterial(object), caliperColor, caliperMaterialConfig)
        missing.calipers = false
      }

      if (isSeatOuter) {
        object.userData[carBuilderPartKey] = 'seatOuter'
        object.material = createColoredMaterial(getOriginalMaterial(object), seatOuterColor, seatOuterMaterialConfig)
        missing.seatOuter = false
      }

      ;(carConfig.addOns ?? []).forEach((addOn) => {
        const partKey = `addOn:${addOn.id}`
        const isAddOn = object.userData[carBuilderPartKey] === partKey || matchesConfigPart(object, addOn)

        if (!isAddOn) {
          return
        }

        object.userData[carBuilderPartKey] = partKey
        object.visible = Boolean(addOnValues[addOn.id])
        missingAddOns[addOn.id] = false
      })
    })

    Object.entries(missing).forEach(([partName, isMissing]) => {
      if (isMissing) {
        console.warn(`CarModel: ${partName} mesh was not found. Check mesh names in Blender/GLB export.`)
      }
    })

    ;(carConfig.addOns ?? []).forEach((addOn) => {
      if (missingAddOns[addOn.id]) {
        console.warn(`CarModel: ${addOn.name} add-on mesh was not found. Check mesh names in Blender/GLB export.`)
      }
    })
  }, [addOnValues, caliperColor, caliperMaterialConfig, carColor, carConfig, paintMaterialConfig, rimMaterial, scene, seatOuterColor, seatOuterMaterialConfig])

  useEffect(() => {
    onLoaded?.()
  }, [onLoaded])

  return <primitive object={scene} position={[0, -0.74, 0]} rotation={rotation} scale={1.25} />
}

export default CarModel
