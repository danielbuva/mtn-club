import assert from 'node:assert/strict'
import test from 'node:test'
import {
  announcementStatus,
  schedulesOverlap,
} from '../lib/announcements/schedule.ts'
import { eventDateTimeToIso } from '../lib/events/date-time.ts'

const start = Date.parse('2026-09-08T12:00:00Z')
const item = {
  status: 'published',
  starts_at: new Date(start).toISOString(),
  ends_at: new Date(start + 1000).toISOString(),
}
test('announcement schedule uses inclusive start and exclusive end', () => {
  assert.equal(announcementStatus(item, start - 1), 'Scheduled')
  assert.equal(announcementStatus(item, start), 'Live')
  assert.equal(announcementStatus(item, start + 999), 'Live')
  assert.equal(announcementStatus(item, start + 1000), 'Expired')
  assert.equal(announcementStatus(item, start + 1001), 'Expired')
  assert.equal(announcementStatus({ ...item, status: 'draft' }, start), 'Draft')
  assert.equal(
    announcementStatus({ ...item, status: 'archived' }, start),
    'Archived',
  )
})
test('overlaps exclude adjacent windows and unpublished notices', () => {
  assert.equal(schedulesOverlap(item, item), true)
  assert.equal(
    schedulesOverlap(item, { ...item, starts_at: item.ends_at }),
    false,
  )
  assert.equal(schedulesOverlap(item, { ...item, status: 'draft' }), false)
})
test('meeting schedule uses Pacific daylight time, independent of machine zone', () => {
  assert.equal(
    eventDateTimeToIso('2026-09-15T17:30', 'America/Los_Angeles'),
    '2026-09-16T00:30:00.000Z',
  )
  assert.equal(
    eventDateTimeToIso('2026-09-16T00:00', 'America/Los_Angeles'),
    '2026-09-16T07:00:00.000Z',
  )
  assert.equal(
    eventDateTimeToIso('2026-02-30T12:00', 'America/Los_Angeles'),
    null,
  )
})

test('editor rejects invalid slugs and schedules and allows optional copy', async () => {
  const { announcementSchema } = await import('../lib/announcements/schema.ts')
  const values = {
    id: '',
    slug: 'general-meeting',
    title: 'Meeting',
    subtitle: '',
    description: '',
    content: '',
    status: 'draft',
    starts_at: '2026-09-08T12:00',
    ends_at: '2026-09-09T12:00',
  }
  assert.equal(announcementSchema.safeParse(values).success, true)
  for (const change of [
    { ends_at: values.starts_at },
    { title: '' },
    { slug: '../draft' },
    { starts_at: 'invalid' },
    { status: 'invalid' },
  ]) {
    assert.equal(
      announcementSchema.safeParse({ ...values, ...change }).success,
      false,
    )
  }
})
