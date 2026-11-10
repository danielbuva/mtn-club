import { gearSections } from '@/app/(reader)/guides/guide-content'
import { GuideShell } from '@/components/guides/GuideShell'

export default function GearGuidePage() {
  return <GuideShell guide="gear" sections={gearSections} />
}
