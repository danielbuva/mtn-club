import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MembershipBenefits } from './membership-benefits'
import { MembershipFaq } from './membership-faq'
import { MembershipHero } from './membership-hero'
import { activeFaqs, memberPerks } from './membership-data'
import type { Viewer } from '@/lib/auth/viewer'
import { ManageBillingButton } from './manage-billing-button'

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type StatusRowProps = {
  label: string
  value: string
}

function StatusRow({ label, value }: StatusRowProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

type MembershipActiveProps = {
  viewer: Viewer
}

export function MembershipActive({ viewer }: MembershipActiveProps) {
  const member = viewer.member
  const memberSince = formatDate(member?.joinedOn)
  const expiresAt = formatDate(member?.expiresAt)
  const renewalLabel = member?.autoRenew ? 'Renews on' : 'Expires on'
  const renewalValue = member?.expiresAt ? expiresAt : 'N/A'
  const autoRenewValue =
    member?.autoRenew === null || member?.autoRenew === undefined
      ? 'N/A'
      : member.autoRenew
        ? 'On'
        : 'Off'
  const roleLabel =
    member?.role && member.role !== 'regular' ? member.role : 'Member'

  return (
    <main className="flex-1 pt-16">
      <MembershipHero
        badge="Membership Active"
        title="Welcome back"
        description="Your membership unlocks upcoming trips, resources, and the community."
      />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-secondary/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Membership Status</CardTitle>
                <Badge variant="secondary">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your membership is active and ready for your next adventure.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatusRow label="Status" value="Active" />
                <StatusRow label="Member since" value={memberSince} />
                <StatusRow label={renewalLabel} value={renewalValue} />
                <StatusRow
                  label="Auto-renew"
                  value={autoRenewValue}
                />
                <StatusRow label="Role" value={roleLabel} />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-xl">
                  <Link href="/profile">View Profile</Link>
                </Button>
                <Button variant="outline" className="rounded-xl bg-transparent" asChild>
                  <Link href="/coming-soon">Browse Trips (Coming Soon)</Link>
                </Button>
                <ManageBillingButton className="rounded-xl bg-transparent" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <MembershipBenefits
        eyebrow="Your Perks"
        title="Your Membership Perks"
        description="Everything you already have access to as an active member."
        benefits={memberPerks}
      />

      <MembershipFaq
        eyebrow="FAQ"
        title="Member Questions"
        description="Quick answers to common membership questions."
        faqs={activeFaqs}
      />

      <section className="py-24 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Plan your next trip
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Browse upcoming adventures and RSVP when you're ready to hit the trail.
          </p>
          <Button size="lg" variant="secondary" className="rounded-xl text-lg px-8" asChild>
            <Link href="/coming-soon">Browse Trips (Coming Soon)</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
