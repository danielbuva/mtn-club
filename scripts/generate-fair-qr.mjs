import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'

const source = 'fall-2026-involvement-fair'
const siteValue = process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL

if (!siteValue) {
  throw new Error(
    'Pass the deployed site URL or set NEXT_PUBLIC_SITE_URL before generating print assets.',
  )
}

const siteUrl = new URL(siteValue)
if (siteUrl.protocol !== 'https:') {
  throw new Error('The printed QR destination must use HTTPS.')
}

const destination = new URL('/welcome', siteUrl.origin)
destination.searchParams.set('source', source)

const outputDirectory = path.resolve('public/qr')
await mkdir(outputDirectory, { recursive: true })

for (const level of ['M', 'Q']) {
  const suffix = level.toLowerCase()
  const common = {
    errorCorrectionLevel: level,
    margin: 4,
    color: { dark: '#000000', light: '#FFFFFF' },
  }

  await QRCode.toFile(
    path.join(outputDirectory, `welcome-fall-2026-${suffix}.svg`),
    destination.toString(),
    { ...common, type: 'svg' },
  )
  await QRCode.toFile(
    path.join(outputDirectory, `welcome-fall-2026-${suffix}.png`),
    destination.toString(),
    { ...common, type: 'png', width: 2400 },
  )
}

console.log(`Generated M and Q assets for ${destination.toString()}`)
