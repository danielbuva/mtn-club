import type { RegistrationInput, TripRegistrationSnapshot } from './schema'
import type { TransportationResponse } from './transportation'

export type RegistrationValues = {
  answers: TripRegistrationSnapshot['answers']
  emergencyContact: TripRegistrationSnapshot['emergencyContact']
  showInAttendeeList: boolean
  emailUpdates: boolean
  emergencyConfirmed: boolean
  transportationMode: NonNullable<TransportationResponse>['mode'] | null
  seatsOffered: number
  riskAcknowledgedId: string | null
  waiverReadId: string | null
  waiverAgreed: boolean
  signatureName: string
  signerDetails: NonNullable<RegistrationInput['data']['signerDetails']>
}
export function initialRegistrationValues(
  snapshot: TripRegistrationSnapshot,
): RegistrationValues {
  return {
    answers: snapshot.answers,
    emergencyContact: snapshot.emergencyContact,
    showInAttendeeList: snapshot.showInAttendeeList,
    emailUpdates: snapshot.emailUpdates,
    emergencyConfirmed: false,
    transportationMode: snapshot.transportation?.mode ?? null,
    seatsOffered:
      snapshot.transportation?.mode === 'driver'
        ? snapshot.transportation.seatsOffered
        : 1,
    riskAcknowledgedId: null,
    waiverReadId: null,
    waiverAgreed: false,
    signatureName: '',
    signerDetails: {
      phone: '',
      address: '',
      emergencyAddress: '',
      birthDate: '',
      initials: Array.from({ length: 7 }, () => ''),
    },
  }
}

/** The only persistence projection: transient hidden values never leak into commands. */
export function normalizeRegistrationValues(
  values: RegistrationValues,
  snapshot: TripRegistrationSnapshot,
  intent: 'draft' | 'submit',
): RegistrationInput['data'] {
  const transportation: TransportationResponse =
    values.transportationMode === 'driver'
      ? { mode: 'driver', seatsOffered: values.seatsOffered }
      : values.transportationMode
        ? { mode: values.transportationMode }
        : null
  const data: RegistrationInput['data'] = {
    formVersion: snapshot.formVersion,
    answers: Object.fromEntries(
      snapshot.questions.flatMap(question => {
        const answer = values.answers[question.id]
        return answer === undefined ? [] : [[question.id, answer]]
      }),
    ),
    emergencyContact: values.emergencyContact,
    ...(snapshot.collectTransportation ? { transportation } : {}),
  }
  if (intent === 'submit') {
    if (
      snapshot.informedRisks &&
      values.riskAcknowledgedId === snapshot.informedRisks.id
    ) {
      data.riskAcknowledged = true
      data.riskDisclosureId = snapshot.informedRisks.id
    }
    data.joiningPreferences = {
      showInAttendeeList: values.showInAttendeeList,
      emailUpdates: values.emailUpdates,
      expectedEmailUpdates: snapshot.emailUpdates,
      expectedAttendeeDefault: snapshot.defaultShowInAttendeeList,
    }
    if (snapshot.emergencyRequired)
      data.emergencyConfirmed = values.emergencyConfirmed
    if (
      snapshot.waiverRequired &&
      !snapshot.waiverSigned &&
      snapshot.ageAdult === true &&
      values.waiverAgreed
    ) {
      data.waiverAgreed = true
      data.waiverId = snapshot.waiver?.id
      data.signatureName = values.signatureName.trim()
      if (snapshot.waiver?.sourceUrl)
        data.signerDetails = {
          ...values.signerDetails,
          initials: values.signerDetails.initials.map(value => value.trim()),
        }
    }
  }
  return data
}
export function registrationSteps(
  snapshot: TripRegistrationSnapshot,
  values: RegistrationValues,
): string[] {
  return [
    ...(snapshot.ageAdult === null ? ['age'] : []),
    ...snapshot.questions.map(question => `question:${question.id}`),
    ...(snapshot.collectTransportation
      ? [
          'transportation',
          ...(values.transportationMode === 'driver' ? ['seats'] : []),
        ]
      : []),
    'emergency',
    ...(snapshot.waiverRequired && !snapshot.waiverSigned ? ['waiver'] : []),
    ...(snapshot.annualWaiver ? ['risks'] : []),
    'preferences',
    'review',
  ]
}
export function registrationFieldStep(field: string): string {
  if (field.startsWith('risk')) return 'risks'
  if (field.startsWith('joiningPreferences')) return 'preferences'
  if (field.startsWith('answers.'))
    return `question:${field.slice('answers.'.length)}`
  if (field.startsWith('emergency')) return 'emergency'
  if (field.startsWith('transportation') || field === 'seatsOffered')
    return field === 'seatsOffered' ? 'seats' : 'transportation'
  return 'waiver'
}
