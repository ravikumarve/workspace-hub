export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6 animate-pulse">
      <div className="h-10 rounded-lg bg-zinc-900" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-900" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-zinc-900" />
        <div className="h-64 rounded-xl bg-zinc-900" />
      </div>
    </main>
  );
}
