import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 rounded-full"
        asChild
      >
        <Link href="/" aria-label="Back to home">
          <X className="h-4 w-4" />
        </Link>
      </Button>
      {children}
    </div>
  )
}
