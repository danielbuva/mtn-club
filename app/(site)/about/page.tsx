import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { activities, steps, values } from '@/components/about/content'
import { AboutPhoto, SectionHeading } from '@/components/about/feature-parts'
import { MemberCTA } from '@/components/member-cta'
import { aboutPhotos } from '@/lib/gallery/about-photos'

export default function AboutPage() {
  return (
    <main className="public-page-top bg-background px-4 pb-16 text-foreground sm:px-6 md:pb-24">
      <article className="mx-auto max-w-6xl">
        <header className="space-y-7 pb-12 md:pb-20">
          <p className="border-b border-foreground/80 pb-4 font-brand text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            About the club
          </p>
          <h1 className="max-w-5xl font-brand text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            Building community through adventure
          </h1>
          <p className="text-sm text-muted-foreground">
            A feature from the club · Fall 2026
          </p>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <p className="max-w-xl text-lg leading-relaxed md:text-xl">
              UNLV Mountain Club connects outdoor enthusiasts for unforgettable
              experiences in nature.
            </p>
            <Link
              href="/membership-sign-up"
              className="inline-flex min-h-11 items-center py-2 text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 md:shrink-0"
            >
              Become a member →
            </Link>
          </div>
          <AboutPhoto
            photo={aboutPhotos.hero}
            hero
            caption="Time outside, shared with the club."
          />
        </header>

        <section
          aria-labelledby="why-we-exist"
          className="grid gap-8 border-t border-foreground/80 py-10 md:grid-cols-2 md:gap-16 md:py-16"
        >
          <div>
            <SectionHeading
              id="why-we-exist"
              eyebrow="Our story"
              title="Why we exist"
            />
            <div className="mt-6 space-y-5 text-base leading-relaxed">
              <p>
                UNLV Mountain Club was founded in 2018 by a group of friends who
                believed that the outdoors are best experienced together. What
                started as informal weekend hikes has grown into a thriving
                community of over 2,000 members.
              </p>
              <p>
                We exist to make outdoor adventure accessible, safe, and deeply
                communal. Our mission is simple: get more people outside, build
                lasting friendships, and foster a deep respect for the natural
                world.
              </p>
              <blockquote className="border-y border-foreground/60 py-5 font-brand text-3xl font-bold leading-tight text-foreground md:text-4xl">
                Every trail we walk, every peak we summit, and every campfire we
                gather around strengthens our bond with nature and each other.
              </blockquote>
            </div>
          </div>
          <AboutPhoto
            photo={aboutPhotos.story}
            caption="The people who make the adventure."
          />
        </section>

        <section
          aria-labelledby="what-we-do"
          className="border-t border-foreground/80 py-10 md:py-16"
        >
          <SectionHeading
            id="what-we-do"
            eyebrow="Activities"
            title="What we do"
            description="From casual day hikes to technical alpine climbs, we offer a wide range of outdoor experiences for every skill level."
          />
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-6">
            {activities.map(activity => (
              <div
                key={activity.title}
                className="min-w-0 border border-border"
              >
                <AboutPhoto photo={activity.image} activity />
                <div className="space-y-2 p-3 md:p-5">
                  <h3 className="font-brand text-xl font-bold uppercase leading-tight md:text-2xl">
                    {activity.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="our-values"
          className="grid gap-8 border-t border-foreground/80 py-10 md:grid-cols-[1fr_2fr] md:gap-16 md:py-16"
        >
          <SectionHeading
            id="our-values"
            eyebrow="Our principles"
            title="Our values"
            description="These core values guide everything we do, from planning trips to welcoming new members."
          />
          <ul>
            {values.map(value => (
              <li
                key={value.title}
                className="flex gap-5 border-b border-border py-6 first:pt-0 last:border-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-3 size-1.5 shrink-0 bg-muted-foreground"
                />
                <div className="space-y-2">
                  <h3 className="font-brand text-2xl font-bold uppercase">
                    {value.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="how-it-works"
          className="border-t border-foreground/80 py-10 md:py-16"
        >
          <SectionHeading
            id="how-it-works"
            eyebrow="Getting started"
            title="How it works"
            description="Joining Mountain Club is simple. Here is how to get started on your next adventure."
          />
          <ol className="mt-8 grid border-t border-border md:grid-cols-3">
            {steps.map(step => (
              <li
                key={step.number}
                className="space-y-4 border-b border-border py-6 md:border-r md:border-b-0 md:px-6 md:first:pl-0 md:last:border-r-0"
              >
                <span className="font-brand text-5xl font-bold text-muted-foreground">
                  {step.number}
                </span>
                <h3 className="font-brand text-2xl font-bold uppercase">
                  {step.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="join-adventure"
          className="border border-foreground/80 bg-(--editorial-inverse) p-6 text-(--editorial-inverse-foreground) md:p-12"
        >
          <p className="mb-5 border-b border-current/30 pb-3 font-brand text-[13px] uppercase tracking-[0.14em]">
            An open invitation
          </p>
          <h2
            id="join-adventure"
            className="max-w-2xl font-brand text-4xl font-bold uppercase leading-none text-(--editorial-highlight) md:text-6xl"
          >
            Ready to join the adventure?
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed">
            Become a member today for just $25/year and unlock access to all our
            trips, workshops, and community events.
          </p>
          <MemberCTA
            variant="link"
            className="mt-7 inline-flex min-h-11 items-center gap-3 border border-(--editorial-highlight) px-5 py-3 text-sm font-medium text-(--editorial-highlight) hover:text-(--editorial-highlight) focus-visible:outline-2 focus-visible:outline-offset-4"
            icon={<ArrowRight aria-hidden="true" className="size-4" />}
          />
        </section>
      </article>
    </main>
  )
}
