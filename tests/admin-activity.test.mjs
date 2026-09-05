import assert from 'node:assert/strict'
import test from 'node:test'
import {
  activityHistoryHref,
  activityOwnerName,
  literalSearch,
  parseActivityFilters,
} from '../lib/admin/activity-filters.ts'

test('history filters normalize input and reject impossible dates and invalid paging', () => {
  assert.deepEqual(
    parseActivityFilters({
      owner: [' Dani ', 'ignored'],
      action: ' trip ',
      from: '2026-02-30',
      to: '2026-09-04',
      historySort: 'invalid',
      historyPage: '-1',
    }),
    {
      owner: 'Dani',
      action: 'trip',
      from: '',
      to: '2026-09-04',
      sort: 'newest',
      page: 1,
    },
  )
  assert.equal(parseActivityFilters({ historyPage: '1.5' }).page, 1)
  assert.equal(
    parseActivityFilters({
      from: '2024-02-29',
      historySort: 'oldest',
      historyPage: '3',
    }).from,
    '2024-02-29',
  )
  assert.equal(
    parseActivityFilters({ historySort: 'action_desc' }).sort,
    'action_desc',
  )
})

test('pagination preserves filters and metric range while replacing only the page', () => {
  const url = new URL(
    activityHistoryHref(
      {
        range: '90',
        owner: 'A & B',
        action: 'trip_updated',
        from: '2026-09-01',
        to: '2026-09-04',
        historySort: 'oldest',
        historyPage: '8',
      },
      2,
    ),
    'https://example.com',
  )
  assert.equal(url.searchParams.get('owner'), 'A & B')
  assert.equal(url.searchParams.get('historyPage'), '2')
  assert.equal(url.searchParams.get('range'), '90')
  assert.equal(url.searchParams.get('historySort'), 'oldest')
  assert.equal(url.searchParams.get('to'), '2026-09-04')
  assert.equal(url.hash, '#activity-history')
})

test('owner attribution uses names without inventing identities for missing actors', () => {
  const names = new Map([
    ['one', ' Dani '],
    ['two', ' '],
  ])
  assert.equal(activityOwnerName('one', names), 'Dani')
  assert.equal(activityOwnerName('two', names), 'User two')
  assert.equal(activityOwnerName('missing', names), 'User missing')
  assert.equal(activityOwnerName(null, names), 'System / unavailable')
})

test('filter text treats SQL wildcard characters literally', () => {
  assert.equal(literalSearch('trip_updated%'), 'trip\\_updated\\%')
  assert.equal(literalSearch('a\\b'), 'a\\\\b')
})
