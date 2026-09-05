export function TripTitleText({
  title,
  canceled,
}: {
  title: string
  canceled: boolean
}) {
  return canceled ? (
    <s className="decoration-4 decoration-current">{title}</s>
  ) : (
    title
  )
}
