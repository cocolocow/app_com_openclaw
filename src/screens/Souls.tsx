import { useState, useEffect, useCallback } from "react";
import { useNodStore } from "../store/nodStore";
import {
  useClawSouls,
  type SoulListItem,
  type SoulBundle,
  type SoulCategory,
} from "../hooks/useClawSouls";

const CATEGORY_EMOJI: Record<string, string> = {
  lifestyle: "🌿",
  work: "💼",
  creative: "🎨",
  education: "📚",
  professional: "👔",
  writing: "✍️",
  development: "💻",
  engineering: "⚙️",
  business: "📊",
  devops: "🚀",
  health: "🩺",
  marketing: "📣",
  technology: "🔧",
  language: "🌍",
  security: "🔒",
  design: "🎯",
  robot: "🤖",
  personal: "🧠",
  general: "✨",
  assistant: "🤝",
};

function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "🔮";
}

export function Souls() {
  const { activeSoul, setCurrentScreen } = useNodStore();
  const { fetchSouls, fetchBundle, fetchCategories, installSoul, removeSoul, loading } =
    useClawSouls();

  const [souls, setSouls] = useState<SoulListItem[]>([]);
  const [categories, setCategories] = useState<SoulCategory[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [selectedSoul, setSelectedSoul] = useState<SoulBundle | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {});
  }, [fetchCategories]);

  // Load souls on mount and when filters change
  const loadSouls = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const list = await fetchSouls({
        q: query || undefined,
        category: activeCategory,
      });
      setSouls(list);
    } catch {
      setError("Failed to load souls");
    } finally {
      setLoadingList(false);
    }
  }, [fetchSouls, query, activeCategory]);

  useEffect(() => {
    loadSouls();
  }, [loadSouls]);

  // Search with debounce
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSelect = useCallback(
    async (soul: SoulListItem) => {
      setLoadingDetail(true);
      try {
        const bundle = await fetchBundle(soul.owner, soul.name);
        setSelectedSoul(bundle);
      } catch {
        setError("Failed to load soul details");
      } finally {
        setLoadingDetail(false);
      }
    },
    [fetchBundle],
  );

  const handleInstall = useCallback(async () => {
    if (!selectedSoul) return;
    const result = await installSoul(selectedSoul.owner, selectedSoul.name);
    if (result.success) {
      setSelectedSoul(null);
    } else {
      setError(result.error ?? "Install failed");
    }
  }, [selectedSoul, installSoul]);

  const handleRemove = useCallback(async () => {
    await removeSoul();
  }, [removeSoul]);

  const isActive = (soul: { owner: string; name: string }) =>
    activeSoul?.owner === soul.owner && activeSoul?.name === soul.name;

  // Detail view
  if (selectedSoul) {
    const soulMd = selectedSoul.files?.["SOUL.md"] ?? "";
    const { manifest } = selectedSoul;
    return (
      <div className="h-dvh flex flex-col bg-bg-primary">
        <header className="bg-bg-secondary border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedSoul(null)}
            className="w-9 h-9 rounded-full bg-bubble-ai flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold truncate">
              {categoryEmoji(manifest.category)} {manifest.displayName}
            </h1>
            <p className="text-xs text-text-secondary truncate">
              {selectedSoul.owner}/{selectedSoul.name} v{selectedSoul.version}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-text-secondary">{manifest.description}</p>

          <div className="flex flex-wrap gap-2">
            {manifest.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-bubble-ai text-xs text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>

          {soulMd && (
            <div className="bg-bg-secondary rounded-xl p-4">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                SOUL.md
              </h2>
              <pre className="text-xs text-text-primary whitespace-pre-wrap break-words font-mono leading-relaxed">
                {soulMd}
              </pre>
            </div>
          )}

          <div className="flex gap-2 text-xs text-text-secondary">
            <span className="capitalize">{categoryEmoji(manifest.category)} {manifest.category}</span>
          </div>
        </div>

        <div className="sticky bottom-0 bg-bg-secondary border-t border-border p-3">
          {isActive(selectedSoul) ? (
            <button
              type="button"
              onClick={handleRemove}
              className="w-full py-3 rounded-xl bg-status-error/20 text-status-error font-semibold text-sm"
            >
              Remove Soul
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInstall}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-bubble-user text-white font-semibold text-sm disabled:opacity-40"
            >
              {loading ? "Installing..." : "Install Soul"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="h-dvh flex flex-col bg-bg-primary">
      <header className="bg-bg-secondary border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setCurrentScreen("chat")}
          className="w-9 h-9 rounded-full bg-bubble-ai flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft />
        </button>
        <h1 className="text-base font-semibold">Souls</h1>
      </header>

      {/* Active soul banner */}
      {activeSoul && (
        <div className="mx-4 mt-3 bg-bubble-user/10 border border-bubble-user/30 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-bubble-user font-semibold">Active</p>
            <p className="text-sm text-text-primary truncate">{activeSoul.displayName}</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-status-error px-3 py-1 rounded-lg bg-status-error/10"
          >
            Remove
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-4 pt-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search souls..."
          className="w-full bg-bubble-ai text-text-primary placeholder-text-secondary rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bubble-user/50"
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
          <CategoryChip
            label="All"
            active={!activeCategory}
            onClick={() => setActiveCategory(undefined)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.name}
              label={`${categoryEmoji(cat.name)} ${cat.name}`}
              count={cat.count}
              active={activeCategory === cat.name}
              onClick={() =>
                setActiveCategory(activeCategory === cat.name ? undefined : cat.name)
              }
            />
          ))}
        </div>
      )}

      {/* Soul list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {error && (
          <p className="text-sm text-status-error text-center py-4">{error}</p>
        )}

        {loadingList && (
          <p className="text-sm text-text-secondary text-center py-8">Loading...</p>
        )}

        {!loadingList && !error && souls.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">No souls found</p>
        )}

        {souls.map((soul) => (
          <SoulCard
            key={`${soul.owner}/${soul.name}`}
            soul={soul}
            active={isActive(soul)}
            disabled={loadingDetail}
            onSelect={() => handleSelect(soul)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-bubble-user text-white"
          : "bg-bubble-ai text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
      {count != null && (
        <span className="ml-1 opacity-60">{count}</span>
      )}
    </button>
  );
}

const CATEGORY_COLOR: Record<string, string> = {
  development: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  engineering: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  creative: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  writing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  education: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  lifestyle: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  work: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  professional: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  business: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  personal: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

function categoryColor(category: string): string {
  return CATEGORY_COLOR[category.toLowerCase()] ?? "bg-white/10 text-text-secondary border-white/10";
}

function SoulCard({
  soul,
  active,
  disabled,
  onSelect,
}: {
  soul: SoulListItem;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="w-full text-left bg-bg-secondary rounded-xl p-4 hover:bg-white/5 transition-colors disabled:opacity-50 border border-transparent hover:border-border"
    >
      {/* Row 1: Avatar + Name + Verified */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-bubble-ai flex items-center justify-center text-xl shrink-0">
          {categoryEmoji(soul.category)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold truncate">
              {soul.displayName}
              {active && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-bubble-user/20 text-bubble-user align-middle">
                  ACTIVE
                </span>
              )}
            </h3>
            {soul.scanScore != null && (
              <span className={`shrink-0 text-[11px] font-medium ${
                soul.scanStatus === "pass" ? "text-status-connected" : "text-status-connecting"
              }`}>
                ✅ Verified {soul.scanScore}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {soul.owner}/{soul.name}
          </p>
        </div>
      </div>

      {/* Row 2: Description */}
      <p className="text-xs text-text-secondary mt-2.5 line-clamp-2 leading-relaxed">
        {soul.description}
      </p>

      {/* Row 3: Category pill + version + downloads + rating */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${categoryColor(soul.category)}`}>
          {soul.category}
        </span>
        <span className="text-[11px] text-text-secondary">v{soul.version}</span>
        <span className="text-[11px] text-text-secondary">↓ {soul.downloads}</span>
        {soul.avgRating != null && soul.reviewCount > 0 && (
          <span className="text-[11px] text-status-connecting font-medium">
            ★ {soul.avgRating.toFixed(1)} ({soul.reviewCount})
          </span>
        )}
      </div>

      {/* Row 4: Tags */}
      {soul.tags.length > 0 && (
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {soul.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Row 5: Install command bar */}
      <div className="mt-3 bg-bg-primary rounded-lg px-3 py-2 flex items-center justify-between border border-border">
        <code className="text-[11px] text-bubble-user truncate">
          npx clawsouls install {soul.owner}/{soul.name}
        </code>
      </div>
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
