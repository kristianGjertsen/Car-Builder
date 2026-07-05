const configModules = import.meta.glob('./*/config.js', {
  eager: true,
  import: 'default',
})

const modelModules = import.meta.glob('./*/*.glb', {
  eager: true,
  import: 'default',
  query: '?url',
})

const previewModules = import.meta.glob('./*/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
  query: '?url',
})

function getFolderPath(filePath) {
  return filePath.slice(0, filePath.lastIndexOf('/'))
}

function getModelPathForConfig(configPath) {
  const configFolder = getFolderPath(configPath)
  const matchingModels = Object.entries(modelModules)
    .filter(([modelPath]) => getFolderPath(modelPath) === configFolder)
    .sort(([firstPath], [secondPath]) => firstPath.localeCompare(secondPath))

  if (matchingModels.length === 0) {
    throw new Error(`No .glb model found next to ${configPath}. Put one .glb file in the same car folder as config.js.`)
  }

  if (matchingModels.length > 1) {
    console.warn(`Multiple .glb models found next to ${configPath}. Using ${matchingModels[0][0]}.`)
  }

  const modelModule = matchingModels[0][1]

  return typeof modelModule === 'string' ? modelModule : modelModule.default
}

function getPreviewImageForConfig(configPath) {
  const configFolder = getFolderPath(configPath)
  const matchingPreviews = Object.entries(previewModules)
    .filter(([assetPath]) => getFolderPath(assetPath) === configFolder)
    .sort(([firstPath], [secondPath]) => firstPath.localeCompare(secondPath))

  if (matchingPreviews.length === 0) {
    return null
  }

  const previewModule = matchingPreviews[0][1]

  return typeof previewModule === 'string' ? previewModule : previewModule.default
}

export const carConfigs = Object.entries(configModules).map(([configPath, config]) => ({
  ...config,
  modelId: getFolderPath(configPath),
  modelPath: getModelPathForConfig(configPath),
  previewImage: getPreviewImageForConfig(configPath),
}))

const modelPathCounts = carConfigs.reduce((counts, config) => {
  counts[config.modelPath] = (counts[config.modelPath] ?? 0) + 1
  return counts
}, {})

carConfigs.forEach((config) => {
  if (modelPathCounts[config.modelPath] > 1) {
    console.warn(`${config.name} shares the same built GLB asset as another car. Check that the .glb files are not identical.`)
  }
})

export const defaultCarConfig = carConfigs[0]
