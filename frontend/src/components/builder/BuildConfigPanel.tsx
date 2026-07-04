import ColorField from './ColorField'
import CustomColorPicker from './CustomColorPicker'
import OrderSummary from './OrderSummary'
import { ColorOption, OrderLine, formatPrice } from '../../builder/buildUtils'

function BuildConfigPanel({
  activeAddOn,
  activeCustomConfig,
  activeCustomPicker,
  activeStep,
  addOnValues,
  bodyColor,
  bodyColorOptions,
  caliperColor,
  caliperColorOptions,
  carConfig,
  customBodyColor,
  customCaliperColor,
  customPickerRef,
  customRimColor,
  money,
  onCustomPickerClose,
  orderLines,
  rimColor,
  rimColorOptions,
  sceneReady,
  seatOuterColor,
  seatOuterColorOptions,
  selectBodyColor,
  selectCaliperColor,
  selectRimColor,
  selectSeatOuterColor,
  selectedCaliperOption,
  selectedSeatOuterOption,
  setCustomBodyColor,
  setCustomCaliperColor,
  setCustomRimColor,
  setSceneTunerTarget,
  toggleAddOn,
}: {
  activeAddOn: any
  activeCustomConfig: any
  activeCustomPicker: 'body' | 'rim' | 'caliper' | null
  activeStep: any
  addOnValues: Record<string, boolean>
  bodyColor: string
  bodyColorOptions: ColorOption[]
  caliperColor: string
  caliperColorOptions: ColorOption[]
  carConfig: any
  customBodyColor: string
  customCaliperColor: string
  customPickerRef: any
  customRimColor: string
  money: number
  onCustomPickerClose: () => void
  orderLines: OrderLine[]
  rimColor: string
  rimColorOptions: ColorOption[]
  sceneReady: boolean
  seatOuterColor: string
  seatOuterColorOptions: ColorOption[]
  selectBodyColor: (option: ColorOption) => void
  selectCaliperColor: (option: ColorOption) => void
  selectRimColor: (option: ColorOption) => void
  selectSeatOuterColor: (option: ColorOption) => void
  selectedCaliperOption?: ColorOption
  selectedSeatOuterOption?: ColorOption
  setCustomBodyColor: (color: string) => void
  setCustomCaliperColor: (color: string) => void
  setCustomRimColor: (color: string) => void
  setSceneTunerTarget: (node: HTMLDivElement | null) => void
  toggleAddOn: (addOnId: string) => void
}) {
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
            <CustomColorPicker
              activeCustomConfig={activeCustomConfig}
              activeCustomPicker={activeCustomPicker}
              customBodyColor={customBodyColor}
              customCaliperColor={customCaliperColor}
              customPickerRef={customPickerRef}
              customRimColor={customRimColor}
              onClose={onCustomPickerClose}
              setCustomBodyColor={setCustomBodyColor}
              setCustomCaliperColor={setCustomCaliperColor}
              setCustomRimColor={setCustomRimColor}
            />
          )}
        </div>
      </div>
    </aside>
  )
}

export default BuildConfigPanel
