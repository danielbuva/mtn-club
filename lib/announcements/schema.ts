import { z } from 'zod'
import { eventDateTimeToIso } from '../events/date-time.ts'
import { ANNOUNCEMENT_TIME_ZONE } from './types.ts'

export const announcementSchema = z
  .object({
    id: z.union([z.literal(''), z.string().uuid()]),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        'Use lowercase words separated by hyphens.',
      ),
    title: z.string().trim().min(1, 'Enter a title.').max(80),
    subtitle: z.string().trim().max(120),
    description: z.string().trim().max(180),
    content: z.string().trim().max(30000),
    status: z.enum(['draft', 'published', 'archived']),
    starts_at: z
      .string()
      .transform(value => eventDateTimeToIso(value, ANNOUNCEMENT_TIME_ZONE))
      .refine(
        value => value !== null,
        'Enter a valid appearance date and time.',
      ),
    ends_at: z
      .string()
      .transform(value => eventDateTimeToIso(value, ANNOUNCEMENT_TIME_ZONE))
      .refine(
        value => value !== null,
        'Enter a valid disappearance date and time.',
      ),
  })
  .refine(
    value =>
      !value.starts_at ||
      !value.ends_at ||
      Date.parse(value.ends_at) > Date.parse(value.starts_at),
    { message: 'Disappears must be after Appears.', path: ['ends_at'] },
  )
export type AnnouncementActionState = { error?: string; saved?: boolean }
