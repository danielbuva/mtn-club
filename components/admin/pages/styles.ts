export const mutedText = 'text-[#6A5146] dark:text-muted-foreground'

export const listClass =
  'divide-y divide-[#211D18]/15 border border-[#211D18]/15 bg-[#FFFCF4] dark:divide-border dark:border-border dark:bg-card'

export const noteBoxClass =
  'border border-dashed border-[#211D18]/30 px-4 py-6 text-sm leading-6 dark:border-border'

const actionBase =
  'inline-flex h-11 shrink-0 items-center justify-center gap-1.5 px-3.5 font-brand text-[13px] font-bold uppercase tracking-[0.08em] whitespace-nowrap outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211D18] sm:h-9 dark:focus-visible:outline-[#F8F1DF]'

export const editActionClass = `${actionBase} bg-[#211D18] text-[#FFECA2] hover:bg-[#352E27] dark:border dark:border-[#FFECA2] dark:bg-transparent dark:text-[#FFECA2] dark:hover:bg-[#FFECA2]/10`

export const viewActionClass = `${actionBase} border border-[#211D18]/50 hover:border-[#211D18] dark:border-[#F8F1DF]/50 dark:hover:border-[#F8F1DF]`

export const textLinkClass =
  'font-semibold underline underline-offset-4 outline-none hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211D18] dark:focus-visible:outline-[#F8F1DF]'

/** Keeps the View column the same width whether it holds a button or a note. */
export const viewSlotClass = 'sm:w-24'

export const blockLinkClass =
  'inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#211D18] underline underline-offset-4 outline-none hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211D18] dark:text-[#F8F1DF] dark:focus-visible:outline-[#F8F1DF]'
