import type { OpenGuardianRequest } from './schema'

export type GuardianDetails = {
  name: string
  email: string
  phone: string
  relationship: string
}

export type SignFormValues = {
  membershipAgreed: boolean
  waiverRead: boolean
  waiverAgreed: boolean
  initials: string[]
  birthDate: string
  address: string
  emergency: {
    name: string
    relationship: string
    phone: string
    address: string
    notes: string
  }
  authority: boolean
  special: boolean
  specialNote: string
  signatureName: string
}

export function initialSignValues(
  view: OpenGuardianRequest,
  details: GuardianDetails,
): SignFormValues {
  const participant = view.prefill?.participant ?? {}
  const emergency = view.prefill?.emergencyContact ?? {}
  return {
    membershipAgreed: false,
    waiverRead: false,
    waiverAgreed: false,
    initials: Array.from({ length: 7 }, () => ''),
    birthDate: participant.birthDate ?? '',
    address: participant.address ?? '',
    emergency: {
      name: emergency.name ?? details.name,
      relationship: emergency.relationship ?? details.relationship,
      phone: emergency.phone ?? details.phone,
      address: emergency.address ?? participant.address ?? '',
      notes: emergency.notes ?? '',
    },
    authority: false,
    special: false,
    specialNote: '',
    signatureName: '',
  }
}

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase()

/** Business date in the club's zone, matching the database's waiver_today(). */
export function clubToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
  }).format(now)
}

export function validateDetails(
  details: GuardianDetails,
): Partial<Record<keyof GuardianDetails, string>> {
  const errors: Partial<Record<keyof GuardianDetails, string>> = {}
  if (details.name.trim().length < 2)
    errors.name = 'Enter your full legal name.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(details.email.trim()))
    errors.email = 'Enter an email you can open now.'
  if (details.phone.replace(/\D/g, '').length < 7)
    errors.phone = 'Enter a phone number the club can reach you at.'
  if (details.relationship.trim().length < 2)
    errors.relationship =
      'Say how you’re related, like Mother or Legal guardian.'
  return errors
}

/** Error keys match element ids so focus can move to the first one. */
export function validateSignForm(
  values: SignFormValues,
  view: OpenGuardianRequest,
  guardianName: string,
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (view.membership && !values.membershipAgreed)
    errors['g-membership'] = 'Check this to give membership permission.'
  if (view.waiver) {
    if (!values.waiverRead)
      errors['g-read'] = 'Open the waiver and read it to the end.'
    values.initials.forEach((value, index) => {
      if (!value.trim()) errors[`g-initial-${index}`] = 'Initial this section.'
    })
    const today = clubToday()
    const [y, m, d] = today.split('-').map(Number)
    const adultCutoff = `${y - 18}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthDate))
      errors['g-birth'] = `Enter ${view.participantName}’s date of birth.`
    else if (values.birthDate <= adultCutoff)
      errors['g-birth'] =
        'This date makes them 18 or older. Adults sign their own waiver.'
    if (values.address.trim().length < 5)
      errors['g-address'] = 'Enter their local street address.'
    if (values.emergency.name.trim().length < 2)
      errors['g-em-name'] = 'Enter the emergency contact’s name.'
    if (!values.emergency.relationship.trim())
      errors['g-em-relationship'] = 'Enter how they’re related.'
    if (values.emergency.phone.replace(/\D/g, '').length < 7)
      errors['g-em-phone'] = 'Enter a phone number with at least 7 digits.'
    if (values.emergency.address.trim().length < 5)
      errors['g-em-address'] = 'Enter the emergency contact’s address.'
    if (!values.waiverAgreed)
      errors['g-agree'] = 'Check this to agree to the waiver.'
  }
  if (!values.authority)
    errors['g-authority'] = 'Confirm you’re allowed to sign for them.'
  if (!values.signatureName.trim())
    errors['g-signature'] = 'Type your full name to sign.'
  else if (normalize(values.signatureName) !== normalize(guardianName))
    errors['g-signature'] = `Type your name exactly as above: ${guardianName}.`
  return errors
}
