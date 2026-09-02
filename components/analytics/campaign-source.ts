type AnalyticsProperties = Record<string, string | number | boolean>

export function withCampaignSource(
  properties?: AnalyticsProperties,
): AnalyticsProperties | undefined {
  if (typeof window === 'undefined') return properties

  const rawSource = new URLSearchParams(window.location.search)
    .get('source')
    ?.trim()
    .toLowerCase()

  if (!rawSource || !/^[a-z0-9-]{1,64}$/.test(rawSource)) return properties

  return { source: rawSource, ...properties }
}
