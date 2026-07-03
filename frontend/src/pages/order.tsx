import { Suspense, lazy, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import OrderSummary from './OrderSummary'
import { carConfigs, defaultCarConfig } from '../cars'
import { resolveColorOptions } from '../cars/colors'

const CarScene = lazy(() => import('../components/CarScene'))

function formatPrice(price: number) {
  return new Intl.NumberFormat('nb-NO').format(price)
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

function getColorOptions(colorConfig) {
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

function getDefaultColorValue(colorConfig) {
  const colors = resolveColorOptions(colorConfig)
  const defaultOption = colors.find((option) => option.value === colorConfig.defaultValue || option.name === colorConfig.defaultValue)

  return defaultOption?.value ?? colors[0]?.value
}

function hasColorConfig(colorConfig) {
  return Boolean(colorConfig?.colors?.length)
}

function getSelectedColorOption(colorConfig, savedValue) {
  const options = getColorOptions(colorConfig)

  return options.find((option) => option.value === savedValue) ?? options.find((option) => option.value === getDefaultColorValue(colorConfig)) ?? options[0]
}

function OrderPage() {
  const navigate = useNavigate()
  const { carId } = useParams()
  const selectedCarId = carId ? decodeURIComponent(carId) : defaultCarConfig.id
  const carConfig = useMemo(
    () => carConfigs.find((config) => config.id === selectedCarId) ?? defaultCarConfig,
    [selectedCarId],
  )
  const savedBuild = useMemo(() => readSavedBuild(carConfig.id), [carConfig.id])
  const selectedBodyOption = getSelectedColorOption(carConfig.paint, savedBuild?.bodyColor)
  const selectedRimOption = getSelectedColorOption(carConfig.rims, savedBuild?.rimColor)
  const selectedCaliperOption = hasColorConfig(carConfig.calipers)
    ? getSelectedColorOption(carConfig.calipers, savedBuild?.caliperColor)
    : null
  const selectedSeatOuterOption = hasColorConfig(carConfig.seatOuter)
    ? getSelectedColorOption(carConfig.seatOuter, savedBuild?.seatOuterColor)
    : null
  const effectiveBodyColor = selectedBodyOption.custom ? savedBuild?.customBodyColor ?? selectedBodyOption.value : selectedBodyOption.value
  const effectiveRimColor = selectedRimOption.custom ? savedBuild?.customRimColor ?? selectedRimOption.value : selectedRimOption.value
  const effectiveCaliperColor = selectedCaliperOption?.custom ? savedBuild?.customCaliperColor ?? selectedCaliperOption.value : selectedCaliperOption?.value
  const effectiveSeatOuterColor = selectedSeatOuterOption?.value
  const addOnValues = savedBuild?.addOnValues ?? {}
  const selectedAddOns = (carConfig.addOns ?? []).filter((addOn) => Boolean(savedBuild?.addOnValues?.[addOn.id]))
  const orderScene = {
    ...carConfig.scene,
    cameraAngle: 18,
    cameraHeight: 1.05,
    zoom: 7.2,
    fov: 45,
    carAngle: 0,
    target: [0, 0.15, 0],
    intro: {
      enabled: false,
    },
  }
  const orderLines = [
    {
      id: 'base',
      label: 'Model',
      value: carConfig.name,
      price: carConfig.basePrice ?? 0,
    },
    {
      id: 'paint',
      label: carConfig.paint.label ?? 'Body Color',
      value: selectedBodyOption.custom ? `${selectedBodyOption.name} ${(savedBuild?.customBodyColor ?? '').toUpperCase()}` : selectedBodyOption.name,
      price: selectedBodyOption.price,
      color: effectiveBodyColor,
      customColor: selectedBodyOption.custom,
    },
    {
      id: 'rims',
      label: carConfig.rims.label ?? 'Rim Color',
      value: selectedRimOption.custom ? `${selectedRimOption.name} ${(savedBuild?.customRimColor ?? '').toUpperCase()}` : selectedRimOption.name,
      price: selectedRimOption.price,
      color: effectiveRimColor,
      customColor: selectedRimOption.custom,
    },
    ...(selectedCaliperOption
      ? [
          {
            id: 'calipers',
            label: carConfig.calipers.label ?? 'Caliper Color',
            value: selectedCaliperOption.custom ? `${selectedCaliperOption.name} ${(savedBuild?.customCaliperColor ?? '').toUpperCase()}` : selectedCaliperOption.name,
            price: selectedCaliperOption.price,
            color: effectiveCaliperColor,
            customColor: selectedCaliperOption.custom,
          },
        ]
      : []),
    ...(selectedSeatOuterOption
      ? [
          {
            id: 'seatOuter',
            label: carConfig.seatOuter.label ?? 'Seat Outer',
            value: selectedSeatOuterOption.name,
            price: selectedSeatOuterOption.price,
            color: effectiveSeatOuterColor,
            customColor: selectedSeatOuterOption.custom,
          },
        ]
      : []),
    ...selectedAddOns.map((addOn: { id: any; name: any; price: any }) => ({
      id: `addOn:${addOn.id}`,
      label: 'Add-on',
      value: addOn.name,
      price: addOn.price ?? 0,
    })),
  ]
  const total = orderLines.reduce((sum, line) => sum + line.price, 0)

  return (
    <main className="min-h-svh bg-[#f5f4f2] text-[#1f2328]">
      <Header
        metricLabel="Totalpris"
        metricValue={formatPrice(total) + ' kr'}
        onLogoClick={() => navigate(`/cars/${encodeURIComponent(carConfig.id)}`)}
        subtitle="Order"
        title={carConfig.name}
      />

      <section className="mx-auto grid min-h-[calc(100svh-81px)] max-w-[1180px] grid-cols-[minmax(0,1fr)_390px] gap-8 px-8 py-10 max-[900px]:grid-cols-1 max-[760px]:px-4 max-[760px]:py-6">
        <div className="rounded-[3px] border border-[#dfe3e8] bg-white p-8 shadow-sm max-[760px]:p-5">
          <div className="mb-8 h-[430px] overflow-hidden rounded-[3px] border border-[#dfe3e8] bg-[#ebe8e3] max-[760px]:h-[320px]">
            <Suspense fallback={<SceneLoadingPanel />}>
              <CarScene
                addOnValues={addOnValues}
                autoSpin
                caliperColor={effectiveCaliperColor}
                caliperMaterial={selectedCaliperOption?.material}
                carColor={effectiveBodyColor}
                carConfig={carConfig}
                centerModel
                paintMaterial={selectedBodyOption.material}
                presentationMode
                rimColor={effectiveRimColor}
                rimMaterial={selectedRimOption.material}
                sceneConfig={carConfig.orderScene ?? orderScene}
                seatOuterColor={effectiveSeatOuterColor}
                seatOuterMaterial={selectedSeatOuterOption?.material}
                spinSpeed={0.09}
              />
            </Suspense>
          </div>

          <p className="text-[13px] font-semibold text-[#60656c]">Order overview</p>
          <h2 className="mt-3 max-w-[760px] text-[clamp(38px,6vw,72px)] leading-[0.96] font-normal tracking-[-0.04em]">
            Review your configuration
          </h2>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="h-12 cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-5 text-[15px] font-semibold transition hover:border-[#1c69d4]"
              onClick={() => navigate(`/cars/${encodeURIComponent(carConfig.id)}`)}
              type="button"
            >
              Back to customize
            </button>
            <button
              className="h-12 cursor-pointer rounded-[3px] bg-[#1c69d4] px-6 text-[15px] font-semibold text-white transition hover:bg-[#1654aa]"
              type="button"
            >
              Place order
            </button>
          </div>
        </div>

        <aside className="rounded-[3px] border border-[#dfe3e8] bg-white p-5 shadow-sm">
          <OrderSummary lines={orderLines} total={total} />
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
        <p className="mt-2 text-[14px] text-[#1f2328]">Preparing the 3D preview.</p>
      </div>
    </div>
  )
}

export default OrderPage
