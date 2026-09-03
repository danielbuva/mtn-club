const neutralizeSpreadsheetFormula = (value: string) =>
  /^[=+\-@]/.test(value) ? `'${value}` : value

export const escapeCsvCell = (value: string) =>
  `"${neutralizeSpreadsheetFormula(value).replaceAll('"', '""')}"`

export const buildMailingListCsv = (
  rows: Array<{
    email: string
    displayName: string
    consentSource: string
    subscribedAt: string
  }>,
) =>
  [
    'email,display_name,consent_source,subscribed_at',
    ...rows.map(row =>
      [row.email, row.displayName, row.consentSource, row.subscribedAt]
        .map(escapeCsvCell)
        .join(','),
    ),
  ].join('\n')
