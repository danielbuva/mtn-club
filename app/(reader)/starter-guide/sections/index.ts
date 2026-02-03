import { communicationPlatformsSection } from './communication-platforms'
import { communityCultureSection } from './community-culture'
import { contactSection } from './contact'
import { costTransparencySection } from './cost-transparency'
import { faqSection } from './faq'
import { gearEquipmentSection } from './gear-equipment'
import { getInvolvedSection } from './get-involved'
import { leadershipVolunteeringSection } from './leadership-volunteering'
import { membershipBasicsSection } from './membership-basics'
import { safetyExpectationsSection } from './safety-expectations'
import { skillLevelSection } from './skill-level'
import { timeCommitmentSection } from './time-commitment'
import type { Section } from './types'
import { typicalExperienceSection } from './typical-experience'
import { welcomeSection } from './welcome'
import { whatClubIsSection } from './what-club-is'
import { whatWeDoSection } from './what-we-do'
import { whereNextSection } from './where-next'

export { LINKS } from './links'
export type { Section, SectionId } from './types'

export const sections: Section[] = [
  welcomeSection,
  whatClubIsSection,
  whatWeDoSection,
  typicalExperienceSection,
  getInvolvedSection,
  membershipBasicsSection,
  gearEquipmentSection,
  skillLevelSection,
  safetyExpectationsSection,
  communicationPlatformsSection,
  timeCommitmentSection,
  costTransparencySection,
  communityCultureSection,
  leadershipVolunteeringSection,
  faqSection,
  whereNextSection,
  contactSection,
]
