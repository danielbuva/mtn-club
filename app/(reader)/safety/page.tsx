import { safetySections } from '@/app/(reader)/guides/guide-content'
import { GuideShell } from '@/components/guides/GuideShell'

export default function SafetyGuidePage() {
  return <GuideShell sections={safetySections} />
}
