import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useProfile } from "@/lib/intelliplay/store";
import {
  SKILLS,
  SKILL_LABELS,
  type RoundResult,
  type SkillKey,
} from "@/lib/intelliplay/types";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, updateAccessibility } = useProfile();
  const acc = profile?.accessibility;
  const isHighContrast = acc?.highContrast ?? false;
  const fontSize = acc?.fontSize ?? "medium";

  // Apply font-size scaling class to <html> so all rem units scale globally
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("font-size-medium", "font-size-large", "font-size-extra-large");
    html.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);

  // Apply high-contrast and dark classes to <html> for global contrast overrides
  useEffect(() => {
    const html = document.documentElement;
    if (isHighContrast) {
      html.classList.add("high-contrast", "dark");
    } else {
      html.classList.remove("high-contrast", "dark");
    }
  }, [isHighContrast]);

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-200 bg-background text-foreground",
        isHighContrast && "high-contrast dark",
      )}
    >
      {/* Top Accessibility Bar */}
      <div className="bg-muted/80 border-b border-border py-1.5 px-4 text-xs font-semibold text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span>🧠 Cognitive & Memory Assistance</span>
          <span className="opacity-40">•</span>
          <span>Care Level: <strong className="text-foreground capitalize">{profile?.careLevel ?? "guided"}</strong></span>
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateAccessibility({ highContrast: !isHighContrast })}
            className="hover:text-foreground underline transition-colors"
          >
            {isHighContrast ? "☀️ Light Mode" : "👁️ High Contrast (Dark)"}
          </button>
          <button
            onClick={() => {
              const next = fontSize === "medium" ? "large" : fontSize === "large" ? "extra-large" : "medium";
              updateAccessibility({ fontSize: next });
            }}
            className="hover:text-foreground underline transition-colors"
          >
            🔤 Font Size ({fontSize})
          </button>
        </div>
      </div>

      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center" aria-label="MindWeave Home">
          <img
            src={logoImg}
            alt="MindWeave"
            className="h-auto w-32 sm:w-36 md:w-40 object-contain transition-transform hover:scale-102"
            width={160}
            height={90}
          />
        </Link>
        <nav className="flex items-center gap-2 text-base font-bold">
          <Link
            to="/"
            className="rounded-full px-4 py-2 hover:bg-muted transition-colors"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-card border-2 border-border shadow-soft" }}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className="rounded-full px-4 py-2 hover:bg-muted transition-colors"
            activeProps={{ className: "bg-card border-2 border-border shadow-soft" }}
          >
            Activity Summary
          </Link>
          <Link
            to="/memories"
            className="rounded-full px-4 py-2 hover:bg-muted transition-colors"
            activeProps={{ className: "bg-card border-2 border-border shadow-soft" }}
          >
            🖼️ Memories
          </Link>
          <Link
            to="/reminders"
            className="rounded-full px-4 py-2 hover:bg-muted transition-colors"
            activeProps={{ className: "bg-card border-2 border-border shadow-soft" }}
          >
            💊 Reminders
          </Link>
          <Link
            to="/caregiver"
            className="rounded-full px-4 py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
            activeProps={{ className: "bg-primary text-primary-foreground font-bold shadow-soft" }}
          >
            🛡️ Caregiver Portal
          </Link>
          <ProfileShortcut />
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">{children}</main>
    </div>
  );
}

