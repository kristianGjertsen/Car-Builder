import Header from '../components/Header'
import { resolveColorOptions } from '../cars/colors'

type CarSelectPageProps = {
  carConfigs: any[]
  onSelectCar: (carId: string) => void
  selectedCarId: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('nb-NO').format(price)
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

function CarSelectPage({ carConfigs, onSelectCar, selectedCarId }: CarSelectPageProps) {
  return (
    <main className="min-h-svh bg-[#f5f4f2] text-[#1f2328]">
      <Header metricLabel="Models" metricValue={String(carConfigs.length)} subtitle="Select model" title="Car Builder" />

      <section className="mx-auto grid min-h-[calc(100svh-81px)] max-w-[1280px] grid-rows-[auto_1fr] gap-8 px-8 py-10 max-[760px]:px-4 max-[760px]:py-6">
        <div className="max-w-[760px]">
          <p className="text-[13px] font-semibold text-[#60656c]">Choose your vehicle</p>
          <h2 className="mt-3 text-[clamp(38px,6vw,76px)] leading-[0.96] font-normal tracking-[-0.04em] text-[#1f2328]">
            Start your configuration
          </h2>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] content-start gap-5">
          {carConfigs.map((config) => {
            const isSelected = selectedCarId === config.id
            const paintColors = getColorOptions(config.paint).slice(0, 5)
            const rimColors = getColorOptions(config.rims).slice(0, 4)

            return (
              <button
                className={`group cursor-pointer rounded-[3px] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1c69d4] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1c69d4] ${isSelected ? 'border-[#1c69d4] ring-1 ring-[#1c69d4]' : 'border-[#dfe3e8]'}`}
                key={config.id}
                onClick={() => onSelectCar(config.id)}
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
          })}
        </div>
      </section>
    </main>
  )
}

export default CarSelectPage
