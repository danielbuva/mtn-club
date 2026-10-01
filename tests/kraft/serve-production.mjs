import { spawn } from 'node:child_process'

const build = spawn('pnpm', ['build'], { stdio: 'inherit' })
let server

build.on('exit', code => {
  if (code !== 0) {
    process.exit(code ?? 1)
  }
  server = spawn(
    'pnpm',
    ['start', '--hostname', '127.0.0.1', '--port', '3130'],
    {
      stdio: 'inherit',
    },
  )
  server.on('exit', exitCode => process.exit(exitCode ?? 1))
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    build.kill(signal)
    server?.kill(signal)
  })
}
