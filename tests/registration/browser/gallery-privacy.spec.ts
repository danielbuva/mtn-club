import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import {
  admin,
  captchaToken,
  cleanup,
  client,
  createAccount,
  password,
  status,
} from '../../integration/auth-services.mjs'

test('private gallery bytes follow publication state', async ({
  page,
  request,
}, testInfo) => {
  const owner = await createAccount()
  const bucket = admin.storage.from('club_gallery')
  const path = `${owner.id}/${randomUUID()}.png`
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ZQAAAAASUVORK5CYII=',
    'base64',
  )
  const id = randomUUID()
  try {
    const roles = await admin
      .from('admin_roles')
      .select('id')
      .eq('is_super_admin', true)
    expect(roles.error).toBeNull()
    const roleId = roles.data?.[0]?.id
    expect(roleId).toBeTruthy()
    expect(
      (
        await admin
          .from('admin_user_roles')
          .insert({ user_id: owner.id, role_id: roleId })
      ).error,
    ).toBeNull()
    const officer = client()
    expect(
      (
        await officer.auth.signInWithPassword({
          email: owner.email,
          password,
          options: { captchaToken },
        })
      ).error,
    ).toBeNull()
    expect(
      (
        await officer.storage
          .from('club_gallery')
          .upload(path, png, { contentType: 'image/png' })
      ).error,
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
    await page.goto('/gallery')
    await expect(
      page.getByRole('img', { name: 'Single pixel' }),
    ).toHaveAttribute('src', href)
    await page.screenshot({
      path: testInfo.outputPath('gallery-publication.png'),
    })

    const originalAsset = await request.get(
      `${status.API_URL}/storage/v1/object/public/club_gallery/${path}`,
    )
    expect(originalAsset.ok()).toBe(false)
    const signed = await client()
      .storage.from('club_gallery')
      .createSignedUrl(path, 60)
    expect(signed.data).toBeNull()
    expect(signed.error).toBeTruthy()
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
    await admin.from('admin_user_roles').delete().eq('user_id', owner.id)
    await cleanup()
  }
})
