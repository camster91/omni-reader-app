"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
interface Source {
  id: string; label: string; category: string;
  active: boolean; maxItems: number; color: string;
}
interface Item { title: string; link: string; source: string; }
type Digest = Record<string, Item[]>;
const SOURCES: Source[] = [
  { id: "news", label: "World", category: "News", active: true, maxItems: 5, color: "#22c55e" },
  { id: "tech", label: "Tech", category: "Tech", active: true, maxItems: 5, color: "#3b82f6" },
  { id: "aiml", label: "AI", category: "AI/ML", active: true, maxItems: 5, color: "#8b5cf6" },
  { id: "dev", label: "Dev", category: "Dev", active: true, maxItems: 5, color: "#f59e0b" },
  { id: "social", label: "Social", category: "Social", active: false, maxItems: 5, color: "#ec4899" },
  { id: "freelance", label: "Work", category: "Freelance", active: false, maxItems: 5, color: "#14b8a6" },
];
const STORAGE = "omni-reader-v3";
function hash(str: string) { let h = 0; for (let c of str) h = ((h << 5) - h + c.charCodeAt(0)) | 0; return String(h); }
function itemKey(item: Item) { return hash(item.title + item.link); }
function unreadCount(src: Source, digest: Digest, read: Set<string>, showRead: boolean) {
  const items = (digest[src.category] ?? []).slice(0, src.maxItems);
  if (showRead) return items.length;
  return items.filter((i) => !read.has(itemKey(i))).length;
}
export default function Home() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<Source[]>(SOURCES);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string | "all">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showRead, setShowRead] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      if (saved.sources) setSources(saved.sources);
      if (saved.read) setRead(new Set(saved.read));
      if (saved.showRead != null) setShowRead(saved.showRead);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ sources, read: [...read], showRead }));
  }, [sources, read, showRead]);
  useEffect(() => {
    fetch("./digest.json")
      .then((r) => r.json())
      .then((data: Digest) => { setDigest(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  const active = useMemo(() => sources.filter((s) => s.active), [sources]);
  const visible = useMemo(() => {
    if (!digest) return [];
    const out: { source: Source; item: Item; key: string }[] = [];
    for (const src of active) {
      for (const item of (digest[src.category] ?? []).slice(0, src.maxItems)) {
        out.push({ source: src, item, key: itemKey(item) });
      }
    }
    return showRead ? out : out.filter((i) => !read.has(i.key));
  }, [digest, active, showRead, read]);
  const filtered = useMemo(() => {
    if (filter === "all") return visible;
    const src = active.find((s) => s.id === filter);
    if (!src || !digest) return [];
    const items = (digest[src.category] ?? [])
      .slice(0, src.maxItems)
      .map((item) => ({ source: src, item, key: itemKey(item) }));
    return showRead ? items : items.filter((i) => !read.has(i.key));
  }, [filter, visible, active, digest, showRead, read]);
  const unread = visible.filter((i) => !read.has(i.key)).length;
  const total = visible.length;
  const allDone = unread === 0 && total > 0;
  const toggleRead = useCallback((id: string) => {
    setRead((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const markAll = useCallback(() => {
    setRead((prev) => {
      const next = new Set(prev);
      for (const i of filtered) next.add(i.key);
      return next;
    });
  }, [filtered]);
  const reset = useCallback(() => { if (confirm("Reset all progress?")) setRead(new Set()); }, []);
  const toggleSource = useCallback((id: string) => {
    setSources((s) => s.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
  }, []);
  const setMax = useCallback((id: string, n: number) => {
    setSources((s) => s.map((x) => (x.id === id ? { ...x, maxItems: n } : x)));
  }, []);
  if (loading) {
    return (
      <main className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </main>
    );
  }
  if (!digest) {
    return (
      <main className="min-h-screen bg-[#030712] flex items-center justify-center text-center">
        <div>
          <div className="text-4xl mb-3 opacity-40">📡</div>
          <h1 className="text-xl font-semibold text-slate-300 mb-1">No signal</h1>
          <p className="text-sm text-slate-500">Couldnt load digest data.</p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-[#030712] pb-12">
      <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Omni Reader</h1>
            <p className="text-[11px] text-slate-500 font-medium">{allDone ? "All caught up" : `${unread} unread`}</p>
          </div>
          <button
            onClick={() => setSettingsOpen((s) => !s)}
            className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition"
          >
            {settingsOpen ? "Close" : "Feeds"}
          </button>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 pt-4">
      {settingsOpen && (
          <div className="mb-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Feeds</span>
              <button onClick={reset} className="text-xs text-red-400/70 hover:text-red-400 transition">Reset</button>
            </div>
            <div className="space-y-2">
              {sources.map((src) => (
                <div key={src.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                  <button
                    onClick={() => toggleSource(src.id)}
                    className={`w-8 h-8 rounded-md text-sm flex items-center justify-center shrink-0 font-medium transition ${src.active ? "" : "opacity-30 grayscale"}`}
                    style={{ backgroundColor: src.active ? `${src.color}18` : undefined, color: src.active ? src.color : undefined }}
                  >
                    {src.label[0]}
                  </button>
                  <span className="text-sm text-slate-300 flex-1">{src.label}</span>
                  {src.active && (
                    <input
                      type="number" min={1} max={20} value={src.maxItems}
                      onChange={(e) => setMax(src.id, Number(e.target.value))}
                      className="w-12 bg-black/30 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-300 text-center"
                    />
                  )}
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm text-slate-400 cursor-pointer select-none">
              <input type="checkbox" checked={showRead} onChange={(e) => setShowRead(e.target.checked)} className="accent-indigo-500" />
              Show read
            </label>
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
              filter === "all" ? "bg-white text-black" : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border border-white/[0.06]"
            }`}
          >
            All
          </button>
          {active.map((src) => (
            <button
              key={src.id}
              onClick={() => setFilter(src.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
                filter === src.id ? "text-white" : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border border-white/[0.06]"
              }`}
              style={filter === src.id ? { backgroundColor: src.color, boxShadow: `0 0 12px ${src.color}40` } : undefined}
            >
              {src.label}
              <span className="text-xs opacity-80">{unreadCount(src, digest, read, showRead)}</span>
            </button>
          ))}
        </div>
        {filtered.length > 0 && !allDone && (
          <div className="flex items-center justify-between mb-4 px-0.5">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              {filter === "all" ? "Everything" : active.find((s) => s.id === filter)?.label}
            </span>
            <button
              onClick={markAll}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition px-2 py-1 rounded hover:bg-indigo-500/10"
            >
              Mark all read
            </button>
          </div>
        )}
        <div className="space-y-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3">{allDone ? "☕" : "📭"}</div>
              <div className="text-slate-300 font-medium mb-1">{allDone ? "All caught up" : "Nothing here"}</div>
              <p className="text-sm text-slate-500">{allDone ? "Check back after the next digest update." : "No items match your filters."}</p>
              {allDone && (
                <button
                  onClick={() => { setShowRead(false); setFilter("all"); }}
                  className="mt-4 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-sm text-slate-300"
                >
                  Show read items
                </button>
              )}
            </div>
          ) : filter === "all" ? (
            active.map((src) => {
              const items = (digest[src.category] ?? [])
                .slice(0, src.maxItems)
                .map((item) => ({ item, key: itemKey(item) }))
                .filter((i) => showRead || !read.has(i.key));
              if (items.length === 0) return null;
              return (
                <section key={src.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: src.color, boxShadow: `0 0 6px ${src.color}` }} />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">{src.label}</span>
                    <div className="flex-1 h-px bg-white/[0.03]" />
                  </div>
                  <div className="space-y-2">
                    {items.map(({ item, key }, i) => (
                      <StoryCard key={key} item={item} source={src} isRead={read.has(key)} delay={i * 40} onToggle={() => toggleRead(key)} />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="space-y-2">
              {filtered.map(({ item, key, source }, i) => (
                <StoryCard key={key} item={item} source={source} isRead={read.has(key)} delay={i * 40} onToggle={() => toggleRead(key)} />
              ))}
            </div>
          )}
        {filtered.length > 0 && !allDone && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-3 text-slate-700 text-[10px] font-semibold uppercase tracking-[0.2em]">
                <span className="h-px w-6 bg-slate-800" />
                End
                <span className="h-px w-6 bg-slate-800" />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
function StoryCard({
  item, source, isRead, delay, onToggle,
}: {
  item: Item; source: Source; isRead: boolean; delay: number; onToggle: () => void;
}) {
  return (
    <div className="animate-fade-up group" style={{ animationDelay: `${delay}ms` }}>
      <div
        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
          isRead
            ? "bg-white/[0.015] border-white/[0.03] opacity-35"
            : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]"
        }`}
        onClick={() => window.open(item.link, "_blank", "noopener,noreferrer")}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors duration-150 ${
            isRead ? "bg-indigo-500 border-indigo-500" : "border-slate-600 hover:border-indigo-400 bg-transparent"
          }`}
          aria-label={isRead ? "Mark unread" : "Mark read"}
        >
          {isRead && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-[15px] leading-snug mb-0.5 ${isRead ? "line-through text-slate-600" : "text-slate-200"}`}>
            {item.title}
          </div>
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${source.color}14`, color: source.color }}
          >
            {item.source}
          </span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className="text-slate-600 shrink-0 mt-1 opacity-0 group-hover:opacity-60 transition-opacity"
        >
          <path d="M7 17L17 7M7 7h10v10" />
        </svg>
      </div>
    </div>
  );
}
