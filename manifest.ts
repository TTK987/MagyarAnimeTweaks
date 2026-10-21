import { defineManifest } from '@crxjs/vite-plugin'
// @ts-ignore Vite wants the file extension, but ts reports an error...
import { commonManifest } from './manifest.common.ts'

export default defineManifest({
    ...commonManifest,
    background: {
        type: 'module',
        service_worker: 'src/background.js',
    },
} as any)
