import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import webExtension from "vite-plugin-web-extension";
import fs from 'fs';
import path from 'path';

import manifest from "./manifest.firefox";


function Copy() {
    return {
        name: 'copy-from-dist-to-build',
        closeBundle() {
            const distDir = path.resolve(__dirname, 'dist');
            const buildDir = path.resolve(__dirname, 'build-firefox');
            if (fs.existsSync(distDir)) {
                fs.rmSync(buildDir, { recursive: true, force: true });
                fs.renameSync(distDir, buildDir);
            }
        },
    };
}

export default defineConfig({
    define: {
        "process.env.NODE_ENV": JSON.stringify("production")
    },
    build: {
        minify: "esbuild",
        chunkSizeWarningLimit: 750,
        emptyOutDir: true,
        outDir: 'dist',
        manifest: false,
        target: 'baseline-widely-available',
        sourcemap: false,
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
            },
        },
    },
    css: {
        postcss: './postcss.config.cjs',
    },
    plugins: [
        react(),
        webExtension({
            manifest: manifest,
            browser: 'firefox',
            printSummary: true,
            disableAutoLaunch: true,
        }),
        Copy(),
    ],
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
})