/** Top-right profile shortcut and quick account menu. */
export function ProfileShortcut() {
  const { profile, signOut, user, ready } = useProfile();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!ready) return null;

  if (!user) {
    return (
      <Link
        to="/login"
        className="toy-press ml-1 rounded-full bg-primary px-5 py-2.5 text-base font-bold text-primary-foreground shadow-soft"
      >
        Sign in
      </Link>
    );
  }

  if (!profile) {
    return (
      <div ref={wrapRef} className="relative ml-1">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Open account menu"
          className="toy-press flex items-center gap-2 rounded-full border-2 border-border bg-card py-1.5 px-4 shadow-soft text-base font-bold"
        >
          <span>👤 {user.email?.split("@")[0] || "Account"}</span>
        </button>
        {open ? (
          <div className="panel animate-pop absolute right-0 z-50 mt-2 w-52 p-3 text-left">
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
                navigate({ to: "/login" });
              }}
              className="toy-press mt-3 block w-full rounded-full border border-destructive/40 bg-destructive/10 px-3 py-2 text-center font-display text-xs font-bold text-destructive"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div ref={wrapRef} className="relative ml-1">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open profile"
        className="toy-press flex items-center gap-2.5 rounded-full border-2 border-border bg-card py-1 pl-1.5 pr-4 shadow-soft"
      >
        <div className="size-9 rounded-full bg-primary/20 text-primary font-display font-bold flex items-center justify-center text-sm">
          {initials}
        </div>
        <span className="font-display text-base font-bold">{profile.name}</span>
      </button>

      {open ? (
        <div className="panel animate-pop absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] p-5 text-left space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-14 rounded-full bg-primary/20 text-primary font-display font-bold flex items-center justify-center text-xl ring-4 ring-primary/20">
              {initials}
            </div>
            <div>
              <p className="font-display text-xl font-bold">{profile.name}</p>
              <p className="text-xs font-bold text-muted-foreground capitalize">
                Care Level: {profile.careLevel}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Cognitive Profile Summary
            </p>
            <div className="space-y-2">
              {SKILLS.slice(0, 4).map((s) => (
                <SkillBar key={s} skill={s} value={profile.skills[s]} />
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <Link
              to="/caregiver"
              onClick={() => setOpen(false)}
              className="toy-press block w-full rounded-full bg-primary/10 border border-primary/30 px-4 py-2.5 text-center font-display text-sm font-bold text-primary"
            >
              🛡️ Caregiver Portal
            </Link>
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
                navigate({ to: "/login" });
              }}
              className="toy-press block w-full rounded-full border-2 border-border bg-card px-4 py-2.5 text-center font-display text-sm font-bold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SkillBar({ skill, value }: { skill: SkillKey; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm font-bold">
        <span>{SKILL_LABELS[skill]}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3.5 py-2.5">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-lg font-bold text-foreground mt-0.5">{value}</div>
    </div>
  );
}

export function GameHeader({
  title,
  emoji,
  skills,
  note,
  params,
}: {
  title: string;
  emoji: string;
  skills: string;
  note?: string | null;
  params: { label: string; value: string }[];
}) {
  return (
    <div className="panel animate-pop mb-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            {emoji} {title}
          </h1>
          <p className="text-sm text-muted-foreground">Focuses on {skills}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {params.map((p) => (
            <span
              key={p.label}
              className="rounded-full bg-muted px-3 py-1 text-xs font-bold"
            >
              {p.label}: {p.value}
            </span>
          ))}
        </div>
      </div>
      {note ? (
        <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-foreground">
          🤖 {note}
        </p>
      ) : null}
    </div>
  );
}

export function RoundSummary({
  result,
  onAgain,
}: {
  result: RoundResult;
  onAgain: () => void;
  confidence?: { label: string; confidence: number };
}) {
  const router = useRouter();
  return (
    <div className="panel animate-pop mt-5 p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-success/15 text-success">
          <span className="text-3xl">🌟</span>
        </div>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold">{result.feedback}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comfortable pace · Keep up the wonderful practice
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label="Accuracy"
          value={`${Math.round(result.metrics.accuracy * 100)}%`}
        />
        <Stat label="Duration" value={`${result.metrics.timeTaken.toFixed(0)}s`} />
        <Stat label="Hints Used" value={result.metrics.hintsUsed} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 pt-2">
        <button
          onClick={onAgain}
          className="toy-press rounded-full bg-primary px-6 py-3 font-display text-lg font-bold text-primary-foreground shadow-soft"
        >
          Try another round
        </button>
        <button
          onClick={() => router.navigate({ to: "/" })}
          className="toy-press rounded-full border-2 border-border bg-card px-6 py-3 font-display text-lg font-bold"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}

/** Dignified completion overlay shown on session finish. */
export function GameWinOverlay({
  show,
  onNextGame,
}: {
  show: boolean;
  onNextGame: () => void;
}) {
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="panel animate-pop max-w-md w-full p-8 text-center space-y-5 bg-card">
        <div className="size-20 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center text-4xl">
          🌟
        </div>
        <div>
          <h2 className="font-display text-3xl font-bold">Wonderful Work Today</h2>
          <p className="mt-2 text-muted-foreground text-base">
            You completed your cognitive activity. Every session helps keep the mind sharp and active!
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={onNextGame}
            className="toy-press w-full rounded-full bg-primary py-3.5 font-display text-lg font-bold text-primary-foreground shadow-soft"
          >
            Next Activity
          </button>
          <button
            onClick={() => navigate({ to: "/" })}
            className="toy-press w-full rounded-full border-2 border-border bg-card py-3 font-display text-lg font-bold"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export function NeedsProfile() {
  return (
    <div className="panel animate-pop p-8 text-center max-w-lg mx-auto my-12">
      <h1 className="font-display text-2xl font-bold">
        Welcome to MindWeave
      </h1>
      <p className="mt-2 text-muted-foreground">
        Please set up a profile to personalize orientation, memory assistance, and cognitive activities.
      </p>
      <Link
        to="/"
        className="toy-press mt-6 inline-block rounded-full bg-primary px-8 py-3.5 font-display text-lg font-bold text-primary-foreground shadow-soft"
      >
        Set Up Patient Profile
      </Link>
    </div>
  );
}
