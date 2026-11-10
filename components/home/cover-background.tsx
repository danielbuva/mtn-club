import Image from 'next/image'
import type { Cover } from '@/components/home/covers'

export function CoverBackground({
  cover,
  priority,
  isMd,
}: {
  cover: Cover
  priority: boolean
  isMd: boolean
}) {
  return (
    <Image
      src={cover.src}
      alt={cover.alt}
      fill
      priority={priority}
      sizes="100vw"
      className="object-cover"
      style={{
        objectPosition: isMd ? cover.posDesktop : cover.posMobile,
        transform: `scale(${isMd ? cover.scaleDesktop : cover.scaleMobile})`,
        transformOrigin: isMd ? cover.originDesktop : cover.originMobile,
      }}
    />
  )
}
