import Image from 'next/image'
import type { aboutPhotos } from '@/lib/gallery/about-photos'

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="space-y-3">
      <p className="font-brand text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-brand text-4xl font-bold uppercase leading-none md:text-5xl"
      >
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}

export function AboutPhoto({
  photo,
  caption,
  hero = false,
  activity = false,
}: {
  photo: (typeof aboutPhotos)['hero']
  caption?: string
  hero?: boolean
  activity?: boolean
}) {
  return (
    <figure className="min-w-0">
      <div
        className={`relative overflow-hidden ${hero ? 'aspect-4/3 md:aspect-[2/1]' : 'aspect-4/3'} ${activity ? 'border-b border-border' : 'border border-border'}`}
      >
        <Image
          src={photo.imageUrl}
          alt={photo.alt_text}
          unoptimized={photo.unoptimized}
          fill
          sizes={
            hero
              ? '(min-width: 1280px) 1152px, 100vw'
              : activity
                ? '(min-width: 1024px) 25vw, 50vw'
                : '(min-width: 768px) 50vw, 100vw'
          }
          className={`object-cover ${hero ? 'object-[40%_70%]' : ''}`}
          priority={hero}
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
