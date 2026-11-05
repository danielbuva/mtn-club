import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as offlineTypes from '../lib/kraft/offline-types.ts'

const compiled = ts.transpileModule(
  readFileSync(
    new URL('../lib/kraft/offline-client.ts', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText

function harness() {
  const timers = new Map()
  const channels = []
  const commands = []
  let nextTimer = 0
  let registrations = 0
  let readyReads = 0
  const snapshot = { status: 'not-downloaded' }
  function worker() {
    return {
      state: 'activated',
      postMessage(command, ports) {
        assert.equal(this.state, 'activated', 'retired worker received command')
        commands.push({ worker: this, command })
        ports[0].reply({ result: snapshot })
      },
    }
  }
  const initialWorker = worker()
  const registration = { active: initialWorker }
  const serviceWorker = {
    controller: initialWorker,
    async register(url, options) {
      assert.equal(url, '/guide/kraft-sw.js')
      assert.equal(options.scope, '/guide/')
      registrations += 1
      return registration
    },
    get ready() {
      readyReads += 1
      return Promise.resolve(registration)
    },
  }
  class MockMessageChannel {
    constructor() {
      this.port1 = {
        onmessage: null,
        closeCount: 0,
        close() {
          this.closeCount += 1
        },
      }
      this.port2 = {
        closeCount: 0,
        close() {
          this.closeCount += 1
        },
        reply: data => this.port1.onmessage?.({ data }),
      }
      channels.push(this)
    }
  }
  const exports = {}
  runInNewContext(compiled, {
    exports,
    require(name) {
      assert.equal(name, './offline-types')
      return offlineTypes
    },
    navigator: { serviceWorker },
    MessageChannel: MockMessageChannel,
    window: {
      setTimeout(callback, delay) {
        const id = ++nextTimer
        timers.set(id, { callback, delay })
        return id
      },
      clearTimeout(id) {
        timers.delete(id)
      },
    },
  })
  function assertClosed() {
    assert.equal(timers.size, 0, 'command timeout must be cleared')
    for (const channel of channels) {
      assert.equal(channel.port1.onmessage, null)
      assert.equal(channel.port1.closeCount, 1)
      assert.equal(channel.port2.closeCount, 1)
    }
  }
  return {
    send: exports.sendOfflineCommand,
    serviceWorker,
    registration,
    initialWorker,
    worker,
    commands,
    timers,
    snapshot,
    assertClosed,
    registrations: () => registrations,
    readyReads: () => readyReads,
  }
}

test('open tabs send later commands to the controller that replaced a retired worker', async () => {
  const h = harness()
  assert.deepEqual(await h.send({ type: 'STATUS' }), h.snapshot)
  const currentWorker = h.worker()
  h.initialWorker.state = 'redundant'
  h.registration.active = currentWorker
  h.serviceWorker.controller = currentWorker
  for (const type of ['DOWNLOAD', 'REMOVE', 'STATUS']) {
    const command =
      type === 'DOWNLOAD'
        ? {
            type,
            version: 'v1',
            assets: [],
            staticPaths: [],
            boulders: 0,
            climbs: 0,
            photos: 0,
          }
        : { type }
    assert.deepEqual(await h.send(command), h.snapshot)
    assert.equal(h.commands.at(-1).worker, currentWorker)
  }
  assert.equal(h.commands[0].worker, h.initialWorker)
  assert.equal(h.registrations(), 1)
  assert.equal(h.readyReads(), 0)
  h.assertClosed()
})

test('uncontrolled tabs resolve the ready registration active worker for every command', async () => {
  const h = harness()
  h.serviceWorker.controller = null
  await h.send({ type: 'STATUS' })
  h.initialWorker.state = 'redundant'
  const currentWorker = h.worker()
  h.registration.active = currentWorker
  await h.send({ type: 'REMOVE' })
  assert.equal(h.commands.at(-1).worker, currentWorker)
  assert.equal(h.readyReads(), 2)
  h.assertClosed()
})

test('postMessage failure rejects immediately and closes both ports and the timeout', async () => {
  const h = harness()
  const failure = new Error('Worker is redundant')
  h.initialWorker.postMessage = () => {
    throw failure
  }
  await assert.rejects(h.send({ type: 'STATUS' }), error => error === failure)
  h.assertClosed()
})

test('a command timeout closes both ports and clears its timer', async () => {
  const h = harness()
  h.initialWorker.postMessage = () => {}
  const pending = h.send({ type: 'STATUS' })
  const rejected = assert.rejects(pending, /stopped responding/)
  // Allow registration and worker resolution to finish without real timers.
  for (let tick = 0; tick < 10 && h.timers.size === 0; tick += 1) {
    await Promise.resolve()
  }
  assert.equal(h.timers.size, 1)
  const timer = [...h.timers.values()][0]
  assert.equal(timer.delay, 45_000)
  timer.callback()
  await rejected
  h.assertClosed()
})

test('worker errors close both ports and clear the timeout', async () => {
  const h = harness()
  h.initialWorker.postMessage = (_command, ports) => {
    ports[0].reply({ error: 'Storage unavailable' })
  }
  await assert.rejects(h.send({ type: 'REMOVE' }), /Storage unavailable/)
  h.assertClosed()
})
