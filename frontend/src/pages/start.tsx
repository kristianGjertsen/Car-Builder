import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ColorSwatch from '../components/ColorSwatch'
import Header from '../components/Header'
import CarSelectPage from './CarSelectPage'
import OrderSummary from './OrderSummary'
import { carConfigs, defaultCarConfig } from '../cars'
import { resolveColorOptions } from '../cars/colors'

const CarScene = lazy(() => import('../components/CarScene'))

type ColorOption = {
  name: string
  value: string
  price: number
  custom?: boolean
  material?: Record<string, number>
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('nb-NO').format(price)
}

function getColorOptions(colorConfig): ColorOption[] {
  const colors = resolveColorOptions(colorConfig)

  if (!colorConfig.custom?.enabled) {
    return colors
  }

  return [
    ...colors,
    {
      name: colorConfig.custom.name ?? 'Custom',
      value: colorConfig.custom.value,
      price: colorConfig.custom.price ?? 0,
      material: {
        ...(colorConfig.material ?? {}),
        ...(colorConfig.custom.material ?? {}),
      },
      custom: true,
    },
  ]
}

function getDefaultAddOnValues(carConfig: { addOns: any }) {
  return Object.fromEntries((carConfig.addOns ?? []).map((addOn: { id: any; defaultEnabled: any }) => [addOn.id, Boolean(addOn.defaultEnabled)]))
}

function getSavedBuildKey(carId: string) {
  return `car-builder:build:${carId}`
}

function readSavedBuild(carId: string) {
  try {
    const savedBuild = window.localStorage.getItem(getSavedBuildKey(carId))

    return savedBuild ? JSON.parse(savedBuild) : null
  } catch {
    return null
  }
}

function saveBuild(carId: string, build) {
  try {
    window.localStorage.setItem(getSavedBuildKey(carId), JSON.stringify(build))
  } catch {
    // localStorage can be unavailable in private browsing or blocked browser contexts.
  }
}

function getDefaultColorValue(colorConfig) {
  const colors = resolveColorOptions(colorConfig)
  const defaultOption = colors.find((option) => option.value === colorConfig.defaultValue || option.name === colorConfig.defaultValue)

  return defaultOption?.value ?? colors[0]?.value
}

function hasColorConfig(colorConfig) {
  return Boolean(colorConfig?.colors?.length)
}

function stripScenePositions(scene = {}) {
  const { positions, ...sceneWithoutPositions } = scene

  return sceneWithoutPositions
}

function mergeSceneConfig(baseScene = {}, stepScene = {}) {
  return {
    ...stripScenePositions(baseScene),
    ...stripScenePositions(stepScene),
    intro: {
      ...(baseScene.intro ?? {}),
      ...(stepScene.intro ?? {}),
    },
  }
}

function getScenePositions(baseScene = {}, stepScene = {}) {
  const sharedScene = mergeSceneConfig(baseScene, stepScene)
  const positions = stepScene?.positions ?? []

  if (!positions.length) {
    return []
  }

  return positions.map((position, index) => ({
    id: position.id ?? `position-${index + 1}`,
    label: position.label ?? `Position ${index + 1}`,
    scene: mergeSceneConfig(sharedScene, position.scene ?? position),
  }))
}

