import { BackButton } from '@/components/back-button'
import { JoinTempPage } from '@/components/join/JoinTempPage'

export default function JoinPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto hidden w-full max-w-3xl px-4 pt-5 md:block">
        <BackButton className="text-xs text-muted-foreground/80" />
      </div>
      <JoinTempPage />
    </main>
  )
}
