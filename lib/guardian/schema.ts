import { z } from 'zod'

export const waiverStateSchema = z.enum([
  'not_published',
  'covered',
  'awaiting_review',
  'withdrawn',
  'aged_out',
  'expired',
  'updated',
  'needs_signature',
])
export const tripGuardianStateSchema = z.enum([
  'covered',
  'risks_pending',
  'not_published',
  'out_of_scope',
  'awaiting_review',
  'waiting_for_guardian',
  'withdrawn',
  'aged_out',
  'expired',
  'updated',
  'needs_signature',
  'legacy',
])
export type TripGuardianState = z.infer<typeof tripGuardianStateSchema>
export const membershipConsentStateSchema = z.enum([
  'not_applicable',
  'confirmed',
  'awaiting_review',
  'needs_signature',
])
const coverageSchema = z.object({
  from: z.string(),
  until: z.string(),
  activities: z.array(z.string()),
})

export const guardianStatusSchema = z.object({
  minor: z.boolean(),
  guardian: z
    .object({
      name: z.string(),
      email: z.string(),
      phone: z.string().nullable(),
      relationship: z.string(),
      emailVerifiedAt: z.string().nullable(),
      officerVerifiedAt: z.string().nullable(),
    })
    .nullable(),
  request: z
    .object({
      id: z.string().uuid(),
      inviteSentAt: z.string().nullable(),
      inviteCount: z.number(),
      invitedEmail: z.string().nullable(),
      nextInviteAt: z.string().nullable(),
      needsMembership: z.boolean(),
      needsWaiver: z.boolean(),
    })
    .nullable(),
  lastOutcome: z
    .object({
      status: z.enum(['signed', 'declined']),
      completedAt: z.string(),
      decision: z.enum(['approved', 'rejected', 'clarification']).nullable(),
      reason: z.string().nullable(),
      decidedAt: z.string().nullable(),
      basis: z.enum(['officer', 'prior_verification']).nullable(),
    })
    .nullable(),
  membership: membershipConsentStateSchema,
  waiver: z.object({
    state: waiverStateSchema,
    current: coverageSchema
      .extend({
        id: z.string().uuid(),
        title: z.string(),
        version: z.number(),
      })
      .nullable(),
    validUntil: z.string().nullable(),
    signedAt: z.string().nullable(),
    signerKind: z.string().nullable(),
    signerName: z.string().nullable(),
  }),
  trip: tripGuardianStateSchema.nullable(),
  tripCoverage: coverageSchema.nullable(),
})
export type GuardianStatus = z.infer<typeof guardianStatusSchema>

const documentWaiverSchema = coverageSchema.extend({
  id: z.string().uuid(),
  title: z.string(),
  version: z.number(),
  body: z.string(),
  sourceUrl: z.string().nullable(),
})
export const guardianRequestViewSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('invalid') }),
  z.object({
    state: z.enum(['open', 'signed', 'declined', 'closed']),
    requestId: z.string().uuid(),
    delivery: z.enum(['same_device', 'email', 'record']),
    participantName: z.string(),
    trip: z
      .object({
        id: z.string().uuid(),
        title: z.string(),
        startsAt: z.string(),
        timeZone: z.string(),
      })
      .nullable(),
    verifiedEmail: z.string().nullable(),
    guardian: z
      .object({
        name: z.string(),
        email: z.string(),
        phone: z.string().nullable(),
        relationship: z.string(),
        emailVerified: z.boolean(),
      })
      .nullable(),
    membership: z.object({ version: z.number(), body: z.string() }).nullable(),
    waiver: documentWaiverSchema.nullable(),
    prefill: z
      .object({
        participant: z
          .object({
            birthDate: z.string().optional(),
            address: z.string().optional(),
          })
          .passthrough(),
        emergencyContact: z
          .object({
            name: z.string().optional(),
            relationship: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            notes: z.string().optional(),
          })
          .passthrough(),
      })
      .nullable(),
    signed: z
      .object({
        at: z.string(),
        name: z.string().nullable(),
        validFrom: z.string().nullable(),
        validUntil: z.string().nullable(),
        withdrawn: z.boolean(),
        withdrawnAt: z.string().nullable().optional(),
        decision: z.enum(['approved', 'rejected', 'clarification']).nullable(),
      })
      .nullable(),
  }),
])
export type GuardianRequestView = z.infer<typeof guardianRequestViewSchema>
export type OpenGuardianRequest = Exclude<
  GuardianRequestView,
  { state: 'invalid' }
