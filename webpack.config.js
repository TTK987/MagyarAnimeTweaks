const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");

module.exports = {
    entry: {
        background: './src/background.js',
        content: './src/content.js',
        dailymotion: './src/dailymotion.js',
        indavideo: './src/indavideo.js',
        mega: './src/mega.js',
        permissions: './src/permissions.js',
        rumble: './src/rumble.js',
        videa: './src/videa.js',
        rmp: './src/rmp.js',
        report: './src/report.js',
        bookmark: './src/pages/bookmark/bookmark.js',
        settings: './src/pages/settings/settings.js',
        resume: './src/pages/resume/resume.js',
        popup: './src/pages/popup/popup.js',
    },
    output: {
        filename: (pathData) => {
            if (pathData.chunk.name === 'commons') return 'pages/commons.js';
            let names = ['bookmark', 'settings', 'resume', 'popup'];
            return names.includes(pathData.chunk.name) ? 'pages/[name]/[name].js' : '[name].js';
        },
        path: path.resolve(__dirname, 'extension'),
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
            }),
            new CssMinimizerPlugin(),
            new HtmlMinimizerPlugin(),
        ],
    },
    module: {
        rules: [
            {
                test: /.js$/,
                exclude: /node_modules/,
            },
            {
                test: /.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /.html$/,
                use: ['html-loader'],
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: './src/logo', to: 'logo'},
                {from: './src/pages/bookmark/index.html', to: 'pages/bookmark/index.html'},
                {from: './src/pages/bookmark/bookmark.css', to: 'pages/bookmark/bookmark.css'},
                {from: './src/pages/settings/index.html', to: 'pages/settings/index.html'},
                {from: './src/pages/settings/settings.css', to: 'pages/settings/settings.css'},
                {from: './src/pages/resume/index.html', to: 'pages/resume/index.html'},
                {from: './src/pages/resume/resume.css', to: 'pages/resume/resume.css'},
                {from: './src/pages/popup/index.html', to: 'pages/popup/index.html'},
                {from: './src/pages/popup/popup.css', to: 'pages/popup/popup.css'},
                {from: './src/pages/common.css', to: 'pages/common.css'},
                {from: './src/assets', to: 'assets'},
                {from: './src/manifest.json'},
                {from: './src/permissions.html'},
                {from: './src/bookmarks.html'},
                {from: './src/blank.mp4'},
                {from: './src/MATStyle.css'},
                {from: './src/player.css'},
                {from: './src/plyr.svg'},
                {from: './src/player.js'},
            ],
        }),
    ],
};