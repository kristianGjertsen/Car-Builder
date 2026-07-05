const defaultMaterial = {
  metalness: 0.8,
  roughness: 0.2,
  clearcoat: 0.2,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.25,
}

export const colorPresets = {
  'alpine white': {
    value: '#f4f1ea',
    material: {
      metalness: 0.55,
      roughness: 0.24,
      clearcoat: 0.45,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.18,
    },
  },
  black: {
    value: '#0d0d0f',
    material: {
      metalness: 0.82,
      roughness: 0.18,
      clearcoat: 0.35,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.05,
    },
  },
  'black sapphire': {
    value: '#08090b',
    material: {
      metalness: 0.9,
      roughness: 0.16,
      clearcoat: 0.55,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.28,
    },
  },
  blue: {
    value: '#1f5fbf',
    material: {
      metalness: 0.52,
      roughness: 0.26,
      clearcoat: 0.38,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1,
    },
  },
  bronze: {
    value: '#b08d57',
    material: {
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 0.18,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.05,
    },
  },
  'brooklyn grey': {
    value: '#9da1a4',
    material: {
      metalness: .92,
      roughness: 1.22,
      clearcoat: 0.32,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.2,
    },
  },
  'dravit grey': {
    value: '#2f3338',
    material: {
      metalness: 0.82,
      roughness: 0.2,
      clearcoat: 0.26,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25,
    },
  },
  gold: {
    value: '#d4a23a',
    material: {
      metalness: 1,
      roughness: 0,
      clearcoat: 0,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1,
    },
  },
  gunmetal: {
    value: '#626870',
    material: {
      metalness: 0.86,
      roughness: 0.2,
      clearcoat: 0.22,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.08,
    },
  },
  'gray': {
    value: '#706e6e',
    material: {
      metalness: 0.4,
      roughness: 0.9,
      clearcoat: 0.26,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25,
    },
  },
  'm red': {
    value: '#d71920',
    material: {
      metalness: 0.36,
      roughness: 0.3,
      clearcoat: 0.38,
      clearcoatRoughness: 0.16,
      envMapIntensity: 0.92,
    },
  },
  'portimao blue': {
    value: '#1f4f8f',
    material: {
      metalness: 0.78,
      roughness: 0.19,
      clearcoat: 0.5,
      clearcoatRoughness: 0.07,
      envMapIntensity: 1.25,
    },
  },
  'san remo green': {
    value: '#254134',
    material: {
      metalness: 1,
      roughness: 0.2,
      clearcoat: 0.42,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.15,
    },
  },
  silver: {
    value: '#d7dce2',
    material: {
      metalness: 1,
      roughness: 0,
      clearcoat: 0.22,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.18,
    },
  },
  'tanzanite blue': {
    value: '#10233f',
    material: {
      metalness: 0.84,
      roughness: 0.18,
      clearcoat: 0.56,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.28,
    },
  },
  white: {
    value: '#ffffff',
    material: {
      metalness: 0.5,
      roughness: 0.28,
      clearcoat: 0.38,
      clearcoatRoughness: 0.12,
      envMapIntensity: 10.05,
    },
  },
}

function normalizeColorName(name = '') {
  return name.trim().toLowerCase()
}

export function getColorPreset(name) {
  return colorPresets[normalizeColorName(name)]
}

export function resolveColorOption(option, colorConfig = {}) {
  const preset = getColorPreset(option.name)
  const fallbackValue = option.value ?? colorConfig.defaultValue ?? '#ffffff'

  return {
    ...option,
    value: preset?.value ?? fallbackValue,
    price: option.price ?? 0,
    material: {
      ...defaultMaterial,
      ...(colorConfig.material ?? {}),
      ...(preset?.material ?? {}),
      ...(option.material ?? {}),
    },
  }
}

export function resolveColorOptions(colorConfig = {}) {
  return (colorConfig.colors ?? []).map((option) => resolveColorOption(option, colorConfig))
}
