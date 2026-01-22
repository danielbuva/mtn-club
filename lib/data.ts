export interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  favoriteTrail: string
  photo: string
  social?: {
    instagram?: string
    email?: string
  }
}

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'April Contreras',
    role: 'Founder',
    bio: 'Former search and rescue volunteer with 15 years of backcountry experience. Certified Wilderness First Responder.',
    favoriteTrail: 'Enchantments Traverse, WA',
    photo: '/images/team/sarah.jpg',
    social: {
      instagram: '@sarahoutdoors',
      email: 'sarah@mountainclub.com'
    }
  },
  {
    id: '2',
    name: 'Marcus Rivera',
    role: 'Technical Climbing Director',
    bio: 'AMGA certified rock guide and former competitive climber. Specializes in trad climbing and alpine routes.',
    favoriteTrail: 'The Nose, El Capitan',
    photo: '/images/team/marcus.jpg',
    social: {
      instagram: '@marcusclimbs',
      email: 'marcus@mountainclub.com'
    }
  },
  {
    id: '3',
    name: 'Emily Tanaka',
    role: 'Community Manager',
    bio: 'Passionate about making the outdoors accessible to everyone. Organizes beginner-friendly trips and workshops.',
    favoriteTrail: 'Rattlesnake Ledge, WA',
    photo: '/images/team/emily.jpg',
    social: {
      instagram: '@emilyhikes',
      email: 'emily@mountainclub.com'
    }
  },
  {
    id: '4',
    name: 'James Okonkwo',
    role: 'Safety & Training Lead',
    bio: 'EMT and Wilderness First Responder instructor. Ensures all trips meet the highest safety standards.',
    favoriteTrail: 'Mount Whitney, CA',
    photo: '/images/team/james.jpg',
    social: {
      instagram: '@jamesontrail',
      email: 'james@mountainclub.com'
    }
  },
  {
    id: '5',
    name: 'Alex Petrov',
    role: 'Snow Sports Coordinator',
    bio: 'Ski mountaineering enthusiast and avalanche safety certified. Leads winter backcountry adventures.',
    favoriteTrail: 'Mount Baker Ski Descent',
    photo: '/images/team/alex.jpg',
    social: {
      instagram: '@alexpetrov_snow',
      email: 'alex@mountainclub.com'
    }
  },
  {
    id: '6',
    name: 'Maya Patel',
    role: 'Trail Running Coach',
    bio: 'Ultra-marathon runner and certified running coach. Leads trail running clinics and group runs.',
    favoriteTrail: 'Western States Trail, CA',
    photo: '/images/team/maya.jpg',
    social: {
      instagram: '@mayaruns',
      email: 'maya@mountainclub.com'
    }
  }
]
