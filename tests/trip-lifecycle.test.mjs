import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import * as formatters from '../lib/events/formatters.ts'
import { formatScheduleDate } from '../lib/events/schedule.ts'

function compile(path, dependencies) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const exports = {}
  new Function(
    'require',
    'exports',
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  )(name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
    return dependencies[name]
  }, exports)
  return exports
}

const mappers = compile('../lib/events/mappers.ts', {
  '@/lib/events/formatters': formatters,
})
const event = {
  id: 'event-id',
  schedule_key: null,
  title: 'New official event',
  starts_at: '2027-01-16T01:00:00Z',
  ends_at: '2027-01-17T23:00:00Z',
  time_zone: 'America/Los_Angeles',
  is_official: true,
  lifecycle_status: 'published',
  visibility: 'public',
}
const host = { name: 'Current leader', title: 'Trip Leader' }
function fixture(rows, error) {
  const client = {}
  const read = async passedClient => {
    assert.equal(passedClient, client)
    if (error) throw error
    return rows
  }
  const queries = {
    fetchOfficialTrips: read,
    fetchTripsInRange: read,
    fetchPublicHostsByTrip: async (_client, ids) =>
      new Map(ids.map(id => [id, [host]])),
  }
  const { getOfficialSchedule } = compile(
    '../lib/events/official-schedule.ts',
    {
      '@/lib/events/queries': queries,
      '@/lib/events/mappers': mappers,
    },
  )
  const { getCalendarYearData } = compile('../lib/events/calendar.ts', {
    'date-fns': {
      startOfYear: value => value,
      endOfYear: value => value,
    },
    '@/lib/events/queries': queries,
    '@/lib/events/mappers': mappers,
    '@/lib/supabase/public': { createPublicClient: () => client },
    '@/lib/supabase/server': { createClient: async () => client },
  })
  return {
    schedule: () => getOfficialSchedule(client),
    calendar: () => getCalendarYearData({ year: 2027, viewerKey: 'public' }),
  }
}

test('new official events need no schedule key or hardcoded semester entry', async () => {
  const f = fixture([event])
  const [trip] = await f.schedule()
  assert.equal(trip.id, event.id)
  assert.equal(trip.title, event.title)
  assert.equal(trip.dateStart, '2027-01-15')
  assert.equal(trip.dateEnd, '2027-01-17')
  assert.deepEqual(trip.hosts, [host])
  assert.deepEqual((await f.calendar()).trips, [trip])
})

test('renames, date changes, and cancellation reasons come from the current event', async () => {
  const f = fixture([
    {
      ...event,
      title: 'Rescheduled event',
      starts_at: '2027-01-23T01:00:00Z',
      ends_at: null,
      lifecycle_status: 'canceled',
      cancellation_reason: 'Rain',
    },
  ])
  const [trip] = await f.schedule()
  assert.equal(trip.title, 'Rescheduled event')
  assert.equal(trip.dateStart, '2027-01-22')
  assert.equal(trip.dateEnd, '2027-01-22')
  assert.equal(trip.lifecycleStatus, 'canceled')
  assert.equal(trip.cancellationReason, 'Rain')
  assert.deepEqual((await f.calendar()).trips, [trip])
})

test('deleted events leave both views empty instead of restoring a static trip', async () => {
  const f = fixture([])
  assert.deepEqual(await f.schedule(), [])
  assert.deepEqual((await f.calendar()).trips, [])
})

test('database failures surface for retry instead of publishing outdated events', async () => {
  const error = new Error('Database unavailable')
  const f = fixture([], error)
  await assert.rejects(f.schedule, error)
  await assert.rejects(f.calendar, error)
})

test('schedule labels handle a single day, multi-day weekends, and year boundaries', () => {
  assert.equal(formatScheduleDate('2026-10-23'), 'Oct 23, 2026')
  assert.equal(formatScheduleDate('2026-10-23', '2026-10-23'), 'Oct 23, 2026')
  assert.equal(
    formatScheduleDate('2026-10-23', '2026-10-25'),
    'Oct 23–25, 2026',
  )
  assert.equal(
    formatScheduleDate('2026-10-31', '2026-11-01'),
    'Oct 31–Nov 1, 2026',
  )
  assert.equal(
    formatScheduleDate('2026-12-31', '2027-01-02'),
    'Dec 31, 2026–Jan 2, 2027',
  )
})
