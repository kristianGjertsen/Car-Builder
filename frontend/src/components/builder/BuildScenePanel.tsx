import { Suspense, lazy } from 'react'
import SceneLoadingPanel from './SceneLoadingPanel'

const CarScene = lazy(() => import('../CarScene'))

function BuildScenePanel({
  activeScenePositionIndex,
  activeScenePositions,
  activeStepIndex,
  canGoNext,
  canGoPrevious,
  carSceneKey,
  carSceneProps,
  customizableSteps,
  nextStep,
  onNextStep,
  onOrder,
  onPreviousStep,
  onScenePositionChange,
}: {
  activeScenePositionIndex: number
  activeScenePositions: any[]
  activeStepIndex: number
  canGoNext: boolean
  canGoPrevious: boolean
  carSceneKey: string
  carSceneProps: any
  customizableSteps: any[]
  nextStep: any
  onNextStep: () => void
  onOrder: () => void
  onPreviousStep: () => void
  onScenePositionChange: (scenePositionIndex: number) => void
}) {
  return (
    <div className="min-w-0 max-[980px]:order-1">
      <div className="relative h-[calc(100svh-214px)] min-h-[520px] overflow-hidden rounded-[22px] border border-[#dfe3e8] bg-[#ebe8e3] shadow-sm max-[980px]:h-[54svh] max-[980px]:min-h-[360px] max-[520px]:min-h-[300px]">
        <Suspense fallback={<SceneLoadingPanel />}>
          <CarScene
            key={carSceneKey}
            {...carSceneProps}
          />
        </Suspense>

        {activeScenePositions.length > 1 && (
          <div className="absolute top-5 left-1/2 z-30 flex max-w-[calc(100%-40px)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full bg-white/92 px-3 py-2 shadow-sm backdrop-blur">
            {activeScenePositions.map((position, index) => {
              const isActive = index === activeScenePositionIndex

              return (
                <button
                  className={`min-h-9 cursor-pointer rounded-full px-4 text-[12px] font-semibold transition ${isActive ? 'bg-[#1f2328] text-white' : 'bg-[#eef0f2] text-[#1f2328] hover:bg-[#dfe4ea]'}`}
                  key={position.id}
                  onClick={() => onScenePositionChange(index)}
                  type="button"
                >
                  {position.label}
                </button>
              )
            })}
          </div>
        )}

        <div className="absolute bottom-5 left-5 z-30 flex items-center gap-3 rounded-full bg-white/90 px-3 py-2 text-[12px] font-semibold text-[#60656c] shadow-sm backdrop-blur">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1f2328] text-[10px] text-white">360</span>
          Drag to rotate
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
          <span className="absolute top-1/2 left-0 h-px w-full bg-[#1c69d4]/35" />
          <span className="absolute top-0 left-1/2 h-full w-px bg-[#1c69d4]/35" />
          <span className="absolute top-1/2 left-1/2 h-px w-[142%] origin-center -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#1c69d4]/25" />
          <span className="absolute top-1/2 left-1/2 h-px w-[142%] origin-center -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#1c69d4]/25" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-[620px]:grid-cols-1">
        <div className="flex justify-end max-[620px]:justify-stretch">
          {canGoPrevious && (
            <button
              className="min-h-12 w-full max-w-[260px] cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-5 text-[15px] font-semibold text-[#1f2328] transition hover:border-[#1c69d4] max-[620px]:max-w-none"
              onClick={onPreviousStep}
              type="button"
            >
              Previous: {customizableSteps[activeStepIndex - 1]?.label}
            </button>
          )}
        </div>
        <div className="text-center text-[13px] font-semibold text-[#60656c] max-[620px]:hidden">
          {activeStepIndex + 1} / {customizableSteps.length}
        </div>
        <div className="flex justify-start max-[620px]:justify-stretch">
          <button
            className="min-h-12 w-full max-w-[260px] cursor-pointer rounded-[3px] bg-[#1f2328] px-5 text-[15px] font-semibold text-white transition hover:bg-[#111418] max-[620px]:max-w-none"
            onClick={canGoNext && nextStep?.type !== 'order' ? onNextStep : onOrder}
            type="button"
          >
            {canGoNext && nextStep?.type !== 'order' ? `Next: ${nextStep?.label}` : 'Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BuildScenePanel
