import {
  getZoomBounds,
  roundSceneValue,
  sliderValueToZoom,
  zoomToSliderValue,
} from './sceneControls'

function SliderControl({ label, max, min, onChange, step = 1, suffix = '', value }) {
  const displayValue = Number.isFinite(value) ? roundSceneValue(value) : 0

  return (
    <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#3e3c34]">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="flex items-center gap-1">
          <input
            className="h-7 w-20 rounded-[3px] border border-[#c9d0d8] bg-white px-2 text-right text-[12px] font-black text-[#111] outline-none focus:border-[#1c69d4]"
            max={max}
            min={min}
            onChange={(event) => {
              if (event.target.value === '') {
                return
              }

              onChange(Number(event.target.value))
            }}
            step={step}
            type="number"
            value={displayValue}
          />
          {suffix && <span className="font-black text-[#111]">{suffix}</span>}
        </span>
      </span>
      <input
        className="accent-[#ff3b24]"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  )
}

function ZoomSliderControl({ onChange, sceneControls }) {
  const { max, min } = getZoomBounds(sceneControls)
  const sliderValue = zoomToSliderValue(sceneControls.zoom, min, max)
  const displayValue = Number.isFinite(sceneControls.zoom) ? roundSceneValue(sceneControls.zoom) : min

  return (
    <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#3e3c34]">
      <span className="flex items-center justify-between gap-3">
        <span>Zoom</span>
        <input
          className="h-7 w-20 rounded-[3px] border border-[#c9d0d8] bg-white px-2 text-right text-[12px] font-black text-[#111] outline-none focus:border-[#1c69d4]"
          min={0}
          onChange={(event) => {
            if (event.target.value === '') {
              return
            }

            onChange(Number(event.target.value))
          }}
          step={0.01}
          type="number"
          value={displayValue}
        />
      </span>
      <input
        className="accent-[#ff3b24]"
        max={100}
        min={0}
        onChange={(event) => onChange(roundSceneValue(sliderValueToZoom(Number(event.target.value), min, max)))}
        step={0.1}
        type="range"
        value={sliderValue}
      />
    </label>
  )
}

function SceneTunerPanel({
  copySceneControls,
  resetSceneControls,
  resetViewControlsToZero,
  sceneControls,
  sceneTunerTarget,
  setShowTuner,
  showTuner,
  updateSceneControl,
  updateTargetControl,
}) {
  return (
    <div
      className={sceneTunerTarget ? 'rounded-[3px] border border-[#dfe3e8] bg-[#f8f9fa] p-4' : 'absolute top-4 right-4 z-40 w-[230px] border-[3px] border-[#111] bg-[#fff5dc] p-3 text-[#111] shadow-[6px_6px_0_#111] max-[820px]:top-3 max-[820px]:right-3 max-[820px]:w-[210px]'}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className={sceneTunerTarget ? 'mb-3 flex items-center justify-between gap-3 border-b border-[#dfe3e8] pb-3' : 'mb-3 flex items-center justify-between gap-3 border-b-2 border-[#111] pb-2'}>
        <p className={sceneTunerTarget ? 'text-[12px] font-semibold text-[#60656c]' : 'text-[10px] font-black uppercase tracking-[0.14em] text-[#e22e1d]'}>Scene tune</p>
        <button
          className={sceneTunerTarget ? 'cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-3 py-1.5 text-[12px] font-semibold' : 'cursor-pointer border-2 border-[#111] bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#111]'}
          onClick={() => setShowTuner((currentValue) => !currentValue)}
          type="button"
        >
          {showTuner ? 'Hide' : 'Show'}
        </button>
      </div>

      {showTuner && (
        <div className="grid gap-3">
          <SliderControl label="Cam angle" max={180} min={-180} onChange={updateSceneControl('cameraAngle')} suffix="°" value={sceneControls.cameraAngle} />
          <ZoomSliderControl onChange={updateSceneControl('zoom')} sceneControls={sceneControls} />
          <SliderControl label="Height" max={12} min={-6} onChange={updateSceneControl('cameraHeight')} step={0.1} value={sceneControls.cameraHeight} />
          <SliderControl label="FOV" max={120} min={20} onChange={updateSceneControl('fov')} suffix="°" value={sceneControls.fov} />
          <SliderControl label="Car angle" max={180} min={-180} onChange={updateSceneControl('carAngle')} suffix="°" value={sceneControls.carAngle} />
          <SliderControl label="Max rot X" max={90} min={0} onChange={updateSceneControl('maxRotationX')} suffix="°" value={sceneControls.maxRotationX} />
          <SliderControl label="Max rot Y" max={180} min={0} onChange={updateSceneControl('maxRotationY')} suffix="°" value={sceneControls.maxRotationY} />
          <SliderControl label="Target X" max={15} min={-15} onChange={updateTargetControl(0)} step={0.05} value={sceneControls.target[0]} />
          <SliderControl label="Target Y" max={6} min={-6} onChange={updateTargetControl(1)} step={0.05} value={sceneControls.target[1]} />
          <SliderControl label="Target Z" max={15} min={-15} onChange={updateTargetControl(2)} step={0.05} value={sceneControls.target[2]} />
          <SliderControl label="Light" max={5} min={0} onChange={updateSceneControl('light')} step={0.1} value={sceneControls.light} />
          <SliderControl label="Shadow" max={1} min={0} onChange={updateSceneControl('shadow')} step={0.05} value={sceneControls.shadow} />
          <div className="grid grid-cols-3 gap-2">
            <button
              className={sceneTunerTarget ? 'cursor-pointer rounded-[3px] bg-[#1f2328] px-3 py-2 text-[12px] font-semibold text-white' : 'mt-1 cursor-pointer border-[3px] border-[#111] bg-[#ff3b24] px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0_#111]'}
              onClick={resetSceneControls}
              type="button"
            >
              Reset
            </button>
            <button
              className={sceneTunerTarget ? 'cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-3 py-2 text-[12px] font-semibold' : 'cursor-pointer border-[3px] border-[#111] bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0_#111]'}
              onClick={resetViewControlsToZero}
              type="button"
            >
              Zero view
            </button>
            <button
              className={sceneTunerTarget ? 'cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-3 py-2 text-[12px] font-semibold' : 'cursor-pointer border-[3px] border-[#111] bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0_#111]'}
              onClick={copySceneControls}
              type="button"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SceneTunerPanel
