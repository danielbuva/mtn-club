// General hazards informed by NPS hiking and climbing safety guidance.
// https://www.nps.gov/articles/hiking-safety.htm
// https://www.nps.gov/subjects/climbing/staying-safe.htm
export const riskActivities = [
  {
    value: 'hiking',
    description:
      'Hiking involves uneven ground, falls, exertion, sun exposure, dehydration, and changing weather.',
  },
  {
    value: 'backpacking',
    description:
      'Backpacking adds heavy loads, fatigue, navigation challenges, and potentially delayed emergency help.',
  },
  {
    value: 'camping',
    description:
      'Camping involves outdoor exposure, temperature changes, wildlife, and limited nearby services.',
  },
  {
    value: 'scrambling',
    description:
      'Scrambling involves loose rock, exposed terrain, and falls that can cause serious injury.',
  },
  {
    value: 'rock climbing',
    description:
      'Rock climbing involves falls, falling rock, and equipment or technique failures that can cause serious injury or death.',
  },
  {
    value: 'bouldering',
    description:
      'Bouldering involves unroped falls and uneven landings that can cause serious injury.',
  },
  {
    value: 'transportation/travel',
    description:
      'Travel involves vehicle collisions, road conditions, and driver fatigue.',
  },
]
export function riskStatements(
  activities: string[],
  additional = '',
): string[] {
  if (activities.includes('none'))
    return ['No trip-specific risk disclosure required.']
  const defaults = activities
    .flatMap(activity => {
      const option = riskActivities.find(option => option.value === activity)
      return option ? [option.description] : []
    })
    .join(' ')
  return [defaults, ...additional.split('\n').map(line => line.trim())].filter(
    Boolean,
  )
}
export function requiresRiskAcknowledgement(snapshot: {
  annualWaiver?: boolean
  informedRisks?: { activities: string[] } | null
}): boolean {
  return Boolean(
    (snapshot.annualWaiver || snapshot.informedRisks) &&
      !snapshot.informedRisks?.activities.includes('none'),
  )
}

export function additionalRiskStatements(
  activities: string[],
  statements: string[],
): string {
  const generated = riskStatements(activities)[0]
  return statements.filter(statement => statement !== generated).join('\n')
}
