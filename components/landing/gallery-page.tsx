import { Images } from 'lucide-react'
import Image from 'next/image'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { PublicShell } from '@/components/landing/public-shell'
import type { PublicGalleryPhoto } from '@/lib/gallery/queries'

export function GalleryPage({ children }: { children: React.ReactNode }) {
  return (
    <PublicShell>
      <PageViewTracker eventName="gallery_view" />
      <section className="public-page-top px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <p className="font-brand text-sm uppercase tracking-[0.2em] text-[#6A5146]">
            Club gallery
          </p>
          <h1 className="mt-3 max-w-3xl font-brand text-5xl uppercase leading-[0.92] sm:text-7xl">
            The days outside are worth remembering.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#211D18]/70">
            The club&apos;s archive of real climbing, hiking, camping,
            backpacking, and snow-trip moments.
          </p>

          {children}
        </div>
      </section>
    </PublicShell>
  )
}

export function GalleryPhotoCollection({
  photos,
}: {
  photos: PublicGalleryPhoto[]
}) {
  if (photos.length > 0) {
    return (
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map(photo => (
          <figure
            key={photo.id}
            className="overflow-hidden border border-[#211D18]/25 bg-[#E9DDC3]"
          >
            <Image
              src={photo.imageUrl}
              alt={photo.alt_text}
              width={1200}
              height={900}
              unoptimized={photo.unoptimized}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="aspect-square w-full border-b border-[#211D18]/25 object-cover"
            />
            <figcaption className="p-5">
              <h2 className="font-brand text-2xl uppercase">{photo.title}</h2>
              {photo.caption && (
                <p className="mt-2 text-sm leading-6 text-[#211D18]/65">
                  {photo.caption}
                </p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-12 grid min-h-96 place-items-center border border-[#211D18]/30 bg-[#E9DDC3]/55 px-6 py-14 text-center">
      <div className="max-w-lg">
        <span className="mx-auto flex size-16 items-center justify-center bg-[#211D18] text-[#FFECA2]">
          <Images className="size-8" aria-hidden="true" />
        </span>
        <h2 className="mt-6 font-brand text-4xl uppercase sm:text-5xl">
          Trip photos are temporarily unavailable.
        </h2>
        <p className="mt-4 leading-7 text-[#211D18]/65">
          Please try again in a moment.
        </p>
      </div>
    </div>
  )
}
