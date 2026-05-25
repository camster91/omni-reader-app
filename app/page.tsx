"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

interface Source {
  id: string;
  label: string;
  icon: string;
  category: string;
  active: boolean;
  maxItems: number;
}

interface DigestItem {
  title: string;
  link: string;
  source: string;
}

type Digest = Record<string, DigestItem[]>;

const DEFAULT_SOURCES: Source[] = [
  { id: "news", label: "News", icon: "🌎", category: "News", active: true, maxItems: 5 },
  { id: "tech", label: "Tech", icon: "💻", category: "Tech", active: true, maxItems: 5 },
  { id: "aiml", label: "AI/ML", icon: "🤖", category: "AI/ML", active: true, maxItems: 5 },
  { id: "social", label: "Social", icon: "📱", category: "Social", active: false, maxItems: 5 },
  { id: "dev", label: "Dev", icon: "⚙️", category: "Dev", active: true, maxItems: 5 },
  { id: "freelance", label: "Freelance", icon: "💼", category: "Freelance", active: false, maxItems: 5 },
];

const STORAGE_KEY = "omni-reader-v1";

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

export default function Home() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [selectedSource, setSelectedSource] = useState<string | "all">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [showDone, setShowDone] = useState(false);

  // Load from localStorage
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

  // Save to localStorage
  useEffect(() => {
    const payload = {
      sources,
      done: Array.from(done),
      showDone,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [sources, done, showDone]);

  // Fetch digest
  useEffect(() => {
    fetch("./digest.json")
      .then((r) => r.json())
      .then((data: Digest) => {
        setDigest(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeSources = useMemo(
    () => sources.filter((s) => s.active),
    [sources]
  );

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
    if (confirm("Clear all saved progress?")) {
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
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse h-8 w-48 bg-slate-800 rounded mb-2" />
        <div className="animate-pulse h-4 w-32 bg-slate-800 rounded" />
      </main>
    );
  }

  if (!digest) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Omni Reader</h1>
        <p className="text-slate-400">Failed to load digest.</p>
      </main>
    );
  }

  const allCaughtUp = unreadCount === 0 && totalCount > 0;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Omni Reader</h1>
          <p className="text-sm text-slate-400">
            {allCaughtUp
              ? "All caught up"
              : `${unreadCount} unread${totalCount > unreadCount ? ` / ${totalCount} total` : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          aria-label="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-slate-500">
            Feeds
          </h3>
          <div className="space-y-3">
            {sources.map((src) => {
              const unread =
                (digest[src.category] ?? [])
                  .slice(0, src.maxItems)
                  .filter((i) => !done.has(itemKey(i))).length;
              return (
                <div key={src.id} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSource(src.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      src.active
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {src.icon} {src.label}
                    <span className="ml-1 opacity-70">{unread}</span>
                  </button>
                  {src.active && (
                    <label className="flex items-center gap-2 text-sm text-slate-400 ml-auto">
                      Max
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={src.maxItems}
                        onChange={(e) =>
                          updateMaxItems(src.id, Number(e.target.value))
                        }
                        className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showDone}
                onChange={(e) => setShowDone(e.target.checked)}
                className="accent-indigo-600"
              />
              Show read items
            </label>
            <button
              onClick={clearAll}
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Reset all progress
            </button>
          </div>
        </div>
      )}

      {/* Source pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setSelectedSource("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
            selectedSource === "all"
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
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
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                selectedSource === src.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {src.icon} {src.label}
              {unread > 0 && (
                <span className="ml-1.5 text-xs opacity-80">{unread}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions bar */}
      {filteredItems.length > 0 && !allCaughtUp && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            {selectedSource === "all" ? "All feeds" : activeSources.find((s) => s.id === selectedSource)?.label}
          </span>
          <button
            onClick={markAllDone}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
          >
            Mark all read
          </button>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">{allCaughtUp ? "☕" : "📭"}</div>
            <h2 className="text-lg font-semibold text-slate-300 mb-1">
              {allCaughtUp ? "You're all caught up" : "Nothing here"}
            </h2>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              {allCaughtUp
                ? "Check back after the next digest update."
                : "No unread items matching your filters."}
            </p>
            {allCaughtUp && (
              <button
                onClick={() => {
                  setShowDone(false);
                  setSelectedSource("all");
                }}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition"
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
                    <section key={src.id} className="border-l-2 border-slate-800 pl-4">
                      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>{src.icon}</span> {src.label}
                      </h2>
                      <ul className="space-y-2">
                        {items.map(({ item, key }) => {
                          const isDone = done.has(key);
                          return (
                            <li key={key}>
                              <div className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                                isDone
                                  ? "bg-slate-900/30 border-slate-800/50 opacity-50"
                                  : "bg-slate-900/60 border-slate-800 hover:border-indigo-500/30"
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => markDone(key)}
                                  className="mt-1 accent-indigo-600 shrink-0"
                                />
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener"
                                  className="flex-1 min-w-0"
                                >
                                  <div className={`font-medium leading-snug ${isDone ? "line-through text-slate-500" : "text-slate-200"}`}>
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                    <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                                      {item.source}
                                    </span>
                                  </div>
                                </a>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })
              : (
                <ul className="space-y-2">
                  {filteredItems.map(({ item, key, source }) => {
                    const isDone = done.has(key);
                    return (
                      <li key={key}>
                        <div className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                          isDone
                            ? "bg-slate-900/30 border-slate-800/50 opacity-50"
                            : "bg-slate-900/60 border-slate-800 hover:border-indigo-500/30"
                        }`}>
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => markDone(key)}
                            className="mt-1 accent-indigo-600 shrink-0"
                          />
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener"
                            className="flex-1 min-w-0"
                          >
                            <div className={`font-medium leading-snug ${isDone ? "line-through text-slate-500" : "text-slate-200"}`}>
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                              <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                                {item.source}
                              </span>
                              {source && (
                                <span className="text-slate-600">{source.icon} {source.label}</span>
                              )}
                            </div>
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
          </>
        )}

        {/* End marker */}
        {filteredItems.length > 0 && !allCaughtUp && (
          <div className="text-center pt-6 pb-2">
            <div className="inline-flex items-center gap-3 text-slate-600 text-xs uppercase tracking-widest">
              <span className="h-px w-12 bg-slate-700" />
              End
              <span className="h-px w-12 bg-slate-700" />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
