export function isPaymentsOnlyMode(): boolean {
  const mode = process.env.NEXT_PUBLIC_RELEASE_MODE ?? 'payments_only'
  return mode === 'payments_only'
}