function getCustomizableSteps(carConfig) {
  if (carConfig.customizable?.steps?.length) {
    return [
      ...carConfig.customizable.steps.map((step) => ({
        ...step,
        scene: mergeSceneConfig(carConfig.scene, step.scene),
        scenePositions: getScenePositions(carConfig.scene, step.scene),
      })),
      {
        id: 'order',
        type: 'order',
        label: 'Order',
        scene: mergeSceneConfig(carConfig.scene, carConfig.customizable.orderScene ?? carConfig.orderScene),
        scenePositions: getScenePositions(carConfig.scene, carConfig.customizable.orderScene ?? carConfig.orderScene),
      },
    ]
  }

  return [
    {
      id: 'paint',
      type: 'paint',
      label: carConfig.paint?.label ?? 'Body Color',
      scene: mergeSceneConfig(carConfig.scene, carConfig.paint?.scene),
      scenePositions: getScenePositions(carConfig.scene, carConfig.paint?.scene),
    },
    {
      id: 'rims',
      type: 'rims',
      label: carConfig.rims?.label ?? 'Rim Color',
      scene: mergeSceneConfig(carConfig.scene, carConfig.rims?.scene),
      scenePositions: getScenePositions(carConfig.scene, carConfig.rims?.scene),
    },
    ...(hasColorConfig(carConfig.calipers)
      ? [
          {
            id: 'calipers',
            type: 'calipers',
            label: carConfig.calipers.label ?? 'Caliper Color',
            scene: mergeSceneConfig(carConfig.scene, carConfig.calipers.scene),
            scenePositions: getScenePositions(carConfig.scene, carConfig.calipers.scene),
          },
        ]
      : []),
    ...(hasColorConfig(carConfig.seatOuter)
      ? [
          {
            id: 'seats',
            type: 'seats',
            label: 'Seat Colors',
            scene: mergeSceneConfig(carConfig.scene, carConfig.seatOuter?.scene),
            scenePositions: getScenePositions(carConfig.scene, carConfig.seatOuter?.scene),
          },
        ]
      : []),
    ...(carConfig.addOns ?? []).map((addOn) => ({
      id: addOn.id,
      type: 'addOn',
      addOnId: addOn.id,
      label: addOn.name,
      scene: mergeSceneConfig(carConfig.scene, addOn.scene),
      scenePositions: getScenePositions(carConfig.scene, addOn.scene),
    })),
    {
      id: 'order',
      type: 'order',
      label: 'Order',
      scene: mergeSceneConfig(carConfig.scene, carConfig.orderScene),
      scenePositions: getScenePositions(carConfig.scene, carConfig.orderScene),
    },
  ]
}

