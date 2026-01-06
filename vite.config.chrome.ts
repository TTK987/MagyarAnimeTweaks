import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'

// @ts-ignore
import manifest from './manifest'

// @ts-ignore
export default defineConfig(() => {
    return {
        build: {
            minify: 'esbuild',
            chunkSizeWarningLimit: 750,
            emptyOutDir: true,
            outDir: 'build',
            manifest: false,
            rollupOptions: {
                input: {
                    bookmark: 'src/pages/bookmark/index.html',
                    permissions: 'src/pages/permissions/index.html',
                    popup: 'src/pages/popup/index.html',
                    resume: 'src/pages/resume/index.html',
                    settings: 'src/pages/settings/index.html',
                },
                output: {
                    entryFileNames: 'pages/[name].js',
                    chunkFileNames: 'assets/chunk-[hash].js',
                    manualChunks: (id) => {
                        // put plyr.io's css in a separate chunk
                        if (id.includes('node_modules/plyr/dist/plyr.css')) {
                            return 'plyr'
                        }
                    },
                },
            },
        },
        css: {
            postcss: './postcss.config.cjs',
        },
        plugins: [crx({ manifest }), react()],
        legacy: {
            skipWebSocketTokenCheck: true,
        },
        resolve: {
            alias: {
                '@': '/src',
                '@components': '/src/components',
                '@lib': '/src/lib',
                '@api': '/src/api',
            },
        },
    }
})
