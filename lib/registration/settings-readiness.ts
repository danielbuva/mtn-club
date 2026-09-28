import type { RegistrationSettingsInput } from './schema'

export function registrationSetupIssues(
  values: RegistrationSettingsInput,
  context: { annualWaiver: boolean; hasWaiver: boolean; isAllDay: boolean },
): string[] {
  if (!values.enabled) return []
  const issues: string[] = []
  if (
    values.waiverRequired &&
    !context.annualWaiver &&
    !context.hasWaiver &&
    !values.waiverBody?.trim()
  ) {
    issues.push(
      'Add the club-approved waiver under Participant requirements before opening registration.',
    )
  }
  if (context.isAllDay && !values.deadline) {
    issues.push(
      'Set a registration closing date and time below because the trip start time is still TBA.',
    )
  }
  return issues
}
