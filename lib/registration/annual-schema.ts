import { z } from 'zod'
import { emergencyContactSchema } from './schema'
export const annualDocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  version: z.number(),
  body: z.string(),
  effective_from: z.string(),
  effective_until: z.string(),
  activity_scope: z.array(z.string()),
  source_url: z.string(),
  filled_values: z.record(z.string(), z.unknown()),
})
export const annualStateSchema = z.object({
  current: annualDocumentSchema.nullable(),
  signatureId: z.string().nullable(),
  history: z.array(
    annualDocumentSchema.extend({
      signatureId: z.string(),
      signedAt: z.string(),
      signatureName: z.string(),
      signerKind: z.string(),
      guardianSignedOn: z.string().nullable(),
      withdrawnAt: z.string().nullable(),
      validFrom: z.string(),
      validUntil: z.string(),
    }),
  ),
  upcomingRegistrations: z.number(),
  ageAdult: z.boolean().nullable(),
  emergencyContact: emergencyContactSchema,
})
export type AnnualState = z.infer<typeof annualStateSchema>
export const annualFieldsSchema = z.object({
  event: z.string().trim().min(5).max(200),
  sponsor: z.string().trim().min(5).max(200),
  risks: z.string().trim().min(20).max(10000),
  effectiveFrom: z.string().date(),
  activities: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
})
