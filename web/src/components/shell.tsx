import Link from "next/link";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/kdp", label: "KDP" },
  { href: "/freelance", label: "Freelance" },
  { href: "/orchestrator", label: "Orchestrator" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/timeline", label: "Timeline" },
];

export function Nav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-lg px-3 py-1.5 ${
            active === l.label
              ? "bg-zinc-800 font-medium"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  sub,
  active,
}: {
  title: string;
  sub: string;
  active: string;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-xs text-zinc-500">{sub}</p>
      </div>
      <Nav active={active} />
    </header>
  );
}

export function ApiOffline() {
  return (
    <main className="p-10">
      <h1 className="text-xl font-semibold text-red-400">Hub API offline</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Start it with:{" "}
        <code className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs">
          cd backend && uvicorn api:app --port 8787
        </code>
      </p>
    </main>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
      {children}
    </h2>
  );
}
