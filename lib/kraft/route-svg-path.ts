const arities = new Map([
  ['M', 2],
  ['L', 2],
  ['H', 1],
  ['V', 1],
  ['C', 6],
  ['S', 4],
  ['Q', 4],
  ['T', 2],
  ['A', 7],
  ['Z', 0],
])

/** Validate full SVG path syntax and parameter groups before calling it a line. */
export function isDrawableSvgPath(path: string): boolean {
  const tokens = [
    ...path.matchAll(
      /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g,
    ),
  ]
  if (!tokens.length || tokens[0]?.[0].toUpperCase() !== 'M') return false
  let end = 0
  for (const [index, token] of tokens.entries()) {
    const gap = path.slice(end, token.index)
    if (!/^[\s,]*$/.test(gap) || (gap.match(/,/g)?.length ?? 0) > 1)
      return false
    if (
      gap.includes(',') &&
      (index === 0 ||
        arities.has(token[0].toUpperCase()) ||
        arities.has(tokens[index - 1]?.[0].toUpperCase() ?? ''))
    )
      return false
    end = token.index + token[0].length
  }
  if (!/^\s*$/.test(path.slice(end))) return false
  let cursor = 0
  let hasSegment = false
  while (cursor < tokens.length) {
    const command = tokens[cursor]?.[0].toUpperCase() ?? ''
    const arity = arities.get(command)
    if (arity === undefined) return false
    cursor += 1
    const parameters: number[] = []
    while (
      cursor < tokens.length &&
      !arities.has(tokens[cursor]?.[0].toUpperCase() ?? '')
    ) {
      const value = Number(tokens[cursor]?.[0])
      if (!Number.isFinite(value)) return false
      parameters.push(value)
      cursor += 1
    }
    if (arity === 0) {
      if (parameters.length) return false
      continue
    }
    if (!parameters.length || parameters.length % arity !== 0) return false
    if (command === 'A') {
      for (let offset = 0; offset < parameters.length; offset += arity) {
        if (
          (parameters[offset] ?? -1) < 0 ||
          (parameters[offset + 1] ?? -1) < 0 ||
          ![0, 1].includes(parameters[offset + 3] ?? -1) ||
          ![0, 1].includes(parameters[offset + 4] ?? -1)
        )
          return false
      }
    }
    if (command !== 'M' || parameters.length > 2) hasSegment = true
  }
  return hasSegment
}
