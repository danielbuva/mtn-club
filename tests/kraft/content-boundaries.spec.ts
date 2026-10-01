import { expect, test } from '@playwright/test'
import { kraftBoulders } from '../../lib/kraft/data'
import { openMapCatalog } from './catalog-helpers'

test('available real photographs load, retain attribution and do not imply reviewed route geometry', async ({
  page,
}, testInfo) => {
  await page.goto('/guide/kraft')
  for (const boulder of kraftBoulders) {
    for (const face of boulder.faces) {
      if (face.image.status !== 'available') continue
      await openMapCatalog(page, boulder.id)
      const dialog = page.getByRole('dialog', {
        name: `${boulder.name} boulder guide`,
      })
      await dialog
        .getByRole('group', { name: 'Recorded boulder faces' })
        .getByRole('button', {
          name: `${face.name} · ${face.orientation}`,
          exact: true,
        })
        .click()
      const viewer = dialog.getByRole('region', {
        name: 'Boulder faces',
        exact: true,
      })
      const photo = viewer.getByRole('img', {
        name: face.image.alt,
        exact: true,
      })
      await expect(photo).toBeVisible()
      await expect
        .poll(() =>
          photo.evaluate(
            element =>
              element instanceof HTMLImageElement &&
              element.complete &&
              element.naturalWidth > 0,
          ),
        )
        .toBe(true)
      const photoCredit = viewer.getByRole('link', {
        name: /^Photo:/,
        includeHidden: true,
      })
      await expect(photoCredit).toBeHidden()
      await viewer.getByText('Photo notes & credit', { exact: true }).click()
      await expect(photoCredit).toBeVisible()
      if (face.photographNote)
        await expect(
          viewer.getByText(face.photographNote, { exact: true }),
        ).toBeVisible()
      await expect(viewer).toContainText(
        'viewpoint and route correspondence await field review',
      )
      await expect(viewer).toContainText('No route lines have been authored')
      await viewer
        .getByRole('button', { name: 'Zoom in photograph', exact: true })
        .click()
      await expect(
        viewer.getByRole('button', {
          name: 'Reset photograph zoom',
          exact: true,
        }),
      ).toBeEnabled()
      await viewer
        .getByRole('button', { name: 'Reset photograph zoom', exact: true })
        .click()
      await testInfo.attach(`${face.id}-real-photo`, {
        body: await page.screenshot({ scale: 'css' }),
        contentType: 'image/png',
      })
      await dialog
        .getByRole('button', { name: 'Back to Kraft', exact: true })
        .click()
    }
  }
})

test('catalog missing faces remain explicit without fabricated topo routes', async ({
  page,
}, testInfo) => {
  await page.goto('/guide/kraft')
  for (const boulder of kraftBoulders) {
    await openMapCatalog(page, boulder.id)
    const dialog = page.getByRole('dialog', {
      name: `${boulder.name} boulder guide`,
    })
    for (const face of boulder.faces.filter(
      record => record.image.status === 'missing',
    )) {
      const faceButton = dialog
        .getByRole('group', { name: 'Recorded boulder faces' })
        .getByRole('button', {
          name: `${face.name} · ${face.orientation}`,
          exact: true,
        })
      await faceButton.click()
      await expect(faceButton).toHaveAttribute('aria-pressed', 'true')
      const viewer = dialog.getByRole('region', {
        name: 'Boulder faces',
        exact: true,
      })
      await expect(
        viewer.getByRole('heading', {
          name: 'Photograph not yet in the guide',
          exact: true,
        }),
      ).toBeVisible()
      await expect(viewer).toContainText('No route lines available')
      await expect(viewer.getByRole('img')).toHaveCount(0)
      await testInfo.attach(`${boulder.id}-${face.id}-missing-face`, {
        body: await page.screenshot({ scale: 'css' }),
        contentType: 'image/png',
      })
    }
    const climbList = dialog
      .getByRole('region', { name: 'Climbs sorted by grade', exact: true })
      .getByRole('list')
    await expect(climbList).toHaveCount(boulder.climbs.length ? 1 : 0)
    await expect(climbList.getByRole('listitem')).toHaveCount(
      boulder.climbs.length,
    )
    for (const climb of boulder.climbs.filter(
      record => record.faceAssignmentStatus === 'unassigned',
    )) {
      const recordNumber = String(boulder.climbs.indexOf(climb) + 1).padStart(
        2,
        '0',
      )
      const escapedName = climb.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      await expect(
        climbList.getByRole('button', {
          name: new RegExp(`^${recordNumber} ${escapedName} `),
        }),
      ).toContainText('Face assignment pending')
    }
    await dialog
      .getByRole('button', { name: 'Back to Kraft', exact: true })
      .click()
  }
})

test('empty local searches describe catalog coverage and can be recovered', async ({
  page,
}, testInfo) => {
  await page.goto('/guide/kraft')
  await page.getByRole('searchbox').fill('no-such-climb-in-this-edition')
  await expect(
    page.getByRole('heading', { name: 'No matching records in this edition.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('complementary', { name: 'Boulder directory' }),
  ).toContainText('Unresolved identities and missing images')
  await testInfo.attach('empty-search', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click()
  await expect(page.getByRole('searchbox')).toHaveValue('')
  await expect(
    page.getByRole('button', { name: 'Boulders 78', exact: true }),
  ).toBeVisible()
})
