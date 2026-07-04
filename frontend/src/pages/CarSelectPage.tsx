import Header from '../components/Header'
import CarCard from '../components/builder/CarCard'

type CarSelectPageProps = {
  carConfigs: any[]
  onSelectCar: (carId: string) => void
  selectedCarId: string
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

            return (
              <CarCard
                config={config}
                isSelected={isSelected}
                key={config.id}
                onSelect={() => onSelectCar(config.id)}
              />
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default CarSelectPage
