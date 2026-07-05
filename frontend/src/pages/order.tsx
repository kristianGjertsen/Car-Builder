import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import OrderDisplay from '../components/builder/OrderDisplay'
import OrderSummary from '../components/builder/OrderSummary'
import Header from '../components/Header'
import { carConfigs, defaultCarConfig } from '../cars'
import { getOrderDisplayConfig } from '../builder/customizationSteps'
import {
  formatPrice,
  getOrderLines,
  getSelectedAddOns,
  getSelectedColorOption,
  hasColorConfig,
  readSavedBuild,
} from '../builder/buildUtils'

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
  const selectedGlassTintOption = hasColorConfig(carConfig.glassTint)
    ? getSelectedColorOption(carConfig.glassTint, savedBuild?.glassTintColor)
    : null
  const selectedSeatOuterOption = hasColorConfig(carConfig.seatOuter)
    ? getSelectedColorOption(carConfig.seatOuter, savedBuild?.seatOuterColor)
    : null
  const effectiveBodyColor = selectedBodyOption.value
  const effectiveRimColor = selectedRimOption.value
  const effectiveCaliperColor = selectedCaliperOption?.value
  const effectiveGlassTintColor = selectedGlassTintOption?.value
  const effectiveSeatOuterColor = selectedSeatOuterOption?.value
  const addOnValues = savedBuild?.addOnValues ?? {}
  const selectedAddOns = getSelectedAddOns(carConfig, savedBuild?.addOnValues ?? {})
  const fallbackOrderScene = useMemo(() => ({
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
  }), [carConfig])
  const orderDisplay = useMemo(() => getOrderDisplayConfig(carConfig, fallbackOrderScene), [carConfig, fallbackOrderScene])
  const orderLines = getOrderLines({
    carConfig,
    effectiveBodyColor,
    effectiveCaliperColor,
    effectiveGlassTintColor,
    effectiveRimColor,
    effectiveSeatOuterColor,
    includeColorMetadata: true,
    selectedAddOns,
    selectedBodyOption,
    selectedCaliperOption,
    selectedGlassTintOption,
    selectedRimOption,
    selectedSeatOuterOption,
  })
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
          <OrderDisplay
            carSceneProps={{
              addOnValues,
              caliperColor: effectiveCaliperColor,
              caliperMaterial: selectedCaliperOption?.material,
              carColor: effectiveBodyColor,
              carConfig,
              glassTintColor: effectiveGlassTintColor,
              glassTintMaterial: selectedGlassTintOption?.material,
              paintMaterial: selectedBodyOption.material,
              rimColor: effectiveRimColor,
              rimMaterial: selectedRimOption.material,
              seatOuterColor: effectiveSeatOuterColor,
              seatOuterMaterial: selectedSeatOuterOption?.material,
            }}
            scene={orderDisplay.scene}
            scenePositions={orderDisplay.scenePositions}
          />

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

export default OrderPage
