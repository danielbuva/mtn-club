import { Compass, Flag, Heart, Mail, Map, Shield } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TeamCard } from '@/components/team-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { teamMembers } from '@/lib/data'

const roles = [
  {
    icon: Flag,
    title: 'Trip Lead',
    description: 'Responsible for overall trip planning, navigation, and group management. Sets the pace and makes go/no-go decisions.',
  },
  {
    icon: Compass,
    title: 'Sweep',
    description: 'Stays at the back of the group to ensure no one falls behind. Assists slower hikers and handles rear communications.',
  },
  {
    icon: Shield,
    title: 'First Aid',
    description: 'Certified in wilderness first aid. Carries the group first aid kit and responds to any medical situations.',
  },
  {
    icon: Map,
    title: 'Route Planning',
    description: 'Scouts routes in advance, identifies hazards, and prepares detailed trip itineraries with backup options.',
  },
]

export default function TeamPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-24 px-4 bg-secondary/30">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Our Team</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-4 text-balance">
              Meet the People Behind the Adventures
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our leadership team brings decades of combined outdoor experience, certifications, and a shared passion for building community.
            </p>
          </div>
        </section>

        {/* Team Grid */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <TeamCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        </section>

        {/* Safety & Roles */}
        <section className="py-24 px-4 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">Trip Safety</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-balance">
                Safety Roles & Responsibilities
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every trip has designated roles to ensure a safe and enjoyable experience for all participants.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {roles.map((role) => (
                <Card key={role.title} className="p-6 bg-card border-border/50">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <role.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{role.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{role.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Join Leadership CTA */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Heart className="w-10 h-10 text-primary" />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 text-balance">
                      Interested in Joining Leadership?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      We are always looking for passionate, experienced outdoor enthusiasts to join our team. Leadership roles include trip leads, workshop instructors, and community organizers.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Button size="lg" className="rounded-xl gap-2" asChild>
                        <a href="mailto:leadership@mountainclub.com">
                          <Mail className="w-4 h-4" />
                          Apply to Lead
                        </a>
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        or email leadership@mountainclub.com
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
