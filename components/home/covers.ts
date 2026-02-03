import type { StaticImageData } from 'next/image'
import bouldering from '@/public/club-covers/bouldering.jpg'
import clubHike from '@/public/club-covers/club-hike.jpg'
import daxClimbingPose from '@/public/club-covers/dax-climbing-pose.jpg'
import hoawenLeadingCrack from '@/public/club-covers/hoawen-leading-a-crack.jpg'
import leadClimbing from '@/public/club-covers/lead-climbing.jpg'
import multiPitch from '@/public/club-covers/multi-pitch.jpg'

type Cover = {
  src: StaticImageData
  posMobile: string
  posDesktop: string
  originMobile: string
  originDesktop: string
  scaleMobile: number
  scaleDesktop: number
}

export const covers: Cover[] = [
  {
    src: leadClimbing,
    posMobile: '50% 35%',
    posDesktop: '45% 40%',
    originMobile: '50% 35%',
    originDesktop: '45% 40%',
    scaleMobile: 1.08,
    scaleDesktop: 1.05,
  },
  {
    src: clubHike,
    posMobile: '40% 45%',
    posDesktop: '45% 50%',
    originMobile: '40% 45%',
    originDesktop: '45% 50%',
    scaleMobile: 1.1,
    scaleDesktop: 1.06,
  },
  {
    src: bouldering,
    posMobile: '40% 35%',
    posDesktop: '45% 40%',
    originMobile: '40% 35%',
    originDesktop: '45% 40%',
    scaleMobile: 1.12,
    scaleDesktop: 1.08,
  },
  {
    src: daxClimbingPose,
    posMobile: '48% 35%',
    posDesktop: '50% 40%',
    originMobile: '48% 35%',
    originDesktop: '50% 40%',
    scaleMobile: 1.1,
    scaleDesktop: 1.06,
  },
  {
    src: multiPitch,
    posMobile: '20% 90%',
    posDesktop: '20% 50%',
    originMobile: '20% 90%',
    originDesktop: '20% 50%',
    scaleMobile: 1.3,
    scaleDesktop: 1.12,
  },
  {
    src: hoawenLeadingCrack,
    posMobile: '70% 45%',
    posDesktop: '55% 45%',
    originMobile: '70% 45%',
    originDesktop: '55% 45%',
    scaleMobile: 1.1,
    scaleDesktop: 1.06,
  },
]
