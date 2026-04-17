"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Presentation } from "@/lib/types";
import PresentationCard from "@/components/PresentationCard";
import presentationsData from "@/data/presentations.json";

const presentations = presentationsData as Presentation[];

function buildTagCounts(items: Presentation[]): Record<string, number> {
  const counts: Record<string, number> = {};
  items.forEach((p) => p.tags.forEach((t) => (counts[t] = (counts[t] ?? 0) + 1)));
  return counts;
}

export default function GalleryPage() {
  const [query, setQuery] = useState("");
  const tagCounts = useMemo(() => buildTagCounts(presentations), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presentations;
    return presentations.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs tracking-widest uppercase text-text-muted mb-2">公開</p>
        <h1 className="text-4xl font-black mb-4">瀏覽公開簡報</h1>
        <Link
          href="/"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          ← 返回首頁
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋標題、摘要或關鍵字…"
          className="w-full border border-gray-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#111111] transition-colors"
        />
      </div>

      <div className="mb-10">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">
          熱門關鍵字
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="text-xs border border-gray-200 px-3 py-1 rounded-full hover:border-[#111111] hover:bg-surface transition-colors"
              >
                {tag} ({count})
              </button>
            ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-text-muted">
          <p className="text-lg mb-2">找不到相關簡報</p>
          <button
            onClick={() => setQuery("")}
            className="text-sm underline hover:text-text-secondary"
          >
            清除搜尋
          </button>
        </div>
      )}
    </div>
  );
}
