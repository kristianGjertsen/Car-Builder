import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BuildConfigPanel from '../components/builder/BuildConfigPanel'
import BuildScenePanel from '../components/builder/BuildScenePanel'
import BuildStepper from '../components/builder/BuildStepper'
import Header from '../components/Header'
import CarSelectPage from './CarSelectPage'
import { carConfigs, defaultCarConfig } from '../cars'
import { getCustomizableSteps } from '../builder/customizationSteps'
import {
  ColorOption,
  formatPrice,
  getColorOptions,
  getDefaultAddOnValues,
  getDefaultColorValue,
  getOrderLines,
  getSelectedAddOns,
  hasColorConfig,
  readSavedBuild,
  saveBuild,
} from '../builder/buildUtils'

function StartPage() {
  const navigate = useNavigate()
  const { carId } = useParams()
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
  const activeScenePosition = activeScenePositions[activeScenePositionIndex]
  const activeSceneConfig = activeScenePositions[activeScenePositionIndex]?.scene ?? activeStep?.scene ?? carConfig.scene
  const bodyColorOptions = useMemo(() => getColorOptions(carConfig.paint), [carConfig])
  const rimColorOptions = useMemo(() => getColorOptions(carConfig.rims), [carConfig])
  const caliperColorOptions = useMemo(() => hasColorConfig(carConfig.calipers) ? getColorOptions(carConfig.calipers) : [], [carConfig])
  const glassTintColorOptions = useMemo(() => hasColorConfig(carConfig.glassTint) ? getColorOptions(carConfig.glassTint) : [], [carConfig])
  const seatOuterColorOptions = useMemo(() => hasColorConfig(carConfig.seatOuter) ? getColorOptions(carConfig.seatOuter) : [], [carConfig])
  const [bodyColor, setBodyColor] = useState(() => getDefaultColorValue(defaultCarConfig.paint))
  const [rimColor, setRimColor] = useState(() => getDefaultColorValue(defaultCarConfig.rims))
  const [caliperColor, setCaliperColor] = useState(() => hasColorConfig(defaultCarConfig.calipers) ? getDefaultColorValue(defaultCarConfig.calipers) : '#d71920')
  const [glassTintColor, setGlassTintColor] = useState(() => hasColorConfig(defaultCarConfig.glassTint) ? getDefaultColorValue(defaultCarConfig.glassTint) : '#9fb4c4')
  const [seatOuterColor, setSeatOuterColor] = useState(() => hasColorConfig(defaultCarConfig.seatOuter) ? getDefaultColorValue(defaultCarConfig.seatOuter) : '#1f1b1a')
  const [addOnValues, setAddOnValues] = useState(() => getDefaultAddOnValues(defaultCarConfig))
  const [sceneReady, setSceneReady] = useState(false)
  const selectedBodyOption = bodyColorOptions.find((option) => option.value === bodyColor) ?? bodyColorOptions[0]
  const selectedRimOption = rimColorOptions.find((option) => option.value === rimColor) ?? rimColorOptions[0]
  const selectedCaliperOption = caliperColorOptions.find((option) => option.value === caliperColor) ?? caliperColorOptions[0]
  const selectedGlassTintOption = glassTintColorOptions.find((option) => option.value === glassTintColor) ?? glassTintColorOptions[0]
  const selectedSeatOuterOption = seatOuterColorOptions.find((option) => option.value === seatOuterColor) ?? seatOuterColorOptions[0]
  const effectiveBodyColor = selectedBodyOption.value
  const effectiveRimColor = selectedRimOption.value
  const effectiveCaliperColor = selectedCaliperOption?.value
  const effectiveGlassTintColor = selectedGlassTintOption?.value
  const effectiveSeatOuterColor = selectedSeatOuterOption?.value
  const activeAddOn = activeStep?.type === 'addOn'
    ? (carConfig.addOns ?? []).find((addOn) => addOn.id === activeStep.addOnId)
    : null
  const addOnTotal = (carConfig.addOns ?? []).reduce((total, addOn) => total + (addOnValues[addOn.id] ? addOn.price ?? 0 : 0), 0)
  const caliperPrice = selectedCaliperOption?.price ?? 0
  const glassTintPrice = selectedGlassTintOption?.price ?? 0
  const seatOuterPrice = selectedSeatOuterOption?.price ?? 0
  const money = (carConfig.basePrice ?? 0) + selectedBodyOption.price + selectedRimOption.price + caliperPrice + glassTintPrice + seatOuterPrice + addOnTotal
  const orderLines = useMemo(() => getOrderLines({
    carConfig,
    effectiveGlassTintColor,
    selectedAddOns: getSelectedAddOns(carConfig, addOnValues),
    selectedBodyOption,
    selectedCaliperOption,
    selectedGlassTintOption,
    selectedRimOption,
    selectedSeatOuterOption,
  }), [addOnValues, carConfig, effectiveGlassTintColor, selectedBodyOption, selectedCaliperOption, selectedGlassTintOption, selectedRimOption, selectedSeatOuterOption])
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
    setActiveScenePositionIndex(0)
    setActiveStepIndex((currentIndex) => Math.max(currentIndex - 1, 0))
  }

  const goToNextStep = () => {
    setActiveScenePositionIndex(0)
    setActiveStepIndex((currentIndex) => Math.min(currentIndex + 1, customizableSteps.length - 1))
  }

  const goToStep = (stepIndex: number) => {
    setActiveScenePositionIndex(0)

    if (customizableSteps[stepIndex]?.type === 'order') {
      navigate(`/cars/${encodeURIComponent(carConfig.id)}/order`)
      return
    }

    setActiveStepIndex(Math.min(Math.max(stepIndex, 0), customizableSteps.length - 1))
  }

  const goToOrder = () => {
    navigate(`/cars/${encodeURIComponent(carConfig.id)}/order`)
  }

  const resetBuild = () => {
    setActiveStepIndex(0)
    setActiveScenePositionIndex(0)
    setBodyColor(getDefaultColorValue(carConfig.paint))
    setRimColor(getDefaultColorValue(carConfig.rims))
    setCaliperColor(hasColorConfig(carConfig.calipers) ? getDefaultColorValue(carConfig.calipers) : '#d71920')
    setGlassTintColor(hasColorConfig(carConfig.glassTint) ? getDefaultColorValue(carConfig.glassTint) : '#9fb4c4')
    setSeatOuterColor(hasColorConfig(carConfig.seatOuter) ? getDefaultColorValue(carConfig.seatOuter) : '#1f1b1a')
    setAddOnValues(getDefaultAddOnValues(carConfig))
  }

  const selectBodyColor = (option: ColorOption) => {
    setBodyColor(option.value)
  }

  useEffect(() => {
    const savedBuild = readSavedBuild(carConfig.id)
    const defaultAddOnValues = getDefaultAddOnValues(carConfig)

    setSceneReady(false)
    setBodyColor(savedBuild?.bodyColor ?? getDefaultColorValue(carConfig.paint))
    setRimColor(savedBuild?.rimColor ?? getDefaultColorValue(carConfig.rims))
    setCaliperColor(savedBuild?.caliperColor ?? (hasColorConfig(carConfig.calipers) ? getDefaultColorValue(carConfig.calipers) : '#d71920'))
    setGlassTintColor(savedBuild?.glassTintColor ?? (hasColorConfig(carConfig.glassTint) ? getDefaultColorValue(carConfig.glassTint) : '#9fb4c4'))
    setSeatOuterColor(savedBuild?.seatOuterColor ?? (hasColorConfig(carConfig.seatOuter) ? getDefaultColorValue(carConfig.seatOuter) : '#1f1b1a'))
    setAddOnValues({
      ...defaultAddOnValues,
      ...(savedBuild?.addOnValues ?? {}),
    })
    setActiveStepIndex(0)
    setActiveScenePositionIndex(0)
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
      glassTintColor,
      seatOuterColor,
      addOnValues,
    })
  }, [
    activeStep?.id,
    activeStepIndex,
    addOnValues,
    bodyColor,
    caliperColor,
    carConfig.id,
    glassTintColor,
    seatOuterColor,
    restoredCarId,
    rimColor,
  ])

  const selectRimColor = (option: ColorOption) => {
    setRimColor(option.value)
  }

  const selectCaliperColor = (option: ColorOption) => {
    setCaliperColor(option.value)
  }

  const selectSeatOuterColor = (option: ColorOption) => {
    setSeatOuterColor(option.value)
  }

  const selectGlassTintColor = (option: ColorOption) => {
    setGlassTintColor(option.value)
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
        <BuildStepper
          activeStepIndex={activeStepIndex}
          customizableSteps={customizableSteps}
          onStepClick={goToStep}
        />

        <BuildScenePanel
          activeScenePositionIndex={activeScenePositionIndex}
          activeScenePositions={activeScenePositions}
          activeStepIndex={activeStepIndex}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          carSceneKey={carConfig.id}
          carSceneProps={{
            addOnValues,
            caliperMaterial: selectedCaliperOption?.material,
            caliperColor: effectiveCaliperColor,
            carColor: effectiveBodyColor,
            carConfig,
            glassTintColor: effectiveGlassTintColor,
            glassTintMaterial: selectedGlassTintOption?.material,
            onReady: handleSceneReady,
            paintMaterial: selectedBodyOption.material,
            rimColor: effectiveRimColor,
            rimMaterial: selectedRimOption.material,
            sceneConfig: activeSceneConfig,
            sceneGroupKey: activeStep?.id ?? 'default',
            scenePositionKey: activeScenePosition?.id ?? 'default',
            sceneTunerTarget,
            seatOuterColor: effectiveSeatOuterColor,
            seatOuterMaterial: selectedSeatOuterOption?.material,
            usePanelSceneTuner: true,
          }}
          customizableSteps={customizableSteps}
          nextStep={nextStep}
          onNextStep={goToNextStep}
          onOrder={goToOrder}
          onPreviousStep={goToPreviousStep}
          onScenePositionChange={setActiveScenePositionIndex}
        />

        <BuildConfigPanel
          activeAddOn={activeAddOn}
          activeStep={activeStep}
          addOnValues={addOnValues}
          bodyColor={bodyColor}
          bodyColorOptions={bodyColorOptions}
          caliperColor={caliperColor}
          caliperColorOptions={caliperColorOptions}
          carConfig={carConfig}
          glassTintColor={glassTintColor}
          glassTintColorOptions={glassTintColorOptions}
          money={money}
          orderLines={orderLines}
          rimColor={rimColor}
          rimColorOptions={rimColorOptions}
          sceneReady={sceneReady}
          seatOuterColor={seatOuterColor}
          seatOuterColorOptions={seatOuterColorOptions}
          selectBodyColor={selectBodyColor}
          selectCaliperColor={selectCaliperColor}
          selectGlassTintColor={selectGlassTintColor}
          selectRimColor={selectRimColor}
          selectSeatOuterColor={selectSeatOuterColor}
          selectedCaliperOption={selectedCaliperOption}
          selectedSeatOuterOption={selectedSeatOuterOption}
          setSceneTunerTarget={setSceneTunerTarget}
          toggleAddOn={toggleAddOn}
        />
      </section>
    </main>
  )
}

export default StartPage
