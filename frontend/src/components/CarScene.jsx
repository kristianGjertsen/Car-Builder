import { createPortal } from 'react-dom'
import SceneCanvas from './scene/SceneCanvas'
//import SceneTunerPanel from './scene/SceneTunerPanel'
import { useSceneControls } from './scene/useSceneControls'

function CarScene({
  addOnValues,
  autoSpin = false,
  caliperColor,
  caliperMaterial,
  carColor,
  carConfig,
  centerModel = false,
  glassTintColor,
  glassTintMaterial,
  paintMaterial,
  presentationMode = false,
  rimColor,
  rimMaterial,
  rimType = 'standard',
  sceneConfig,
  sceneGroupKey = 'default',
  scenePositionKey = 'default',
  sceneTunerTarget,
  seatOuterColor,
  seatOuterMaterial,
  spinSpeed,
  usePanelSceneTuner = false,
  onReady,
}) {
  const {
    cameraPosition,
    carRotation,
    controlsRef,
    copySceneControls,
    handleModelLoaded,
    orbitLimits,
    resetSceneControls,
    resetViewControlsToZero,
    sceneControls,
    setShowTuner,
    showTuner,
    syncSceneControlsFromOrbit,
    updateSceneControl,
    updateTargetControl,
    zoomBounds,
  } = useSceneControls({
    carConfig,
    onReady,
    presentationMode,
    sceneConfig,
    sceneGroupKey,
    scenePositionKey,
  })

  /* const sceneTuner = (
     //Possible to have cam settings for each scenen and test
     
     <SceneTunerPanel
       copySceneControls={copySceneControls}
       resetSceneControls={resetSceneControls}
       resetViewControlsToZero={resetViewControlsToZero}
       sceneControls={sceneControls}
       sceneTunerTarget={sceneTunerTarget}
       setShowTuner={setShowTuner}
       showTuner={showTuner}
       updateSceneControl={updateSceneControl}
       updateTargetControl={updateTargetControl}
     />
   )
     */

  return (
    <>
      <SceneCanvas
        addOnValues={addOnValues}
        autoSpin={autoSpin}
        caliperColor={caliperColor}
        caliperMaterial={caliperMaterial}
        cameraPosition={cameraPosition}
        carColor={carColor}
        carConfig={carConfig}
        carRotation={carRotation}
        centerModel={centerModel}
        controlsRef={controlsRef}
        glassTintColor={glassTintColor}
        glassTintMaterial={glassTintMaterial}
        handleModelLoaded={handleModelLoaded}
        orbitLimits={orbitLimits}
        paintMaterial={paintMaterial}
        presentationMode={presentationMode}
        rimColor={rimColor}
        rimMaterial={rimMaterial}
        rimType={rimType}
        sceneControls={sceneControls}
        seatOuterColor={seatOuterColor}
        seatOuterMaterial={seatOuterMaterial}
        spinSpeed={spinSpeed}
        syncSceneControlsFromOrbit={syncSceneControlsFromOrbit}
        zoomBounds={zoomBounds}
      />

      {!presentationMode && (sceneTunerTarget ? createPortal(sceneTuner, sceneTunerTarget) : !usePanelSceneTuner ? sceneTuner : null)}
    </>
  )
}

export default CarScene
