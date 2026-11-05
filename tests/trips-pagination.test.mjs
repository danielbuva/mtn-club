import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const exports = {}
new Function(
  'require',
  'exports',
  ts.transpileModule(
    readFileSync(
      new URL('../lib/trips/list-query.ts', import.meta.url),
      'utf8',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
)(name => {
  assert.equal(name, '@/lib/events/queries')
  return { LEGACY_PLACEHOLDER_TRIP_IDS: [] }
}, exports)
const { fetchTripListPage, parseTripListParams } = exports

// Simulate the API's 1000-row cap as well as its ordering/filtering semantics.
function clientFor(rows, error = null) {
  return {
    from(table) {
      assert.equal(table, 'trips')
      let matches = rows
      let from = 0
      let to = 999
      const orders = []
      function result() {
        const data = [...matches]
          .sort((a, b) => {
            for (const { key, ascending } of orders) {
              const order = a[key].localeCompare(b[key])
              if (order) return ascending ? order : -order
            }
            return 0
          })
          .slice(from, Math.min(to + 1, from + 1000))
        return Promise.resolve({ data, error })
      }
      const query = {
        select() {
          return query
        },
        not() {
          return query
        },
        in(key, values) {
          matches = matches.filter(row => values.includes(row[key]))
          return query
        },
        order(key, { ascending }) {
          orders.push({ key, ascending })
          return query
        },
        range(start, end) {
          from = start
          to = end
          return query
        },
        lt(key, value) {
          matches = matches.filter(row => row[key] < value)
          return result()
        },
        gte(key, value) {
          matches = matches.filter(row => row[key] >= value)
          return result()
        },
      }
      return query
    },
  }
}

test('trip history pages reach all 1050 trips and retain a stable date/id order', async () => {
  const rows = Array.from({ length: 1050 }, (_, i) => ({
    id: String(i).padStart(4, '0'),
    starts_at: '2020-01-01T00:00:00.000Z',
    lifecycle_status: 'published',
  }))
  const upcoming = {
    id: 'future',
    starts_at: '2100-01-01T00:00:00.000Z',
    lifecycle_status: 'published',
  }
  const client = clientFor([...rows, upcoming])
  const seen = []
  for (let page = 1; ; page++) {
    const { events, hasMore } = await fetchTripListPage(client, 'past', page)
    assert.ok(events.length <= 24)
    seen.push(...events.map(event => event.id))
    if (!hasMore) break
  }
  assert.deepEqual(seen, rows.map(row => row.id).reverse())
  assert.deepEqual((await fetchTripListPage(client, 'upcoming', 1)).events, [
    upcoming,
  ])
  assert.deepEqual(await fetchTripListPage(client, 'past', 100), {
    events: [],
    hasMore: false,
  })
})

test('invalid page parameters reset safely and query failures reject the page', async () => {
  for (const page of ['-1', '0', 'NaN', '1.5', 'Infinity', '100001', ['2']]) {
    assert.deepEqual(parseTripListParams({ page, view: 'invalid' }), {
      page: 1,
      view: 'upcoming',
    })
  }
  assert.deepEqual(parseTripListParams({ page: '3', view: 'past' }), {
    page: 3,
    view: 'past',
  })
  await assert.rejects(
    fetchTripListPage(
      clientFor([], new Error('Database unavailable')),
      'past',
      1,
    ),
    /Database unavailable/,
  )
})
