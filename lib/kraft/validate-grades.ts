import type { Climb } from './types'

/** Typography may change the dash; the published grade and modifiers may not change. */
function normalizeVGrade(grade: string): string {
  return grade.trim().toUpperCase().replaceAll(/[–—−]/g, '-')
}

export function validateSelectedGrade(climb: Climb): string[] {
  const errors: string[] = []
  const selected = normalizeVGrade(climb.grade)
  const bounds = /^V(\d+)(?:-(\d+)|[+-])?$/.exec(selected)
  if (!bounds) {
    errors.push(`${climb.id}: selected V grade has no supported filter bounds`)
    return errors
  }
  const lower = Number(bounds[1])
  const upper = bounds[2] ? Number(bounds[2]) : lower
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
