import { GuardianHeading } from './guardian-shell'

const copy = {
  invalid: {
    title: 'This link doesn’t work.',
    body: 'It may have expired or been replaced by a newer one. Ask the participant to send you a new link from their Mountain Club profile.',
  },
  closed: {
    title: 'This request was closed.',
    body: 'It was canceled or replaced by a newer request, so there’s nothing to sign here. Ask {name} to send a new link if they still need you.',
  },
  declined: {
    title: 'You chose not to sign.',
    body: 'Nothing was signed. If you change your mind, ask {name} to send a new request.',
  },
} as const

export function GuardianLinkNotice({
  kind,
  participantName,
}: {
  kind: keyof typeof copy
  participantName?: string
}) {
  const { title, body } = copy[kind]
  return (
    <GuardianHeading title={title}>
      <p>{body.replace('{name}', participantName?.split(' ')[0] ?? 'them')}</p>
      <p className="text-muted-foreground">
        Can’t sign online? The club can also take a signed paper waiver.
      </p>
    </GuardianHeading>
  )
}
