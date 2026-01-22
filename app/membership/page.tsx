'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Calendar, Camera, Check, CreditCard, Lock, MessageSquare, Shield, Ticket, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { createCheckoutSession } from './actions'

const benefits = [
  {
    icon: Ticket,
    title: 'Access to Upcoming Trips',
    description: 'Unlock access to upcoming trips in our Trips Calendar to sign up for adventures.',
  },
  {
    icon: Calendar,
    title: 'Access to Guidebook Library',
    description: 'Explore our extensive library of guidebooks covering trails, safety tips, and gear reviews.',
  },
  {
    icon: MessageSquare,
    title: 'Gear Room',
    description: 'Borrow essential outdoor gear from our Gear Room for your adventures.',
  },
  {
    icon: Camera,
    title: 'Trip Photo Archives',
    description: 'Access our complete library of professional trip photos and download high-resolution images.',
  },
  {
    icon: Users,
    title: 'Bring a Guest',
    description: 'Members can bring one guest per quarter to experience a trip before joining.',
  },
  {
    icon: Shield,
    title: 'Trip Insurance',
    description: 'Basic trip cancellation coverage included with your membership.',
  },
]

const faqs = [
  {
    question: 'What happens after I join?',
    answer: 'After completing checkout, you will receive a welcome email with instructions to set up your member profile, join our Discord community, and start RSVPing to trips. Your membership is active immediately.',
  },
  {
    question: 'How do I participate in a trip?',
    answer: 'Once you are a member, you can browse our Trips Calendar and RSVP for upcoming trips. You will receive email reminders with trip details a few days before the event. Just show up at the designated meeting point ready for adventure!',
  },
  {
    question: 'Can I cancel my membership?',
    answer: 'Yes, you can cancel your membership at any time. Your benefits will remain active until the end of your billing period. We do not offer prorated refunds, but you are welcome to rejoin at any time.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'We offer a full refund within 14 days of purchase if you have not attended any trips. After attending a trip or after 14 days, membership fees are non-refundable.',
  },
  {
    question: 'Are trips included in the membership fee?',
    answer: 'Membership gives you access to RSVP for trips. Most trips are free, but some special adventures (multi-day trips, workshops with instructors) may have additional costs that are clearly listed.',
  },
  {
    question: 'What safety measures do you have?',
    answer: 'All trip leaders are trained in wilderness first aid. We carry emergency communication devices on all trips and maintain detailed safety protocols. Participants must sign a liability waiver before each trip.',
  },
  {
    question: 'Am I required to go on a specific number of trips every year?',
    answer: 'No, there is no minimum trip requirement. You can join as many or as few trips as you like during your membership period.',
  },
]

export default function MembershipPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [autoRenew, setAutoRenew] = useState(true)

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const result = await createCheckoutSession()
      if (result.success && result.url) {
        // In production, redirect to Stripe checkout
        // window.location.href = result.url
        alert('Checkout initiated! In production, this would redirect to Stripe.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&h=1080&fit=crop"
              alt="Mountain landscape"
              fill
              sizes="100vw"
              className="object-cover opacity-10"
            />
          </div>
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">Limited Time Offer</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              Join Mountain Club
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unlock access to our Upcoming Events, our Guidebook Library, Gear Room, and a community of outdoor enthusiasts who share your passion.
            </p>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="py-12 px-4">
          <div className="max-w-lg mx-auto">
            <Card className="border-primary/20 shadow-xl overflow-hidden">
              <div className="bg-primary text-primary-foreground p-6 text-center">
                <h2 className="font-semibold text-lg mb-1">Annual Membership</h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">$25</span>
                  <span className="text-primary-foreground/80">/year</span>
                </div>
              </div>
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  {[
                    'Access to Upcoming Trips in our Trips Calendar',
                    'Access to Guidebook Library',
                    'Access to Gear Room',
                    'Bring a guest once per quarter',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Auto-renew toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary mb-6">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="auto-renew" className="text-sm font-medium cursor-pointer">
                      Auto-renew annually
                    </Label>
                  </div>
                  <Switch
                    id="auto-renew"
                    checked={autoRenew}
                    onCheckedChange={setAutoRenew}
                  />
                </div>

                {/* Checkout button */}
                <Button
                  size="lg"
                  className="w-full rounded-xl text-lg gap-2"
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      Checkout
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                {/* Payment methods */}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Visa, Mastercard, Amex, Apple Pay, Google Pay
                  </span>
                </div>

                {/* Security note */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>Secure checkout powered by Stripe</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="py-24 px-4 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">Member Perks</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-balance">
                What You Get
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Your membership unlocks a full suite of benefits designed to enhance your outdoor experience.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="p-6 bg-card border-border/50 hover:border-primary/20 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-balance">
                Common Questions
              </h2>
              <p className="text-muted-foreground">
                Everything you need to know about becoming a member.
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-2xl px-6 data-[state=open]:bg-secondary/30"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Ready to Start Your Adventure?
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Join 200+ members exploring the best of the West Coast. Your next adventure is waiting.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-xl text-lg px-8 gap-2"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              Join Now for $25/year
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
