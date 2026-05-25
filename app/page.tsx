"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

interface Source {
  id: string;
  label: string;
  icon: string;
  category: string;
  active: boolean;
  maxItems: number;
  color: string;
}

interface DigestItem {
  title: string;
  link: string;
  source: string;
}

type Digest = Record<string, DigestItem[]>;

const DEFAULT_SOURCES: Source[] = [
  { id: "news", label: "World", icon: "🌍", category: "News", active: true, maxItems: 5, color: "#22c55e" },
  { id: "tech", label: "Tech", icon: "🔷", category: "Tech", active: true, maxItems: 5, color: "#3b82f6" },
  { id: "aiml", label: "AI", icon: "◆", category: "AI/ML", active: true, maxItems: 5, color: "#8b5cf6" },
  { id: "dev", label: "Dev", icon: "⚡", category: "Dev", active: true, maxItems: 5, color: "#f59e0b" },
  { id: "social", label: "Social", icon: "●", category: "Social", active: false, maxItems: 5, color: "#ec4899" },
  { id: "freelance", label: "Work", icon: "▲", category: "Freelance", active: false, maxItems: 5, color: "#14b8a6" },
];

const STORAGE_KEY = "omni-reader-v2";

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function itemKey(item: DigestItem) {
  return hash(item.title + item.link);
}

function ProgressRing({
  total,
  done,
}: {
  total: number;
  done: number;
}) {
  const pct = total === 0 ? 0 : (done / total) * 100;
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="#6366f1"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-300">
        {Math.round(pct)}%
      </div>
    </div>
  );
}

