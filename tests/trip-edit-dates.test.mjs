import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import * as dateTime from '../lib/events/date-time.ts'
import * as riskActivities from '../lib/registration/risk-activities.ts'

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
const { resolveTripEditDates } = compile('../lib/events/trip-edit-dates.ts', {
  './date-time': dateTime,
})
const trip = {
  starts_at: '2026-09-13T07:00:00+00:00',
  ends_at: '2026-09-14T06:59:59+00:00',
  rsvp_deadline: '2026-09-13T01:00:00+00:00',
  time_zone: 'America/Los_Angeles',
  is_all_day: true,
}
const form = (start, end) => {
  const result = new FormData()
  result.set('startAt', start)
  result.set('endAt', end)
  return result
}
test('Black Mountain edit preserves the date and exact end seconds on a UTC server', () => {
  const result = resolveTripEditDates(
    form('2026-09-13T00:00', '2026-09-13T23:59'),
    trip,
  )
  assert.equal(result.ok, true)
  assert.equal(result.startsAt, trip.starts_at)
  assert.equal(result.endsAt, trip.ends_at)
})
test('edited wall times use the event timezone, including winter offset', () => {
  const result = resolveTripEditDates(
    form('2026-11-14T06:00', '2026-11-14T18:00'),
    trip,
  )
  assert.equal(result.ok, true)
  assert.equal(result.startsAt, '2026-11-14T14:00:00.000Z')
  assert.equal(result.endsAt, '2026-11-15T02:00:00.000Z')
})
test('actual deadline conflicts and invalid dates return actionable errors', () => {
  const conflict = resolveTripEditDates(
    form('2026-09-12T17:00', '2026-09-13T23:59'),
    trip,
  )
  assert.equal(conflict.ok, false)
  assert.match(conflict.error, /Manage registration/)
  for (const value of ['2026-03-08T02:30', 'not-a-date']) {
    assert.equal(resolveTripEditDates(form(value, ''), trip).ok, false)
  }
})
test('an unchanged repeated DST hour preserves its original instant', () => {
  const repeated = { ...trip, starts_at: '2026-11-01T09:30:15Z', ends_at: null }
  assert.equal(
    resolveTripEditDates(form('2026-11-01T01:30', ''), repeated).startsAt,
    repeated.starts_at,
  )
})

const { z } = await import('zod')
const activityTags = await import('../lib/events/activity-tags.ts')
function actionFixture({ allowed = true, saved = true } = {}) {
  const writes = []
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'admin' } } }) },
    rpc: async () => ({ data: allowed }),
    from(table) {
      let updating = false
      const builder = {
        select() {
          return builder
        },
        eq() {
          return builder
        },
        update(payload) {
          updating = true
          writes.push({ table, payload })
          return builder
        },
        async single() {
          return { data: trip }
        },
        async maybeSingle() {
          return { data: updating && saved ? { id: 'trip' } : null }
        },
        async upsert(payload) {
          writes.push({ table, payload })
          return { error: null }
        },
      }
      return builder
    },
  }
  const actions = compile('../app/(reader)/trips/actions.ts', {
    'next/cache': { revalidatePath() {} },
    'next/navigation': {
      redirect() {
        throw new Error('Unexpected redirect')
      },
    },
    zod: { z },
    '@/lib/events/activity-tags': activityTags,
    '@/lib/events/host-assignments': {},
    '@/lib/events/trip-edit-dates': { resolveTripEditDates },
    '@/lib/supabase/server': { createClient: async () => client },
  })
  const values = form('2026-09-13T00:00', '2026-09-13T23:59')
  values.set('tripId', '771c7bce-afc2-44de-acf5-5b5268ff1bbb')
  values.set('title', 'Black Mountain Hike')
  return {
    save: () => actions.saveTripDetailEditsAction(values),
    values,
    writes,
  }
}
test('full save action sends timezone-correct instants without querying membership', async () => {
  const f = actionFixture()
  assert.equal((await f.save()).ok, true)
  assert.equal(f.writes[0].payload.starts_at, trip.starts_at)
  assert.equal(f.writes[0].payload.ends_at, trip.ends_at)
  assert.equal(f.writes[1].table, 'trip_private')
})
test('date conflicts and permission failures cause no partial writes', async () => {
  const conflict = actionFixture()
  conflict.values.set('startAt', '2026-09-12T17:00')
  assert.equal((await conflict.save()).ok, false)
  assert.deepEqual(conflict.writes, [])
  const denied = actionFixture({ allowed: false })
  assert.equal((await denied.save()).ok, false)
  assert.deepEqual(denied.writes, [])
})
test('a row hidden by access rules is not reported as saved', async () => {
  const f = actionFixture({ saved: false })
  assert.equal((await f.save()).ok, false)
  assert.equal(f.writes.length, 1)
})

