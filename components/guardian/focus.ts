/** After errors render, move focus to the first invalid control in the form. */
export function focusFirstError(root: HTMLElement | null) {
  requestAnimationFrame(() => {
    const found = root?.querySelector<HTMLElement>(
      '[aria-invalid="true"], [data-invalid="true"]',
    )
    // A flagged wrapper (like the waiver reader) hands focus to its control.
    const target = found?.matches('[data-invalid="true"]')
      ? found.querySelector<HTMLElement>('button, input, textarea')
      : found
    target?.focus()
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

/** Moves focus to the new step's heading so screen readers announce it. */
export function focusStepHeading() {
  // Two frames: transitions may commit the new step after the first one.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('[data-step-heading]')
      heading?.focus({ preventScroll: true })
      window.scrollTo({ top: 0 })
    }),
  )
}
