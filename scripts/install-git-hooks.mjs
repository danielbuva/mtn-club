import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

if (!existsSync('.git')) {
  console.log('Skipping Git hook installation outside a Git checkout.')
  process.exit(0)
}

const command = join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'lefthook.cmd' : 'lefthook',
)
const result = spawnSync(command, ['install'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.error) {
  console.error(`Unable to install Git hooks: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
