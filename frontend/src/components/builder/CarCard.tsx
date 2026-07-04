import { formatPrice, getColorOptions } from '../../builder/buildUtils'

function CarCard({
  config,
  isSelected,
  onSelect,
}: {
  config: any
  isSelected: boolean
  onSelect: () => void
}) {
  const paintColors = getColorOptions(config.paint).slice(0, 5)
  const rimColors = getColorOptions(config.rims).slice(0, 4)

  return (
    <button
      className={`group cursor-pointer rounded-[3px] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1c69d4] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1c69d4] ${isSelected ? 'border-[#1c69d4] ring-1 ring-[#1c69d4]' : 'border-[#dfe3e8]'}`}
      onClick={onSelect}
      type="button"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold text-[#60656c]">Model</p>
          <h3 className="mt-2 text-[26px] leading-tight font-semibold tracking-[-0.03em] text-[#1f2328]">{config.name}</h3>
        </div>
        <span className="rounded-[3px] bg-[#1c69d4] px-4 py-2 text-[13px] font-semibold text-white transition group-hover:bg-[#1654aa]">
          Build
        </span>
      </div>

      <div className="mb-5 grid h-40 place-items-center rounded-[18px] border border-[#dfe3e8] bg-[#ebe8e3]">
        <span className="text-[64px] leading-none font-semibold tracking-[-0.08em] text-[#c4c8ce]">{config.name.slice(0, 2).toUpperCase()}</span>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[#dfe3e8] pt-4">
        <div>
          <p className="text-[12px] font-semibold text-[#60656c]">From</p>
          <p className="mt-1 text-[20px] leading-none font-semibold text-[#1f2328]">{formatPrice(config.basePrice ?? 0)} kr</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1.5">
            {paintColors.map((color) => (
              <span className="h-5 w-5 rounded-full border border-black/15" key={color.value} style={{ background: color.value }} />
            ))}
          </div>
          <div className="flex gap-1.5">
            {rimColors.map((color) => (
              <span className="h-3 w-3 rounded-full border border-black/15" key={color.value} style={{ background: color.value }} />
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}

export default CarCard
