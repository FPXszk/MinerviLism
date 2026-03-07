#!/usr/bin/env node
// Wrapper to run Vitest while stripping unsupported Jest-style flags
import { run } from 'vitest'

// Known incompatible flags that sometimes appear in CI
const incompatible = new Set(['--runInBand', '--silent'])

const args = process.argv.slice(2).filter((a) => !incompatible.has(a))

;(async () => {
  try {
    await run(args)
  } catch (e) {
    // Vitest will set process exit accordingly
    // If an exception bubbles up, log and exit with 1
    // eslint-disable-next-line no-console
    console.error('Vitest wrapper error:', e)
    process.exit(1)
  }
})()
