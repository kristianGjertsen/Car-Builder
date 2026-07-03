const bmwX7M60iConfig = {
  id: "BMW X7 M60i",
  name: "BMW X7 M60i",
  basePrice: 970000,

  scene: {
    cameraAngle: 12,
    cameraHeight: 1.2,
    zoom: 5.5,
    fov: 50,
    carAngle: -36,
    maxRotationX: 90,
    maxRotationY: 180,
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

  orderScene: {
    cameraAngle: 16,
    cameraHeight: 1.25,
    zoom: 8.2,
    fov: 45,
    carAngle: 0,
    target: [0, 0.35, 0],
    intro: {
      enabled: false,
    },
  },

  customizable: {
    steps: [
      {
        id: "paint",
        type: "paint",
        label: "Body Color",
        scene: {
          cameraAngle: 12,
          cameraHeight: 1.2,
          zoom: 5.5,
          fov: 50,
          carAngle: -36,
          maxRotationX: 90,
          maxRotationY: 180,
          light: 0.45,
          shadow: 0.75,
          background: "#ffffff",
          target: [0, 0.15, 0],
          minDistance: 0,
          maxDistance: 28,
          intro: {
            enabled: true,
            startHeight: 8,
            useLast: true,
            duration: 1200,
          },
        },
      },
      {
        id: "rims",
        type: "rims",
        label: "Rim Color",
        scene: {
          cameraAngle: 90,
          cameraHeight: 0.22,
          zoom: 5.34,
          fov: 50,
          carAngle: 0,
          maxRotationX: 90,
          maxRotationY: 180,
          light: 0.6,
          shadow: 0.8,
          background: "#ffffff",
          target: [0, 0, 0],
          minDistance: 0,
          maxDistance: 28,
          intro: {
            enabled: true,
            startHeight: 8,
            duration: 850,
            useLast: true,
          },
        },
      },
    ],
  },

  paint: {
    label: "Body Color",
    defaultValue: "Dravit Grey",

    meshNames: [],
    materialNames: ["inmx7m60i_body", "bodyshell.6", "f_bump1.5"],
    keywords: [],

    material: {
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 0.2,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25,
    },

    colors: [
      { name: "Dravit Grey", price: 0 },
      { name: "Alpine White", price: 7900 },
      { name: "Black Sapphire", price: 12900 },
      { name: "Portimao Blue", price: 18900 },
      { name: "Tanzanite Blue", price: 18900 },
      { name: "Brooklyn Grey", price: 14900 },
      { name: "San Remo Green", price: 14900 },
    ],

    custom: {
      enabled: false,
    },
  },

  rims: {
    label: "Rim Color",
    defaultValue: "Black",

    meshNames: [
      "inmx7m60i_wheel_inmx7m60i_black_0",
      "inmx7m60i_wheel.001_inmx7m60i_black_0",
      "inmx7m60i_wheel.002_inmx7m60i_black_0",
      "inmx7m60i_wheel.003_inmx7m60i_black_0",
    ],

    materialNames: [],

    keywords: [
      "inmx7m60i_wheel_inmx7m60i_black_0",
      "inmx7m60i_wheel.001_inmx7m60i_black_0",
      "inmx7m60i_wheel.002_inmx7m60i_black_0",
      "inmx7m60i_wheel.003_inmx7m60i_black_0",
    ],

    material: {
      metalness: 0.75,
      roughness: 0.18,
      clearcoat: 0.4,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.1,
    },

    colors: [
      { name: "Black", price: 0 },
      { name: "Silver", price: 5900 },
      { name: "Gunmetal", price: 5900 },
      { name: "Bronze", price: 9900 },
      { name: "White", price: 3900 },
    ],

    custom: {
      enabled: false,
    },
  },
};

export default bmwX7M60iConfig;
