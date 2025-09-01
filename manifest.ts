import { defineManifest } from '@crxjs/vite-plugin'
import packageData from './package.json'

export default defineManifest({
    name: `${packageData.displayName || packageData.name}`,
    description: packageData.description,
    version: packageData.version,
    manifest_version: 3,
    permissions: [
        'storage',
        'contextMenus',
        'downloads',
        'declarativeNetRequest',
        'unlimitedStorage',
        'alarms'
    ],
    host_permissions: [
        '*://*.magyaranime.eu/*',
        '*://*.magyaranime.hu/*',
        '*://*.embed.indavideo.hu/*',
        '*://*.mega.nz/embed/*',
        '*://*.dailymotion.com/player.html*',
        '*://*.rumble.com/embed/*',
        '*://*.videa.hu/player*',
    ],
    icons: {
        16: 'img/MATLogo-16.png',
        32: 'img/MATLogo-32.png',
        64: 'img/MATLogo-64.png',
        128: 'img/MATLogo-128.png',
    },

    web_accessible_resources: [
        {
            resources: [
                'src/styles/player.css',
                'assets/plyr.svg',
                'src/styles//MATStyle.css',
                'img/MATLogo-128.png',
                'src/styles/tailwind.css',
                'assets/blank.mp4',
                'src/styles//popup.css',
            ],
            matches: [
                'https://*.mega.nz/*',
                'https://*.magyaranime.eu/*',
                'https://*.magyaranime.hu/*',
                'https://*.dailymotion.com/*',
            ],
        },
    ],

    action: {
        default_popup: 'src/pages/popup/index.html',
        default_icon: {
            16: 'img/MATLogo-16.png',
            32: 'img/MATLogo-32.png',
            64: 'img/MATLogo-64.png',
            128: 'img/MATLogo-128.png',
        },
    },

    options_ui: {
        page: 'src/pages/settings/index.html',
        open_in_tab: true,
    },

    background: {
        type: 'module',
        service_worker: 'src/background.js',
    },

    content_scripts: [
        {
            matches: ['*://*.magyaranime.eu/*', '*://*.magyaranime.hu/*'],
            js: ['src/content.ts', 'src/search.ts'],
            css: [
                'src/styles/player.css',
                'src/styles/MATStyle.css',
                'src/styles/popup.css',
                'src/styles/tailwind.css',
            ],
            all_frames: true,
            run_at: 'document_start',
        },
        {
            matches: ['*://*.magyaranime.eu/*', '*://*.magyaranime.hu/*'],
            js: ['src/rmp.js'],
            // @ts-ignore
            world: 'MAIN',
            all_frames: true,
            run_at: 'document_start',
        },
        {
            matches: ['*://*.magyaranime.eu/hibajelentes/*', '*://*.magyaranime.hu/hibajelentes/*'],
            js: ['src/report.js'],
            all_frames: true,
            run_at: 'document_end',
        },
        {
            matches: ['*://embed.indavideo.hu/*'],
            js: ['src/sources/indavideo.js'],
            all_frames: true,
            run_at: 'document_start',
        },
        {
            matches: ['*://embed.indavideo.hu/*'],
            js: ['src/sources/indavideoHelper.js'],
            all_frames: true,
            run_at: 'document_start',
            // @ts-ignore
            world: 'MAIN',
        },
        {
            matches: ['*://*.mega.nz/embed/*'],
            js: ['src/sources/mega.js'],
            css: ['src/styles/player.css', 'src/styles/popup.css', 'src/styles/MATStyle.css'],
            all_frames: true,
            run_at: 'document_end',
        },
        {
            matches: ['*://*.dailymotion.com/*'],
            js: ['src/sources/dailymotion.tsx'],
            css: ['src/styles/player.css', 'src/styles/MATStyle.css', 'src/styles/popup.css'],
            all_frames: true,
            run_at: 'document_start',
        },
        {
            matches: ['*://*.rumble.com/embed/*'],
            js: ['src/sources/rumble.ts'],
            all_frames: true,
            run_at: 'document_start',
        },
        {
            matches: ['*://*.videa.hu/player?*'],
            js: ['src/sources/videa.js'],
            all_frames: true,
            run_at: 'document_end',
        },
        {
            matches: ['*://*.videa.hu/player?*'],
            js: ['src/sources/videaHelper.js'],
            all_frames: true,
            run_at: 'document_start',
            // @ts-ignore
            world: 'MAIN',
        },
    ],
})
