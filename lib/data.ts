export interface Trip {
  id: string
  title: string
  state: string
  coordinates: { lat: number; lng: number }
  dateStart: string
  dateEnd: string
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Expert'
  miles: number
  elevationGain: number
  tags: string[]
  photos: string[]
  membersOnly: boolean
  description: string
  meetingTime: string
  meetingLocation: string
}

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

export const trips: Trip[] = [
  {
    id: '1',
    title: 'Half Dome Day Hike',
    state: 'California',
    coordinates: { lat: 37.7460, lng: -119.5330 },
    dateStart: '2026-03-15',
    dateEnd: '2026-03-15',
    difficulty: 'Challenging',
    miles: 16,
    elevationGain: 4800,
    tags: ['hike', 'iconic', 'spring'],
    photos: ['/images/half-dome-1.jpg', '/images/half-dome-2.jpg'],
    membersOnly: true,
    description: 'Tackle one of the most iconic hikes in the world. Cable route to the summit of Half Dome with stunning views of Yosemite Valley.',
    meetingTime: '5:00 AM',
    meetingLocation: 'Happy Isles Trailhead, Yosemite'
  },
  {
    id: '2',
    title: 'Mount Rainier Summit',
    state: 'Washington',
    coordinates: { lat: 46.8523, lng: -121.7603 },
    dateStart: '2026-06-20',
    dateEnd: '2026-06-22',
    difficulty: 'Expert',
    miles: 18,
    elevationGain: 9000,
    tags: ['climb', 'snow', 'summer', 'multi-day'],
    photos: ['/images/rainier-1.jpg', '/images/rainier-2.jpg'],
    membersOnly: true,
    description: 'A classic Pacific Northwest mountaineering objective. Multi-day glacier climb to the summit of Washington\'s highest peak.',
    meetingTime: '6:00 AM',
    meetingLocation: 'Paradise Visitor Center'
  },
  {
    id: '3',
    title: 'Olympic Coast Backpack',
    state: 'Washington',
    coordinates: { lat: 47.8896, lng: -124.6369 },
    dateStart: '2026-07-10',
    dateEnd: '2026-07-13',
    difficulty: 'Moderate',
    miles: 22,
    elevationGain: 2400,
    tags: ['hike', 'camp', 'coast', 'summer'],
    photos: ['/images/olympic-1.jpg', '/images/olympic-2.jpg'],
    membersOnly: false,
    description: 'Wild beaches, sea stacks, and tide pools. A stunning coastal backpacking route through Olympic National Park.',
    meetingTime: '8:00 AM',
    meetingLocation: 'Rialto Beach Parking'
  },
  {
    id: '4',
    title: 'Smith Rock Climbing',
    state: 'Oregon',
    coordinates: { lat: 44.3682, lng: -121.1405 },
    dateStart: '2026-04-05',
    dateEnd: '2026-04-06',
    difficulty: 'Moderate',
    miles: 4,
    elevationGain: 800,
    tags: ['climb', 'spring'],
    photos: ['/images/smith-rock-1.jpg', '/images/smith-rock-2.jpg'],
    membersOnly: false,
    description: 'World-class sport climbing at the birthplace of American sport climbing. Routes for all skill levels.',
    meetingTime: '7:00 AM',
    meetingLocation: 'Bivy Campground'
  },
  {
    id: '5',
    title: 'Joshua Tree Weekend',
    state: 'California',
    coordinates: { lat: 33.8734, lng: -115.9010 },
    dateStart: '2026-02-14',
    dateEnd: '2026-02-16',
    difficulty: 'Easy',
    miles: 8,
    elevationGain: 600,
    tags: ['hike', 'camp', 'desert', 'winter'],
    photos: ['/images/joshua-tree-1.jpg', '/images/joshua-tree-2.jpg'],
    membersOnly: false,
    description: 'Desert exploration among iconic Joshua Trees. Perfect winter escape with hiking, stargazing, and optional rock scrambling.',
    meetingTime: '10:00 AM',
    meetingLocation: 'Hidden Valley Campground'
  },
  {
    id: '6',
    title: 'Crater Lake Snowshoe',
    state: 'Oregon',
    coordinates: { lat: 42.9446, lng: -122.1090 },
    dateStart: '2026-01-25',
    dateEnd: '2026-01-25',
    difficulty: 'Moderate',
    miles: 6,
    elevationGain: 500,
    tags: ['snow', 'winter', 'hike'],
    photos: ['/images/crater-lake-1.jpg', '/images/crater-lake-2.jpg'],
    membersOnly: true,
    description: 'Snowshoe along the rim of America\'s deepest lake. Stunning blue waters surrounded by pristine winter snow.',
    meetingTime: '9:00 AM',
    meetingLocation: 'Rim Village Visitor Center'
  },
  {
    id: '7',
    title: 'Big Sur Trail Run',
    state: 'California',
    coordinates: { lat: 36.2438, lng: -121.8074 },
    dateStart: '2026-05-03',
    dateEnd: '2026-05-03',
    difficulty: 'Challenging',
    miles: 12,
    elevationGain: 3200,
    tags: ['hike', 'run', 'spring', 'coast'],
    photos: ['/images/big-sur-1.jpg', '/images/big-sur-2.jpg'],
    membersOnly: false,
    description: 'Trail running through redwood groves to coastal views. A challenging but rewarding route along the Big Sur coast.',
    meetingTime: '6:30 AM',
    meetingLocation: 'Pfeiffer Big Sur State Park'
  },
  {
    id: '8',
    title: 'North Cascades Alpine',
    state: 'Washington',
    coordinates: { lat: 48.7718, lng: -121.2985 },
    dateStart: '2026-08-15',
    dateEnd: '2026-08-17',
    difficulty: 'Expert',
    miles: 14,
    elevationGain: 5500,
    tags: ['climb', 'hike', 'summer', 'alpine'],
    photos: ['/images/cascades-1.jpg', '/images/cascades-2.jpg'],
    membersOnly: true,
    description: 'Technical alpine climbing in the "American Alps." Dramatic peaks, glaciers, and wilderness as far as the eye can see.',
    meetingTime: '4:00 AM',
    meetingLocation: 'Marblemount Ranger Station'
  }
]

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Founder & Lead Guide',
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

export function getUpcomingTrips(): Trip[] {
  const today = new Date()
  return trips
    .filter(trip => new Date(trip.dateStart) >= today)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
}

export function getTripsByMonth(year: number, month: number): Trip[] {
  return trips.filter(trip => {
    const tripDate = new Date(trip.dateStart)
    return tripDate.getFullYear() === year && tripDate.getMonth() === month
  })
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  const year = startDate.getFullYear()
  
  if (start === end) {
    return `${startMonth} ${startDay}, ${year}`
  }
  
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`
  }
  
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
}
