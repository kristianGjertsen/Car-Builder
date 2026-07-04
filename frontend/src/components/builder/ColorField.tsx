import ColorSwatch from '../ColorSwatch'
import { ColorOption, formatPrice } from '../../builder/buildUtils'

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
              className={`flex min-h-[92px] cursor-pointer items-center gap-3 rounded-[2px] border bg-white px-3 py-3 text-left transition hover:border-[#1c69d4] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c69d4] ${isSelected ? 'border-[#1c69d4] ring-1 ring-[#1c69d4]' : 'border-[#d7dce2]'}`}
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

export default ColorField
