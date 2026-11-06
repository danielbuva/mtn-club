export const participantContactQuestions = [
  {
    id: 'participant_email',
    label: 'Your email address',
    type: 'text',
    required: true,
  },
  {
    id: 'participant_phone',
    label: 'Your phone number',
    type: 'text',
    required: true,
  },
] as const

export function isParticipantContactQuestion(id: string): boolean {
  return participantContactQuestions.some(question => question.id === id)
}

export function validContactEmail(value: string): boolean {
  return (
    value.trim().length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
}

export function validContactPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return value.length <= 50 && digits.length >= 10 && digits.length <= 15
}
