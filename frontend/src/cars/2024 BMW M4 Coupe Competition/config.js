const mazdaRx7Config = {
  id: "2024 BMW M4 Coupe Competition",
  name: "2024 BMW M4 Coupe Competition",
  basePrice: 730000,

  scene: {
    cameraAngle: 12,
    cameraHeight: 1.2,
    zoom: 5.5,
    fov: 50,
    carAngle: -36,
    light: 0.45,
    shadow: 0.75,
    background: "#ffffff",
    target: [0, 0.15, 0],
    minDistance: 0,
    maxDistance: 28,
    intro: {
      enabled: true,
      startHeight: 8,
      duration: 1200,
    },
  },

  paint: {
    label: "Body Color",
    defaultValue: "#2f3338",
    meshNames: [],
    materialNames: ["M4_2024_paint", "M4_2024_paint.001"],
    keywords: [],
    excludeKeywords: ["logo", "badge"],
    material: {
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 0.2,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25,
    },
    colors: [
      { name: "Dravit Grey", value: "#2f3338", price: 0 },
      { name: "Alpine White", value: "#f4f1ea", price: 7900 },
      { name: "Black Sapphire", value: "#08090b", price: 12900 },
      { name: "Portimao Blue", value: "#1f4f8f", price: 18900 },
      { name: "Tanzanite Blue", value: "#10233f", price: 18900 },
      { name: "Brooklyn Grey", value: "#9da1a4", price: 14900 },
      { name: "San Remo Green", value: "#254134", price: 14900 },
    ],
    custom: {
      enabled: false,
    },
  },

  rims: {
    label: "Rim Color",
    defaultValue: "#d7dce2",
    meshNames: [
      "M4_2024_wheels_m_black_M4_2024_Black_0",
      "M4_2024_wheels_m_black.001_M4_2024_Black_0",
      "M4_2024_wheels_m_black.002_M4_2024_Black_0",
      "M4_2024_wheels_m_black.003_M4_2024_Black_0",
    ],
    materialNames: [],
    keywords: [],
    excludeKeywords: ["logo", "badge", "hub"],
    colors: [
      { name: "Silver", value: "#d7dce2", price: 0 },
      { name: "Gunmetal", value: "#626870", price: 5900 },
      { name: "Black", value: "#0d0d0f", price: 5900 },
      { name: "Bronze", value: "#b08d57", price: 9900 },
      { name: "White", value: "#f5f5f5", price: 3900 },
    ],
    custom: {
      enabled: false,
    },
  },
};

export default mazdaRx7Config;
