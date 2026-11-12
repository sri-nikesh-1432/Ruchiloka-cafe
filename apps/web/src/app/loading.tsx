export default function GlobalLoading() {
  return (
    <div className="pt-36 pb-24 editorial-container">
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-full bg-beige" />
        <div className="h-64 animate-pulse rounded-[2rem] border border-beige-border bg-ivory" />
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-3xl border border-beige-border bg-ivory"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
