import { z } from 'zod'
import {
  EVENT_DIFFICULTIES,
  EVENT_KINDS,
  EVENT_VISIBILITIES,
} from '@/lib/events/constants'
import { eventDateTimeToIso } from './date-time'

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    shortSummary: z
      .string()
      .max(4000, 'Summary is too long')
      .optional()
      .or(z.literal('')),
    kind: z.enum(EVENT_KINDS),
    activityTypes: z.array(z.string()).optional(),
    startAt: z.string().min(1, 'Start date is required'),
    endAt: z.string().min(1, 'End date is required'),
    timezone: z.string().min(1, 'Timezone is required'),
    primaryLocationName: z
      .string()
      .trim()
      .min(1, 'Primary location is required'),
    meetingLocationName: z.string().optional(),
    locationNotes: z.string().optional(),
    overviewWhat: z.string().optional(),
    overviewWhere: z.string().optional(),
    overviewWeather: z.string().optional(),
    overviewEquipment: z.string().optional(),
    overviewCarpoolNeedGear: z.string().optional(),
    visibility: z.enum(EVENT_VISIBILITIES),
    maxParticipants: z.string().optional(),
    difficulty: z.enum(EVENT_DIFFICULTIES).optional(),
    isOfficial: z.boolean(),
    collectTransportation: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    let start: string | null = null
    let end: string | null = null
    try {
      Intl.DateTimeFormat('en', { timeZone: data.timezone })
      start = eventDateTimeToIso(data.startAt, data.timezone)
      end = eventDateTimeToIso(data.endAt, data.timezone)
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'Choose a valid timezone',
        path: ['timezone'],
      })
      return
    }
    if (!start)
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid start time in this timezone',
        path: ['startAt'],
      })
    if (!end)
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid end time in this timezone',
        path: ['endAt'],
      })
    if (start && end && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['endAt'],
      })
    }
  })

export type EventFormValues = z.infer<typeof eventFormSchema>