export default function Home() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [selectedSource, setSelectedSource] = useState<string | "all">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sources) setSources(parsed.sources);
        if (parsed.done) setDone(new Set(parsed.done));
        if (parsed.showDone !== undefined) setShowDone(parsed.showDone);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const payload = { sources, done: Array.from(done), showDone };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [sources, done, showDone]);

  useEffect(() => {
    fetch("./digest.json")
      .then((r) => r.json())
      .then((data: Digest) => {
        setDigest(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeSources = useMemo(() => sources.filter((s) => s.active), [sources]);

  const allItems = useMemo(() => {
    if (!digest) return [];
    const out: { source: Source; item: DigestItem; key: string }[] = [];
    for (const src of activeSources) {
      const items = digest[src.category] ?? [];
      const slice = items.slice(0, src.maxItems);
      for (const item of slice) {
        out.push({ source: src, item, key: itemKey(item) });
      }
    }
    return out;
  }, [digest, activeSources]);

  const filteredItems = useMemo(() => {
    if (selectedSource === "all") {
      return showDone ? allItems : allItems.filter((i) => !done.has(i.key));
    }
    const src = activeSources.find((s) => s.id === selectedSource);
    if (!src || !digest) return [];
    const items = (digest[src.category] ?? [])
      .slice(0, src.maxItems)
      .map((item) => ({ source: src, item, key: itemKey(item) }));
    return showDone ? items : items.filter((i) => !done.has(i.key));
  }, [allItems, selectedSource, activeSources, digest, done, showDone]);

  const unreadCount = useMemo(
    () => allItems.filter((i) => !done.has(i.key)).length,
    [allItems, done]
  );

  const totalCount = allItems.length;
  const doneCount = done.size;

  const markDone = useCallback((key: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const markAllDone = useCallback(() => {
    setDone((prev) => {
      const next = new Set(prev);
      for (const i of filteredItems) next.add(i.key);
      return next;
    });
  }, [filteredItems]);

  const clearAll = useCallback(() => {
    if (confirm("Reset all progress?")) {
      setDone(new Set());
    }
  }, []);

  const toggleSource = useCallback((id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  }, []);

  const updateMaxItems = useCallback((id: string, n: number) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, maxItems: n } : s))
    );
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          <div className="text-sm text-slate-500 font-medium">Loading digest...</div>
        </div>
      </main>
    );
  }

  if (!digest) {
    return (
      <main className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 opacity-50">📡</div>
          <h1 className="text-xl font-semibold text-slate-300 mb-2">No signal</h1>
          <p className="text-sm text-slate-500">Couldnt load digest data.</p>
        </div>
      </main>
    );
  }

  const allCaughtUp = unreadCount === 0 && totalCount > 0;

  return (
    <main className="min-h-screen bg-[#030712] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Omni Reader</h1>
              <p className="text-xs text-slate-500 font-medium">
                {allCaughtUp
                  ? "All caught up"
                  : `${unreadCount} unread`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProgressRing total={totalCount} done={doneCount} />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                showSettings
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
              aria-label="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.8 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.8 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.8a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/50 border border-white/[0.06] shadow-xl shadow-black/20">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Feeds</h3>
                <button
                  onClick={clearAll}
                  className="text-xs font-medium text-red-400/80 hover:text-red-400 transition"
                >
                  Reset progress
                </button>
              </div>
              <div className="space-y-3">
                {sources.map((src) => {
                  const unread =
                    (digest[src.category] ?? [])
                      .slice(0, src.maxItems)
                      .filter((i) => !done.has(itemKey(i))).length;
                  return (
                    <div
                      key={src.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition"
                    >
                      <button
                        onClick={() => toggleSource(src.id)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                          src.active
                            ? "shadow-lg"
                            : "opacity-40 grayscale"
                        }`}
                        style={{
                          backgroundColor: src.active ? `${src.color}20` : undefined,
                          color: src.active ? src.color : undefined,
                        }}
                      >
                        {src.icon}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">{src.label}</span>
                          {src.active && unread > 0 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                              {unread}
                            </span>
                          )}
                        </div>
                        {!src.active && (
                          <span className="text-xs text-slate-600">Paused</span>
                        )}
                      </div>
                      {src.active && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-medium">Max</span>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={src.maxItems}
                            onChange={(e) => updateMaxItems(src.id, Number(e.target.value))}
                            className="w-14 bg-black/30 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-sm text-slate-300 text-center focus:outline-none focus:border-indigo-500/50 transition"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <label className="flex items-center gap-2.5 text-sm text-slate-400 cursor-pointer select-none">
                  <div className={`w-9 h-5 rounded-full transition-all duration-200 ${showDone ? "bg-indigo-600" : "bg-slate-700"} relative`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${showDone ? "translate-x-4" : ""}`} />
                  </div>
                  <input
                    type="checkbox"
                    checked={showDone}
                    onChange={(e) => setShowDone(e.target.checked)}
                    className="sr-only"
                  />
                  Show read items
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Source Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedSource("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              selectedSource === "all"
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-slate-200"
            }`}
          >
            All
          </button>
          {activeSources.map((src) => {
            const unread =
              (digest[src.category] ?? [])
                .slice(0, src.maxItems)
                .filter((i) => !done.has(itemKey(i))).length;
            return (
              <button
                key={src.id}
                onClick={() => setSelectedSource(src.id)}
                className={`shrink-0 pl-3 pr-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  selectedSource === src.id
                    ? "shadow-lg text-white"
                    : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-slate-200"
                }`}
                style={
                  selectedSource === src.id
                    ? { backgroundColor: src.color, boxShadow: `0 4px 20px ${src.color}30` }
                    : undefined
                }
              >
                <span className="text-sm opacity-80">{src.icon}</span>
                {src.label}
                {unread > 0 && (
                  <span className="ml-0.5 text-xs font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mark all bar */}
        {filteredItems.length > 0 && !allCaughtUp && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {selectedSource === "all" ? "Everything" : activeSources.find((s) => s.id === selectedSource)?.label}
            </span>
            <button
              onClick={markAllDone}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
            >
              Mark all read
            </button>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className={`text-5xl mb-5 ${allCaughtUp ? "grayscale opacity-40" : ""}`}>
                {allCaughtUp ? "☕" : "📭"}
              </div>
              <h2 className="text-lg font-semibold text-slate-200 mb-1">
                {allCaughtUp ? "All caught up" : "Nothing here"}
              </h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                {allCaughtUp
                  ? "Check back after the next digest update."
                  : "No items matching your filters."}
              </p>
              {allCaughtUp && (
                <button
                  onClick={() => {
                    setShowDone(false);
                    setSelectedSource("all");
                  }}
                  className="mt-5 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-sm font-medium text-slate-300 transition"
                >
                  Show read items
                </button>
              )}
            </div>
          ) : (
            <>
              {selectedSource === "all"
                ? activeSources.map((src) => {
                    const items = (digest[src.category] ?? [])
                      .slice(0, src.maxItems)
                      .map((item) => ({ item, key: itemKey(item) }))
                      .filter((i) => showDone || !done.has(i.key));
                    if (items.length === 0) return null;
                    return (
                      <section key={src.id}>
                        <div className="flex items-center gap-2.5 mb-3 pl-0.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: src.color, boxShadow: `0 0 8px ${src.color}60` }}
                          />
                          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                            {src.label}
                          </h2>
                          <div className="flex-1 h-px bg-white/[0.03]" />
                        </div>
                        <div className="space-y-2">
                          {items.map(({ item, key }, idx) => {
                            const isDone = done.has(key);
                            return (
                              <div
                                key={key}
                                className="group animate-fade-up"
                                style={{ animationDelay: `${idx * 50}ms` }}
                              >
                                <div
                                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                    isDone
                                      ? "bg-white/[0.02] border-white/[0.03] opacity-40"
                                      : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-lg hover:shadow-black/20"
                                  }`}
                                  onClick={() => window.open(item.link, "_blank", "noopener,noreferrer")}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markDone(key);
                                    }}
                                    className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 transition-all duration-150 flex items-center justify-center ${
                                      isDone
                                        ? "bg-indigo-500 border-indigo-500"
                                        : "border-slate-600 hover:border-indigo-400 bg-transparent"
                                    }`}
                                  >
                                    {isDone && (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`font-medium text-[15px] leading-snug mb-1 ${
                                        isDone ? "line-through text-slate-600" : "text-slate-200"
                                      }`}
                                    >
                                      {item.title}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                        style={{
                                          backgroundColor: `${src.color}15`,
                                          color: src.color,
                                        }}
                                      >
                                        {item.source}
                                      </span>
                                    </div>
                                  </div>
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-slate-600 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <path d="M7 17L17 7" />
                                    <path d="M7 7h10v10" />
                                  </svg>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })
                : (
                  <div className="space-y-2">
                    {filteredItems.map(({ item, key, source }, idx) => {
                      const isDone = done.has(key);
                      return (
                        <div
                          key={key}
                        className="group animate-fade-up"
                        style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div
                            className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                              isDone
                                ? "bg-white/[0.02] border-white/[0.03] opacity-40"
                                : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-lg hover:shadow-black/20"
                            }`}
                            onClick={() => window.open(item.link, "_blank", "noopener,noreferrer")}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markDone(key);
                              }}
                              className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 transition-all duration-150 flex items-center justify-center ${
                                isDone
                                  ? "bg-indigo-500 border-indigo-500"
                                  : "border-slate-600 hover:border-indigo-400 bg-transparent"
                              }`}
                            >
                              {isDone && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div
                                className={`font-medium text-[15px] leading-snug mb-1 ${
                                  isDone ? "line-through text-slate-600" : "text-slate-200"
                                }`}
                              >
                                {item.title}
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                  style={{
                                    backgroundColor: source ? `${source.color}15` : undefined,
                                    color: source?.color,
                                  }}
                                >
                                  {item.source}
                                </span>
                              </div>
                            </div>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-slate-600 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <path d="M7 17L17 7" />
                              <path d="M7 7h10v10" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </>
          )}

          {/* End state */}
          {filteredItems.length > 0 && !allCaughtUp && (
            <div className="text-center py-10">
              <div className="inline-flex items-center gap-3 text-slate-700 text-xs font-medium uppercase tracking-[0.2em]">
                <span className="h-px w-8 bg-slate-800" />
                End
                <span className="h-px w-8 bg-slate-800" />
              </div>
            </div>
          )}
        </div>
      </div>

    </main>
  );
}
