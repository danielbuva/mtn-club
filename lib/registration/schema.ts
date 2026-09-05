import { z } from 'zod'

export const registrationStateSchema = z.enum([
  'none',
  'incomplete',
  'maybe',
  'confirmed',
  'waitlisted',
  'offered',
  'cancelled',
  'removed_by_organizer',
  'legacy_review',
])
export const commandSchema = z.enum([
  'set_maybe',
  'set_not_going',
  'begin_signup',
  'save_draft',
  'register',
  'cancel',
  'accept_offer',
  'decline_offer',
  'issue_offer',
  'revoke_offer',
  'remove',
  'restore',
  'update_response',
  'attendance',
  'guardian_review',
  'request_guardian',
])
export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,49}$/),
    label: z.string().trim().min(1).max(300),
    type: z.enum(['text', 'single', 'multiple', 'boolean']),
    required: z.boolean(),
    options: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  })
  .superRefine((question, ctx) => {
    if (
      ['single', 'multiple'].includes(question.type) &&
      (!question.options ||
        question.options.length < 2 ||
        new Set(question.options).size !== question.options.length)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Enter 2–20 unique choices.',
      })
    }
  })
export const questionsSchema = z
  .array(questionSchema)
  .max(20)
  .refine(
    questions => new Set(questions.map(q => q.id)).size === questions.length,
    'Question identifiers must be unique.',
  )
export const answersSchema = z.record(
  z.string(),
  z.union([
    z.string().max(4000),
    z.boolean(),
    z.array(z.string().max(200)).max(20),
    z.null(),
  ]),
)
export const emergencyContactSchema = z.object({
  name: z.string().max(200).optional().default(''),
  relationship: z.string().max(200).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
})
export const snapshotSchema = z.object({
  tripId: z.string().uuid(),
  title: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  timeZone: z.string(),
  availability: z.enum([
    'open',
    'waitlist',
    'full',
    'closed',
    'disabled',
    'canceled',
    'archived',
  ]),
  closeAt: z.string(),
  eligibility: z.enum(['members', 'account']),
  eligibilityReasons: z.array(z.string()),
  requirements: z.array(z.string()),
  capacity: z.number().nullable(),
  confirmedCount: z.number(),
  reservedCount: z.number(),
  waitlistCount: z.number(),
  state: registrationStateSchema,
  revision: z.number(),
  authenticated: z.boolean(),
  canManage: z.boolean(),
  canReviewGuardian: z.boolean(),
  emailEnabled: z.boolean(),
  actions: z.array(commandSchema),
  ageAdult: z.boolean().nullable(),
  formVersion: z.number(),
  questions: questionsSchema,
  emergencyRequired: z.boolean(),
  waiverRequired: z.boolean(),
  waiverSigned: z.boolean(),
  waiver: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      body: z.string(),
      version: z.number(),
      sourceUrl: z.string().nullable().optional(),
    })
    .nullable(),
  answers: answersSchema,
  emergencyContact: emergencyContactSchema,
  offer: z
    .object({
      id: z.string().uuid(),
      expiresAt: z.string(),
      issuedAt: z.string(),
    })
    .nullable(),
  events: z.array(z.object({ kind: z.string(), createdAt: z.string() })),
  attendees: z.array(
    z.object({
      userId: z.string().uuid(),
      name: z.string(),
      avatarUrl: z.string().nullable(),
    }),
  ),
})
export const registrationInputSchema = z
  .object({
    tripId: z.string().uuid(),
    command: commandSchema,
    requestId: z.string().uuid(),
    expectedRevision: z.number().int().min(0),
    userId: z.string().uuid().optional(),
    data: z
      .object({
        formVersion: z.number().int().optional(),
        answers: answersSchema.optional(),
        emergencyContact: emergencyContactSchema.optional(),
        emergencyConfirmed: z.boolean().optional(),
        waiverAgreed: z.boolean().optional(),
        waiverId: z.string().uuid().nullable().optional(),
        signatureName: z.string().trim().min(2).max(200).optional(),
        signerDetails: z
          .object({
            phone: z.string().min(7).max(50),
            address: z.string().min(5).max(500),
            emergencyAddress: z.string().min(5).max(500),
            birthDate: z.string().date(),
            initials: z.array(z.string().trim().min(1).max(10)).length(7),
          })
          .optional(),
        guardianDocument: z
          .object({
            guardianName: z.string().trim().min(2).max(200),
            signedOn: z.string().date(),
            reference: z.string().trim().min(5).max(1000),
            verified: z.literal(true),
          })
          .optional(),
        offerId: z.string().uuid().optional(),
        reason: z.string().trim().min(5).max(2000).optional(),
        evidence: z.string().trim().min(5).max(2000).optional(),
        attendance: z.enum(['present', 'absent', 'unmarked']).optional(),
      })
      .strict()
      .default({}),
  })
  .strict()
export const settingsInputSchema = z.object({
  enabled: z.boolean(),
  eligibility: z.enum(['members', 'account']),
  emergencyRequired: z.boolean(),
  waiverRequired: z.boolean(),
  questions: questionsSchema,
  capacity: z.number().int().positive().max(100000).nullable(),
  waitlistEnabled: z.boolean(),
  deadline: z.string().datetime({ offset: true }).nullable(),
  offerHours: z.number().int().min(1).max(168),
  waiverSourceUrl: z.string().url().optional(),
  waiverTitle: z.string().max(200).optional(),
  waiverBody: z.string().max(100000).optional(),
})
export const rosterSchema = z.object({
  snapshot: snapshotSchema,
  settings: z.object({
    enabled: z.boolean(),
    eligibility: z.enum(['members', 'account']),
    emergency_required: z.boolean(),
    waiver_required: z.boolean(),
    questions: questionsSchema,
    revision: z.number(),
    offer_hours: z.number(),
    locked_at: z.string().nullable(),
  }),
  trip: z.object({
    capacity: z.number().nullable(),
    waitlistEnabled: z.boolean(),
    deadline: z.string().nullable(),
    isAllDay: z.boolean(),
  }),
  rows: z.array(
    z.object({
      userId: z.string().uuid(),
      name: z.string(),
      state: registrationStateSchema,
      revision: z.number(),
      registeredAt: z.string().nullable(),
      queuedAt: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      emailEnabled: z.boolean(),
      requirements: z.array(z.string()),
      answers: answersSchema,
      emergencyContact: emergencyContactSchema,
      attendance: z.enum(['present', 'absent', 'unmarked']),
      offers: z.array(
        z.object({
          id: z.string(),
          status: z.string(),
          issuedAt: z.string(),
          expiresAt: z.string(),
        }),
      ),
      delivery: z.array(
        z.object({
          id: z.string(),
          kind: z.string(),
          status: z.string(),
          createdAt: z.string(),
          errorCode: z.string().nullable(),
        }),
      ),
    }),
  ),
})
export type TripRegistrationSnapshot = z.infer<typeof snapshotSchema>
export type RegistrationCommand = z.infer<typeof commandSchema>
export type RegistrationInput = z.infer<typeof registrationInputSchema>
export type RegistrationQuestion = z.infer<typeof questionSchema>
export type RegistrationAnswers = z.infer<typeof answersSchema>
export type RegistrationRoster = z.infer<typeof rosterSchema>
export type RegistrationSettingsInput = z.infer<typeof settingsInputSchema>
export type RegistrationResult =
  | { ok: true; snapshot: TripRegistrationSnapshot }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[]>
      snapshot?: TripRegistrationSnapshot
    }
