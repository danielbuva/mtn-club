import { expect, test } from '@playwright/test'

test.beforeEach(async ({ request }) => {
  await request.get('http://127.0.0.1:54399/test/announcement?active=true')
})
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test(`homepage notice placement and link at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    const note = page.getByRole('complementary', { name: 'Club announcement' })
    await expect(note).toBeVisible()
    await expect(note.getByText('From Dax Whitaker')).toBeVisible()
    const box = await note.boundingBox()
    expect(box).not.toBeNull()
    if (!box) return
    expect(box.x).toBeGreaterThan(16)
    expect(box.x + box.width).toBeLessThan(viewport.width - 16)
    expect(box.y + box.height).toBeLessThan(viewport.height * 0.4)
    const wordmark = await page.locator('[data-home-wordmark]').boundingBox()
    if (viewport.width < 1000 && wordmark)
      expect(box.y + box.height).toBeLessThan(wordmark.y)
    if (viewport.width > 1000) expect(box.x).toBeGreaterThan(viewport.width / 2)
    const link = note.getByRole('link')
    await expect(link).toHaveAttribute('href', '/announcements/general-meeting')
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('heading', { level: 1, name: 'General meeting' }),
    ).toBeVisible()
    await expect(page).toHaveTitle('General meeting | UNLV Mountain Club')
  })
}
test('no active notice leaves no homepage placeholder', async ({
  page,
  request,
}) => {
  await request.get('http://127.0.0.1:54399/test/announcement?active=false')
  await page.goto('/')
  await expect(
    page.getByRole('link', { name: 'Welcome →', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('complementary', { name: 'Club announcement' }),
  ).toHaveCount(0)
})
test('past detail retains current link and missing or draft slugs use 404', async ({
  page,
}) => {
  await page.goto('/announcements/past-meeting')
  await expect(
    page
      .getByRole('article')
      .getByText('From the archives · Past announcement'),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Current notice: General meeting →' }),
  ).toBeVisible()
  for (const slug of ['missing', 'draft']) {
    await page.goto(`/announcements/${slug}`)
    await expect(page.getByText('This page could not be found.')).toBeVisible()
  }
})
