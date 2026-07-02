import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei/core/Gltf'

const carBuilderPartKey = 'carBuilderPart'
const reservedNodeNameCharacters = /[[\].:/]/g

function normalizeNodeName(name = '') {
  return name.replace(/\s/g, '_').replace(reservedNodeNameCharacters, '')
}

function getAncestorNames(object) {
  const names = []
  let current = object

  while (current) {
    if (current.name) {
      names.push(current.name)
    }

    current = current.parent
  }

  return names
}

function hasMatchingName(object, names) {
  const normalizedNames = names.map(normalizeNodeName)

  return getAncestorNames(object).some((name) => normalizedNames.includes(normalizeNodeName(name)))
}

function getMaterialNames(material) {
  if (Array.isArray(material)) {
    return material.map((item) => item?.name ?? '').filter(Boolean)
  }

  return material?.name ? [material.name] : []
}

function cloneMaterials(material) {
  if (Array.isArray(material)) {
    return material.map((item) => item?.clone())
  }

  return material?.clone()
}

function getOriginalMaterialNames(object) {
  return object.userData.originalMaterialNames ?? getMaterialNames(object.material)
}

function getOriginalMaterial(object) {
  return object.userData.originalMaterial ?? object.material
}

function createColoredMaterial(originalMaterial, color, materialConfig = {}) {
  if (Array.isArray(originalMaterial)) {
    return originalMaterial.map((material) => createColoredMaterial(material, color, materialConfig))
  }

  const material = originalMaterial?.clone?.() ?? new THREE.MeshStandardMaterial()

  if (material.color) {
    material.color.set(color)
  }

  if ('metalness' in material) {
    material.metalness = materialConfig.metalness ?? material.metalness
  }

  if ('roughness' in material) {
    material.roughness = materialConfig.roughness ?? material.roughness
  }

  if ('clearcoat' in material) {
    material.clearcoat = materialConfig.clearcoat ?? material.clearcoat
  }

  if ('clearcoatRoughness' in material) {
    material.clearcoatRoughness = materialConfig.clearcoatRoughness ?? material.clearcoatRoughness
  }

  material.envMapIntensity = materialConfig.envMapIntensity ?? material.envMapIntensity

  return material
}

function hasKeyword(value, keywords) {
  const lowerValue = normalizeNodeName(value).toLowerCase()

  return keywords.some((keyword) => lowerValue.includes(normalizeNodeName(keyword).toLowerCase()))
}

function hasMatchingMaterialName(object, names = []) {
  return getOriginalMaterialNames(object).some((name) => names.includes(name))
}

function isExcludedConfigPart(object, configPart) {
  const parentNames = getAncestorNames(object)
  const materialNames = getOriginalMaterialNames(object)
  const searchableNames = [...parentNames, ...materialNames]
  const meshNames = configPart?.excludeMeshNames ?? []
  const materialNamesToExclude = configPart?.excludeMaterialNames ?? []
  const keywords = configPart?.excludeKeywords ?? []

  return (
    hasMatchingName(object, meshNames) ||
    materialNames.some((name) => materialNamesToExclude.includes(name)) ||
    searchableNames.some((name) => hasKeyword(name, keywords))
  )
}

function matchesConfigPart(object, configPart) {
  if (isExcludedConfigPart(object, configPart)) {
    return false
  }

  const parentNames = getAncestorNames(object)
  const materialNames = getOriginalMaterialNames(object)
  const searchableNames = [...parentNames, ...materialNames]
  const meshNames = configPart?.meshNames ?? []
  const exactMaterialNames = configPart?.materialNames ?? []
  const keywords = configPart?.keywords ?? []

  return (
    hasMatchingName(object, meshNames) ||
    hasMatchingMaterialName(object, exactMaterialNames) ||
    searchableNames.some((name) => hasKeyword(name, keywords))
  )
}

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
