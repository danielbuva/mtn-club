import { costSections } from '@/app/(reader)/guides/guide-content'
import { GuideShell } from '@/components/guides/GuideShell'

export default function CostGuidePage() {
  return <GuideShell sections={costSections} />
}
