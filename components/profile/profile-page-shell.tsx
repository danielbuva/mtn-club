import type { ReactNode } from 'react'

type ProfilePageShellProps = {
  children: ReactNode
}

export function ProfilePageShell({ children }: ProfilePageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pt-16">
        <section className="py-12 px-4 bg-secondary/30 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Profile</h1>
            <p className="text-muted-foreground">Update your member details and preferences.</p>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">{children}</div>
        </section>
      </main>
    </div>
  )
}
