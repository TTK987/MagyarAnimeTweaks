import { defineManifest } from '@crxjs/vite-plugin'
import { commonManifest } from './manifest.common'

export default defineManifest({
    ...commonManifest,
    background: {
        type: 'module',
        service_worker: 'src/background.js',
    },
} as any)
