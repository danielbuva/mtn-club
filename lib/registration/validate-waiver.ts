import type { RegistrationValues } from './form-values'

export function validateWaiverSignature(
  values: Pick<
    RegistrationValues,
    'waiverAgreed' | 'signatureName' | 'signerDetails'
  >,
  requiresDetails: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!values.waiverAgreed)
    errors.waiverAgreed =
      'Read and agree to the current waiver before submitting.'
  if (values.signatureName.trim().length < 2)
    errors.signatureName = 'Enter your full name as your signature.'
  if (requiresDetails) {
    for (const field of ['phone', 'address', 'emergencyAddress'] as const) {
      if (
        values.signerDetails[field].trim().length < (field === 'phone' ? 7 : 5)
      )
        errors[`signerDetails.${field}`] = 'Please complete this waiver detail.'
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.signerDetails.birthDate))
      errors['signerDetails.birthDate'] = 'Enter your date of birth.'
    for (const [index, value] of values.signerDetails.initials.entries())
      if (!value.trim())
        errors[`signerDetails.initials.${index}`] =
          'Initial this provision after reading it.'
  }
  return errors
}
