const fs = require('fs')
const path = require('path')

const sourceDir = path.resolve(__dirname, '..', 'frontend', 'dist')
const targetDir = path.resolve(__dirname, '..', 'renderer-dist')

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Frontend build output not found: ${sourceDir}`)
}

fs.rmSync(targetDir, { recursive: true, force: true })
fs.mkdirSync(targetDir, { recursive: true })
fs.cpSync(sourceDir, targetDir, { recursive: true })
