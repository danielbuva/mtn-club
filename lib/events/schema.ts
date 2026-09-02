import { z } from 'zod'
import {
  EVENT_DIFFICULTIES,
  EVENT_KINDS,
  EVENT_VISIBILITIES,
} from '@/lib/events/constants'

export const eventFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
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
    primaryLocationName: z.string().min(1, 'Primary location is required'),
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
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startAt)
    const end = new Date(data.endAt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return
    }
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['endAt'],
      })
    }
  })

export type EventFormValues = z.infer<typeof eventFormSchema>
