import { z } from 'zod'

export const transportationSchema = z
  .discriminatedUnion('mode', [
    z
      .object({
        mode: z.literal('driver'),
        seatsOffered: z.number().int().min(1).max(8),
      })
      .strict(),
    z.object({ mode: z.literal('needs_ride') }).strict(),
    z.object({ mode: z.literal('self_arranged') }).strict(),
  ])
  .nullable()
export type TransportationResponse = z.infer<typeof transportationSchema>
export function transportationLabel(value: TransportationResponse) {
  if (!value) return 'Not provided'
  if (value.mode === 'driver')
    return `Can drive · ${value.seatsOffered} passenger ${value.seatsOffered === 1 ? 'seat' : 'seats'}`
  return value.mode === 'needs_ride'
    ? 'Needs a ride'
    : 'Transportation arranged'
}
