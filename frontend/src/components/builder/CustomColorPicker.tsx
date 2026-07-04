import ColorSwatch from '../ColorSwatch'
import { formatPrice } from '../../builder/buildUtils'

function CustomColorPicker({
  activeCustomConfig,
  activeCustomPicker,
  customBodyColor,
  customCaliperColor,
  customPickerRef,
  customRimColor,
  onClose,
  setCustomBodyColor,
  setCustomCaliperColor,
  setCustomRimColor,
}: {
  activeCustomConfig: any
  activeCustomPicker: 'body' | 'rim' | 'caliper'
  customBodyColor: string
  customCaliperColor: string
  customPickerRef: any
  customRimColor: string
  onClose: () => void
  setCustomBodyColor: (color: string) => void
  setCustomCaliperColor: (color: string) => void
  setCustomRimColor: (color: string) => void
}) {
  const selectedColor = activeCustomPicker === 'body' ? customBodyColor : activeCustomPicker === 'rim' ? customRimColor : customCaliperColor

  return (
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
          onClick={onClose}
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
            value={selectedColor}
          />
          <ColorSwatch
            className="h-16 w-16 rounded-[3px]"
            color={selectedColor}
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
            {selectedColor.toUpperCase()}
          </p>
        </div>
      </div>

      <button
        className="mt-4 w-full cursor-pointer rounded-[3px] bg-[#1c69d4] px-4 py-2.5 text-[13px] font-semibold text-white"
        onClick={onClose}
        type="button"
      >
        Use this color
      </button>
    </div>
  )
}

export default CustomColorPicker
