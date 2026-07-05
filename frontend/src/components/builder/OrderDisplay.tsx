import { Suspense, lazy, useEffect, useState } from 'react'
import SceneLoadingPanel from './SceneLoadingPanel'

const CarScene = lazy(() => import('../CarScene'))

function OrderDisplay({
  carSceneProps,
  scene,
  scenePositions,
}: {
  carSceneProps: any
  scene: any
  scenePositions: any[]
}) {
  const [activeScenePositionIndex, setActiveScenePositionIndex] = useState(0)
  const activeScenePosition = scenePositions[activeScenePositionIndex]
  const activeSceneConfig = activeScenePosition?.scene ?? scene

  useEffect(() => {
    setActiveScenePositionIndex(0)
  }, [scene, scenePositions])

  useEffect(() => {
    if (activeScenePositionIndex < scenePositions.length) {
      return
    }

    setActiveScenePositionIndex(0)
  }, [activeScenePositionIndex, scenePositions.length])

  return (
    <div className="mb-8">
      <div className="relative h-[430px] overflow-hidden rounded-[3px] border border-[#dfe3e8] bg-[#ebe8e3] max-[760px]:h-[320px]">
        <Suspense fallback={<SceneLoadingPanel />}>
          <CarScene
            key={carSceneProps.carConfig.id}
            {...carSceneProps}
            autoSpin={false}
            presentationMode={false}
            sceneConfig={activeSceneConfig}
            sceneGroupKey="order"
            scenePositionKey={activeScenePosition?.id ?? 'default'}
            spinSpeed={0}
            usePanelSceneTuner
          />
        </Suspense>

        {scenePositions.length > 1 && (
          <div className="absolute top-5 left-1/2 z-30 flex max-w-[calc(100%-40px)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full bg-white/92 px-3 py-2 shadow-sm backdrop-blur">
            {scenePositions.map((position, index) => {
              const isActive = index === activeScenePositionIndex

              return (
                <button
                  className={`min-h-9 cursor-pointer rounded-full px-4 text-[12px] font-semibold transition ${isActive ? 'bg-[#1f2328] text-white' : 'bg-[#eef0f2] text-[#1f2328] hover:bg-[#dfe4ea]'}`}
                  key={position.id}
                  onClick={() => setActiveScenePositionIndex(index)}
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
    </div>
  )
}

export default OrderDisplay
