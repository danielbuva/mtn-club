import { mkdir, copyFile, access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcWorker = resolve(root, 'node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js')
const srcWorkerDev = resolve(root, 'node_modules/maplibre-gl/dist/maplibre-gl-csp-worker-dev.js')
const destWorker = resolve(root, 'public/maplibre/maplibre-gl-worker.js')
const destWorkerDev = resolve(root, 'public/maplibre/maplibre-gl-worker-dev.js')

async function copyOrThrow(source, destination) {
  await access(source)
  await mkdir(dirname(destination), { recursive: true })
  await copyFile(source, destination)
  console.log('copied', source, '->', destination)
}

await copyOrThrow(srcWorker, destWorker)
await copyOrThrow(srcWorkerDev, destWorkerDev)
