/** Difficulty belongs in the dedicated difficulty field, not activity tags. */
export function isDifficultyTag(tag: string): boolean {
  return (
    tag
      .trim()
      .toLowerCase()
      .replace(/[-\s]+/g, ' ') === 'beginner friendly'
  )
}

export function normalizeActivityTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && !isDifficultyTag(tag)),
    ),
  )
}
