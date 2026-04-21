export default function Loading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f3ea_0%,#faf8f4_45%,#ffffff_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-12 w-72 animate-pulse rounded-full bg-zinc-200/80" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-52 animate-pulse rounded-[2rem] bg-zinc-200/80" />
          <div className="h-52 animate-pulse rounded-[2rem] bg-zinc-200/80" />
          <div className="h-52 animate-pulse rounded-[2rem] bg-zinc-200/80" />
        </div>
      </div>
    </main>
  );
}
