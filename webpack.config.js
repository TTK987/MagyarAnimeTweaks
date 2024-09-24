const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");

module.exports = {
    entry: {
        API: './src/API.js',
        background: './src/background.js',
        content: './src/content.js',
        dailymotion: './src/dailymotion.js',
        indavideo: './src/indavideo.js',
        mega: './src/mega.js',
        options: './src/options.js',
        permissions: './src/permissions.js',
        popup: './src/popup.js',
        rumble: './src/rumble.js',
        videa: './src/videa.js',
        rmp: './src/rmp.js',
        bookmarks: './src/bookmarks.js',
        resume: './src/resume.js',
    },
    output: {
        filename: '[name].js',
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
                { from: './src/logo', to: 'logo' },
                { from: './src/manifest.json' },
                { from: './src/popup.html' },
                { from: './src/options.html' },
                { from: './src/permissions.html' },
                { from: './src/bookmarks.html' },
                { from: './src/blank.mp4' },
                { from: './src/MATStyle.css' },
                { from: './src/options.css' },
                { from: './src/player.css' },
                { from: './src/plyr.svg' },
                { from: './src/resume.html' },
                { from: './src/player.js' },
            ],
        }),
    ],
};