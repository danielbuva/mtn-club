import type { Climb } from './types'

/** Typography may change the dash; the published grade and modifiers may not change. */
function normalizeVGrade(grade: string): string {
  return grade.trim().toUpperCase().replaceAll(/[–—−]/g, '-')
}

export function validateSelectedGrade(climb: Climb): string[] {
  const errors: string[] = []
  const selected = normalizeVGrade(climb.grade)
  const bounds = /^V(\d+)(?:-(\d+)|[+-])?$/.exec(selected)
  const easy = selected === 'V-EASY' || selected === 'VB'
  if (!bounds && !easy && climb.gradeValue !== null) {
    errors.push(`${climb.id}: selected V grade has no supported filter bounds`)
    return errors
  }
  if (!bounds && !easy) {
    if (climb.gradeMaxValue != null)
      errors.push(
        `${climb.id}: non-V grade cannot have numeric V filter bounds`,
      )
    const linked = climb.gradeObservations.some(
      observation =>
        observation.system !== 'V' &&
        observation.sourceId === climb.selectedGradeSourceId &&
        observation.identityStatus === 'source-linked' &&
        climb.sourceIds.includes(observation.sourceId) &&
        observation.grade.trim() === climb.grade.trim(),
    )
    if (!linked)
      errors.push(
        `${climb.id}: selected non-V grade has no linked source observation`,
      )
    return errors
  }
  const lower = easy ? -1 : Number(bounds?.[1])
  const upper = bounds?.[2] ? Number(bounds[2]) : lower
  if (
    climb.gradeValue !== lower ||
    (climb.gradeMaxValue ?? climb.gradeValue) !== upper ||
    upper < lower
  )
    errors.push(
      `${climb.id}: numeric filter bounds contradict selected V grade`,
    )

  const linked = climb.gradeObservations.some(
    observation =>
      observation.system === 'V' &&
      observation.sourceId === climb.selectedGradeSourceId &&
      observation.identityStatus === 'source-linked' &&
      climb.sourceIds.includes(observation.sourceId) &&
      normalizeVGrade(observation.grade) === selected,
  )
  if (!linked)
    errors.push(
      `${climb.id}: selected V grade has no linked source observation`,
    )
  return errors
}
