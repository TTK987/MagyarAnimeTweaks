import { commonManifest } from './manifest.common'

export default () => {return {
    ...commonManifest,
    background: {
        scripts: ['src/background.ts'],
    },
    browser_specific_settings: {
        gecko: {
            id: '{7b0929ca-1c4a-4374-873e-8af3106c8b96}',
            strict_min_version: '128.0',
        },
    },
}}
