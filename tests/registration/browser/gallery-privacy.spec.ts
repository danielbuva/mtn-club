import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import {
  admin,
  cleanup,
  createAccount,
  status,
} from '../../integration/auth-services.mjs'

test('private gallery bytes follow publication state', async ({ request }) => {
  const owner = await createAccount()
  const bucket = admin.storage.from('club_gallery')
  const path = `integration/${randomUUID()}.png`
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ZQAAAAASUVORK5CYII=',
    'base64',
  )
  const id = randomUUID()
  try {
    expect(
      (await bucket.upload(path, png, { contentType: 'image/png' })).error,
    ).toBeNull()
    expect(
      (
        await admin.from('gallery_photos').insert({
          id,
          storage_path: path,
          title: 'Synthetic image',
          alt_text: 'Single pixel',
          uploaded_by: owner.id,
        })
      ).error,
    ).toBeNull()

    const href = `/api/gallery/${id}`
    expect((await request.get(href)).status()).toBe(404)
    expect(
      (
        await admin
          .from('gallery_photos')
          .update({ is_published: true })
          .eq('id', id)
      ).error,
    ).toBeNull()
    const published = await request.get(href)
    expect(published.status()).toBe(200)
    expect(published.headers()['cache-control']).toContain('no-store')
    expect(await published.body()).toEqual(png)

    const originalAsset = await request.get(
      `${status.API_URL}/storage/v1/object/public/club_gallery/${path}`,
    )
    expect(originalAsset.ok()).toBe(false)
    expect(
      (
        await admin
          .from('gallery_photos')
          .update({ is_published: false })
          .eq('id', id)
      ).error,
    ).toBeNull()
    expect((await request.get(href)).status()).toBe(404)
  } finally {
    await admin.from('gallery_photos').delete().eq('id', id)
    await bucket.remove([path])
    await cleanup()
  }
})
