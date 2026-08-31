import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, NeedsProfile } from "@/components/intelliplay/shell";
import { useProfile } from "@/lib/intelliplay/store";
import { getStoredMemories, type MemoryItem } from "@/lib/intelliplay/memoryVault";

export const Route = createFileRoute("/memories")({
  head: () => ({
    meta: [
      { title: "Family Memories Vault — MindWeave" },
      {
        name: "description",
        content: "Personal family photos, relations, and warm memory flashcards for elderly users.",
      },
    ],
  }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const { profile, ready } = useProfile();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [activeMemory, setActiveMemory] = useState<MemoryItem | null>(null);

  useEffect(() => {
    const loaded = getStoredMemories();
    setMemories(loaded);
    if (loaded.length > 0) setActiveMemory(loaded[0]!);
  }, []);

  if (!ready) {
    return (
      <AppShell>
        <div className="panel p-8 text-center font-display text-xl">Loading Memories…</div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <NeedsProfile />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="panel p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">🖼️ Family & Personal Memories</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse photo flashcards of loved ones, warm stories, and start personalized memory recall exercises.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/play/memory"
              className="toy-press rounded-full bg-primary px-6 py-3 font-display text-base font-bold text-primary-foreground shadow-soft"
            >
              🧠 Start Memory Game
            </Link>
            <Link
              to="/caregiver"
              className="toy-press rounded-full border-2 border-border px-5 py-3 font-display text-sm font-bold"
            >
              🛡️ Caregiver Manager
            </Link>
          </div>
        </div>

        {/* Featured Memory Flashcard & Gallery */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Memory Preview Flashcard */}
          {activeMemory && (
            <div className="panel p-6 lg:col-span-2 space-y-5 animate-pop">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted border-2 border-border shadow-soft">
                <img
                  src={activeMemory.photoUrl}
                  alt={activeMemory.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-4 left-4 rounded-full bg-black/60 backdrop-blur-md px-4 py-1.5 font-display text-sm font-bold text-white shadow-md">
                  {activeMemory.relation}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-3xl font-bold">{activeMemory.name}</h2>
                  {activeMemory.location && (
                    <span className="text-sm font-bold text-muted-foreground">
                      📍 {activeMemory.location}
                    </span>
                  )}
                </div>

                {activeMemory.interests && activeMemory.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeMemory.interests.map((interest: string) => (
                      <span
                        key={interest}
                        className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold"
                      >
                        ❤️ {interest}
                      </span>
                    ))}
                  </div>
                )}

                {activeMemory.notes && (
                  <div className="rounded-2xl bg-muted/50 p-4 text-base font-medium text-foreground italic border border-border">
                    "{activeMemory.notes}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Memories List / Thumbnail Selector */}
          <div className="panel p-5 space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground">
              Family Members ({memories.length})
            </h3>

            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
              {memories.map((m) => {
                const isSelected = activeMemory?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMemory(m)}
                    className={`toy-press flex items-center gap-3.5 w-full p-3 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <img
                      src={m.photoUrl}
                      alt={m.name}
                      className="size-14 rounded-xl object-cover border border-border shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-base text-foreground truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {m.relation} {m.location ? `· ${m.location}` : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
