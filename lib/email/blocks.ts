// Content blocks for the email card. Every helper takes trusted HTML:
// escape user content with `escapeHtml` first.
import { emailTheme as t } from './theme.ts'

export const paragraph = (html: string, after = 16): string =>
  `<p style="margin:0 0 ${after}px;font-family:${t.body};font-size:16px;line-height:26px;color:${t.ink}">${html}</p>`

export const finePrint = (html: string): string =>
  `<p class="em-muted" style="margin:0 0 12px;font-family:${t.body};font-size:14px;line-height:22px;color:${t.muted}">${html}</p>`

export const inlineLink = (href: string, label: string): string =>
  `<a href="${href}" style="color:${t.ink};text-decoration:underline">${label}</a>`

/**
 * The one primary action. VML keeps the padded block in Outlook for Windows,
 * sized from the label (≈9.5px per uppercase character plus padding).
 */
export function button(href: string, label: string): string {
  const vmlWidth = Math.round(label.length * 9.5 + 64)
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-collapse:collapse"><tr><td class="em-button-cell" bgcolor="${t.ink}" style="background-color:${t.ink}">
<!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:52px;v-text-anchor:middle;width:${vmlWidth}px" stroke="f" fillcolor="${t.ink}"><w:anchorlock/><center style="color:${t.highlight};font-family:'Arial Narrow',Arial,sans-serif;font-size:16px;font-weight:bold;letter-spacing:1px">${label.toUpperCase()} &rarr;</center></v:rect><![endif]-->
<!--[if !mso]><!--><a class="em-button" href="${href}" style="display:inline-block;padding:16px 28px;font-family:${t.display};font-size:17px;line-height:20px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${t.highlight};background-color:${t.ink};text-decoration:none">${label}&nbsp;&rarr;</a><!--<![endif]-->
</td></tr></table>`
}

/**
 * Padded-cell button for labels unknown at build time (Resend variables):
 * Outlook honors cell padding, so no VML width guess is needed.
 */
export const fluidButton = (href: string, label: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-collapse:collapse"><tr><td class="em-button-cell em-button" bgcolor="${t.ink}" style="padding:16px 28px;background-color:${t.ink}"><a class="em-button" href="${href}" style="display:block;font-family:${t.display};font-size:17px;line-height:20px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${t.highlight};background-color:${t.ink};text-decoration:none">${label}&nbsp;&rarr;</a></td></tr></table>`

/** Body copy slot that may hold several paragraphs (separated by <br><br>). */
export const richText = (html: string): string =>
  `<div style="margin:0 0 16px;font-family:${t.body};font-size:16px;line-height:26px;color:${t.ink}">${html}</div>`

/** Outlined secondary action, for when a second path matters (security mail). */
export const secondaryButton = (href: string, label: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;border-collapse:collapse"><tr><td class="em-outline" style="padding:13px 24px;border:2px solid ${t.ink}"><a href="${href}" style="display:block;font-family:${t.display};font-size:16px;line-height:20px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${t.ink};text-decoration:none">${label}&nbsp;&rarr;</a></td></tr></table>`

/** Large, selectable one-time code: one text node, spacing from CSS only. */
export const codeBlock = (code: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-collapse:collapse"><tr><td class="em-code" bgcolor="${t.paper}" style="padding:16px 14px 16px 20px;background-color:${t.paper};border:1px solid ${t.rule};font-family:${t.mono};font-size:34px;line-height:40px;font-weight:700;letter-spacing:6px;color:${t.ink};-webkit-user-select:all;user-select:all"><span style="-webkit-user-select:all;user-select:all">${code}</span></td></tr></table>`

/** Ink panel with a yellow value, the site's "date on dark" idiom. For deadlines. */
export const callout = (label: string, value: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:4px 0 20px;border-collapse:collapse"><tr><td class="em-callout" bgcolor="${t.ink}" style="padding:16px 20px;background-color:${t.ink}"><p class="em-muted" style="margin:0 0 4px;font-family:${t.display};font-size:13px;line-height:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${t.dark.muted}">${label}</p><p class="em-callout-value" style="margin:0;font-family:${t.display};font-size:22px;line-height:28px;font-weight:700;color:${t.highlight}">${value}</p></td></tr></table>`

export type DetailRow = {
  label: string
  value: string
  emphasis?: boolean
  /** For lowercase provider names Supabase fills in ("discord"). */
  capitalize?: boolean
}

/** Label/value rows framed like a trip ticket. Values are trusted HTML. */
export function details(rows: DetailRow[]): string {
  const cells = rows
    .map((row, index) => {
      const hair = index ? `border-top:1px solid ${t.rule};` : ''
      const cls = index ? ' class="em-hair"' : ''
      return `<tr><td${cls} valign="top" width="80" style="width:80px;padding:12px 12px 12px 0;${hair}font-family:${t.display};font-size:13px;line-height:22px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${t.muted}">${row.label}</td><td${cls} valign="top" style="padding:12px 0;${hair}font-family:${t.body};font-size:16px;line-height:22px;color:${t.ink}${row.emphasis ? ';font-weight:700' : ''}${row.capitalize ? ';text-transform:capitalize' : ''}">${row.value}</td></tr>`
    })
    .join('')
  return `<table role="presentation" class="em-frame" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:4px 0 24px;border-collapse:collapse;border-top:2px solid ${t.ink};border-bottom:2px solid ${t.ink}">${cells}</table>`
}

export type StatusTone = 'positive' | 'pending' | 'negative'

/** Status in words; tone sets the treatment so bad news never looks celebratory. */
export function statusTag(label: string, tone: StatusTone): string {
  const base = `display:inline-block;font-family:${t.display};font-size:13px;line-height:20px;font-weight:700;letter-spacing:1px;text-transform:uppercase`
  switch (tone) {
    case 'positive':
      return `<span class="em-tag-positive" style="${base};padding:2px 8px;color:${t.ink};background-color:${t.highlight}">${label}</span>`
    case 'pending':
      return `<span class="em-tag-pending" style="${base};padding:1px 7px;color:${t.ink};border:1px solid ${t.ink}">${label}</span>`
    case 'negative':
      return `<span class="em-tag-negative" style="${base};padding:1px 7px;color:${t.redText};border:1px solid ${t.red}">${label}</span>`
    default: {
      const unreachable: never = tone
      return unreachable
    }
  }
}

/** Raw-URL fallback for auth links, set apart at the bottom of the card. */
export const linkFallback = (href: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:12px 0 0;border-collapse:collapse"><tr><td class="em-hair" style="padding-top:16px;border-top:1px solid ${t.rule};font-family:${t.body};font-size:12px;line-height:18px;color:${t.muted}"><span class="em-muted" style="color:${t.muted}">Or paste this link:</span><br><a class="em-plain em-muted" href="${href}" style="color:${t.muted};text-decoration:none;word-break:break-all">${href}</a></td></tr></table>`

/** Full-width 16:9 photo (1068×600 JPEG), optionally linked. */
export const image = (src: string, alt: string, href?: string): string => {
  const img = `<img src="${src}" width="534" height="300" alt="${alt}" style="display:block;width:100%;max-width:534px;height:auto;border:0;font-family:${t.body};font-size:14px;line-height:20px;color:${t.muted}">`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:4px 0 24px;border-collapse:collapse"><tr><td bgcolor="${t.rule}" style="background-color:${t.rule}">${href ? `<a href="${href}" style="text-decoration:none">${img}</a>` : img}</td></tr></table>`
}

/** Red-ruled notice for safety and schedule alerts. */
export const notice = (label: string, html: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:4px 0 24px;border-collapse:collapse"><tr><td class="em-notice" style="padding:4px 0 4px 16px;border-left:4px solid ${t.red}"><p class="em-urgent" style="margin:0 0 4px;font-family:${t.display};font-size:13px;line-height:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${t.redText}">${label}</p><p style="margin:0;font-family:${t.body};font-size:16px;line-height:24px;font-weight:700;color:${t.ink}">${html}</p></td></tr></table>`

export type StoryItem = { title: string; summary: string; href: string }

/** Stacked headline + summary + link list, for digests and roundups. */
export function storyList(items: StoryItem[]): string {
  const rows = items
    .map((item, index) => {
      const hair = index ? `border-top:1px solid ${t.rule};` : ''
      return `<tr><td${index ? ' class="em-hair"' : ''} style="padding:16px 0;${hair}"><a class="em-story-title" href="${item.href}" style="font-family:${t.display};font-size:20px;line-height:24px;font-weight:700;text-transform:uppercase;color:${t.ink};text-decoration:none">${item.title}</a><p style="margin:6px 0 8px;font-family:${t.body};font-size:16px;line-height:24px;color:${t.ink}">${item.summary}</p><a href="${item.href}" style="font-family:${t.body};font-size:14px;line-height:20px;font-weight:700;color:${t.ink};text-decoration:underline">Read more&nbsp;&rarr;</a></td></tr>`
    })
    .join('')
  return `<table role="presentation" class="em-frame" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:4px 0 24px;border-collapse:collapse;border-top:2px solid ${t.ink};border-bottom:2px solid ${t.ink}">${rows}</table>`
}
