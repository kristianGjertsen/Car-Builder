import { resolveColorOptions } from '../cars/colors'

export type ColorOption = {
  name: string
  value: string
  price: number
  custom?: boolean
  material?: Record<string, number>
}

export type OrderLine = {
  id: string
  label: string
  value: string
  price: number
  color?: string
  customColor?: boolean
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('nb-NO').format(price)
}

export function getColorOptions(colorConfig): ColorOption[] {
  return resolveColorOptions(colorConfig)
}

export function getDefaultAddOnValues(carConfig: { addOns: any }) {
  return Object.fromEntries((carConfig.addOns ?? []).map((addOn: { id: any; defaultEnabled: any }) => [addOn.id, Boolean(addOn.defaultEnabled)]))
}

export function getSavedBuildKey(carId: string) {
  return `car-builder:build:${carId}`
}

export function readSavedBuild(carId: string) {
  try {
    const savedBuild = window.localStorage.getItem(getSavedBuildKey(carId))

    return savedBuild ? JSON.parse(savedBuild) : null
  } catch {
    return null
  }
}

export function saveBuild(carId: string, build) {
  try {
    window.localStorage.setItem(getSavedBuildKey(carId), JSON.stringify(build))
  } catch {
    // localStorage can be unavailable in private browsing or blocked browser contexts.
  }
}

export function getDefaultColorValue(colorConfig) {
  const colors = resolveColorOptions(colorConfig)
  const defaultOption = colors.find((option) => option.value === colorConfig.defaultValue || option.name === colorConfig.defaultValue)

  return defaultOption?.value ?? colors[0]?.value
}

export function hasColorConfig(colorConfig) {
  return Boolean(colorConfig?.colors?.length)
}

export function getSelectedColorOption(colorConfig, savedValue) {
  const options = getColorOptions(colorConfig)

  return options.find((option) => option.value === savedValue) ?? options.find((option) => option.value === getDefaultColorValue(colorConfig)) ?? options[0]
}

export function getSelectedAddOns(carConfig, addOnValues = {}) {
  return (carConfig.addOns ?? []).filter((addOn) => Boolean(addOnValues[addOn.id]))
}

export function getOrderLines({
  carConfig,
  effectiveBodyColor,
  effectiveCaliperColor,
  effectiveGlassTintColor,
  effectiveRimColor,
  effectiveSeatOuterColor,
  includeColorMetadata = false,
  selectedAddOns = [],
  selectedBodyOption,
  selectedCaliperOption,
  selectedGlassTintOption,
  selectedRimOption,
  selectedSeatOuterOption,
}: {
  carConfig: any
  effectiveBodyColor?: string
  effectiveCaliperColor?: string
  effectiveGlassTintColor?: string
  effectiveRimColor?: string
  effectiveSeatOuterColor?: string
  includeColorMetadata?: boolean
  selectedAddOns?: any[]
  selectedBodyOption: ColorOption
  selectedCaliperOption?: ColorOption | null
  selectedGlassTintOption?: ColorOption | null
  selectedRimOption: ColorOption
  selectedSeatOuterOption?: ColorOption | null
}): OrderLine[] {
  const bodyValue = selectedBodyOption.name
  const rimValue = selectedRimOption.name
  const caliperValue = selectedCaliperOption?.name
  const glassTintValue = selectedGlassTintOption?.name
  const seatOuterValue = selectedSeatOuterOption?.name

  const withColorMetadata = (line: OrderLine, color?: string, customColor?: boolean) => {
    if (!includeColorMetadata) {
      return line
    }

    return {
      ...line,
      color,
      customColor,
    }
  }

  return [
    {
      id: 'base',
      label: 'Model',
      value: carConfig.name,
      price: carConfig.basePrice ?? 0,
    },
    withColorMetadata(
      {
        id: 'paint',
        label: carConfig.paint.label ?? 'Body Color',
        value: bodyValue,
        price: selectedBodyOption.price,
      },
      effectiveBodyColor,
      false,
    ),
    withColorMetadata(
      {
        id: 'rims',
        label: carConfig.rims.label ?? 'Rim Color',
        value: rimValue,
        price: selectedRimOption.price,
      },
      effectiveRimColor,
      false,
    ),
    ...(selectedCaliperOption
      ? [
          withColorMetadata(
            {
              id: 'calipers',
              label: carConfig.calipers.label ?? 'Caliper Color',
              value: caliperValue,
              price: selectedCaliperOption.price,
            },
            effectiveCaliperColor,
            false,
          ),
        ]
      : []),
    ...(selectedGlassTintOption
      ? [
          withColorMetadata(
            {
              id: 'glassTint',
              label: carConfig.glassTint.label ?? 'Window Tint',
              value: glassTintValue,
              price: selectedGlassTintOption.price,
            },
            effectiveGlassTintColor,
            false,
          ),
        ]
      : []),
    ...(selectedSeatOuterOption
      ? [
          withColorMetadata(
            {
              id: 'seatOuter',
              label: carConfig.seatOuter.label ?? 'Seat Outer',
              value: seatOuterValue,
              price: selectedSeatOuterOption.price,
            },
            effectiveSeatOuterColor,
            false,
          ),
        ]
      : []),
    ...selectedAddOns.map((addOn: { id: any; name: any; price: any }) => ({
      id: `addOn:${addOn.id}`,
      label: 'Add-on',
      value: addOn.name,
      price: addOn.price ?? 0,
    })),
  ]
}
