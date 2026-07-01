import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const chunkGroups = {
  'three-core': ['three', 'three-mesh-bvh'],
  'react-three': ['@react-three/fiber', 'its-fine', 'react-reconciler', 'scheduler', 'suspend-react'],
  'drei-vendor': [
    '@react-three/drei',
    'three-stdlib',
    'troika-three-text',
    'troika-three-utils',
    '@monogrid/gainmap-js',
    'camera-controls',
    'meshline',
    'maath',
    'stats-gl',
  ],
}

function matchesPackage(id, pkgName) {
  return id.includes(`/node_modules/${pkgName}/`) || id.includes(`\\node_modules\\${pkgName}\\`)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          for (const [chunkName, packages] of Object.entries(chunkGroups)) {
            if (packages.some((pkgName) => matchesPackage(id, pkgName))) {
              return chunkName
            }
          }
        },
      },
    },
  },
})
