import Link from 'next/link'
import {
  BadgeCheck,
  Calendar,
  Compass,
  ExternalLink,
  MapPin,
  MessageCircle,
  Mountain,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const involvementCenterUrl =
  'https://involvementcenter.unlv.edu/organization/unlvmountainclub'

type TocItem = {
  id: string
  label: string
}

const tocItems: TocItem[] = [
  { id: 'how-to-become-a-member', label: 'How to become a member' },
  { id: 'where-do-we-meet', label: 'Where do we meet' },
  { id: 'climbing-schedule', label: 'Climbing schedule & pricing' },
  { id: 'how-to-join-trips', label: 'How to join trips' },
  { id: 'online-tools', label: 'Online tools & communication' },
  { id: 'trips-overview', label: 'Trips overview (general)' },
  { id: 'activity-expectations', label: 'Activity-specific expectations' },
]

const howToBecomeMemberSteps = [
  {
    title: 'Join UNLV Mountain Club on the Involvement Center',
    detail: 'Officially join the org first so you are on the roster.',
    href: involvementCenterUrl,
    cta: 'Join the org',
  },
  {
    title: 'Join the Discord + follow Instagram',
    detail: 'Meet people, see announcements, and stay in the loop.',
  },
  {
    title: 'Pay annual membership dues',
    detail: 'Dues unlock member updates, trips, and the gear closet.',
    href: '/membership',
    cta: 'Pay dues',
  },
]

const meetingHighlights = [
  'Monday 5–7pm at UNLV Rock Wall',
  'Tuesday and Friday evenings at Nevada Climbing Center (NCC)',
  'One general meeting a semester',
  'Unofficial meets through Discord coordination',
  'Official trips and events (posted on Discord; RSVP via Eventbrite – coming soon to web app)',
]

const climbingSchedule = [
  'Every first Friday AND every first week of the semester, UNLV climbing is free',
  'Monday 5–7 meet at UNLV rock wall',
  'Tuesday and Friday meet at NCC',
]

const climbingPricing = [
  'UNLV wall is $10/month for students',
  'NCC is $12 student pass any day for MTN club members (mention MTN club and maybe show student ID)',
]

const joinTripsSteps = [
  'Follow Discord #announcements for trip info',
  'RSVP on Eventbrite',
  'Communicate equipment and carpool needs',
  'Show up at designated meet up spot',
]

const onlineTools = [
  'Use Discord for communication (announcements, trip brainstorming, and updates)',
  'Use text for carpooling or day-of-trip communication',
  'Eventbrite for trip RSVP, emergency contact, waiver — coming soon to web app',
  'PhotoCircle for sharing trip photos — coming soon to web app',
  'Email newsletter for trip announcements — coming soon, sign up on the web app',
]

const tripsOverview = [
  'Carpool',
  'Mainly on weekends',
  'Can create your own unofficial or official events',
  'Gear closet shared between members',
  'The club rents and shares necessary gear for you',
  'On overnight trips dinner is included',
  'General meeting once at the beginning of semesters',
  'We are partnered with Snow Club',
  'We teach and share knowledge about all activities if you want it',
]

const activityExpectations = [
  {
    title: 'Camping',
    points: [
      'Dinner is free',
      'All necessary equipment is rented or shared to you (except clothing and shoes)',
      'We climb, hike, and explore during trips',
    ],
  },
  {
    title: 'Backpacking',
    points: [
      'Backpacking backpack is rented or shared to you',
      'On overnight trips dinner is included',
    ],
  },
  {
    title: 'Hiking',
    points: ['Bring your own food and water', 'Nice to bring snacks and food to share'],
  },
  {
    title: 'Mountain biking',
    points: ['We like mountain biking'],
  },
]

const faqItems = [
  {
    question: 'Do I need experience?',
    answer:
      'No. We welcome first-timers and seasoned adventurers. We group trips by difficulty and share tips to get you ready.',
  },
  {
    question: 'Do I need my own gear?',
    answer:
      'Not always. Many trips are beginner-friendly, and the gear closet is coming soon for members.',
  },
  {
    question: 'How does carpooling work?',
    answer:
      'We coordinate in Discord and match drivers with riders. Trip leads will confirm meeting points and times.',
  },
  {
    question: 'What do dues cover?',
    answer:
      'Dues support club operations, workshops, and access to member-only resources and events.',
  },
  {
    question: 'Is membership annual?',
    answer: 'Yes, membership is renewed annually.',
  },
  {
    question: 'How do I contact leadership?',
    answer:
      'Email us or reach out in Discord. We respond fastest there.',
  },
]

export default function GetStartedPage() {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? '#'
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL
  const meetingWhen = process.env.NEXT_PUBLIC_MEETING_WHEN ?? 'Monday 5–7pm'
  const meetingWhere = process.env.NEXT_PUBLIC_MEETING_WHERE ?? 'UNLV Rock Wall'
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'unlvmtnclub.tech@gmail.com'

  const isDiscordMissing = discordUrl === '#'

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-20 pb-16">
        <section className="px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">New Member Guide</p>
              <h1 className="text-4xl md:text-5xl font-semibold text-balance">
                Welcome to the UNLV Mountain Club
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                A friendly, fast guide to joining the club, meeting up, and getting ready for trips.
              </p>
            </div>

            <Card className="border-border/60">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="rounded-xl">
                    <a href={discordUrl} target="_blank" rel="noreferrer">
                      Join Discord
                    </a>
                  </Button>
                  <Button variant="secondary" asChild className="rounded-xl">
                    <Link href="/membership">Become a Member</Link>
                  </Button>
                  <Button variant="outline" asChild className="rounded-xl">
                    <a href={involvementCenterUrl} target="_blank" rel="noreferrer">
                      Join UNLV Involvement Center Org
                    </a>
                  </Button>
                  {instagramUrl ? (
                    <Button variant="ghost" asChild className="rounded-xl">
                      <a href={instagramUrl} target="_blank" rel="noreferrer">
                        Follow Instagram
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Instagram (link coming soon)
                    </span>
                  )}
                </div>
                {isDiscordMissing ? (
                  <p className="text-xs text-muted-foreground">
                    Discord invite link missing. Set NEXT_PUBLIC_DISCORD_INVITE_URL to enable.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">How to become a member</h2>
                  </div>
                  <ol className="space-y-4 text-sm text-muted-foreground">
                    <li>
                      <p className="font-medium text-foreground">
                        1. Join UNLV Mountain Club in the Involvement Center
                      </p>
                      <a
                        href={involvementCenterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        involvementcenter.unlv.edu
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      <p className="font-medium text-foreground">2. Join Discord + follow Instagram</p>
                      <p>Connect with the community and stay updated.</p>
                    </li>
                    <li>
                      <p className="font-medium text-foreground">3. Pay annual membership dues</p>
                      <Link href="/membership" className="text-primary hover:underline">
                        Go to Membership
                      </Link>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Where do we meet?</h2>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Highlighted this week</p>
                    <p>{meetingWhen}</p>
                    <p>{meetingWhere}</p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {meetingHighlights.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Table of contents</h2>
                <div className="flex flex-wrap gap-3">
                  {tocItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-4 mt-12">
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Card id="how-to-become-a-member" className="border-border/60 scroll-mt-24">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">How to become a member</h2>
                  </div>
                  <ol className="space-y-4 text-sm text-muted-foreground">
                    {howToBecomeMemberSteps.map((step, index) => (
                      <li key={step.title} className="space-y-2">
                        <p className="font-medium text-foreground">
                          {index + 1}. {step.title}
                        </p>
                        <p>{step.detail}</p>
                        {step.href && step.cta ? (
                          <Button
                            variant={step.href.startsWith('http') ? 'outline' : 'secondary'}
                            asChild
                            className="rounded-xl"
                          >
                            {step.href.startsWith('http') ? (
                              <a href={step.href} target="_blank" rel="noreferrer">
                                {step.cta}
                              </a>
                            ) : (
                              <Link href={step.href}>{step.cta}</Link>
                            )}
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  <div className="rounded-xl border border-border/60 p-4 bg-secondary/20">
                    <p className="text-sm font-semibold text-foreground">What happens after joining</p>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <li>We confirm your membership status.</li>
                      <li>You get access to member updates + channels.</li>
                      <li>Trip RSVPs open up as they launch.</li>
                      <li>We share meeting reminders and announcements.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card id="where-do-we-meet" className="border-border/60 scroll-mt-24">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">Where do we meet</h2>
                  </div>
                  <div className="rounded-xl border border-border/60 p-4 bg-secondary/20">
                    <h3 className="text-sm font-semibold">Schedule (Mon/Tue/Fri)</h3>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <li>Monday 5–7pm at UNLV Rock Wall</li>
                      <li>Tuesday evenings at Nevada Climbing Center (NCC)</li>
                      <li>Friday evenings at Nevada Climbing Center (NCC)</li>
                    </ul>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {meetingHighlights.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card id="climbing-schedule" className="border-border/60 scroll-mt-24">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mountain className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">Climbing schedule & pricing</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Climbing schedule</h3>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {climbingSchedule.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4 bg-secondary/20">
                      <h3 className="text-sm font-semibold">Pricing</h3>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {climbingPricing.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card id="how-to-join-trips" className="border-border/60 scroll-mt-24">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">How to join trips</h2>
                  </div>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    {joinTripsSteps.map((item, index) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-primary font-medium">{index + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card id="online-tools" className="border-border/60 scroll-mt-24">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">Online tools & communication</h2>
                  </div>
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="tools">
                      <AccordionTrigger>Where we communicate</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {onlineTools.map((item) => (
                            <li key={item} className="flex flex-wrap gap-2">
                              <span className="text-primary">•</span>
                              <span>{item}</span>
                              {item.startsWith('Eventbrite') ? (
                                <Badge variant="secondary">Coming soon to web app</Badge>
                              ) : null}
                              {item.startsWith('PhotoCircle') ? (
                                <Badge variant="secondary">Coming soon to web app</Badge>
                              ) : null}
                              {item.startsWith('Email newsletter') ? (
                                <Badge variant="secondary">Coming soon to web app</Badge>
                              ) : null}
                            </li>
                          ))}
                          <li className="flex flex-wrap gap-2">
                            <span className="text-primary">•</span>
                            {instagramUrl ? (
                              <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                              >
                                Instagram
                              </a>
                            ) : (
                              <span>Instagram (link coming soon)</span>
                            )}
                          </li>
                          <li className="flex flex-wrap gap-2">
                            <span className="text-primary">•</span>
                            <a
                              href={involvementCenterUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              Involvement Center
                            </a>
                          </li>
                          <li className="flex flex-wrap gap-2">
                            <span className="text-primary">•</span>
                            <a
                              href={`mailto:${contactEmail}`}
                              className="text-primary hover:underline"
                            >
                              {contactEmail}
                            </a>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card id="trips-overview" className="border-border/60 scroll-mt-24">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">Trips overview (general)</h2>
                  </div>
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="overview">
                      <AccordionTrigger>What trips are like</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {tripsOverview.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card id="activity-expectations" className="border-border/60 scroll-mt-24">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">Activity-specific expectations</h2>
                  </div>
                  <Accordion type="multiple" className="w-full">
                    {activityExpectations.map((activity) => (
                      <AccordionItem key={activity.title} value={activity.title}>
                        <AccordionTrigger>{activity.title}</AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {activity.points.map((point) => (
                              <li key={point} className="flex gap-2">
                                <span className="text-primary">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">FAQ</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {faqItems.map((faq) => (
                      <div key={faq.question} className="space-y-2">
                        <p className="text-sm font-medium">{faq.question}</p>
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <Card className="border-border/60">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-base font-semibold">Quick Links</h2>
                    <nav className="space-y-2 text-sm">
                      {tocItems.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="block text-muted-foreground hover:text-foreground"
                        >
                          {item.label}
                        </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardContent className="p-5 space-y-4">
                    <h2 className="text-base font-semibold">Quick Actions</h2>
                    <div className="flex flex-col gap-3">
                      <Button asChild className="rounded-xl">
                        <a href={discordUrl} target="_blank" rel="noreferrer">
                          Join Discord
                        </a>
                      </Button>
                      <Button variant="secondary" asChild className="rounded-xl">
                        <Link href="/membership">Become a Member</Link>
                      </Button>
                      <Button variant="outline" asChild className="rounded-xl">
                        <a href={involvementCenterUrl} target="_blank" rel="noreferrer">
                          Join UNLV Involvement Center org
                        </a>
                      </Button>
                      {instagramUrl ? (
                        <Button variant="ghost" asChild className="rounded-xl">
                          <a href={instagramUrl} target="_blank" rel="noreferrer">
                            Follow Instagram
                          </a>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Instagram (link coming soon)
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}
