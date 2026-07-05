function stripScenePositions(scene = {}) {
  const { positions, ...sceneWithoutPositions } = scene

  return sceneWithoutPositions
}

export function mergeSceneConfig(baseScene = {}, stepScene = {}) {
  return {
    ...stripScenePositions(baseScene),
    ...stripScenePositions(stepScene),
    intro: {
      ...(baseScene.intro ?? {}),
      ...(stepScene.intro ?? {}),
    },
  }
}

export function getScenePositions(baseScene = {}, stepScene = {}) {
  const sharedScene = mergeSceneConfig(baseScene, stepScene)
  const positions = stepScene?.positions ?? []

  if (!positions.length) {
    return []
  }

  return positions.map((position, index) => ({
    id: position.id ?? `position-${index + 1}`,
    label: position.label ?? `Position ${index + 1}`,
    scene: mergeSceneConfig(sharedScene, position.scene ?? position),
  }))
}

export function getCustomizableSteps(carConfig) {
  if (carConfig.customizable?.steps?.length) {
    return [
      ...carConfig.customizable.steps.map((step) => ({
        ...step,
        scene: mergeSceneConfig(carConfig.scene, step.scene),
        scenePositions: getScenePositions(carConfig.scene, step.scene),
      })),
      {
        id: 'order',
        type: 'order',
        label: 'Order',
        scene: mergeSceneConfig(carConfig.scene, carConfig.customizable.orderScene ?? carConfig.orderScene),
        scenePositions: getScenePositions(carConfig.scene, carConfig.customizable.orderScene ?? carConfig.orderScene),
      },
    ]
  }

  return [
    {
      id: 'paint',
      type: 'paint',
      label: carConfig.paint?.label ?? 'Body Color',
      scene: mergeSceneConfig(carConfig.scene, carConfig.paint?.scene),
      scenePositions: getScenePositions(carConfig.scene, carConfig.paint?.scene),
    },
    {
      id: 'rims',
      type: 'rims',
      label: carConfig.rims?.label ?? 'Rim Color',
      scene: mergeSceneConfig(carConfig.scene, carConfig.rims?.scene),
      scenePositions: getScenePositions(carConfig.scene, carConfig.rims?.scene),
    },
    ...(Boolean(carConfig.calipers?.colors?.length)
      ? [
          {
            id: 'calipers',
            type: 'calipers',
            label: carConfig.calipers.label ?? 'Caliper Color',
            scene: mergeSceneConfig(carConfig.scene, carConfig.calipers.scene),
            scenePositions: getScenePositions(carConfig.scene, carConfig.calipers.scene),
          },
        ]
      : []),
    ...(Boolean(carConfig.glassTint?.colors?.length)
      ? [
          {
            id: 'glassTint',
            type: 'glassTint',
            label: carConfig.glassTint.label ?? 'Window Tint',
            scene: mergeSceneConfig(carConfig.scene, carConfig.glassTint.scene),
            scenePositions: getScenePositions(carConfig.scene, carConfig.glassTint.scene),
          },
        ]
      : []),
    ...(Boolean(carConfig.seatOuter?.colors?.length)
      ? [
          {
            id: 'seats',
            type: 'seats',
            label: 'Seat Colors',
            scene: mergeSceneConfig(carConfig.scene, carConfig.seatOuter?.scene),
            scenePositions: getScenePositions(carConfig.scene, carConfig.seatOuter?.scene),
          },
        ]
      : []),
    ...(carConfig.addOns ?? []).map((addOn) => ({
      id: addOn.id,
      type: 'addOn',
      addOnId: addOn.id,
      label: addOn.name,
      scene: mergeSceneConfig(carConfig.scene, addOn.scene),
      scenePositions: getScenePositions(carConfig.scene, addOn.scene),
    })),
    {
      id: 'order',
      type: 'order',
      label: 'Order',
      scene: mergeSceneConfig(carConfig.scene, carConfig.orderScene),
      scenePositions: getScenePositions(carConfig.scene, carConfig.orderScene),
    },
  ]
}

export function getOrderDisplayConfig(carConfig, fallbackOrderScene = {}) {
  const orderScene = carConfig.orderScene ?? fallbackOrderScene

  return {
    scene: mergeSceneConfig(carConfig.scene, orderScene),
    scenePositions: getScenePositions(carConfig.scene, orderScene),
  }
}
