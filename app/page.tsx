"use client";

import { useEffect, useState } from "react";

interface DigestItem {
  title: string;
  link: string;
  source: string;
}

interface Digest {
  [key: string]: DigestItem[];
}

const emoji: Record<string, string> = {
  News: "🌎",
  Tech: "💻",
  "AI/ML": "🤖",
  Social: "📱",
  Dev: "⚙️",
  Freelance: "💼",
};

const categories = ["News", "Tech", "AI/ML", "Social", "Dev", "Freelance"];

export default function Home() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("./digest.json")
      .then((r) => r.json())
      .then((data) => {
        setDigest(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  const total = Object.values(digest).reduce((a, b) => a + b.length, 0);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-1">Omni Reader</h1>
      <p className="text-slate-400 mb-6">
        {total} stories across {categories.length} categories
      </p>

      <div className="space-y-6">
        {categories.map((cat) => {
          const items = digest[cat] ?? [];
          if (!items.length) return null;

          return (
            <section key={cat} className="border-l-2 border-slate-700 pl-4">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-slate-200">
                <span>{emoji[cat] || "📌"}</span> {cat}
              </h2>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i}>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener"
                      className="block p-3 rounded-lg hover:bg-slate-900/80 border border-transparent hover:border-slate-800 transition"
                    >
                      <div className="font-medium leading-snug">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded">{item.source}</span>
                        {item.link && (
                          <span className="truncate max-w-[16rem]">{item.link}</span>
                        )}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
