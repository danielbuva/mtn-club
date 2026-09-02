type PullQuoteProps = {
  text: string
}

export function PullQuote({ text }: PullQuoteProps) {
  return (
    <blockquote className="border border-border/40 bg-secondary/20 px-6 py-8">
      <p className="text-xl md:text-2xl italic text-foreground">“{text}”</p>
    </blockquote>
  )
}
