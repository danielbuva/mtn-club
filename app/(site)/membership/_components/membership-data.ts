import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  Camera,
  MessageSquare,
  Shield,
  Ticket,
  Users,
} from 'lucide-react'

export type MembershipBenefit = {
  icon: LucideIcon
  title: string
  description: string
}

export type MembershipFaq = {
  question: string
  answer: string
}

export const membershipBenefits: MembershipBenefit[] = [
  {
    icon: Ticket,
    title: 'Access to Upcoming Trips',
    description:
      'Unlock access to upcoming trips in our Trips Calendar to sign up for adventures.',
  },
  {
    icon: Calendar,
    title: 'Access to Guidebook Library',
    description:
      'Explore our extensive library of guidebooks covering trails, safety tips, and gear reviews.',
  },
  {
    icon: MessageSquare,
    title: 'Gear Room',
    description:
      'Borrow essential outdoor gear from our Gear Room for your adventures.',
  },
  {
    icon: Camera,
    title: 'Trip Photo Archives',
    description:
      'Access our complete library of professional trip photos and download high-resolution images.',
  },
  {
    icon: Users,
    title: 'Bring a Guest',
    description:
      'Members can bring one guest per quarter to experience a trip before joining.',
  },
  {
    icon: Shield,
    title: 'Trip Insurance',
    description:
      'Basic trip cancellation coverage included with your membership.',
  },
]

export const memberPerks: MembershipBenefit[] = [
  {
    icon: Ticket,
    title: 'Access to Upcoming Trips',
    description:
      'Browse and RSVP to upcoming trips directly in the Trips Calendar.',
  },
  {
    icon: Calendar,
    title: 'Access to Guidebook Library',
    description:
      'Tap into guidebooks covering trails, safety tips, and gear reviews.',
  },
  {
    icon: MessageSquare,
    title: 'Gear Room',
    description:
      'Reserve essential outdoor gear from the Gear Room for your adventures.',
  },
  {
    icon: Camera,
    title: 'Trip Photo Archives',
    description:
      'Download high-resolution photos from recent trips and events.',
  },
  {
    icon: Users,
    title: 'Bring a Guest',
    description: 'Invite a guest once per quarter to join a trip with you.',
  },
  {
    icon: Shield,
    title: 'Trip Insurance',
    description: 'Trip cancellation coverage is included with your membership.',
  },
]

const baseFaqs: MembershipFaq[] = [
  {
    question: 'How do I participate in a trip?',
    answer:
      'Once you are a member, you can browse our Trips Calendar and RSVP for upcoming trips. You will receive email reminders with trip details a few days before the event. Just show up at the designated meeting point ready for adventure!',
  },
  {
    question: 'Can I cancel my membership?',
    answer:
      'Yes, you can cancel your membership at any time. Your benefits will remain active until the end of your billing period. We do not offer prorated refunds, but you are welcome to rejoin at any time.',
  },
  {
    question: 'What is your refund policy?',
    answer:
      'We offer a full refund within 14 days of purchase if you have not attended any trips. After attending a trip or after 14 days, membership fees are non-refundable.',
  },
  {
    question: 'Are trips included in the membership fee?',
    answer:
      'Membership gives you access to RSVP for trips. Most trips are free, but some special adventures (multi-day trips, workshops with instructors) may have additional costs that are clearly listed.',
  },
  {
    question: 'What safety measures do you have?',
    answer:
      'All trip leaders are trained in wilderness first aid. We carry emergency communication devices on all trips and maintain detailed safety protocols. Participants must sign a liability waiver before each trip.',
  },
  {
    question: 'Am I required to go on a specific number of trips every year?',
    answer:
      'No, there is no minimum trip requirement. You can join as many or as few trips as you like during your membership period.',
  },
]

export const marketingFaqs: MembershipFaq[] = [
  {
    question: 'What happens after I join?',
    answer:
      'After completing checkout, you will receive a welcome email with instructions to set up your member profile, join our Discord community, and start RSVPing to trips. Your membership is active immediately.',
  },
  ...baseFaqs,
]

export const activateFaqs: MembershipFaq[] = [
  {
    question: 'What happens after checkout?',
    answer:
      'After completing checkout, your membership is active immediately. You can start RSVPing to trips, access the guidebook library, and request gear room access right away. We will email your receipt and membership details.',
  },
  ...baseFaqs,
]

export const activeFaqs: MembershipFaq[] = [...baseFaqs]
