import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { ADMIN_VIEWS, adminViewForPath } from '../lib/admin/views.ts'

test('sidebar identity fallback has no extra gap shifting the public-site link', () => {
  const shell = source('components/admin/admin-shell-fallback.tsx')
  assert.match(
    shell,
    /<LoadingValue className="h-5 w-28" \/>\s*<LoadingValue className="h-4 w-20" \/>/,
  )
})

test('leadership placeholders match collapsed roster summaries', () => {
  const loading = source('components/admin/loading/leadership.tsx')
  const page = source('app/(admin)/admin/leadership/page.tsx')
  for (const className of ['roleCardClass', 'roleSummaryClass']) {
    assert.ok(loading.includes(className))
    assert.ok(page.includes(className))
  }
  assert.match(loading, /flex h-6 items-center/)
  assert.match(loading, /flex h-5 items-center/)
  assert.match(loading, /Add leader/)
  assert.doesNotMatch(loading, /Save roster entry/)
  assert.match(page, /<details\s+key=\{host.id\}/)
  assert.match(page, /<summary className=\{roleSummaryClass\}>/)
  assert.doesNotMatch(page, /<details[^>]*\bopen[\s=>]/)
})

test('settings loading shares the real form layout and input height', () => {
  assert.match(source('components/admin/loading/settings.tsx'), /<SettingsForm/)
  assert.match(source('app/(admin)/admin/settings/page.tsx'), /<SettingsForm/)
  const form = source('components/admin/settings-form.tsx')
  for (const icon of [
    'CalendarClock',
    'CircleDollarSign',
    'MapPin',
    'Mountain',
  ]) {
    assert.ok(form.includes(`<${icon} className=`))
  }
  assert.match(form, /relative flex h-9 w-full/)
  assert.match(source('components/ui/input.tsx'), /flex h-9 w-full/)
  assert.match(form, /Save settings/)
})

const source = path =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('loading controls reuse the live filters and gallery draft form', () => {
  assert.match(
    source('components/admin/loading/lists.tsx'),
    /<AccountFilters disabled/,
  )
  assert.match(
    source('app/(admin)/admin/accounts/page.tsx'),
    /<AccountFilters filters=/,
  )
  assert.match(
    source('components/admin/loading/gallery.tsx'),
    /<GalleryDraftForm disabled/,
  )
  assert.match(
    source('components/gallery/gallery-admin-client.tsx'),
    /<GalleryDraftForm/,
  )
  assert.match(
    source('components/admin/admin-view-frame.tsx'),
    /<TripFilterToolbar/,
  )
  assert.doesNotMatch(
    source('app/(admin)/admin/trips/page.tsx'),
    /placeholder="Search trips"/,
  )
})

test('cold shell uses real navigation labels and shared icons', () => {
  const shell = source('components/admin/admin-shell-fallback.tsx')
  assert.match(shell, /ADMIN_NAV_ITEMS\.map/)
  assert.match(shell, /adminNavigationIcons\[item.label\]/)
  assert.match(shell, /\{item.label\}/)
})

test('shared text inputs have no decorative shadow', () => {
  for (const control of ['input', 'textarea']) {
    assert.doesNotMatch(
      source(`components/ui/${control}.tsx`),
      /shadow-(sm|xs|md|lg)/,
    )
  }
  const select = source('components/ui/select.tsx').split(
    'function SelectContent',
  )[0]
  assert.doesNotMatch(select, /shadow-(sm|xs|md|lg)/)
})

const routes = {
  overview: '',
  trips: '/trips',
  membership: '/membership',
  accounts: '/accounts',
  analytics: '/analytics',
  mailing: '/mailing-list',
  gallery: '/gallery',
  leadership: '/leadership',
  settings: '/settings',
}

test('each admin route selects its own loading view and shared copy', () => {
  for (const [view, path] of Object.entries(routes)) {
    assert.equal(adminViewForPath(`/admin${path}`), view)
    assert.ok(ADMIN_VIEWS[view].title)
    assert.ok(ADMIN_VIEWS[view].description)
  }
  assert.equal(adminViewForPath('/admin/accounts/member-id'), 'accounts')
  assert.equal(adminViewForPath('/admin/unknown'), 'overview')
  assert.equal(adminViewForPath('/admin/toString'), 'overview')
})

test('admin page chrome stays outside each data loading boundary', () => {
  for (const [view, path] of Object.entries(routes)) {
    const source = readFileSync(
      new URL(`../app/(admin)/admin${path}/page.tsx`, import.meta.url),
      'utf8',
    )
    assert.match(
      source,
      new RegExp(`<AdminViewFrame view="${view}">\\s*<Suspense`),
    )
    assert.ok(source.includes(`<AdminPanelFallback view="${view}" />`))
  }
})
