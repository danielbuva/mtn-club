'use client'

import { Instagram, Mail, Mountain } from 'lucide-react'
import Link from 'next/link'
import { MemberCTA } from '@/components/member-cta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
              <span className="font-semibold text-lg tracking-tight">
                UNLV Mountain Club
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Building community through outdoor adventure. Join us on the
              trail.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl bg-transparent"
                asChild
              >
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl bg-transparent"
                asChild
              >
                <a
                  href="https://discord.gg/tcrxSQB4"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord"
                >
                  <span className="sr-only">Discord</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M20.317 4.369A19.791 19.791 0 0 0 15.884 3c-.186.332-.393.775-.538 1.129a18.525 18.525 0 0 0-4.692 0A12.355 12.355 0 0 0 10.116 3a19.739 19.739 0 0 0-4.433 1.369C2.86 8.164 2.07 11.83 2.37 15.45a19.92 19.92 0 0 0 5.993 3.063c.48-.654.908-1.348 1.278-2.079a12.901 12.901 0 0 1-2.012-.965c.169-.124.334-.253.496-.387 3.884 1.82 8.086 1.82 11.92 0 .162.134.327.263.496.387-.644.373-1.313.7-2.012.965.37.731.799 1.425 1.278 2.079a19.92 19.92 0 0 0 5.993-3.063c.35-4.36-.6-8.003-3.812-11.081ZM8.959 13.501c-1.07 0-1.952-.993-1.952-2.215s.86-2.215 1.952-2.215c1.093 0 1.974.993 1.953 2.215 0 1.222-.86 2.215-1.953 2.215Zm6.082 0c-1.07 0-1.952-.993-1.952-2.215s.86-2.215 1.952-2.215c1.093 0 1.974.993 1.953 2.215 0 1.222-.86 2.215-1.953 2.215Z"
                    />
                  </svg>
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl bg-transparent"
                asChild
              >
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
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Trips (Coming Soon)
                </Link>
              </li>
              <li>
                <Link
                  href="/team"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Our Team
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
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
                <Link
                  href="/membership#faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/membership#benefits"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
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
            <form className="flex gap-2" onSubmit={e => e.preventDefault()}>
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
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
