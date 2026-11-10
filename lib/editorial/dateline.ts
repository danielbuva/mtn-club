/** Publication season; UTC keeps datelines stable across servers. */
export function publicationDateline(date: Date): string {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const season = month < 5 ? 'Spring' : month < 8 ? 'Summer' : 'Fall'
  return `${season} ${year}`
}
