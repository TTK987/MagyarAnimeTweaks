import fs from 'node:fs'
import path from 'node:path'

const packageDir = path.resolve('package')

fs.rmSync(packageDir, { recursive: true, force: true })
fs.mkdirSync(packageDir, { recursive: true })

console.log(`\x1b[36m[package]\x1b[0m \x1b[32mCleaned package directory\x1b[0m`)
