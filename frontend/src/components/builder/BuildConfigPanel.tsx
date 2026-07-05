import ColorField from './ColorField'
import OrderSummary from './OrderSummary'
import { ColorOption, OrderLine, formatPrice, getColorOptions } from '../../builder/buildUtils'

function BuildConfigPanel({
  activeAddOn,
  activeStep,
  addOnValues,
  bodyColor,
  bodyColorOptions,
  caliperColor,
  caliperColorOptions,
  carConfig,
  glassTintColor,
  glassTintColorOptions = [],
  money,
  orderLines,
  rimColor,
  rimColorOptions,
  sceneReady,
  seatOuterColor,
  seatOuterColorOptions,
  selectBodyColor,
  selectCaliperColor,
  selectGlassTintColor = () => {},
  selectRimColor,
  selectSeatOuterColor,
  selectedCaliperOption,
  selectedSeatOuterOption,
  setSceneTunerTarget,
  toggleAddOn,
}: {
  activeAddOn: any
  activeStep: any
  addOnValues: Record<string, boolean>
  bodyColor: string
  bodyColorOptions: ColorOption[]
  caliperColor: string
  caliperColorOptions: ColorOption[]
  carConfig: any
  glassTintColor: string
  glassTintColorOptions?: ColorOption[]
  money: number
  orderLines: OrderLine[]
  rimColor: string
  rimColorOptions: ColorOption[]
  sceneReady: boolean
  seatOuterColor: string
  seatOuterColorOptions: ColorOption[]
  selectBodyColor: (option: ColorOption) => void
  selectCaliperColor: (option: ColorOption) => void
  selectGlassTintColor?: (option: ColorOption) => void
  selectRimColor: (option: ColorOption) => void
  selectSeatOuterColor: (option: ColorOption) => void
  selectedCaliperOption?: ColorOption
  selectedSeatOuterOption?: ColorOption
  setSceneTunerTarget: (node: HTMLDivElement | null) => void
  toggleAddOn: (addOnId: string) => void
}) {
  const resolvedGlassTintColorOptions = glassTintColorOptions.length > 0
    ? glassTintColorOptions
    : (carConfig.glassTint?.colors?.length ? getColorOptions(carConfig.glassTint) : [])
  const handleGlassTintSelect = (option: ColorOption) => {
    selectGlassTintColor(option)
  }

  return (
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
            />
          )}

          {activeStep?.type === 'rims' && (
            <ColorField
              label={carConfig.rims.label ?? 'Rim Color'}
              options={rimColorOptions}
              value={rimColor}
              onChange={selectRimColor}
            />
          )}

          {activeStep?.type === 'calipers' && selectedCaliperOption && (
            <ColorField
              label={carConfig.calipers.label ?? 'Caliper Color'}
              options={caliperColorOptions}
              value={caliperColor}
              onChange={selectCaliperColor}
            />
          )}

          {activeStep?.type === 'glassTint' && resolvedGlassTintColorOptions.length > 0 && (
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-4 flex w-full justify-between gap-4 text-[12px]">
                <span className="font-semibold text-[#60656c]">{carConfig.glassTint.label ?? 'Window Tint'}</span>
                <strong className="font-semibold text-[#1f2328]">
                  {resolvedGlassTintColorOptions.find((option) => option.value === glassTintColor)?.name}
                </strong>
              </legend>

              <div className="grid gap-3">
                {resolvedGlassTintColorOptions.map((option) => {
                  const isSelected = glassTintColor === option.value

                  return (
                    <button
                      className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-[3px] border px-4 py-4 text-left transition max-[420px]:px-3 ${isSelected ? 'border-[#1c69d4] bg-[#eef4ff]' : 'border-[#c9d0d8] bg-white hover:border-[#1c69d4]'}`}
                      key={option.value}
                      onClick={() => handleGlassTintSelect(option)}
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-[#1f2328]">{option.name}</span>
                        <span className="mt-1 block text-[12px] leading-none text-[#60656c]">{formatPrice(option.price)} kr</span>
                      </span>
                      {isSelected && (
                        <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1c69d4] text-[12px] font-bold text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </fieldset>
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
        </div>
      </div>
    </aside>
  )
}

export default BuildConfigPanel
