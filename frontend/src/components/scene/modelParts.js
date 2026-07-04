import * as THREE from 'three'

export const carBuilderPartKey = 'carBuilderPart'

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

export function getMaterialNames(material) {
  if (Array.isArray(material)) {
    return material.map((item) => item?.name ?? '').filter(Boolean)
  }

  return material?.name ? [material.name] : []
}

export function cloneMaterials(material) {
  if (Array.isArray(material)) {
    return material.map((item) => item?.clone())
  }

  return material?.clone()
}

export function getOriginalMaterialNames(object) {
  return object.userData.originalMaterialNames ?? getMaterialNames(object.material)
}

export function getOriginalMaterial(object) {
  return object.userData.originalMaterial ?? object.material
}

export function createColoredMaterial(originalMaterial, color, materialConfig = {}) {
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

export function matchesConfigPart(object, configPart) {
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
