import type { RegistrationValues } from './form-values'
import type { TripRegistrationSnapshot } from './schema'

export function validateRegistrationValues(
  values: RegistrationValues,
  snapshot: TripRegistrationSnapshot,
  step?: string,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const active = (id: string) => !step || id === step
  if (
    active('risks') &&
    snapshot.annualWaiver &&
    !snapshot.risksAcknowledged &&
    values.riskAcknowledgedId !== snapshot.informedRisks?.id
  )
    errors.riskAcknowledgedId =
      'Review and acknowledge these trip-specific risks.'
  for (const question of snapshot.questions) {
    if (!active(`question:${question.id}`)) continue
    const value = values.answers[question.id]
    const empty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && !value.length)
    if (empty) {
      if (question.required)
        errors[`answers.${question.id}`] = 'Please answer this question.'
      continue
    }
    const valid =
      question.type === 'text'
        ? typeof value === 'string' &&
          value.trim().length > 0 &&
          value.length <= 4000
        : question.type === 'boolean'
          ? typeof value === 'boolean'
          : question.type === 'single'
            ? typeof value === 'string' && question.options?.includes(value)
            : Array.isArray(value) &&
              value.every(item => question.options?.includes(item))
    if (!valid) errors[`answers.${question.id}`] = 'Choose a valid answer.'
  }
  if (
    snapshot.collectTransportation &&
    values.transportationMode === 'driver' &&
    active('seats')
  ) {
    if (
      !Number.isInteger(values.seatsOffered) ||
      values.seatsOffered < 1 ||
      values.seatsOffered > 8
    )
      errors.seatsOffered = 'Choose 1–8 passenger seats.'
  }
  if (active('emergency')) {
    for (const field of ['name', 'relationship', 'phone', 'notes'] as const) {
      const value = values.emergencyContact[field].trim()
      if (snapshot.emergencyRequired && field !== 'notes' && !value)
        errors[`emergencyContact.${field}`] = 'Please complete this field.'
      if (
        value.length > (field === 'notes' ? 1000 : field === 'phone' ? 50 : 200)
      )
        errors[`emergencyContact.${field}`] = 'This entry is too long.'
      if (field === 'phone' && value && value.replace(/\D/g, '').length < 10)
        errors[`emergencyContact.${field}`] = 'Use at least 10 digits.'
    }
    if (snapshot.emergencyRequired && !values.emergencyConfirmed)
      errors.emergencyConfirmed = 'Confirm that these details are current.'
  }
  if (
    active('waiver') &&
    snapshot.waiverRequired &&
    !snapshot.waiverSigned &&
    snapshot.ageAdult === true &&
    (!snapshot.annualWaiver ||
      (Boolean(snapshot.waiver) && snapshot.waiverApplicable !== false))
  ) {
    if (!snapshot.waiver || values.waiverReadId !== snapshot.waiver.id) {
      errors.waiverRead = 'Open the waiver and read through to the end.'
      return errors
    }
    if (!values.waiverAgreed)
      errors.waiverAgreed =
        'Read and agree to the current waiver before submitting.'
    if (values.signatureName.trim().length < 2)
      errors.signatureName = 'Enter your full name as your signature.'
    if (snapshot.waiver?.sourceUrl) {
      for (const field of ['phone', 'address', 'emergencyAddress'] as const) {
        if (
          values.signerDetails[field].trim().length <
          (field === 'phone' ? 7 : 5)
        )
          errors[`signerDetails.${field}`] =
            'Please complete this waiver detail.'
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(values.signerDetails.birthDate))
        errors['signerDetails.birthDate'] = 'Enter your date of birth.'
      for (const [index, value] of values.signerDetails.initials.entries())
        if (!value.trim())
          errors[`signerDetails.initials.${index}`] =
            'Initial this provision after reading it.'
    }
  }
  return errors
}
