import { useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import type { Application } from '@splinetool/runtime'

const bodyColorOptions = [
  { name: 'Crimson', value: '#d7263d' },
  { name: 'Sky', value: '#4dabf7' },
  { name: 'Silver', value: '#f2f4f8' },
  { name: 'Graphite', value: '#2b2d42' },
  { name: 'Sunset', value: '#ff7f50' },
]

const rimColorOptions = [
  { name: 'Silver', value: '#d7dce2' },
  { name: 'Gunmetal', value: '#626870' },
  { name: 'Black', value: '#0d0d0f' },
  { name: 'Bronze', value: '#b08d57' },
  { name: 'White', value: '#f5f5f5' },
]

type ColorOption = (typeof bodyColorOptions)[number]

function ColorField({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: ColorOption[]
  value: string
  onChange: (color: string) => void
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0 not-first:mt-[18px] max-sm:!m-0">
      <legend className="mb-[11px] flex w-full justify-between text-[10px]">
        <span className="text-[#3e3c34]">{label}</span>
        <strong className="font-semibold">{selected?.name}</strong>
      </legend>

      <div className="flex gap-2 max-sm:gap-1">
        {options.map((option) => {
          const isSelected = value === option.value

          return (
            <button
              aria-label={`Select ${option.name} for ${label}`}
              aria-pressed={isSelected}
              className={`h-[29px] w-[29px] cursor-pointer rounded-full border bg-transparent p-[3px] transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3b24] max-sm:h-[27px] max-sm:w-[27px] ${
                isSelected ? 'border-[#ff3b24]' : 'border-transparent'
              }`}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <span
                className="block h-full w-full rounded-full border border-black/20"
                style={{ backgroundColor: option.value }}
              />
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function StartPage() {
  const splineRef = useRef<Application | null>(null)
  const [bodyColor, setBodyColor] = useState(bodyColorOptions[0].value)
  const [rimColor, setRimColor] = useState(rimColorOptions[2].value)
  const [sceneReady, setSceneReady] = useState(false)

  const setColor = (objectName: 'Body_Car' | 'Rim_Car', color: string) => {
    const app = splineRef.current
    if (!app) return

    try {
      app.getAllObjects()
        .filter((object) => object.name === objectName)
        .forEach((object) => {
          object.color = color
        })
    } catch (err) {
      console.warn(`${objectName} color update failed`, err)
    }

    app.requestRender?.()
  }

  const selectBodyColor = (color: string) => {
    setBodyColor(color)
    setColor('Body_Car', color)
  }

  const selectRimColor = (color: string) => {
    setRimColor(color)
    setColor('Rim_Car', color)
  }

  return (
    <main className="min-h-svh overflow-hidden bg-[#f1d733] text-[#111]">
      <header className="relative z-20 flex h-[68px] items-center px-7 max-sm:h-14 max-sm:px-4">
        <a className="text-[18px] leading-none font-bold tracking-[-0.05em]" href="#model" aria-label="Apex 3D demo">
          APEX
          <span className="ml-[7px] align-top text-[9px] tracking-[0.12em] text-[#ff3b24]">3D</span>
        </a>
      </header>

      <section className="relative h-[calc(100svh-68px)] px-[3vw] pt-[18px] pb-[34px] max-sm:h-[calc(100svh-56px)] max-sm:p-[10px]" id="model">
        <div className="absolute top-[5%] right-[5%] bottom-[8%] left-[25%] overflow-hidden border-[3px] border-[#111] bg-[#e9e5dc] shadow-[10px_10px_0_#111] max-[900px]:left-[18%] max-sm:top-[20%] max-sm:right-[15px] max-sm:bottom-[39%] max-sm:left-[16%] max-sm:shadow-[6px_6px_0_#111]">
          {!sceneReady && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="h-7 w-7 animate-spin rounded-full border border-[#999] border-t-[#ff3b24]" />
            </div>
          )}

          <Spline
            className="relative z-20 h-full w-full"
            scene="https://prod.spline.design/JXjoDAPatAlM7VoV/scene.splinecode"
            onLoad={(app) => {
              splineRef.current = app
              setSceneReady(true)
              setColor('Body_Car', bodyColor)
              setColor('Rim_Car', rimColor)
            }}
          />

          <div className="absolute bottom-5 left-[22px] z-30 flex items-center gap-[10px] text-[9px] font-semibold tracking-[0.1em] text-[#56524b] uppercase max-sm:bottom-3 max-sm:left-3">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-full border border-current text-[8px]">360°</span>
            Drag to rotate
          </div>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute top-[5%] left-[3vw] z-30 max-sm:top-5 max-sm:left-[18px]">
          <span className="mb-[17px] block text-[10px] font-bold tracking-[0.2em] text-[#e22e1d]">INTERACTIVE</span>
          <strong className="block text-[clamp(44px,5.4vw,84px)] leading-[0.76] font-black tracking-[-0.08em] max-[900px]:text-[58px] max-sm:text-[42px]">
            MODEL<br />VIEWER
          </strong>
          <small className="mt-7 block text-[9px] font-bold tracking-[0.15em] max-sm:hidden">ROTATE / RECOLOR / EXPLORE</small>
        </div>

        <aside className="absolute bottom-[9%] left-[3vw] z-40 w-[220px] max-[900px]:w-[180px] max-sm:right-[18px] max-sm:bottom-7 max-sm:left-[18px] max-sm:grid max-sm:w-auto max-sm:grid-cols-2 max-sm:gap-[14px]">
          <div className="border-b border-[#111] pb-[13px] text-[9px] font-bold tracking-[0.12em] uppercase max-sm:hidden">
            Choose color
          </div>
          <ColorField label="Body_Car" options={bodyColorOptions} value={bodyColor} onChange={selectBodyColor} />
          <ColorField label="Rim_Car" options={rimColorOptions} value={rimColor} onChange={selectRimColor} />
        </aside>
      </section>
    </main>
  )
}

export default StartPage