>

export const guardianSignInputSchema = z.object({
  guardian: z.object({
    name: z.string().trim().min(2).max(200),
    relationship: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(50),
    authority: z.literal(true),
    special: z.boolean(),
    specialNote: z.string().max(1000),
  }),
  waiver: z
    .object({
      waiverId: z.string().uuid(),
      agreed: z.literal(true),
      participant: z.object({
        birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        address: z.string().trim().min(5).max(500),
      }),
      emergencyContact: z.object({
        name: z.string().trim().min(2).max(200),
        relationship: z.string().trim().min(1).max(200),
        phone: z.string().trim().min(7).max(50),
        address: z.string().trim().min(5).max(500),
        notes: z.string().max(1000),
      }),
      initials: z.array(z.string().trim().min(1).max(10)).length(7),
    })
    .nullable(),
  membershipAgreed: z.boolean(),
  signatureName: z.string().trim().min(2).max(200),
})
export type GuardianSignInput = z.infer<typeof guardianSignInputSchema>

const evidenceSchema = z
  .object({
    method: z.string().optional(),
    verifiedEmail: z.string().optional(),
    emailVerifiedAt: z.string().nullable().optional(),
    delivery: z.string().nullable().optional(),
    userAgent: z.string().optional(),
    specialArrangement: z.boolean().optional(),
    specialNote: z.string().optional(),
    authorityDeclared: z.boolean().optional(),
  })
  .passthrough()
export const reviewQueueSchema = z.object({
  requests: z.array(
    z.object({
      id: z.string().uuid(),
      participantId: z.string().uuid(),
      participantName: z.string(),
      signedAt: z.string(),
      decision: z.enum(['approved', 'rejected', 'clarification']).nullable(),
      decisionReason: z.string().nullable(),
      guardian: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string().nullable(),
        relationship: z.string(),
        emailVerifiedAt: z.string().nullable(),
        officerVerifiedAt: z.string().nullable(),
        guardianChanged: z.boolean(),
      }),
      specialArrangement: z.boolean(),
      evidence: evidenceSchema,
      membership: z
        .object({
          version: z.number(),
          signedAt: z.string(),
          signatureName: z.string(),
        })
        .nullable(),
      waiver: z
        .object({
          title: z.string(),
          version: z.number(),
          signatureName: z.string(),
          signedAt: z.string(),
          validFrom: z.string(),
          validUntil: z.string(),
          activities: z.array(z.string()),
          body: z.string(),
          participantBirthDate: z.string().nullable(),
        })
        .nullable(),
      priorReviews: z.array(
        z.object({
          decision: z.string(),
          basis: z.string(),
          at: z.string(),
          identityChecked: z.boolean(),
          guardianName: z.string().nullable().optional(),
        }),
      ),
      blockers: z.array(
        z.object({
          tripId: z.string().uuid(),
          title: z.string(),
          startsAt: z.string(),
        }),
      ),
    }),
  ),
  withdrawals: z.array(
    z.object({
      id: z.string().uuid(),
      participantName: z.string(),
      guardianName: z.string(),
      at: z.string(),
      note: z.string().nullable(),
      membership: z.boolean(),
      waiver: z.boolean(),
    }),
  ),
  waiting: z.array(
    z.object({
      participantName: z.string(),
      tripTitle: z.string(),
      startsAt: z.string(),
      invited: z.boolean(),
    }),
  ),
})
export type ReviewQueue = z.infer<typeof reviewQueueSchema>
export type ReviewRequest = ReviewQueue['requests'][number]
