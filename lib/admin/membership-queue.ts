import 'server-only'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { Constants } from '@/lib/supabase/types'

const enums = Constants.public.Enums
export const membershipTabs = [
  'review',
  'members',
  'exceptions',
  'archive',
] as const
const tabSchema = z.enum(membershipTabs)
export type MembershipTab = z.infer<typeof tabSchema>

const paymentSchema = z.object({
  status: z.enum(enums.zelle_payment_status),
  claim_source: z.string(),
  claimed_at: z.string(),
  internal_note: z.string().nullable(),
})
export type MembershipQueuePayment = z.infer<typeof paymentSchema>

const applicationSchema = z.object({
  user_id: z.uuid(),
  full_name: z.string(),
  contact_email: z.string(),
  age_status: z.enum(enums.membership_age_status).nullable(),
  guardian_consent: z.enum(enums.guardian_consent_status).nullable(),
  dues_payment_claimed: z.boolean(),
  dues_claimed_at: z.string().nullable(),
  primary_interest: z.string().nullable(),
  experience_notes: z.string().nullable(),
  status: z.enum([...enums.membership_application_status, 'account']),
  created_at: z.string(),
  has_officer_payment: z.boolean(),
  payment: paymentSchema.nullable(),
})
export type MembershipQueueApplication = z.infer<typeof applicationSchema>

const memberSchema = z.object({
  user_id: z.uuid(),
  display_name: z.string().nullable(),
  role: z.enum(enums.club_role),
  member_since: z.string().nullable(),
  joined_on: z.string().nullable(),
})
const exceptionSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  display_name: z.string().nullable(),
  reason_code: z.string(),
  reason_detail: z.string(),
  status: z.enum(enums.membership_review_status),
})
const resultSchema = z.object({
  counts: z.record(tabSchema, z.number().int().nonnegative()),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  rows: z.array(z.unknown()),
})

export async function getMembershipQueue(rawTab: unknown, rawPage: unknown) {
  const tab = tabSchema.catch('review').parse(rawTab)
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(1_000_000)
    .catch(1)
    .parse(rawPage)
  const db = await createClient()
  const result = await db.rpc('get_admin_membership_queue', {
    p_tab: tab,
    p_page: page,
  })
  if (result.error) throw new Error('Unable to load the membership queue.')
  const { rows, ...pagination } = resultSchema.parse(result.data)
  if (tab === 'members')
    return { ...pagination, tab, rows: memberSchema.array().parse(rows) }
  if (tab === 'exceptions')
    return { ...pagination, tab, rows: exceptionSchema.array().parse(rows) }
  return { ...pagination, tab, rows: applicationSchema.array().parse(rows) }
}
