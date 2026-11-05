import { expect, test } from '@playwright/test'

test.skip(
  process.env.KRAFT_ANNOTATION_FIXTURE_TEST !== 'true',
  'The synthetic topo fixture is available only on an isolated development server.',
)

test('start hand nodes and movement options remain one selectable synthetic climb', async ({
  page,
}) => {
  await page.goto('/input-test/kraft-topo')
  const overlay = page.getByRole('group', {
    name: 'Interactive routes. Select a line or climb.',
  })
  const matched = overlay.getByRole('button', {
    name: /^Route 1: Fixture route A,/,
  })
  const alternatives = overlay.getByRole('button', {
    name: /^Route 2: Fixture route B,/,
  })
  await expect(overlay.getByRole('button')).toHaveCount(2)
  await page
    .getByRole('button', { name: 'Calibration view 2', exact: true })
    .click()
  await expect(matched.locator('[data-start-kind]')).toHaveAttribute(
    'data-placement',
    'reviewed-region',
  )
  await expect(matched.locator('[data-hand-node]')).toHaveCount(0)
  await expect(matched.locator('text')).toHaveText('~ start zone')
  await expect(alternatives.locator('[data-start-kind]')).toHaveAttribute(
    'data-start-kind',
    'seated-hands-low',
  )
  await expect(alternatives.locator('[data-hand-node="required"]')).toHaveCount(
    2,
  )
  await expect(alternatives.locator('[data-hand-label="left"]')).toHaveText('L')
  await expect(alternatives.locator('[data-hand-label="right"]')).toHaveText(
    'R',
  )
  await page
    .getByRole('button', { name: 'Calibration view 1', exact: true })
    .click()
  await expect(matched.locator('[data-hand-node="matched"]')).toHaveCount(1)
  await expect(matched.locator('text')).toHaveText('matched start')
  await expect(alternatives.locator('[data-hand-node="required"]')).toHaveCount(
    1,
  )
  await expect(
    alternatives.locator('[data-hand-node="other-region"]'),
  ).toHaveCount(1)
  await expect(alternatives.locator('[data-dyno-node]')).toHaveCount(2)
  await alternatives.focus()
  await page.keyboard.press('Enter')
  await expect(alternatives).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('article', { name: 'Fixture route B details' }),
  ).toContainText('dyno and static options belong to this same climb')
  await page
    .getByRole('button', { name: 'Zoom in photograph', exact: true })
    .click()
  const node = matched.locator('[data-hand-node="matched"]')
  expect(
    await node.evaluate(element =>
      Number.parseFloat(
        getComputedStyle(
          element.closest('[data-start-kind]')?.parentElement ?? element,
        ).opacity,
      ),
    ),
  ).toBeLessThan(0.4)
  await page
    .getByRole('button', { name: 'Zoom in photograph', exact: true })
    .click()
  await expect(overlay.locator('circle, text, [data-dyno-node]')).toHaveCount(0)
  await expect(overlay.getByRole('button')).toHaveCount(2)
})
