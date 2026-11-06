// Localhost-only trip responses for checking the reader's permission gates.
const tripIds = ['60', '61', '62', '63'].map(
  suffix => `00000000-0000-4000-8000-0000000000${suffix}`,
)
const saved = new Map()

export async function handleTripEditRequest(request, response, url, userId) {
  const send = value => response.end(JSON.stringify(value))
  if (url.pathname === '/test/reset-trip-edits') {
    saved.clear()
    send({})
    return true
  }
  if (url.pathname === '/rest/v1/trips') {
    const id = url.searchParams.get('id')?.replace(/^eq\./, '')
    if (!tripIds.includes(id)) return false
    send({
      id,
      title: saved.get(id)?.title ?? 'Community edit fixture',
      starts_at: '2099-11-10T18:00:00Z',
      ends_at: '2099-11-10T22:00:00Z',
      time_zone: 'America/Los_Angeles',
      is_all_day: false,
      is_official: id === tripIds[2],
      created_by: id === tripIds[3] ? 'another-member' : userId,
      lifecycle_status: 'published',
      visibility: 'public',
      activity_tags: ['hiking'],
      difficulty: 'beginner',
      location_public: 'Trailhead',
      cover_image_path: id === tripIds[1] ? '/club-covers/club-hike.jpg' : null,
      rsvp_deadline: null,
    })
    return true
  }
  if (url.pathname === '/rest/v1/rpc/can_manage_trip') {
    let raw = ''
    for await (const chunk of request) raw += chunk
    const body = JSON.parse(raw)
    send(body.p_uid === userId && tripIds.slice(0, 2).includes(body.p_trip_id))
    return true
  }
  if (url.pathname === '/rest/v1/rpc/save_trip_detail_edits') {
    let raw = ''
    for await (const chunk of request) raw += chunk
    const body = JSON.parse(raw)
    // Reject accidental assignment submissions from the member editor.
    if ('p_public_host_ids' in body || 'p_leader_user_ids' in body) {
      response.statusCode = 403
      send({ message: 'Assignment changes are forbidden' })
    } else {
      saved.set(body.p_trip_id, body.p_data)
      send(body.p_trip_id)
    }
    return true
  }
  if (url.pathname === '/rest/v1/rpc/get_trip_registration') {
    send({
      tripId: tripIds[0],
      title: 'Community edit fixture',
      startAt: '2099-11-10T18:00:00Z',
      endAt: '2099-11-10T22:00:00Z',
      timeZone: 'America/Los_Angeles',
      availability: 'disabled',
      closeAt: '2099-11-10T18:00:00Z',
      eligibility: 'members',
      eligibilityReasons: [],
      requirements: [],
      capacity: null,
      confirmedCount: 0,
      reservedCount: 0,
      waitlistCount: 0,
      state: 'none',
      revision: 0,
      authenticated: true,
      canManage: false,
      canReviewGuardian: false,
      emailEnabled: false,
      actions: [],
      ageAdult: true,
      formVersion: 2,
      questions: [],
      emergencyRequired: false,
      waiverRequired: false,
      waiverSigned: false,
      waiver: null,
      answers: {},
      emergencyContact: {},
      offer: null,
      events: [],
      attendees: [],
    })
    return true
  }
  if (url.pathname === '/rest/v1/rpc/is_active_member') {
    send(true)
    return true
  }
  if (url.pathname === '/rest/v1/rpc/has_trip_admin_capability') {
    send(false)
    return true
  }
  if (url.pathname === '/rest/v1/rpc/admin_capability_scope') {
    send(null)
    return true
  }
  if (url.pathname === '/rest/v1/trip_tag_options') {
    send([{ tag: 'hiking' }, { tag: 'camping' }])
    return true
  }
  if (
    ['/rest/v1/trip_private', '/rest/v1/trip_leaders'].includes(url.pathname)
  ) {
    send(null)
    return true
  }
  if (['/rest/v1/club_hosts', '/rest/v1/trip_hosts'].includes(url.pathname)) {
    send([])
    return true
  }
  return false
}
