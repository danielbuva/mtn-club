import Image from 'next/image'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { ArchiveStamp } from '@/components/editorial/archive-stamp'
import { ContactFrame } from '@/components/editorial/contact-frame'
import { PublicShell } from '@/components/landing/public-shell'
import { publicationDateline } from '@/lib/editorial/editions'
import type { PublicGalleryPhoto } from '@/lib/gallery/queries'
import { type GalleryRoll, groupIntoRolls } from '@/lib/gallery/rolls'

export function GalleryPage({ children }: { children: React.ReactNode }) {
  return (
    <PublicShell>
      <PageViewTracker eventName="gallery_view" />
      <section className="public-page-top bg-background px-5 pb-16 text-foreground sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-5xl">{children}</div>
      </section>
    </PublicShell>
  )
}

function GalleryHeader({ newestRoll }: { newestRoll?: GalleryRoll }) {
  const newestDatedPhoto = newestRoll?.photos.find(photo => photo.taken_on)
  const dateline =
    newestRoll?.label !== 'Undated' && newestDatedPhoto?.taken_on
      ? publicationDateline(new Date(newestDatedPhoto.taken_on))
      : 'Undated'

  return (
    <header
      className={
        newestRoll ? 'pb-8' : 'border-b-4 border-double border-border pb-8'
      }
    >
      <div>
        <p className="font-brand text-[13px] uppercase tracking-[0.14em] text-muted-foreground">
          {newestRoll ? `Club archive · ${dateline}` : 'Club gallery'}
        </p>
        <h1 className="mt-3 max-w-3xl font-brand text-5xl font-bold uppercase leading-[0.92] sm:text-7xl">
          The days outside are worth remembering.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          The club&apos;s archive of real climbing, hiking, camping,
          backpacking, and snow-trip moments.
        </p>
      </div>
    </header>
  )
}

const photoDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

function GalleryContactSheet({ roll }: { roll: GalleryRoll }) {
  return (
    <section aria-labelledby={`roll-${roll.id}`}>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-y border-border py-3">
        <h2
          id={`roll-${roll.id}`}
          className="font-brand text-2xl font-bold uppercase"
        >
          Roll {roll.number}
        </h2>
        <p className="font-brand text-lg uppercase tracking-wide">
          {roll.label}
        </p>
        <p className="ml-auto font-brand text-[13px] uppercase tracking-[0.14em] text-muted-foreground">
          {roll.photos.length} {roll.photos.length === 1 ? 'frame' : 'frames'}
        </p>
      </div>
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
        {roll.photos.map((photo, index) => {
          const wide =
            roll.photos.length !== 2 &&
            (index === 0 ||
              (index === roll.photos.length - 1 && index % 2 === 1))
          const date = photo.taken_on ? new Date(photo.taken_on) : null
          return (
            <div key={photo.id} className={wide ? 'sm:col-span-2' : undefined}>
              <ContactFrame
                number={`${roll.number}-${photo.frameNumber}`}
                title={photo.title}
                meta={
                  date && Number.isFinite(date.getTime()) ? (
                    <time dateTime={photo.taken_on ?? undefined}>
                      {photoDate.format(date)}
                    </time>
                  ) : undefined
                }
                caption={photo.caption}
              >
                <Image
                  src={photo.imageUrl}
                  alt={photo.alt_text}
                  width={1200}
                  height={wide ? 800 : 900}
                  unoptimized={photo.unoptimized}
                  sizes={
                    wide
                      ? '(min-width: 1088px) 1024px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)'
                      : '(min-width: 1088px) 502px, (min-width: 640px) calc((100vw - 84px) / 2), calc(100vw - 40px)'
                  }
                  className={`w-full bg-muted object-cover ${wide ? 'aspect-3/2' : 'aspect-4/3'}`}
                />
              </ContactFrame>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function GalleryPhotoCollection({
  photos,
}: {
  photos: PublicGalleryPhoto[]
}) {
  const rolls = groupIntoRolls(photos)

  return (
    <>
      <GalleryHeader newestRoll={rolls[0]} />
      {rolls.length > 0 ? (
        <div className="mt-12 space-y-14 sm:space-y-20">
          {rolls.map(roll => (
            <GalleryContactSheet key={roll.id} roll={roll} />
          ))}
        </div>
      ) : (
        <GalleryStatus />
      )}
    </>
  )
}

function GalleryStatus({ error = false }: { error?: boolean }) {
  return (
    <div className="mt-12 grid min-h-96 place-items-center border border-border bg-[#FFFCF4] px-6 py-14 text-center dark:bg-card">
      <div className="max-w-lg">
        {error && <ArchiveStamp>Developing</ArchiveStamp>}
        <h2
          className={`${error ? 'mt-8 ' : ''}font-brand text-4xl font-bold uppercase sm:text-5xl`}
        >
          {error
            ? 'Trip photos are temporarily unavailable.'
            : 'No photos yet.'}
        </h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          {error
            ? "We couldn't load the photo archive. Refresh the page in a minute."
            : 'Trip photos land here after each outing.'}
        </p>
        {error && (
          <a
            href="/gallery"
            className="mt-6 inline-flex min-h-11 items-center justify-center border border-foreground bg-foreground px-6 font-brand font-bold uppercase tracking-wide text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Refresh
          </a>
        )}
      </div>
    </div>
  )
}

export function GalleryUnavailable() {
  return (
    <>
      <GalleryHeader />
      <GalleryStatus error />
    </>
  )
}
