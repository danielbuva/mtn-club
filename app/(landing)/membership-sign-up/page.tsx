import type { Metadata, Viewport } from 'next'
import { MembershipSignUpForm } from '@/components/membership/membership-sign-up-form'

export const metadata: Metadata = {
  title: 'Membership Sign Up | UNLV Mountain Club',
  description:
    'Create a UNLV Mountain Club account and submit the membership form.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#F8F1DF',
}

export default function Page() {
  return <MembershipSignUpForm />
}
