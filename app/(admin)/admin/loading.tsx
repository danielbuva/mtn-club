export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-5 py-8 sm:px-8 lg:py-10">
      <div className="h-4 w-28 bg-[#E9DDC3]" />
      <div className="mt-3 h-12 w-72 bg-[#E9DDC3]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map(item => (
          <div key={item} className="h-28 bg-[#E9DDC3]" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-80 bg-[#E9DDC3]" />
        <div className="h-80 bg-[#E9DDC3]" />
      </div>
    </div>
  )
}
