"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-6xl p-10 space-y-4">
      <h1 className="text-xl font-semibold text-red-400">Something went wrong</h1>
      <p className="text-sm text-zinc-400">
        {error.message || "The hub hit an unexpected error."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-700"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900"
        >
          Back to Overview
        </a>
      </div>
    </main>
  );
}
