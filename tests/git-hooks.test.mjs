import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const installer = fileURLToPath(
  new URL('../scripts/install-git-hooks.mjs', import.meta.url),
)
for (const scenario of [
  'archive',
  'incomplete metadata',
  'checkout',
  'installer failure',
]) {
  test(`Git hook setup handles ${scenario}`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'mtn-hooks-'))
    try {
      if (scenario === 'incomplete metadata') mkdirSync(join(directory, '.git'))
      if (scenario === 'checkout' || scenario === 'installer failure') {
        execFileSync('git', ['init', '--quiet', directory])
        const bin = join(directory, 'node_modules', '.bin')
        mkdirSync(bin, { recursive: true })
        writeFileSync(
          join(bin, 'lefthook'),
          `#!/usr/bin/env node\nrequire('node:fs').writeFileSync('hook-called', process.argv[2]);process.exit(${scenario === 'installer failure' ? 7 : 0});\n`,
          { mode: 0o755 },
        )
      }
      const result = spawnSync(process.execPath, [installer], {
        cwd: directory,
        encoding: 'utf8',
      })
      assert.equal(
        result.status,
        scenario === 'installer failure' ? 7 : 0,
        result.stderr,
      )
      if (scenario === 'archive' || scenario === 'incomplete metadata') {
        assert.match(result.stdout, /Skipping Git hook installation/)
      } else {
        assert.equal(
          readFileSync(join(directory, 'hook-called'), 'utf8'),
          'install',
        )
      }
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
}
