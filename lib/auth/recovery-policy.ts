export function hasRecentRecoveryProof(
  amr: unknown,
  now = Date.now(),
): boolean {
  return (
    Array.isArray(amr) &&
    amr.some(
      (entry: unknown) =>
        typeof entry === 'object' &&
        entry !== null &&
        'method' in entry &&
        (entry.method === 'recovery' || entry.method === 'invite') &&
        'timestamp' in entry &&
        typeof entry.timestamp === 'number' &&
        entry.timestamp * 1000 <= now + 30_000 &&
        entry.timestamp * 1000 > now - 15 * 60_000,
    )
  )
}

export function matchesPasswordReceipt(
  receipt: Record<string, unknown> | null,
  userId: string,
  sessionId: unknown,
) {
  return (
    typeof sessionId === 'string' &&
    sessionId.length > 0 &&
    receipt?.userId === userId &&
    receipt?.sessionId === sessionId
  )
}