test('setting a start time clears TBA while unrelated edits preserve it', () => {
  const unchanged = form('2026-09-13T00:00', '2026-09-13T23:59')
  assert.equal(resolveTripEditDates(unchanged, trip).isAllDay, true)
  const timed = form('2026-09-13T07:00', '2026-09-13T23:59')
  assert.equal(resolveTripEditDates(timed, trip).isAllDay, false)
  timed.set('timeTba', 'true')
  assert.equal(resolveTripEditDates(timed, trip).isAllDay, true)
  unchanged.set('timeTba', 'false')
  assert.equal(resolveTripEditDates(unchanged, trip).isAllDay, false)
})

test('saving an explicit time updates both the timestamp and display flag', async () => {
  const f = actionFixture()
  f.values.set('startAt', '2026-09-13T07:00')
  f.values.set('timeTba', 'false')
  assert.equal((await f.save()).ok, true)
  assert.equal(f.writes[0].payload.starts_at, '2026-09-13T14:00:00.000Z')
  assert.equal(f.writes[0].payload.is_all_day, false)
})

test('open-ended edit removes the old placeholder end and preserves the start', () => {
  const values = form('2026-09-13T07:00', '2026-09-13T23:59')
  values.set('noEndTime', 'true')
  values.set('timeTba', 'false')
  const saved = { ...trip, starts_at: '2026-09-13T14:00:00+00:00' }
  const result = resolveTripEditDates(values, saved)
  assert.equal(result.ok, true)
  assert.equal(result.startsAt, saved.starts_at)
  assert.equal(result.endsAt, null)
  assert.equal(result.isAllDay, false)
})

test('open-ended save action writes null instead of retaining the previous end', async () => {
  const f = actionFixture()
  f.values.set('noEndTime', 'true')
  assert.equal((await f.save()).ok, true)
  assert.equal(f.writes[0].payload.ends_at, null)
})

const constants = compile('../lib/events/constants.ts', {})
const { eventFormSchema } = compile('../lib/events/schema.ts', {
  zod: { z },
  '@/lib/events/constants': constants,
  '@/lib/registration/risk-activities': riskActivities,
  './date-time': dateTime,
})
const draftHelpers = compile('../lib/events/drafts.ts', {
  './activity-tags': activityTags,
  './constants': constants,
  './date-time': dateTime,
})
const { emptyEventValues } = compile('../lib/events/form-values.ts', {})
const { formatTimeRange } = compile('../lib/events/formatters.ts', {})
test('creation supports explicit no end, including draft round trips', () => {
  const values = {
    ...emptyEventValues(),
    title: 'Open-ended hike',
    waiverActivities: ['hiking'],
    startAt: '2026-09-13T07:00',
    endAt: '',
    noEndTime: true,
    primaryLocationName: 'Black Mountain',
  }
  assert.equal(eventFormSchema.safeParse(values).success, true)
  assert.equal(
    eventFormSchema.safeParse({ ...values, waiverActivities: [] }).success,
    false,
  )
  assert.equal(
    eventFormSchema.safeParse({ ...values, waiverActivities: ['none'] })
      .success,
    true,
  )
  assert.equal(
    eventFormSchema.safeParse({
      ...values,
      waiverActivities: ['none', 'hiking'],
    }).success,
    false,
  )
  assert.equal(
    eventFormSchema.safeParse({ ...values, noEndTime: false }).success,
    false,
  )
  const draft = draftHelpers.toDraftRowInput({
    values,
    isNoLimitEnabled: true,
    createdBy: 'user',
    canChooseOfficial: true,
  })
  assert.equal(draft.ends_at, null)
  assert.equal(draft.no_end_time, true)
  assert.equal(draft.starts_at, '2026-09-13T14:00:00.000Z')
  const restored = draftHelpers.toEventFormValuesFromDraft({
    draft,
    canChooseOfficial: true,
    timezoneFallback: 'America/Los_Angeles',
  }).values
  assert.equal(restored.noEndTime, true)
  assert.equal(restored.endAt, '')
  assert.equal(eventFormSchema.safeParse(restored).success, true)
  assert.equal(
    formatTimeRange(draft.starts_at, draft.ends_at, 'America/Los_Angeles'),
    '7:00 AM',
  )
  assert.equal(
    draftHelpers.toEventFormValuesFromDraft({
      draft: { ...draft, no_end_time: false },
      canChooseOfficial: true,
      timezoneFallback: 'America/Los_Angeles',
    }).values.noEndTime,
    false,
  )
})
