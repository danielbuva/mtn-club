export type MembershipGrant = {
  user_id: string
  starts_at: string
  ends_at: string | null
  revoked_at: string | null
}

export type PaymentBackedGrant = MembershipGrant & {
  payment_id: string | null
  zelle_payment_id: string | null
}

export type MembershipRestriction = {
  user_id: string
  restriction: 'normal' | 'suspended' | 'banned'
}

export type MembershipAccessSnapshot = {
  activeUserIds: ReadonlySet<string>
  paidUserIds: ReadonlySet<string>
  firstActivationByUser: ReadonlyMap<string, string>
}

const isCurrentGrant = (grant: MembershipGrant, now: string) =>
  !grant.revoked_at &&
  grant.starts_at <= now &&
  (!grant.ends_at || grant.ends_at > now)

export function buildMembershipAccessSnapshot({
  entitlements,
  overrides,
  restrictions,
  now,
}: {
  entitlements: readonly PaymentBackedGrant[]
  overrides: readonly MembershipGrant[]
  restrictions: readonly MembershipRestriction[]
  now: string
}): MembershipAccessSnapshot {
  const blockedUserIds = new Set(
    restrictions
      .filter(item => item.restriction !== 'normal')
      .map(item => item.user_id),
  )
  const activeUserIds = new Set<string>()
  const paidUserIds = new Set<string>()
  const firstActivationByUser = new Map<string, string>()

  const recordActivation = (grant: MembershipGrant) => {
    const current = firstActivationByUser.get(grant.user_id)
    if (!current || grant.starts_at < current) {
      firstActivationByUser.set(grant.user_id, grant.starts_at)
    }
  }

  for (const entitlement of entitlements) {
    recordActivation(entitlement)
    if (
      !blockedUserIds.has(entitlement.user_id) &&
      isCurrentGrant(entitlement, now)
    ) {
      activeUserIds.add(entitlement.user_id)
      if (entitlement.payment_id || entitlement.zelle_payment_id) {
        paidUserIds.add(entitlement.user_id)
      }
    }
  }

  for (const override of overrides) {
    recordActivation(override)
    if (
      !blockedUserIds.has(override.user_id) &&
      isCurrentGrant(override, now)
    ) {
      activeUserIds.add(override.user_id)
    }
  }

  return { activeUserIds, paidUserIds, firstActivationByUser }
}

export function countFirstActivationsInRange(
  firstActivationByUser: ReadonlyMap<string, string>,
  startsOn: string,
  endsOn: string,
): number {
  const inclusiveEnd = `${endsOn}T23:59:59.999Z`
  return Array.from(firstActivationByUser.values()).filter(
    activation => activation >= startsOn && activation <= inclusiveEnd,
  ).length
}
