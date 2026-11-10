const buttonClass =
  'flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFECA2]'

export function CoverPager({
  index,
  count,
  previous,
  next,
}: {
  index: number
  count: number
  previous: () => void
  next: () => void
}) {
  return (
    <div
      data-cover-strip
      className="pointer-events-auto absolute bottom-1 left-4 flex items-center text-[13px] text-[#FEF1D0]/80 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] lg:bottom-5 lg:left-6"
    >
      <button
        type="button"
        aria-label="Previous cover"
        onClick={previous}
        className={buttonClass}
      >
        ←
      </button>
      <span aria-hidden="true" className="tabular-nums">
        {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
      </span>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        Cover {index + 1} of {count}
      </span>
      <button
        type="button"
        aria-label="Next cover"
        onClick={next}
        className={buttonClass}
      >
        →
      </button>
    </div>
  )
}
