'use client'

import Link from 'next/link'
import { Instagram, Mail, Mountain, Twitter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MemberCTA } from '@/components/member-cta'

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
                <Mountain className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg tracking-tight">UNLV Mountain Club</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Building community through outdoor adventure. Join us on the trail.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-xl bg-transparent" asChild>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="outline" size="icon" className="rounded-xl bg-transparent" asChild>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="outline" size="icon" className="rounded-xl bg-transparent" asChild>
                <a href="mailto:hello@mountainclub.com" aria-label="Email">
                  <Mail className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Trip Calendar
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Our Team
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4">Membership</h3>
            <ul className="space-y-3">
              <li className="empty:hidden">
                <MemberCTA variant="link" />
              </li>
              <li>
                <Link href="/membership#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/membership#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Member Benefits
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get trip announcements and outdoor tips.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="rounded-xl"
              />
              <Button type="submit" className="rounded-xl shrink-0">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} UNLV Mountain Club. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