function ColorField({
  label,
  options,
  value,
  onChange,
  getOptionColor,
}: {
  label: string
  options: ColorOption[]
  value: string
  onChange: (option: ColorOption) => void
  getOptionColor?: (option: ColorOption) => string
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-4 flex w-full justify-between gap-4 text-[12px]">
        <span className="font-semibold text-[#60656c]">{label}</span>
        <strong className="font-semibold text-[#1f2328]">{selected?.name}</strong>
      </legend>

      <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
        {options.map((option) => {
          const isSelected = value === option.value

          return (
            <button
              aria-label={`Select ${option.name} for ${label}`}
              aria-pressed={isSelected}
              className={`flex min-h-[92px] cursor-pointer items-center gap-3 rounded-[2px] border bg-white px-3 py-3 text-left transition hover:border-[#1c69d4] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c69d4] ${isSelected ? 'border-[#1c69d4] ring-1 ring-[#1c69d4]' : 'border-[#d7dce2]'
                }`}
              key={option.value}
              onClick={() => onChange(option)}
              type="button"
            >
              <ColorSwatch
                color={getOptionColor ? getOptionColor(option) : option.value}
                custom={option.custom}
              />
              <span className="min-w-0">
                <span className="block text-[13px] leading-tight font-semibold text-[#1f2328]">{option.name}</span>
                <span className="mt-1 block text-[12px] leading-none text-[#60656c]">{formatPrice(option.price)} kr</span>
              </span>
              {isSelected && (
                <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1c69d4] text-[12px] font-bold text-white">✓</span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function StartPage() {
  const navigate = useNavigate()
  const { carId } = useParams()
  const customPickerRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const resetDirectionTimeoutRef = useRef<number | null>(null)
  const [sceneTunerTarget, setSceneTunerTarget] = useState<HTMLDivElement | null>(null)
  const [restoredCarId, setRestoredCarId] = useState<string | null>(null)
  const selectedCarId = carId ? decodeURIComponent(carId) : defaultCarConfig.id
  const carConfig = useMemo(
    () => carConfigs.find((config) => config.id === selectedCarId) ?? defaultCarConfig,
    [selectedCarId],
  )
  const customizableSteps = useMemo(() => getCustomizableSteps(carConfig), [carConfig])
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [activeScenePositionIndex, setActiveScenePositionIndex] = useState(0)
  const activeStep = customizableSteps[Math.min(activeStepIndex, customizableSteps.length - 1)] ?? customizableSteps[0]
  const activeScenePositions = activeStep?.scenePositions ?? []
  const activeSceneConfig = activeScenePositions[activeScenePositionIndex]?.scene ?? activeStep?.scene ?? carConfig.scene
  const bodyColorOptions = useMemo(() => getColorOptions(carConfig.paint), [carConfig])
  const rimColorOptions = useMemo(() => getColorOptions(carConfig.rims), [carConfig])
  const caliperColorOptions = useMemo(() => hasColorConfig(carConfig.calipers) ? getColorOptions(carConfig.calipers) : [], [carConfig])
  const seatOuterColorOptions = useMemo(() => hasColorConfig(carConfig.seatOuter) ? getColorOptions(carConfig.seatOuter) : [], [carConfig])
  const [bodyColor, setBodyColor] = useState(() => getDefaultColorValue(defaultCarConfig.paint))
  const [rimColor, setRimColor] = useState(() => getDefaultColorValue(defaultCarConfig.rims))
  const [caliperColor, setCaliperColor] = useState(() => hasColorConfig(defaultCarConfig.calipers) ? getDefaultColorValue(defaultCarConfig.calipers) : '#d71920')
  const [seatOuterColor, setSeatOuterColor] = useState(() => hasColorConfig(defaultCarConfig.seatOuter) ? getDefaultColorValue(defaultCarConfig.seatOuter) : '#1f1b1a')
  const [customBodyColor, setCustomBodyColor] = useState(defaultCarConfig.paint.custom?.defaultValue ?? '#7c3aed')
  const [customRimColor, setCustomRimColor] = useState(defaultCarConfig.rims.custom?.defaultValue ?? '#8b5e3c')
  const [customCaliperColor, setCustomCaliperColor] = useState(defaultCarConfig.calipers?.custom?.defaultValue ?? '#d71920')
  const [addOnValues, setAddOnValues] = useState(() => getDefaultAddOnValues(defaultCarConfig))
  const [activeCustomPicker, setActiveCustomPicker] = useState<'body' | 'rim' | 'caliper' | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const selectedBodyOption = bodyColorOptions.find((option) => option.value === bodyColor) ?? bodyColorOptions[0]
  const selectedRimOption = rimColorOptions.find((option) => option.value === rimColor) ?? rimColorOptions[0]
  const selectedCaliperOption = caliperColorOptions.find((option) => option.value === caliperColor) ?? caliperColorOptions[0]
  const selectedSeatOuterOption = seatOuterColorOptions.find((option) => option.value === seatOuterColor) ?? seatOuterColorOptions[0]
  const effectiveBodyColor = selectedBodyOption.custom ? customBodyColor : selectedBodyOption.value
  const effectiveRimColor = selectedRimOption.custom ? customRimColor : selectedRimOption.value
  const effectiveCaliperColor = selectedCaliperOption?.custom ? customCaliperColor : selectedCaliperOption?.value
  const effectiveSeatOuterColor = selectedSeatOuterOption?.value
  const activeCustomConfig = activeCustomPicker === 'body'
    ? carConfig.paint.custom
    : activeCustomPicker === 'rim'
      ? carConfig.rims.custom
      : carConfig.calipers?.custom
  const activeAddOn = activeStep?.type === 'addOn'
    ? (carConfig.addOns ?? []).find((addOn) => addOn.id === activeStep.addOnId)
    : null
  const addOnTotal = (carConfig.addOns ?? []).reduce((total, addOn) => total + (addOnValues[addOn.id] ? addOn.price ?? 0 : 0), 0)
  const caliperPrice = selectedCaliperOption?.price ?? 0
  const seatOuterPrice = selectedSeatOuterOption?.price ?? 0
  const money = (carConfig.basePrice ?? 0) + selectedBodyOption.price + selectedRimOption.price + caliperPrice + seatOuterPrice + addOnTotal
  const orderLines = useMemo(() => {
    const bodyValue = selectedBodyOption.custom
      ? `${selectedBodyOption.name} ${customBodyColor.toUpperCase()}`
      : selectedBodyOption.name
    const rimValue = selectedRimOption.custom
      ? `${selectedRimOption.name} ${customRimColor.toUpperCase()}`
      : selectedRimOption.name
    const caliperValue = selectedCaliperOption?.custom
      ? `${selectedCaliperOption.name} ${customCaliperColor.toUpperCase()}`
      : selectedCaliperOption?.name
    const seatOuterValue = selectedSeatOuterOption?.name
    const selectedAddOns = (carConfig.addOns ?? [])
      .filter((addOn) => addOnValues[addOn.id])
      .map((addOn) => ({
        id: `addOn:${addOn.id}`,
        label: 'Add-on',
        value: addOn.name,
        price: addOn.price ?? 0,
      }))

    return [
      {
        id: 'base',
        label: 'Model',
        value: carConfig.name,
        price: carConfig.basePrice ?? 0,
      },
      {
        id: 'paint',
        label: carConfig.paint.label ?? 'Body Color',
        value: bodyValue,
        price: selectedBodyOption.price,
      },
      {
        id: 'rims',
        label: carConfig.rims.label ?? 'Rim Color',
        value: rimValue,
        price: selectedRimOption.price,
      },
      ...(selectedCaliperOption
        ? [
            {
              id: 'calipers',
              label: carConfig.calipers.label ?? 'Caliper Color',
              value: caliperValue,
              price: selectedCaliperOption.price,
            },
          ]
        : []),
      ...(selectedSeatOuterOption
        ? [
            {
              id: 'seatOuter',
              label: carConfig.seatOuter.label ?? 'Seat Outer',
              value: seatOuterValue,
              price: selectedSeatOuterOption.price,
            },
          ]
        : []),
      ...selectedAddOns,
    ]
  }, [addOnValues, carConfig, customBodyColor, customCaliperColor, customRimColor, selectedBodyOption, selectedCaliperOption, selectedRimOption, selectedSeatOuterOption])
  const [displayMoney, setDisplayMoney] = useState(money)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'idle'>('idle')
  const canGoPrevious = activeStepIndex > 0
  const canGoNext = activeStepIndex < customizableSteps.length - 1
  const nextStep = customizableSteps[activeStepIndex + 1]

  const selectCarForBuilder = (carId: string) => {
    navigate(`/cars/${encodeURIComponent(carId)}`)
  }

  const toggleAddOn = (addOnId: string) => {
    setAddOnValues((currentValues) => ({
      ...currentValues,
      [addOnId]: !currentValues[addOnId],
    }))
  }

  const handleSceneReady = useCallback(() => {
    setSceneReady(true)
  }, [])

  const goToPreviousStep = () => {
    setActiveCustomPicker(null)
    setActiveScenePositionIndex(0)
    setActiveStepIndex((currentIndex) => Math.max(currentIndex - 1, 0))
  }

  const goToNextStep = () => {
    setActiveCustomPicker(null)
    setActiveScenePositionIndex(0)
    setActiveStepIndex((currentIndex) => Math.min(currentIndex + 1, customizableSteps.length - 1))
  }

  const goToStep = (stepIndex: number) => {
    setActiveCustomPicker(null)
    setActiveScenePositionIndex(0)

    if (customizableSteps[stepIndex]?.type === 'order') {
      navigate(`/cars/${encodeURIComponent(carConfig.id)}/order`)
      return
    }

    setActiveStepIndex(Math.min(Math.max(stepIndex, 0), customizableSteps.length - 1))
  }

  const goToOrder = () => {
    setActiveCustomPicker(null)
    navigate(`/cars/${encodeURIComponent(carConfig.id)}/order`)
  }

  const resetBuild = () => {
    setActiveCustomPicker(null)
    setActiveStepIndex(0)
    setActiveScenePositionIndex(0)
    setBodyColor(getDefaultColorValue(carConfig.paint))
    setRimColor(getDefaultColorValue(carConfig.rims))
    setCaliperColor(hasColorConfig(carConfig.calipers) ? getDefaultColorValue(carConfig.calipers) : '#d71920')
    setSeatOuterColor(hasColorConfig(carConfig.seatOuter) ? getDefaultColorValue(carConfig.seatOuter) : '#1f1b1a')
    setCustomBodyColor(carConfig.paint.custom?.defaultValue ?? '#7c3aed')
    setCustomRimColor(carConfig.rims.custom?.defaultValue ?? '#8b5e3c')
    setCustomCaliperColor(carConfig.calipers?.custom?.defaultValue ?? '#d71920')
    setAddOnValues(getDefaultAddOnValues(carConfig))
  }

  const selectBodyColor = (option: ColorOption) => {
    setBodyColor(option.value)

    if (option.custom) {
      setActiveCustomPicker('body')
      return
    }

    setActiveCustomPicker(null)
  }

  useEffect(() => {
    const savedBuild = readSavedBuild(carConfig.id)
    const defaultAddOnValues = getDefaultAddOnValues(carConfig)

    setSceneReady(false)
    setBodyColor(savedBuild?.bodyColor ?? getDefaultColorValue(carConfig.paint))
    setRimColor(savedBuild?.rimColor ?? getDefaultColorValue(carConfig.rims))
    setCaliperColor(savedBuild?.caliperColor ?? (hasColorConfig(carConfig.calipers) ? getDefaultColorValue(carConfig.calipers) : '#d71920'))
    setSeatOuterColor(savedBuild?.seatOuterColor ?? (hasColorConfig(carConfig.seatOuter) ? getDefaultColorValue(carConfig.seatOuter) : '#1f1b1a'))
    setCustomBodyColor(savedBuild?.customBodyColor ?? carConfig.paint.custom?.defaultValue ?? '#7c3aed')
    setCustomRimColor(savedBuild?.customRimColor ?? carConfig.rims.custom?.defaultValue ?? '#8b5e3c')
    setCustomCaliperColor(savedBuild?.customCaliperColor ?? carConfig.calipers?.custom?.defaultValue ?? '#d71920')
    setAddOnValues({
      ...defaultAddOnValues,
      ...(savedBuild?.addOnValues ?? {}),
    })
    setActiveStepIndex(0)
    setActiveScenePositionIndex(0)
    setActiveCustomPicker(null)
    setRestoredCarId(carConfig.id)
  }, [carConfig, customizableSteps])

  useEffect(() => {
    if (activeScenePositionIndex < activeScenePositions.length) {
      return
    }

    setActiveScenePositionIndex(0)
  }, [activeScenePositionIndex, activeScenePositions.length])

  useEffect(() => {
    if (restoredCarId !== carConfig.id) {
      return
    }

    saveBuild(carConfig.id, {
      activeStepId: activeStep?.id,
      activeStepIndex,
      bodyColor,
      rimColor,
      caliperColor,
      seatOuterColor,
      customBodyColor,
      customRimColor,
      customCaliperColor,
      addOnValues,
    })
  }, [
    activeStep?.id,
    activeStepIndex,
    addOnValues,
    bodyColor,
    caliperColor,
    carConfig.id,
    seatOuterColor,
    customBodyColor,
    customCaliperColor,
    customRimColor,
    restoredCarId,
    rimColor,
  ])

  const selectRimColor = (option: ColorOption) => {
    setRimColor(option.value)

    if (option.custom) {
      setActiveCustomPicker('rim')
      return
    }

    setActiveCustomPicker(null)
  }

  const selectCaliperColor = (option: ColorOption) => {
    setCaliperColor(option.value)

    if (option.custom) {
      setActiveCustomPicker('caliper')
      return
    }

    setActiveCustomPicker(null)
  }

  const selectSeatOuterColor = (option: ColorOption) => {
    setSeatOuterColor(option.value)
    setActiveCustomPicker(null)
  }

  useEffect(() => {
    if (displayMoney === money) {
      return
    }

    setPriceDirection(money > displayMoney ? 'up' : 'down')

    const startValue = displayMoney
    const difference = money - startValue
    const duration = 550
    const startTime = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const easedProgress = 1 - (1 - progress) * (1 - progress)
      const nextValue = Math.round(startValue + difference * easedProgress)

      setDisplayMoney(nextValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick)
        return
      }

      setDisplayMoney(money)

      resetDirectionTimeoutRef.current = window.setTimeout(() => {
        setPriceDirection('idle')
      }, 220)
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (resetDirectionTimeoutRef.current) {
      clearTimeout(resetDirectionTimeoutRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (resetDirectionTimeoutRef.current) {
        clearTimeout(resetDirectionTimeoutRef.current)
      }
    }
  }, [money])

  useEffect(() => {
    if (!activeCustomPicker) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (customPickerRef.current?.contains(event.target as Node)) {
        return
      }

      setActiveCustomPicker(null)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [activeCustomPicker])

  if (!carId) {
    return <CarSelectPage carConfigs={carConfigs} onSelectCar={selectCarForBuilder} selectedCarId={selectedCarId} />
  }

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#f5f4f2] text-[#1f2328]">
      <Header
        action={{ label: 'Order', onClick: goToOrder }}
        metricLabel="Totalpris"
        metricValue={formatPrice(displayMoney) + ' kr'}
        onLogoClick={() => navigate('/')}
        secondaryAction={{ label: 'Reset', onClick: resetBuild }}
        sticky
        subtitle={activeStep?.label ?? 'Customize'}
        title={carConfig.name}
      />

      <section className="grid min-h-[calc(100svh-81px)] grid-cols-[260px_minmax(0,1fr)_390px] gap-6 px-8 py-7 max-[1180px]:grid-cols-[220px_minmax(0,1fr)_340px] max-[980px]:grid-cols-1 max-[760px]:px-4 max-[760px]:py-4" id="model">
        <aside className="min-w-0 max-[980px]:order-2">
          <div className="sticky top-[104px] rounded-[3px] border border-[#dfe3e8] bg-white shadow-sm max-[980px]:static">
            <div className="border-b border-[#dfe3e8] px-5 py-4">
              <p className="text-[12px] font-semibold text-[#60656c]">List of customization</p>
            </div>
            <div className="grid">
              {customizableSteps.map((step, index) => {
                const isActive = index === activeStepIndex
                const isComplete = index < activeStepIndex

                return (
                  <button
                    className={`flex cursor-pointer items-center gap-3 border-b border-[#edf0f2] px-5 py-4 text-left transition last:border-b-0 hover:bg-[#f7f9fb] ${isActive ? 'bg-[#eef4ff] text-[#1c69d4]' : 'text-[#1f2328]'}`}
                    key={step.id}
                    onClick={() => goToStep(index)}
                    type="button"
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${isActive ? 'border-[#1c69d4] bg-[#1c69d4] text-white' : isComplete ? 'border-[#7b858f] bg-[#f5f6f7] text-[#1f2328]' : 'border-[#c9d0d8] text-[#60656c]'}`}>
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold">{step.label}</span>
                      <span className="block text-[12px] text-[#60656c]">{isActive ? 'Active' : isComplete ? 'Configured' : 'Pending'}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <div className="min-w-0 max-[980px]:order-1">
          <div className="relative h-[calc(100svh-214px)] min-h-[520px] overflow-hidden rounded-[22px] border border-[#dfe3e8] bg-[#ebe8e3] shadow-sm max-[980px]:h-[54svh] max-[980px]:min-h-[360px] max-[520px]:min-h-[300px]">
            <Suspense fallback={<SceneLoadingPanel />}>
              <CarScene
                addOnValues={addOnValues}
                caliperMaterial={selectedCaliperOption?.material}
                caliperColor={effectiveCaliperColor}
                carColor={effectiveBodyColor}
                carConfig={carConfig}
                key={carConfig.id}
                onReady={handleSceneReady}
                paintMaterial={selectedBodyOption.material}
                rimColor={effectiveRimColor}
                rimMaterial={selectedRimOption.material}
                sceneConfig={activeSceneConfig}
                sceneTunerTarget={sceneTunerTarget}
                seatOuterColor={effectiveSeatOuterColor}
                seatOuterMaterial={selectedSeatOuterOption?.material}
                usePanelSceneTuner
              />
            </Suspense>

            {activeScenePositions.length > 1 && (
              <div className="absolute top-5 left-1/2 z-30 flex max-w-[calc(100%-40px)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full bg-white/92 px-3 py-2 shadow-sm backdrop-blur">
                {activeScenePositions.map((position, index) => {
                  const isActive = index === activeScenePositionIndex

                  return (
                    <button
                      className={`min-h-9 cursor-pointer rounded-full px-4 text-[12px] font-semibold transition ${isActive ? 'bg-[#1f2328] text-white' : 'bg-[#eef0f2] text-[#1f2328] hover:bg-[#dfe4ea]'}`}
                      key={position.id}
                      onClick={() => setActiveScenePositionIndex(index)}
                      type="button"
                    >
                      {position.label}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="absolute bottom-5 left-5 z-30 flex items-center gap-3 rounded-full bg-white/90 px-3 py-2 text-[12px] font-semibold text-[#60656c] shadow-sm backdrop-blur">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1f2328] text-[10px] text-white">360</span>
              Drag to rotate
            </div>

            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
              <span className="absolute top-1/2 left-0 h-px w-full bg-[#1c69d4]/35" />
              <span className="absolute top-0 left-1/2 h-full w-px bg-[#1c69d4]/35" />
              <span className="absolute top-1/2 left-1/2 h-px w-[142%] origin-center -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#1c69d4]/25" />
              <span className="absolute top-1/2 left-1/2 h-px w-[142%] origin-center -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#1c69d4]/25" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-[620px]:grid-cols-1">
            <div className="flex justify-end max-[620px]:justify-stretch">
              {canGoPrevious && (
                <button
                  className="min-h-12 w-full max-w-[260px] cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-5 text-[15px] font-semibold text-[#1f2328] transition hover:border-[#1c69d4] max-[620px]:max-w-none"
                  onClick={goToPreviousStep}
                  type="button"
                >
                  Previous: {customizableSteps[activeStepIndex - 1]?.label}
                </button>
              )}
            </div>
            <div className="text-center text-[13px] font-semibold text-[#60656c] max-[620px]:hidden">
              {activeStepIndex + 1} / {customizableSteps.length}
            </div>
            <div className="flex justify-start max-[620px]:justify-stretch">
              <button
                className="min-h-12 w-full max-w-[260px] cursor-pointer rounded-[3px] bg-[#1f2328] px-5 text-[15px] font-semibold text-white transition hover:bg-[#111418] max-[620px]:max-w-none"
                onClick={canGoNext && nextStep?.type !== 'order' ? goToNextStep : goToOrder}
                type="button"
              >
                {canGoNext && nextStep?.type !== 'order' ? `Next: ${nextStep?.label}` : 'Order'}
              </button>
            </div>
          </div>
        </div>

        <aside className="min-w-0 max-[980px]:order-3">
          <div className="sticky top-[104px] max-h-[calc(100svh-128px)] overflow-y-auto rounded-[3px] border border-[#dfe3e8] bg-white shadow-sm max-[980px]:static max-[980px]:max-h-none">
            <div className="border-b border-[#dfe3e8] px-6 py-5">
              <p className="text-[12px] font-semibold text-[#60656c]">Configure</p>
              <h2 className="mt-1 text-[32px] leading-tight font-normal text-[#1f2328] max-[1180px]:text-[26px]">{activeStep?.label}</h2>
            </div>

            <div className="grid gap-5 px-6 py-5">
              <div ref={setSceneTunerTarget} />

          {activeStep?.type === 'paint' && (
            <ColorField
              label={carConfig.paint.label ?? 'Body Color'}
              options={bodyColorOptions}
              value={bodyColor}
              onChange={selectBodyColor}
              getOptionColor={(option) => option.custom ? customBodyColor : option.value}
            />
          )}

          {activeStep?.type === 'rims' && (
            <ColorField
              label={carConfig.rims.label ?? 'Rim Color'}
              options={rimColorOptions}
              value={rimColor}
              onChange={selectRimColor}
              getOptionColor={(option) => option.custom ? customRimColor : option.value}
            />
          )}

          {activeStep?.type === 'calipers' && selectedCaliperOption && (
            <ColorField
              label={carConfig.calipers.label ?? 'Caliper Color'}
              options={caliperColorOptions}
              value={caliperColor}
              onChange={selectCaliperColor}
              getOptionColor={(option) => option.custom ? customCaliperColor : option.value}
            />
          )}

          {activeStep?.type === 'seats' && (
            <>
              {selectedSeatOuterOption && (
                <ColorField
                  label={carConfig.seatOuter.label ?? 'Seat Outer'}
                  options={seatOuterColorOptions}
                  value={seatOuterColor}
                  onChange={selectSeatOuterColor}
                />
              )}
            </>
          )}

          {activeStep?.type === 'addOn' && activeAddOn && (
            <div className="grid gap-3">
              {(() => {
                const isEnabled = Boolean(addOnValues[activeAddOn.id])

                return (
                  <button
                    className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-[3px] border border-[#c9d0d8] bg-white px-4 py-4 text-left text-[14px] font-semibold text-[#1f2328] transition hover:border-[#1c69d4] disabled:cursor-not-allowed disabled:bg-[#f1f2f4] disabled:text-[#7b858f] max-[420px]:px-3"
                    disabled={!sceneReady}
                    onClick={() => toggleAddOn(activeAddOn.id)}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block">{isEnabled ? activeAddOn.removeLabel ?? `Remove ${activeAddOn.name}` : activeAddOn.addLabel ?? `Add ${activeAddOn.name}`}</span>
                      <span className="mt-1 block text-[12px] leading-none font-normal text-[#60656c]">
                        {isEnabled ? activeAddOn.activeLabel ?? `${activeAddOn.name} active` : `${formatPrice(activeAddOn.price ?? 0)} kr`}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${isEnabled ? 'bg-[#1c69d4] text-white' : 'bg-[#eef0f2] text-[#60656c]'}`}>{isEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                )
              })()}
            </div>
          )}

          {activeStep?.type === 'order' && (
            <OrderSummary lines={orderLines} total={money} />
          )}

          {activeCustomPicker && (
            <div
              ref={customPickerRef}
              className="rounded-[3px] border border-[#dfe3e8] bg-[#f8f9fa] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#60656c]">Custom color</p>
                  <h2 className="mt-1 text-[18px] leading-tight font-semibold text-[#1f2328]">
                    {activeCustomPicker === 'body' ? 'Body shade' : activeCustomPicker === 'rim' ? 'Rim finish' : 'Caliper finish'}
                  </h2>
                </div>
                <button
                  className="cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-3 py-1.5 text-[12px] font-semibold"
                  onClick={() => setActiveCustomPicker(null)}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3 max-[420px]:items-start">
                <label className="relative block h-16 w-16 shrink-0 cursor-pointer">
                  <input
                    aria-label={activeCustomPicker === 'body' ? 'Choose custom body color' : activeCustomPicker === 'rim' ? 'Choose custom rim color' : 'Choose custom caliper color'}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(event) => {
                      const color = event.target.value

                      if (activeCustomPicker === 'body') {
                        setCustomBodyColor(color)
                        return
                      }

                      if (activeCustomPicker === 'rim') {
                        setCustomRimColor(color)
                        return
                      }

                      setCustomCaliperColor(color)
                    }}
                    type="color"
                    value={activeCustomPicker === 'body' ? customBodyColor : activeCustomPicker === 'rim' ? customRimColor : customCaliperColor}
                  />
                  <ColorSwatch
                    className="h-16 w-16 rounded-[3px]"
                    color={activeCustomPicker === 'body' ? customBodyColor : activeCustomPicker === 'rim' ? customRimColor : customCaliperColor}
                    custom
                    fillClassName="inset-[5px] rounded-[2px]"
                  />
                </label>
                <div>
                  <p className="text-[13px] font-semibold">
                    {activeCustomPicker === 'body' ? 'Custom body color' : activeCustomPicker === 'rim' ? 'Custom rim color' : 'Custom caliper color'}
                  </p>
                  <p className="mt-1 text-[12px] text-[#60656c]">
                    Adds {formatPrice(activeCustomConfig?.price ?? 0)} kr
                  </p>
                  <p className="mt-2 text-[13px] font-semibold">
                    {(activeCustomPicker === 'body' ? customBodyColor : activeCustomPicker === 'rim' ? customRimColor : customCaliperColor).toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                className="mt-4 w-full cursor-pointer rounded-[3px] bg-[#1c69d4] px-4 py-2.5 text-[13px] font-semibold text-white"
                onClick={() => setActiveCustomPicker(null)}
                type="button"
              >
                Use this color
              </button>
            </div>
          )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

function SceneLoadingPanel() {
  return (
    <div className="grid h-full w-full place-items-center text-center">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#60656c]">Loading scene</p>
        <p className="mt-2 text-[14px] text-[#1f2328]">Preparing the 3D configurator.</p>
      </div>
    </div>
  )
}

export default StartPage
