import { startHereSections } from '@/app/(reader)/guides/guide-content'
import { GuideShell } from '@/components/guides/GuideShell'

export default function GetStartedPage() {
  return <GuideShell sections={startHereSections} />
}
