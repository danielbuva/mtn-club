import { faqSections } from '@/app/(reader)/guides/guide-content'
import { GuideShell } from '@/components/guides/GuideShell'

export default function FaqGuidePage() {
  return <GuideShell guide="faq" sections={faqSections} />
}
