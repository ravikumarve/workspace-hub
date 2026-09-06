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
          className={`rounded-[6px] px-3 py-1.5 transition-colors duration-150 ${
            active === l.label
              ? "bg-[rgba(255,255,255,0.08)] text-[var(--linear-ink)] font-medium"
              : "text-[var(--linear-ink-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--linear-ink)]"
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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--linear-border)] pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: "-0.704px", fontFeatureSettings: '"cv01","ss03"' }}>{title}</h1>
        <p className="mt-1 text-xs text-[var(--linear-ink-faint)]">{sub}</p>
      </div>
      <Nav active={active} />
    </header>
  );
}

export function ApiOffline() {
  return (
    <main className="p-10">
      <h1 className="text-xl font-semibold text-red-400">Hub API offline</h1>
      <p className="mt-2 text-sm text-[var(--linear-ink-muted)]">
        Start it with:{" "}
        <code className="rounded bg-[var(--linear-surface)] border border-[var(--linear-border)] px-2 py-1 font-mono text-xs">
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
      className={`rounded-[8px] border border-[var(--linear-border)] bg-[rgba(255,255,255,0.02)] p-5 shadow-[var(--shadow,none)] ${className}`}
      style={{ boxShadow: "rgba(0,0,0,0.2) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px" }}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--linear-ink-muted)]" style={{ letterSpacing: "0.08em" }}>
      {children}
    </h2>
  );
}

export function CommandBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-[var(--linear-border)] bg-[var(--linear-panel)] p-2">
      {children}
    </div>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = "ghost",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "primary" | "subtle";
  disabled?: boolean;
}) {
  const base = "rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50";
  const cls =
    variant === "primary"
      ? "bg-[var(--linear-accent)] text-white hover:bg-[var(--linear-accent-hover)]"
      : variant === "subtle"
        ? "bg-[rgba(255,255,255,0.04)] text-[var(--linear-ink-soft)] border border-[var(--linear-border)]"
        : "bg-[rgba(255,255,255,0.02)] text-[var(--linear-ink-soft)] border border-[var(--linear-border-subtle)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--linear-ink)]";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}
