import gulp from 'gulp'
import zip from 'gulp-zip'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

export function prettyFileSize(size) {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgMagenta: '\x1b[45m',
}

const symbols = {
    package: '📦',
    time: '⏰',
    folder: '📁',
    rocket: '🚀',
    gear: '⚙️',
    sparkles: '✨',
    check: '✅',
    arrow: '→',
    info: 'ℹ️',
}

function logHeader(text) {
    const border = '═'.repeat(text.length + 4)
    console.log(`${colors.cyan}${colors.bright}╔${border}╗${colors.reset}`)
    console.log(`${colors.cyan}${colors.bright}║  ${text}  ║${colors.reset}`)
    console.log(`${colors.cyan}${colors.bright}╚${border}╝${colors.reset}`)
}

function logInfo(label, value, color = colors.cyan) {
    console.log(`${colors.dim}  ${symbols.arrow} ${colors.reset}${color}${label}:${colors.reset} ${colors.bright}${value}${colors.reset}`,)
}

function logSuccess(text) {
    console.log(`\n${colors.bgGreen}${colors.white}${colors.bright} ${symbols.sparkles}  SUCCESS ${colors.reset} ${colors.green}${text}${colors.reset}\n`,)
}

const require = createRequire(import.meta.url)

// Get browser type from command line argument, default to chrome
const browser = process.argv[2] || 'chrome'
const buildDir = browser === 'firefox' ? 'build-firefox' : 'build'
const manifest = require(`./${buildDir}/manifest.json`)

const isDev = process.env.NODE_ENV === 'development'

function getFormattedTimestamp(date) {
    const pad = (num) => String(num).padStart(2, '0')
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

const timestamp = getFormattedTimestamp(new Date())
const sourceDir = path.resolve(buildDir)
const outputName = `${manifest.name.replaceAll(' ', '-')}-v${manifest.version}-${browser}${isDev ? '-dev' : ''}-${timestamp}.zip`

logHeader(`${symbols.sparkles}   MagyarAnimeTweaks V${manifest.version}  ${symbols.sparkles} `)
logInfo('Version', manifest.version)
logInfo('Target Browser', browser.toUpperCase())
logInfo('Environment', isDev ? 'Development' : 'Production')
logInfo('Source Directory', sourceDir)
logInfo('Output File', outputName)

console.log(`\n${colors.blue}${colors.bright}${symbols.package} Creating package...${colors.reset}`)

// Add a simple progress indicator
let dots = 0
const progressInterval = setInterval(() => {
    process.stdout.write(
        `\r${colors.yellow}${symbols.gear} Processing${'.'.repeat(dots % 4)}   ${colors.reset}`,
    )
    dots++
}, 100)

gulp.src(`${buildDir}/**`, { encoding: false })
    .pipe(zip(outputName))
    .pipe(gulp.dest('package'))
    .on('end', () => {
        clearInterval(progressInterval)
        process.stdout.write('\r' + ' '.repeat(20) + '\r') // Clear progress line

        const stats = fs.statSync(path.join('package', outputName))

        logSuccess('Package created successfully!')

        const maxWidth = 100

        function formatTableRow(label, value, maxWidth) {
            const labelPart = ` ${label}`;
            const availableSpace = maxWidth - labelPart.length - 1;

            let displayValue = value;
            if (availableSpace > 3 && displayValue.length > availableSpace) {
                displayValue = `${displayValue.slice(0, availableSpace - 3)}...`;
            }

            const totalContentLength = labelPart.length + displayValue.length + 1;
            const rightPadding = Math.max(0, maxWidth - totalContentLength + 6);

            return `${colors.cyan}│${colors.reset}${labelPart}: ${colors.bright}${displayValue}${colors.reset}${" ".repeat(rightPadding)}${colors.cyan}│${colors.reset}`;
        }

        console.log(`${colors.cyan}┌${"─".repeat(maxWidth - 2)}┐${colors.reset}`)
        console.log(`${colors.cyan}│${colors.reset} ${colors.bright}${symbols.package} Package Information${colors.reset}${" ".repeat(maxWidth - 25)}${colors.cyan}│${colors.reset}`,)
        console.log(`${colors.cyan}├${"─".repeat(maxWidth - 2)}┤${colors.reset}`)
        console.log(formatTableRow(`${colors.green}${symbols.check}  File Size${colors.reset}`, prettyFileSize(stats.size), maxWidth),)
        console.log(formatTableRow(`${colors.blue}${symbols.folder} Location${colors.reset}`, `./package/${outputName}`, maxWidth),)
        console.log(`${colors.cyan}└${"─".repeat(maxWidth - 2)}┘${colors.reset}`)



    })
    .on('error', (err) => {
        clearInterval(progressInterval)
        process.stdout.write('\r' + ' '.repeat(20) + '\r')
        console.log(`\n${colors.bgRed}${colors.white}${colors.bright} ❌ ERROR ${colors.reset} ${colors.red}Package creation failed!${colors.reset}\n`,)
        console.log(`${colors.red}${colors.bright}Error Details:${colors.reset}`)
        console.log(`${colors.red}${err.message}${colors.reset}\n`)
    })
