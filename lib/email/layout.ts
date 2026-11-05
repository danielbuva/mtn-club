// Shared HTML email shell. Layout lives on tables/cells (not <body>/<style>)
// so Gmail and Outlook keep it; <style> only adds dark mode and phone tweaks.
import { emailTheme as t } from './theme.ts'

export * from './blocks.ts'
export { emailTheme, escapeHtml } from './theme.ts'

export type EmailLayout = {
  title: string
  preheader: string
  eyebrow: string
  heading: string
  content: string
  /** Why the reader got this email; shown in the footer. */
  reason: string
  siteUrl: string
  footerLinks?: string
}

const d = t.dark
const css = `:root{color-scheme:light dark;supported-color-schemes:light dark}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font:inherit!important}
u+.body a.em-plain,#MessageViewBody a.em-plain{color:inherit;text-decoration:none}
@media (max-width:480px){
.em-card{padding:28px 20px 20px!important}
.em-card h1{font-size:30px!important;line-height:32px!important}
.em-card .em-callout-value{font-size:20px!important;line-height:26px!important}
}
@media (prefers-color-scheme:dark){
body,.body,.em-paper{background-color:${d.paper}!important}
.em-card{background-color:${d.card}!important;border-color:${d.rule}!important;border-top-color:${t.red}!important}
.em-card h1,.em-card p,.em-card td,.em-card a,.em-card span{color:${d.text}!important}
.em-card .em-muted,.em-foot p,.em-foot a{color:${d.muted}!important}
.em-card .em-hair{border-top-color:${d.rule}!important}
.em-card .em-frame{border-top-color:${d.text}!important;border-bottom-color:${d.text}!important}
.em-card .em-button-cell,.em-card .em-button{background-color:${t.highlight}!important}
.em-card .em-button{color:${t.ink}!important}
.em-card .em-outline{border-color:${d.text}!important}
.em-card .em-code{background-color:${d.paper}!important;border-color:${d.rule}!important}
.em-card .em-callout{background-color:${d.paper}!important;border:1px solid ${d.rule}!important}
.em-card .em-callout-value{color:${t.highlight}!important}
.em-card .em-tag-positive{background-color:${t.highlight}!important;color:${t.ink}!important}
.em-card .em-tag-pending{border-color:${d.text}!important}
.em-card .em-tag-negative{color:${d.red}!important;border-color:${d.red}!important}
}
[data-ogsb] body,[data-ogsb] .body,[data-ogsb] .em-paper{background-color:${d.paper}!important}
[data-ogsb] .em-card{background-color:${d.card}!important;border-color:${d.rule}!important;border-top-color:${t.red}!important}
[data-ogsb] .em-card .em-hair{border-top-color:${d.rule}!important}
[data-ogsb] .em-card .em-frame{border-top-color:${d.text}!important;border-bottom-color:${d.text}!important}
[data-ogsb] .em-card .em-callout,[data-ogsb] .em-card .em-code{background-color:${d.paper}!important;border:1px solid ${d.rule}!important}
[data-ogsb] .em-card .em-outline,[data-ogsb] .em-card .em-tag-pending{border-color:${d.text}!important}
[data-ogsb] .em-card .em-button-cell,[data-ogsb] .em-card .em-button,[data-ogsb] .em-card .em-tag-positive{background-color:${t.highlight}!important}
[data-ogsc] .em-card h1,[data-ogsc] .em-card p,[data-ogsc] .em-card td,[data-ogsc] .em-card a,[data-ogsc] .em-card span{color:${d.text}!important}
[data-ogsc] .em-card .em-button,[data-ogsc] .em-card .em-tag-positive{color:${t.ink}!important}
[data-ogsc] .em-card .em-callout-value{color:${t.highlight}!important}
[data-ogsc] .em-card .em-tag-negative{color:${d.red}!important;border-color:${d.red}!important}
[data-ogsc] .em-card .em-muted,[data-ogsc] .em-foot p,[data-ogsc] .em-foot a{color:${d.muted}!important}`

// Hidden filler stops inbox previews from pulling body copy after the preheader.
const previewFiller = '&#8199;&#847;&zwnj;'.repeat(60)
const footerText = `margin:0 0 8px;font-family:${t.body};font-size:13px;line-height:20px;color:${t.muted}`
const footerLink = `color:${t.muted};text-decoration:underline`

export function renderEmail(email: EmailLayout): string {
  const site = email.siteUrl
  const links =
    email.footerLinks ??
    `<a href="${site}" style="${footerLink}">unlvmountainclub.com</a> &middot; <a href="https://www.instagram.com/unlvmountainclub/" style="${footerLink}">Instagram</a> &middot; <a href="mailto:unlvmountainclub@gmail.com" style="${footerLink}">Email us</a>`
  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><meta name="x-apple-disable-message-reformatting"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no"><title>${email.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@700&amp;display=swap" rel="stylesheet">
<style>${css}</style>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>body,td,p,a{font-family:Arial,sans-serif!important;mso-line-height-rule:exactly}h1{font-family:'Arial Narrow',Arial,sans-serif!important;font-size:30px!important;mso-line-height-rule:exactly}</style><![endif]--></head>
<body class="body" style="margin:0;padding:0;background-color:${t.paper}">
<div role="article" aria-roledescription="email" aria-label="${email.title}" lang="en" dir="ltr">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">${email.preheader}${previewFiller}</div>
<table role="presentation" class="em-paper" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.paper}" style="width:100%;border-collapse:collapse;background-color:${t.paper}"><tr><td align="center" style="padding:0 12px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse">
<tr><td style="padding:32px 4px 20px"><a href="${site}" style="text-decoration:none"><img src="${site}/email/club-badge-v1.png" width="168" height="88" alt="UNLV Mountain Club" style="display:block;width:168px;height:auto;border:0;font-family:${t.body};font-size:16px;line-height:20px;font-weight:700;color:${t.red}"></a></td></tr>
<tr><td class="em-card" bgcolor="${t.card}" style="padding:36px 32px 28px;background-color:${t.card};border:1px solid ${t.rule};border-top:4px solid ${t.red}">
<p class="em-muted" style="margin:0 0 12px;font-family:${t.display};font-size:13px;line-height:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${t.muted}">${email.eyebrow}</p>
<h1 style="margin:0 0 20px;font-family:${t.display};font-size:34px;line-height:36px;font-weight:700;text-transform:uppercase;color:${t.ink}">${email.heading}</h1>
${email.content}
</td></tr>
<tr><td class="em-foot" style="padding:24px 4px 40px">
<p style="${footerText}">${email.reason}</p>
<p style="${footerText}">${links}</p>
<p style="${footerText};margin:0">UNLV Mountain Club &middot; A student organization at the University of Nevada, Las Vegas</p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</div>
</body></html>
`
}
