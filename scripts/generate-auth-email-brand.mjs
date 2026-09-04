import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createRequire, registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const source = new URL('../components/unlv-mountain-club.tsx', import.meta.url)
const output = new URL('../public/email/club-wordmark-v1.png', import.meta.url)
const require = createRequire(import.meta.url)
// Use the same Sharp installation as Next's image pipeline.
const sharp = require(
  require.resolve('sharp', { paths: [require.resolve('next')] }),
)

const hook = registerHooks({
  load(url, context, nextLoad) {
    if (url !== source.href) return nextLoad(url, context)
    return {
      format: 'module',
      shortCircuit: true,
      source: ts.transpileModule(readFileSync(source, 'utf8'), {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
        },
        fileName: fileURLToPath(source),
      }).outputText,
    }
  },
})

try {
  const { default: Wordmark } = await import(source.href)
  const svg = renderToStaticMarkup(createElement(Wordmark))
  // Double-resolution, opaque paper backing keeps the original dark fill and
  // white outline legible even when an email client changes the body colors.
  const png = await sharp(Buffer.from(svg), { density: 144 })
    .flatten({ background: '#F8F1DF' })
    .png()
    .toBuffer()
  if (process.argv.includes('--check')) {
    if (!png.equals(readFileSync(output))) {
      throw new Error(
        'Email wordmark is stale. Regenerate it from the landing-page artwork.',
      )
    }
    console.log('Email wordmark matches the landing-page artwork.')
  } else {
    await mkdir(new URL('../public/email/', import.meta.url), {
      recursive: true,
    })
    await sharp(png).toFile(fileURLToPath(output))
    console.log('Exported the landing-page wordmark for auth emails.')
  }
} finally {
  hook.deregister()
}
