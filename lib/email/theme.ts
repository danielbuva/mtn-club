// Email design tokens. Mirrors the site's editorial palette (app/globals.css)
// plus the club badge red. Never pure #FFF/#000: inverting clients flip them.
export const emailTheme = {
  paper: '#F8F1DF',
  card: '#FFFCF4',
  ink: '#211D18',
  muted: '#6A5146',
  rule: '#E3D6BA',
  red: '#D40000',
  redText: '#B00000',
  highlight: '#FFECA2',
  dark: {
    paper: '#171411',
    card: '#211D18',
    rule: '#3A332B',
    text: '#F8F1DF',
    muted: '#C9B9A0',
    red: '#FF8A80',
  },
  body: 'Helvetica,Arial,sans-serif',
  // Condensed fallbacks keep headlines narrow where web fonts are stripped
  // (Gmail: iOS/macOS ship HelveticaNeue-CondensedBold, Android sans-serif-condensed).
  display:
    "'Archivo Narrow','Arial Narrow','HelveticaNeue-CondensedBold','Helvetica Neue Condensed Bold',sans-serif-condensed,'Helvetica Neue',Arial,sans-serif",
  mono: "'SFMono-Regular',Menlo,Consolas,'Courier New',monospace",
} as const

export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    character =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ] ?? character,
  )
