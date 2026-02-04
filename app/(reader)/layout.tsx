export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen text-foreground">{children}</div>
}
