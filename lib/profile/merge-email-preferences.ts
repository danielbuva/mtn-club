import type { Json } from '@/lib/supabase/types'

// Preserve an opt-out from either identity when accounts are combined.
export function mergeEmailPreferences(
  primary: Json | undefined,
  secondary: Json | undefined,
): Json {
  const left =
    primary && typeof primary === 'object' && !Array.isArray(primary)
      ? primary
      : {}
  const right =
    secondary && typeof secondary === 'object' && !Array.isArray(secondary)
      ? secondary
      : {}
  const merged = { ...right, ...left }
  for (const key of Object.keys(merged)) {
    if (left[key] === false || right[key] === false) merged[key] = false
  }
  return merged
}
