import { ArrowRight, Heart, Leaf, Shield, Sparkles, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { MemberCTA } from '@/components/member-cta'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const values = [
  {
    icon: Leaf,
    title: 'Leave No Trace',
    description:
      'We practice and teach the seven principles of Leave No Trace. Every trip includes education on minimizing our environmental impact.',
  },
  {
    icon: Users,
    title: 'Inclusive Community',
    description:
      'Outdoors are for everyone. We welcome people of all backgrounds, skill levels, and abilities to join our adventures.',
  },
  {
    icon: Sparkles,
    title: 'Skill Building',
    description:
      'From navigation to first aid, we offer workshops and hands-on learning opportunities to help you grow as an outdoor enthusiast.',
  },
  {
    icon: Shield,
    title: 'Safety First',
    description:
      'All our trip leaders are trained in wilderness safety. We maintain strict protocols and never compromise on safety.',
  },
]

const activities = [
  {
    title: 'Hikes',
    description:
      'Explore new trails with guided group hikes for all skill levels.',
    image:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop',
  },
  {
    title: 'Climbing',
    description:
      'Rock climbing and mountaineering trips led by certified guides.',
    image:
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=400&fit=crop',
  },
  {
    title: 'Snow Adventures',
    description:
      'Snowshoeing, backcountry skiing, and winter camping expeditions.',
    image:
      'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=600&h=400&fit=crop',
  },
  {
    title: 'Workshops',
    description: 'Learn navigation, wilderness first aid, and outdoor cooking.',
    image:
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop',
  },
]

const steps = [
  {
    number: '01',
    title: 'Join the Club',
    description:
      'Become a member for just $25/year to unlock access to all trips and the member community.',
  },
  {
    number: '02',
    title: 'RSVP to Trips',
    description:
      'Browse our calendar and reserve your spot. Only members can browse upcoming trips.',
  },
  {
    number: '03',
    title: 'Meet & Explore',
    description:
      'Show up at the meeting point, meet your group, and embark on an unforgettable adventure.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-125 flex items-center justify-center overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&h=1080&fit=crop"
            alt="Mountain landscape"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/60 via-background/40 to-background" />
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              Building Community Through Adventure
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              UNLV Mountain Club connects outdoor enthusiasts for unforgettable
              experiences in nature.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="rounded-xl">
                <Link href="/membership">Become a member</Link>
              </Button>
              <Button variant="secondary" asChild className="rounded-xl">
                <Link href="/start-here">Get started</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why We Exist */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-primary font-medium text-sm uppercase tracking-wider">
                  Our Story
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 text-balance">
                  Why We Exist
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    UNLV Mountain Club was founded in 2018 by a group of friends
                    who believed that the outdoors are best experienced
                    together. What started as informal weekend hikes has grown
                    into a thriving community of over 2,000 members.
                  </p>
                  <p>
                    We exist to make outdoor adventure accessible, safe, and
                    deeply communal. Our mission is simple: get more people
                    outside, build lasting friendships, and foster a deep
                    respect for the natural world.
                  </p>
                  <p>
                    Every trail we walk, every peak we summit, and every
                    campfire we gather around strengthens our bond with nature
                    and each other.
                  </p>
                </div>
              </div>
              <div className="relative aspect-4/3 rounded-3xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&h=600&fit=crop"
                  alt="Group hiking together"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-24 px-4 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">
                Activities
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-balance">
                What We Do
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From casual day hikes to technical alpine climbs, we offer a
                wide range of outdoor experiences for every skill level.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activities.map(activity => (
                <Card
                  key={activity.title}
                  className="group overflow-hidden bg-card border-border/50 hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-4/3 overflow-hidden">
                    <Image
                      src={activity.image || '/placeholder.svg'}
                      alt={activity.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-2">
                      {activity.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {activity.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">
                Our Principles
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-balance">
                Our Values
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These core values guide everything we do, from planning trips to
                welcoming new members.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map(value => (
                <Card
                  key={value.title}
                  className="p-6 bg-card border-border/50 hover:border-primary/20 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-4 bg-secondary/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">
                Getting Started
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-balance">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Joining Mountain Club is simple. Here is how to get started on
                your next adventure.
              </p>
            </div>

            <div className="space-y-8">
              {steps.map(step => (
                <div key={step.number} className="flex gap-6 items-start">
                  <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                    {step.number}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Ready to Join the Adventure?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Become a member today for just $25/year and unlock access to all
              our trips, workshops, and community events.
            </p>
            <MemberCTA
              size="lg"
              className="rounded-xl gap-2 text-lg px-8"
              icon={<ArrowRight className="w-5 h-5" />}
            />
          </div>
        </section>
      </main>
    </div>
  )
}
