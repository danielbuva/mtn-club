import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

// Deployment exclusions can leave a .git directory without a usable repository.
const git = existsSync('.git')
  ? spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  : null

if (git?.status !== 0 || git.stdout.trim() !== 'true') {
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
