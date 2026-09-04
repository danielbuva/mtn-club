import { expect, type Page } from '@playwright/test'

export async function mockAuthServices(page: Page) {
  // Block unmocked external requests. All auth traffic uses an unused localhost
  // port and is fulfilled here; no real accounts, providers, or emails are used.
  await page.route('http://127.0.0.1:54399/**', route =>
    route.fulfill({
      status: 400,
      json: {
        error_code: 'invalid_credentials',
        message: 'do not show raw payload',
      },
    }),
  )
  await page.route('https://challenges.cloudflare.com/**', route =>
    route.fulfill({
      contentType: 'application/javascript',
      body: '/* isolated Turnstile mock */',
    }),
  )
  await page.addInitScript(() => {
    type Options = {
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
      'response-field-name': string
    }
    const widgets = new Map<
      string,
      { node: HTMLElement; options: Options; input: HTMLInputElement }
    >()
    let sequence = 0
    Object.defineProperty(window, 'turnstile', {
      value: {
        render(node: HTMLElement, options: Options) {
          const id = `test-widget-${++sequence}`
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = options['response-field-name']
          input.value = 'isolated-captcha-token'
          const status = document.createElement('span')
          status.textContent = 'Security check complete'
          const expire = document.createElement('button')
          expire.type = 'button'
          expire.textContent = 'Simulate CAPTCHA expiry'
          expire.onclick = () => {
            input.value = ''
            options['expired-callback']()
          }
          const fail = document.createElement('button')
          fail.type = 'button'
          fail.textContent = 'Simulate CAPTCHA failure'
          fail.onclick = () => options['error-callback']()
          node.replaceChildren(status, input, expire, fail)
          widgets.set(id, { node, options, input })
          setTimeout(() => {
            if (widgets.has(id)) options.callback(input.value)
          }, 0)
          return id
        },
        reset(id: string) {
          const widget = widgets.get(id)
          if (widget) {
            widget.input.value = 'isolated-captcha-token'
            widget.options.callback(widget.input.value)
          }
        },
        remove(id: string) {
          const widget = widgets.get(id)
          widget?.node.replaceChildren()
          widgets.delete(id)
        },
        getResponse(id: string) {
          return widgets.get(id)?.input.value ?? ''
        },
        isExpired(id: string) {
          return !widgets.get(id)?.input.value
        },
      },
    })
  })
}

export async function fillLogin(page: Page) {
  await page
    .getByLabel('Email address', { exact: true })
    .fill('member@example.test')
  await page.getByLabel('Password', { exact: true }).fill('existing-short')
  await expect(page.getByText('Security check complete')).toBeVisible()
}
