import { expect, type Page, test } from '@playwright/test'

async function declareAge(page: Page) {
  const form = page.locator('form')
  await expect(form).toHaveAttribute('data-ready', 'true')
  await form.getByRole('radio', { name: 'I am 18 or older' }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
}

async function completeWaiver(page: Page) {
  const form = page.locator('form')
  await expect(form.getByLabel('Full name as signature')).toHaveCount(0)
  const opener = form.getByRole('button', { name: 'Read full waiver' })
  await opener.click()
  const reader = page.getByRole('dialog')
  await expect(reader).toBeVisible()
  await reader.screenshot({
    path: `/tmp/mtn-waiver-reader-${page.viewportSize()?.width}.png`,
  })
  await expect(
    reader.getByRole('button', { name: 'Return to form' }),
  ).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(reader).not.toBeVisible()
  await expect(opener).toBeFocused()
  await expect(form.getByLabel('Full name as signature')).toHaveCount(0)
  await opener.click()
  const document = reader.getByRole('region', { name: 'Full waiver document' })
  await document.focus()
  await page.keyboard.press('ControlOrMeta+End')
  await document.evaluate(element => {
    element.scrollTop = element.scrollHeight
  })
  await reader.getByRole('button', { name: 'Return to form' }).click()
  await expect(form.getByLabel('I have read and agree')).not.toBeChecked()
  await expect(form.getByLabel('Full name as signature')).toBeVisible()
  const initials = form.locator('input[id^="waiver-initial-"]')
  for (let index = 0; index < (await initials.count()); index++)
    await initials.nth(index).fill('TP')
  await form.getByLabel('Your phone number').fill('5551234567')
  await form.getByLabel('Your local address').fill('4505 S Maryland Pkwy')
  await form
    .getByLabel('Emergency contact address')
    .fill('4505 S Maryland Pkwy')
  await form.getByLabel('Your date of birth').fill('2000-01-01')
  await form.getByLabel('Full name as signature').fill('Test Participant')
  await form.getByLabel('I have read and agree').check({ force: true })
}

test('registration branches preserve local seats, validate, and recover from errors', async ({
  page,
}, testInfo) => {
  await page.goto('/form-lab')
  const form = page.locator('form')
  await expect(form).toHaveAttribute('data-ready', 'true')
  await declareAge(page)
  const initialHeight = await form.evaluate(element => element.scrollHeight)
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(form.getByText('Please answer this question.')).toBeVisible()
  expect(await form.evaluate(element => element.scrollHeight)).toBe(
    initialHeight,
  )
  await form.getByRole('radio', { name: 'A new adventure for me' }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(
    form.getByRole('heading', { name: 'How are you getting there?' }),
  ).toBeFocused()
  await form.getByRole('radio', { name: /I can drive/ }).check()
  await page.screenshot({
    path: testInfo.outputPath('transportation.png'),
    fullPage: true,
  })
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('button', { name: 'More seats' }).click()
  await form.getByRole('button', { name: 'More seats' }).click()
  await expect(form.getByRole('spinbutton')).toHaveValue('3')
  await form.getByRole('button', { name: 'Back', exact: true }).click()
  await form.getByRole('radio', { name: 'I need a ride' }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(
    form.getByRole('heading', { name: 'Emergency Contact' }),
  ).toBeVisible()
  await form.getByRole('button', { name: 'Back', exact: true }).click()
  await form.getByRole('radio', { name: /I can drive/ }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(form.getByRole('spinbutton')).toHaveValue('3')
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByLabel('Name', { exact: true }).fill('Test Friend')
  await form.getByLabel('Relationship', { exact: true }).fill('Friend')
  await form.getByLabel('Phone', { exact: true }).fill('555123')
  await form.getByLabel('I confirm this emergency contact').check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(form.getByText('Use at least 10 digits.')).toBeVisible()
  await form.getByLabel('Phone', { exact: true }).fill('5551234567')
  await form.getByLabel('I confirm this emergency contact').check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await completeWaiver(page)
  const waiverContinue = form.getByRole('button', {
    name: 'Continue',
    exact: true,
  })
  await waiverContinue.scrollIntoViewIfNeeded()
  console.log(
    await waiverContinue.evaluate(button => {
      const rect = button.getBoundingClientRect()
      return {
        rect: { top: rect.top, bottom: rect.bottom },
        hits: document
          .elementsFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          )
          .slice(0, 5)
          .map(element => `${element.tagName}.${element.className}`),
      }
    }),
  )
  await waiverContinue.click()
  await form
    .getByRole('switch', { name: 'Show me in the attendee list' })
    .check()
  await form.getByRole('switch', { name: 'Email me trip updates' }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(form.getByText('Can drive · 3 passenger seats')).toBeVisible()
  await page.getByText('Try a different situation', { exact: true }).click()
  await page
    .getByRole('switch', { name: /Try an interrupted connection/ })
    .check()
  await form.getByRole('button', { name: 'Confirm Going' }).click()
  await expect(form.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  await expect(form.getByText(/Unable to save/)).toBeVisible()
  await page
    .getByRole('switch', { name: /Try an interrupted connection/ })
    .uncheck()
  await form.getByRole('button', { name: 'Confirm Going' }).click()
  await expect(
    form.getByRole('heading', { name: 'You’re all set.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Start fresh' }).click()
  await expect(
    form.getByRole('radio', { name: 'I am 18 or older' }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
})

test('creation is grouped, editable, and validates before publishing', async ({
  page,
}, testInfo) => {
  await page.goto('/form-lab')
  await page.getByRole('button', { name: 'Plan a trip', exact: true }).click()
  const form = page.locator('form')
  await expect(form).toHaveAttribute('data-ready', 'true')
  await form.getByLabel('Trip title').fill('')
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(form.getByLabel('Trip title')).toBeFocused()
  await form.getByLabel('Trip title').fill('A Saturday outside')
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(form.locator('[data-form-viewport] > div')).toHaveCSS(
    'opacity',
    '1',
  )
  await page.screenshot({
    path: testInfo.outputPath('creation.png'),
    fullPage: true,
  })
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form
    .getByLabel('Trip-specific risks and conditions')
    .fill('Exposed desert heat with little shade.')
  await form.getByLabel('hiking', { exact: true }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByLabel('Participant limit', { exact: true }).fill('12')
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('button', { name: 'Edit A Saturday outside' }).click()
  await expect(form.getByLabel('Trip title')).toHaveValue('A Saturday outside')
  for (let step = 0; step < 5; step++)
    await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form
    .getByRole('button', { name: 'Create Official Trip', exact: true })
    .click()
  await expect(
    form.getByRole('heading', { name: 'Your trip is ready.' }),
  ).toBeVisible()
})

test('transportation can be omitted and long content stays scrollable', async ({
  page,
}, testInfo) => {
  await page.goto('/form-lab')
  await page.getByText('Try a different situation', { exact: true }).click()
  await page.getByRole('switch', { name: 'Ask about transportation' }).uncheck()
  await page
    .getByRole('switch', { name: 'Include longer reading and writing' })
    .check()
  const form = page.locator('form')
  await expect(form).toHaveAttribute('data-ready', 'true')
  await declareAge(page)
  await form.getByRole('radio', { name: 'Right up my alley' }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(
    form.getByRole('heading', { name: 'Emergency Contact' }),
  ).toBeVisible()
  await form.getByLabel('Name', { exact: true }).fill('Test Friend')
  await form.getByLabel('Relationship', { exact: true }).fill('Friend')
  await form.getByLabel('Phone', { exact: true }).fill('5551234567')
  await form.getByLabel('I confirm this emergency contact').check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.screenshot({
    path: testInfo.outputPath('long-content-dark.png'),
    fullPage: true,
  })
  await completeWaiver(page)
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(
    form.getByRole('heading', { name: 'Everything look right?' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
})

test('small visual viewports use inline actions and keyboard navigation remains available', async ({
  page,
}) => {
  await page.goto('/form-lab')
  const form = page.locator('form')
  await expect(form).toHaveAttribute('data-ready', 'true')
  await declareAge(page)
  const first = form.getByRole('radio', { name: 'Right up my alley' })
  await first.focus()
  await page.keyboard.press('ArrowDown')
  await expect(
    form.getByRole('radio', { name: 'A new adventure for me' }),
  ).toBeChecked()
  await page.keyboard.press('Tab')
  await expect(
    form.getByRole('button', { name: 'Continue', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await page.setViewportSize({ width: 320, height: 400 })
  await expect(form.locator('[data-form-actions]')).toHaveCSS(
    'position',
    /^(static|relative)$/,
  )
  await form.getByRole('button', { name: 'Skip for now' }).click()
  await form.getByLabel('Name', { exact: true }).fill('Small viewport')
  await expect(form.getByLabel('Name', { exact: true })).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
})

for (const situation of ['first', 'returning', 'missing risks']) {
  const signed = situation !== 'first'
  const missingRisks = situation === 'missing risks'
  test(`annual registration ${situation}`, async ({ page }, testInfo) => {
    await page.goto('/form-lab')
    await page.getByText('Try a different situation', { exact: true }).click()
    await page.getByLabel('Annual waiver example', { exact: true }).check()
    if (missingRisks)
      await page
        .getByLabel('Trip risks not configured', { exact: true })
        .check()
    if (signed)
      await page
        .getByLabel('Annual waiver already signed', { exact: true })
        .check()
    await page.getByLabel('Ask about transportation', { exact: true }).uncheck()
    await declareAge(page)
    const form = page.locator('form')
    await form.getByRole('radio', { name: 'A new adventure for me' }).check()
    await form.getByRole('button', { name: 'Continue', exact: true }).click()
    await form.getByLabel('Name', { exact: true }).fill('Test Friend')
    await form.getByLabel('Relationship', { exact: true }).fill('Friend')
    await form.getByLabel('Phone', { exact: true }).fill('7025550100')
    await form.getByLabel('I confirm this emergency contact').check()
    await form.getByRole('button', { name: 'Continue', exact: true }).click()
    if (!signed) {
      await expect(
        form.getByText('You’re signing MTN Club’s annual UNLV waiver', {
          exact: false,
        }),
      ).toBeVisible()
      await expect(
        form.getByText('Valid July 1, 2026 through June 30, 2027', {
          exact: true,
        }),
      ).toBeVisible()
      await completeWaiver(page)
      await form.getByRole('button', { name: 'Continue', exact: true }).click()
    }
    await expect(
      form.getByRole('heading', { name: 'Before you go', exact: true }),
    ).toBeVisible()
    await expect(
      form.getByRole('button', { name: 'Read full waiver' }),
    ).toHaveCount(0)
    const acknowledgement = form.getByLabel(
      'I understand these trip-specific risks and conditions.',
    )
    if (missingRisks) {
      await expect(acknowledgement).toHaveCount(0)
      await expect(
        form.getByText('There is nothing to acknowledge yet.', {
          exact: false,
        }),
      ).toBeVisible()
      await form.getByRole('button', { name: 'Continue', exact: true }).click()
      await expect(
        form.getByRole('heading', { name: 'Before you go', exact: true }),
      ).toBeVisible()
      return
    }
    await expect(acknowledgement).not.toBeChecked()
    await form.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(
      form.getByText('Review and acknowledge these trip-specific risks.', {
        exact: true,
      }),
    ).toBeVisible()
    await acknowledgement.check()
    await page.screenshot({
      path: testInfo.outputPath(`annual-risk-${signed}.png`),
      fullPage: true,
    })
    await form.getByRole('button', { name: 'Continue', exact: true }).click()
    await form.getByRole('button', { name: 'Continue', exact: true }).click()
    await form
      .getByRole('button', { name: 'Confirm Going', exact: true })
      .click()
    await expect(
      form.getByRole('heading', { name: 'You’re all set.' }),
    ).toBeVisible()
    await expect(
      form.getByRole('link', { name: 'Close registration' }),
    ).toHaveAttribute('href', '/trips')
  })
}

test('registered trip options, action-required link and signed waiver fit the viewport', async ({
  page,
}) => {
  await page.goto('/form-lab')
  await page
    .getByText('Registration regression examples', { exact: true })
    .click()
  const panel = page.getByTestId('registration-regressions')
  await expect(
    panel.getByRole('link', { name: 'Finish setup' }),
  ).toHaveAttribute('href', /\/rsvp$/)
  await panel.getByRole('button', { name: 'Going', exact: true }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(
    dialog.getByRole('link', { name: 'Edit registration' }),
  ).toHaveAttribute('href', /\/rsvp$/)
  await expect(
    dialog.getByRole('button', { name: 'Cancel registration', exact: true }),
  ).toBeVisible()
  await dialog.getByRole('button', { name: 'Keep registration' }).click()
  await panel.getByText('View signed waiver', { exact: false }).click()
  await expect(
    panel.getByText('Event:  Outdoor adventures', { exact: false }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
})
