import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

type MembershipHeroProps = {
  badge: string
  title: string
  description: string
}

export function MembershipHero({ badge, title, description }: MembershipHeroProps) {
  return (
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
        <Badge variant="secondary" className="mb-4">
          {badge}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      </div>
    </section>
  )
}
