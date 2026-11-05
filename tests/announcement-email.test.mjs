import assert from 'node:assert/strict'
import test from 'node:test'
import { announcementHtml } from '../lib/email/announcement.ts'
import { resendTemplates } from '../lib/email/resend-templates.ts'

const links = {
  siteUrl: 'https://club.example.test',
  preferencesUrl: 'https://club.example.test/profile/user/privacy',
  unsubscribeUrl: 'https://club.example.test/unsubscribe/abc',
}
const base = {
  title: 'Gear <swap>',
  preheader: 'Thursday',
  intro: 'Bring "gear" & trade',
  cta: { label: 'Details', href: 'https://club.example.test/calendar' },
}

test('announcements escape officer copy and carry bulk-mail footer', () => {
  const html = announcementHtml({ kind: 'news', ...base }, links)
  assert.ok(html.includes('Gear &lt;swap&gt;'))
  assert.ok(html.includes('Bring &quot;gear&quot; &amp; trade'))
  assert.ok(!html.includes('<swap>'))
  assert.ok(html.includes(`href="${links.unsubscribeUrl}"`))
  assert.ok(html.includes(`href="${links.preferencesUrl}"`))
  assert.match(html, /4505 S\. Maryland Pkwy/)
})

test('every announcement kind renders its own block', () => {
  const trip = announcementHtml(
    {
      kind: 'trip',
      ...base,
      trip: { when: 'Sat', where: 'J-Tree', level: 'New', cost: '$25' },
    },
    links,
  )
  assert.match(trip, />Where</)
  const digest = announcementHtml(
    {
      kind: 'digest',
      ...base,
      stories: [{ title: 'A', summary: 'B', href: 'https://x.test/a' }],
    },
    links,
  )
  assert.match(digest, /Read more/)
  const alert = announcementHtml(
    {
      kind: 'alert',
      ...base,
      alert: { change: 'Start moved', trip: 'Red Rock', when: 'Sat 9 AM' },
    },
    links,
  )
  assert.match(alert, /What changed/)
  assert.match(alert, /class="em-urgent"/)
  assert.match(alert, /Unsubscribe from trip updates/)
})

test('Resend templates use the Resend unsubscribe variable', () => {
  assert.equal(resendTemplates.length, 6)
  for (const template of resendTemplates) {
    assert.ok(template.html.includes('{{{RESEND_UNSUBSCRIBE_URL}}}'))
    assert.ok(template.html.includes('{{{TITLE}}}'))
    assert.ok(template.html.length < 60_000)
    assert.ok(template.guide.length > 0)
    // Variable-length labels must not use a fixed-width Outlook VML button.
    assert.doesNotMatch(template.html, /v:rect/)
  }
})
