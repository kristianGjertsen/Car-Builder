import { useEffect, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import type { Application, SPEObject } from '@splinetool/runtime'

const customBodyColorValue = '__custom_body_color__'
const customRimColorValue = '__custom_rim_color__'

const bodyColorOptions = [
  { name: 'Crimson', value: '#d7263d', price: 0 },
  { name: 'Sky', value: '#4dabf7', price: 7900 },
  { name: 'Silver', value: '#f2f4f8', price: 12900 },
  { name: 'Graphite', value: '#2b2d42', price: 18900 },
  { name: 'Sunset', value: '#ff7f50', price: 14900 },
  { name: 'Custom', value: customBodyColorValue, price: 30000, custom: true },
]

const rimColorOptions = [
  { name: 'Silver', value: '#d7dce2', price: 0 },
  { name: 'Gunmetal', value: '#626870', price: 5900 },
  { name: 'Black', value: '#0d0d0f', price: 5900 },
  { name: 'Bronze', value: '#b08d57', price: 9900 },
  { name: 'White', value: '#f5f5f5', price: 3900 },
  { name: 'Custom', value: customRimColorValue, price: 18000, custom: true },
]

type ColorOption = {
  name: string
  value: string
  price: number
  custom?: boolean
}
const basePrice = 730000
const wingPrice = 25000
const wingObjectNames = ['Wing', 'Object_50', 'Object_51']

function formatPrice(price: number) {
  return new Intl.NumberFormat('nb-NO').format(price)
}

function getCustomPreviewBackground(color: string) {
  return `linear-gradient(135deg, #111 0 18%, transparent 18% 32%, #111 32% 50%, transparent 50% 68%, #111 68% 82%, transparent 82% 100%), ${color}`
}

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
    <fieldset className="m-0 min-w-0 border-0 p-0 not-first:mt-6 max-[820px]:not-first:mt-5">
      <legend className="mb-3 flex w-full justify-between gap-4 text-[11px] uppercase">
        <span className="font-bold tracking-[0.12em] text-[#3e3c34]">{label}</span>
        <strong className="text-[12px] font-semibold">{selected?.name}</strong>
      </legend>

      <div className="grid grid-cols-3 gap-3 max-[420px]:grid-cols-2 max-[820px]:gap-2">
        {options.map((option) => {
          const isSelected = value === option.value

          return (
            <button
              aria-label={`Select ${option.name} for ${label}`}
              aria-pressed={isSelected}
              className={`flex cursor-pointer flex-col items-center gap-2 border bg-[#f6f0e4] px-2 py-2 text-center transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3b24] ${isSelected ? 'border-[#ff3b24] shadow-[4px_4px_0_#ff3b24]' : 'border-[#111] shadow-[4px_4px_0_#111]'
                }`}
              key={option.value}
              onClick={() => onChange(option)}
              type="button"
            >
              <span className="relative grid h-12 w-12 place-items-center border border-black/20 max-[820px]:h-10 max-[820px]:w-10">
                <span
                  className="absolute inset-0"
                  style={{
                    background: option.custom
                      ? getCustomPreviewBackground(getOptionColor ? getOptionColor(option) : '#7c3aed')
                      : (getOptionColor ? getOptionColor(option) : option.value),
                  }}
                />
              </span>
              <span className="text-[10px] leading-none font-bold uppercase">{option.name}</span>
              <span className="text-[10px] leading-none text-[#5f5a52]">{formatPrice(option.price)} kr</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function StartPage() {
  const splineRef = useRef<Application | null>(null)
  const wingObjectsRef = useRef<SPEObject[]>([])
  const customPickerRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const resetDirectionTimeoutRef = useRef<number | null>(null)
  const [bodyColor, setBodyColor] = useState(bodyColorOptions[0].value)
  const [rimColor, setRimColor] = useState(rimColorOptions[2].value)
  const [customBodyColor, setCustomBodyColor] = useState('#7c3aed')
  const [customRimColor, setCustomRimColor] = useState('#8b5e3c')
  const [activeCustomPicker, setActiveCustomPicker] = useState<'body' | 'rim' | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [wingOn, setWingOn] = useState(false)
  const [wingAvailable, setWingAvailable] = useState(false)
  const selectedBodyOption = bodyColorOptions.find((option) => option.value === bodyColor) ?? bodyColorOptions[0]
  const selectedRimOption = rimColorOptions.find((option) => option.value === rimColor) ?? rimColorOptions[0]
  const effectiveBodyColor = selectedBodyOption.custom ? customBodyColor : selectedBodyOption.value
  const effectiveRimColor = selectedRimOption.custom ? customRimColor : selectedRimOption.value
  const money = basePrice + selectedBodyOption.price + selectedRimOption.price + (wingOn ? wingPrice : 0)
  const [displayMoney, setDisplayMoney] = useState(money)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'idle'>('idle')

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

  const getWingObjects = (app = splineRef.current) => {
    if (!app) return []

    const allObjects = app.getAllObjects()
    const wingObjects = allObjects.filter((object) => wingObjectNames.includes(object.name))
    const fallbackObjects = wingObjectNames
      .map((objectName) => app.findObjectByName(objectName))
      .filter((object): object is SPEObject => Boolean(object))

    return [...wingObjects, ...fallbackObjects].filter(
      (object, index, objects) => objects.findIndex((item) => item.uuid === object.uuid) === index,
    )
  }

  const setWingVisibility = (visible: boolean, app = splineRef.current) => {
    const wingObjects = getWingObjects(app)

    wingObjectsRef.current = wingObjects
    setWingAvailable(wingObjects.length > 0)

    wingObjects.forEach((object) => {
      if (visible) {
        object.show()
        return
      }

      object.hide()
    })

    app?.requestRender?.()
  }

  const toggleWing = () => {
    const wingObjects = wingObjectsRef.current.length > 0 ? wingObjectsRef.current : getWingObjects()

    if (wingObjects.length === 0) {
      setWingAvailable(false)
      console.warn(`Wing objects were not found in the Spline scene. Tried: ${wingObjectNames.join(', ')}`)
      return
    }

    const nextWingOn = !wingOn

    wingObjectsRef.current = wingObjects
    setWingOn(nextWingOn)
    setWingVisibility(nextWingOn)
  }

  const selectBodyColor = (option: ColorOption) => {
    setBodyColor(option.value)

    if (option.custom) {
      setActiveCustomPicker('body')
      setColor('Body_Car', customBodyColor)
      return
    }

    setActiveCustomPicker(null)
    setColor('Body_Car', option.value)
  }

  const selectRimColor = (option: ColorOption) => {
    setRimColor(option.value)

    if (option.custom) {
      setActiveCustomPicker('rim')
      setColor('Rim_Car', customRimColor)
      return
    }

    setActiveCustomPicker(null)
    setColor('Rim_Car', option.value)
  }

  useEffect(() => {
    if (displayMoney === money) {
      return
    }

    setPriceDirection(money > displayMoney ? 'up' : 'down')

    const startValue = displayMoney
    const difference = money - startValue
    const duration = 550
    const startTime = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const easedProgress = 1 - (1 - progress) * (1 - progress)
      const nextValue = Math.round(startValue + difference * easedProgress)

      setDisplayMoney(nextValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick)
        return
      }

      setDisplayMoney(money)

      resetDirectionTimeoutRef.current = window.setTimeout(() => {
        setPriceDirection('idle')
      }, 220)
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (resetDirectionTimeoutRef.current) {
      clearTimeout(resetDirectionTimeoutRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (resetDirectionTimeoutRef.current) {
        clearTimeout(resetDirectionTimeoutRef.current)
      }
    }
  }, [money])

  useEffect(() => {
    if (selectedBodyOption.custom) {
      setColor('Body_Car', customBodyColor)
    }
  }, [customBodyColor, selectedBodyOption.custom])

  useEffect(() => {
    if (selectedRimOption.custom) {
      setColor('Rim_Car', customRimColor)
    }
  }, [customRimColor, selectedRimOption.custom])

  useEffect(() => {
    if (!activeCustomPicker) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (customPickerRef.current?.contains(event.target as Node)) {
        return
      }

      setActiveCustomPicker(null)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [activeCustomPicker])

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#f1d733] text-[#111]">
      <section className="relative min-h-svh px-[3vw] pt-[18px] pb-[34px] max-[820px]:flex max-[820px]:flex-col max-[820px]:gap-5 max-[820px]:px-4 max-[820px]:pt-4 max-[820px]:pb-8" id="model">
        <div className="absolute top-[8%] right-[7%] bottom-[12%] left-[29%] overflow-hidden border-[3px] border-[#111] bg-[#e9e5dc] shadow-[10px_10px_0_#111] max-[1100px]:left-[32%] max-[900px]:top-[7%] max-[900px]:right-[4%] max-[900px]:bottom-[18%] max-[900px]:left-[30%] max-[820px]:relative max-[820px]:inset-auto max-[820px]:order-2 max-[820px]:h-[44svh] max-[820px]:min-h-[300px] max-[820px]:w-full max-[820px]:shadow-[7px_7px_0_#111] max-[520px]:h-[40svh] max-[520px]:min-h-[250px]">
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
              setWingVisibility(wingOn, app)
              setColor('Body_Car', effectiveBodyColor)
              setColor('Rim_Car', effectiveRimColor)
            }}
          />

          <div className="absolute bottom-5 left-[22px] z-30 flex items-center gap-[10px] text-[9px] font-semibold tracking-[0.1em] text-[#56524b] uppercase max-[820px]:bottom-3 max-[820px]:left-3">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-full border border-current text-[8px]">360°</span>
            Drag to rotate
          </div>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute left-[3vw] z-30 max-[820px]:relative max-[820px]:left-auto max-[820px]:order-1 max-[820px]:z-10">
          <span className="mb-[17px] block text-[10px] font-bold tracking-[0.2em] text-[#e22e1d] max-[820px]:mb-3">INTERACTIVE</span>
          <strong className="block text-[clamp(36px,4.6vw,72px)] leading-[0.76] font-black tracking-[-0.08em] max-[900px]:text-[50px] max-[820px]:text-[clamp(42px,15vw,92px)]">
            CAR<br />
          </strong>

          <strong className="block pl-8 text-[clamp(36px,4.6vw,72px)] leading-[0.76] font-black tracking-[-0.08em] max-[900px]:text-[50px] max-[820px]:pl-[12vw] max-[820px]:text-[clamp(42px,15vw,92px)]">
            BUILDER
          </strong>
        </div>

        <aside className="absolute top-[18%] left-[3vw] z-40 w-[320px] border-[3px] border-[#111] bg-[#fff5dc] px-5 pt-3 pb-5 shadow-[10px_10px_0_#111] max-[1100px]:w-[292px] max-[900px]:top-[50%] max-[900px]:w-[270px] max-[820px]:relative max-[820px]:inset-auto max-[820px]:order-3 max-[820px]:w-full max-[820px]:px-4 max-[820px]:pt-3 max-[820px]:pb-4 max-[820px]:shadow-[7px_7px_0_#111]">
          <div className="mb-4 border-b-2 border-[#111] pb-3 max-[820px]:flex max-[820px]:items-end max-[820px]:justify-between max-[820px]:gap-4">
            <div>
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#e22e1d]">Price </p>
              <p className={`price-counter mt-1 text-[28px] leading-none font-black tracking-[-0.06em] max-[420px]:text-[23px] ${priceDirection === 'up' ? 'price-counter-up' : ''} ${priceDirection === 'down' ? 'price-counter-down' : ''}`}>{formatPrice(displayMoney)} kr</p>
            </div>
            <p className="mt-1 text-[10px] text-[#5f5a52] max-[820px]:mb-1 max-[820px]:text-right">Base price {formatPrice(basePrice)} kr</p>
          </div>
          <ColorField
            label="Body Color"
            options={bodyColorOptions}
            value={bodyColor}
            onChange={selectBodyColor}
            getOptionColor={(option) => option.custom ? customBodyColor : option.value}
          />
          <ColorField
            label="Rim Color"
            options={rimColorOptions}
            value={rimColor}
            onChange={selectRimColor}
            getOptionColor={(option) => option.custom ? customRimColor : option.value}
          />

          <div className="mt-2 border-t-2 border-[#111] pt-2">
            <button
              className="flex w-full cursor-pointer items-center justify-between gap-4 border-[3px] border-[#111] bg-[#ff3b24] px-4 py-3 text-left text-[12px] font-black tracking-[-0.02em] uppercase shadow-[5px_5px_0_#111] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#d8d1c3] disabled:text-[#777] disabled:hover:translate-y-0 max-[420px]:px-3"
              disabled={!sceneReady}
              onClick={toggleWing}
              type="button"
            >
              <span className="min-w-0">
                <span className="block">{wingOn ? 'Remove wing' : 'Add wing'}</span>
                <span className="mt-1 block text-[10px] leading-none font-bold tracking-normal normal-case">
                  {wingOn ? 'Wing active' : ` ${formatPrice(wingPrice)} kr`}
                </span>
              </span>
              <span className="shrink-0 text-[10px] font-bold">{wingOn ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {activeCustomPicker && (
            <div
              ref={customPickerRef}
              className={`absolute left-full ml-4 w-[240px] border-[3px] border-[#111] bg-[#fff5dc] p-4 shadow-[8px_8px_0_#111] ${activeCustomPicker === 'body' ? 'top-0' : 'bottom-0'} max-[1200px]:top-full max-[1200px]:bottom-auto max-[1200px]:left-0 max-[1200px]:mt-4 max-[1200px]:ml-0 max-[820px]:relative max-[820px]:top-auto max-[820px]:bottom-auto max-[820px]:left-auto max-[820px]:mt-4 max-[820px]:ml-0 max-[820px]:w-full max-[820px]:p-3 max-[820px]:shadow-[5px_5px_0_#111]`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#e22e1d]">Custom color</p>
                  <h2 className="mt-1 text-[18px] leading-none font-black tracking-[-0.06em]">
                    {activeCustomPicker === 'body' ? 'Body shade' : 'Rim finish'}
                  </h2>
                </div>
                <button
                  className="cursor-pointer border-2 border-[#111] bg-white px-2 py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0_#111]"
                  onClick={() => setActiveCustomPicker(null)}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3 max-[420px]:items-start">
                <input
                  aria-label={activeCustomPicker === 'body' ? 'Choose custom body color' : 'Choose custom rim color'}
                  className="h-18 w-18 shrink-0 cursor-pointer border-[3px] border-[#111] bg-transparent p-1 max-[420px]:h-16 max-[420px]:w-16"
                  onChange={(event) => {
                    const color = event.target.value

                    if (activeCustomPicker === 'body') {
                      setCustomBodyColor(color)
                      return
                    }

                    setCustomRimColor(color)
                  }}
                  type="color"
                  value={activeCustomPicker === 'body' ? customBodyColor : customRimColor}
                />
                <div>
                  <p className="text-[11px] font-bold uppercase">
                    {activeCustomPicker === 'body' ? 'Custom body color' : 'Custom rim color'}
                  </p>
                  <p className="mt-1 text-[10px] text-[#5f5a52]">
                    Adds {formatPrice(activeCustomPicker === 'body' ? 30000 : 18000)} kr
                  </p>
                  <p className="mt-2 text-[12px] font-semibold">
                    {(activeCustomPicker === 'body' ? customBodyColor : customRimColor).toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                className="mt-4 w-full cursor-pointer border-[3px] border-[#111] bg-[#ff3b24] px-4 py-2.5 text-[11px] font-black uppercase shadow-[4px_4px_0_#111]"
                onClick={() => setActiveCustomPicker(null)}
                type="button"
              >
                Use this color
              </button>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

export default StartPage
