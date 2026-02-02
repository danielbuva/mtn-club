export interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  favoriteTrail: string
  photo: ''
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
    photo: '',
    // social: {
    //   instagram: '',
    //   email: '',
    // }
  },
  {
    id: '2',
    name: 'Dax Whitaker',
    role: 'President',
    bio: 'AMGA certified rock guide and former competitive climber. Specializes in trad climbing and alpine routes.',
    favoriteTrail: 'The Nose, El Capitan',
    photo: '',
    // social: {
    //   instagram: '',
    //   email: '',
    // }
  },
  {
    id: '3',
    name: 'Bridget Morrill',
    role: 'Gear Manager',
    bio: 'Passionate about making the outdoors accessible to everyone. Organizes beginner-friendly trips and workshops.',
    favoriteTrail: 'Rattlesnake Ledge, WA',
    photo: '',
    // social: {
    //   instagram: '',
    //   email: '',
    // }
  },
  {
    id: '4',
    name: 'Lilly Czerwinski',
    role: 'Scheduling Liason',
    bio: 'EMT and Wilderness First Responder instructor. Ensures all trips meet the highest safety standards.',
    favoriteTrail: 'Mount Whitney, CA',
    photo: '',
    // social: {
    //   instagram: '',
    //   email: '',
    // }
  },
  {
    id: '5',
    name: 'Devyn White ',
    role: 'Community Director',
    bio: 'Ski mountaineering enthusiast and avalanche safety certified. Leads winter backcountry adventures.',
    favoriteTrail: 'Mount Baker Ski Descent',
    photo: '',
    // social: {
    //   instagram: '',
    //   email: '',
    // }
  },
  {
    id: '6',
    name: 'Katie Erickson',
    role: 'Treasurer',
    bio: 'Ultra-marathon runner and certified running coach. Leads trail running clinics and group runs.',
    favoriteTrail: 'Western States Trail, CA',
    photo: '',
    // social: {
    //   instagram: '',
    //   email: '',
    // }
  },
  {
    id: '7',
    name: 'Tanner',
    role: 'Trip Leader',
    bio: 'Ultra-marathon runner and certified running coach. Leads trail running clinics and group runs.',
    favoriteTrail: 'Western States Trail, CA',
    photo: '',
    // social: {
    //   instagram: '',
    //   email: '',
    // }
  },
  {
    id: '8',
    name: 'Ahmed',
    role: 'Trip Leader',
    bio: 'Ultra-marathon runner and certified running coach. Leads trail running clinics and group runs.',
    favoriteTrail: 'Western States Trail, CA',
    photo: '',
    // social: {
    //   instagram: '',
    //   email: '',
    // }
  },
]
