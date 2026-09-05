import { escapeCsvCell } from '@/lib/admin/csv'
import { getRoster } from '@/lib/registration/server'
export async function GET(
  _request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await context.params
    const roster = await getRoster(tripId)
    const rows = [
      [
        'name',
        'status',
        'registered_at',
        'queued_at',
        'email',
        'phone',
        'emergency_name',
        'emergency_relationship',
        'emergency_phone',
        'attendance',
      ],
      ...roster.rows.map(row => [
        row.name,
        row.state,
        row.registeredAt ?? '',
        row.queuedAt ?? '',
        row.email ?? '',
        row.phone ?? '',
        row.emergencyContact.name,
        row.emergencyContact.relationship,
        row.emergencyContact.phone,
        row.attendance,
      ]),
    ]
    return new Response(
      rows.map(row => row.map(escapeCsvCell).join(',')).join('\r\n'),
      {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="trip-${tripId}-roster.csv"`,
          'Cache-Control': 'private, no-store',
        },
      },
    )
  } catch {
    return new Response('Roster unavailable or access denied.', {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
