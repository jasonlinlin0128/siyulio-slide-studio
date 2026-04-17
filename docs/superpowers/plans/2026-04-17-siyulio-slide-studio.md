# Siyulio Slide Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 App Router website at slide.siyulio.com that showcases AI-generated presentations, provides a mock 3-step creation wizard, and renders a DESIGN.md page for technical users.

**Architecture:** Static-first Next.js app using App Router. Data comes from a manually maintained `data/presentations.json`. The create wizard is a client-side multi-step form (no backend yet); AI generation is stubbed for future Gemini API hookup. DESIGN.md is read at build time via `fs` and rendered as HTML.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS v3, gray-matter (DESIGN.md frontmatter), react-markdown + remark-gfm (Markdown rendering), next/font (Geist)

---

## File Map

| File | Responsibility |
|------|---------------|
| `app/layout.tsx` | Root layout — NavBar, global font, metadata |
| `app/page.tsx` | Landing Hero (centered CTA × 2 + DESIGN.md micro-link) |
| `app/gallery/page.tsx` | Public gallery grid with search |
| `app/create/page.tsx` | 3-step wizard (topic → style → generate) |
| `app/view/[id]/page.tsx` | Slide viewer (scroll + fullscreen) |
| `app/design/page.tsx` | Reads DESIGN.md, renders as styled HTML |
| `components/NavBar.tsx` | Logo (S icon + Siyulio + Slide Studio) + nav links |
| `components/PresentationCard.tsx` | Gallery card — title, date, tags, Open button |
| `components/CreateWizard.tsx` | Client component for 3-step wizard state |
| `components/SlideViewer.tsx` | Scrollable slide deck + fullscreen toggle |
| `lib/types.ts` | Shared TypeScript interfaces |
| `data/presentations.json` | Manual presentation catalogue |
| `public/slides/` | Placeholder slide HTML files for viewer |

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`, `app/globals.css`

- [ ] **Step 1: Run create-next-app in the project directory**

```bash
cd "C:/Users/user/Desktop/簡報樣板"
npx create-next-app@14 . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-git \
  --yes
```

Expected: Next.js 14 project files appear in current directory alongside existing `DESIGN.md`.

- [ ] **Step 2: Install extra dependencies**

```bash
cd "C:/Users/user/Desktop/簡報樣板"
npm install react-markdown remark-gfm gray-matter
npm install --save-dev @types/node
```

- [ ] **Step 3: Configure Tailwind custom tokens in `tailwind.config.ts`**

Replace the `theme.extend` block:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#FFCC00",
        "text-primary": "#111111",
        "text-secondary": "#555555",
        "text-muted": "#AAAAAA",
        "surface": "#F5F5F5",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Replace `app/globals.css` with minimal base styles**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-white text-text-primary font-sans;
  }
}
```

- [ ] **Step 5: Verify dev server starts**

```bash
cd "C:/Users/user/Desktop/簡報樣板"
npm run dev
```

Expected: Server starts on http://localhost:3000 with default Next.js page.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/user/Desktop/簡報樣板"
git init
git add -A
git commit -m "feat: scaffold Next.js 14 + Tailwind project"
```

---

## Task 2: Shared Types & Data

**Files:**
- Create: `lib/types.ts`
- Create: `data/presentations.json`

- [ ] **Step 1: Create `lib/types.ts`**

```typescript
// lib/types.ts

export interface Presentation {
  id: string;           // URL-safe slug, e.g. "ai-tools-2026"
  title: string;
  summary: string;
  theme: string;        // e.g. "乾淨教育感", "深紫科技感"
  tags: string[];
  createdAt: string;    // ISO 8601 date string
  contributor: string;
  slideCount: number;
  slideHtml?: string;   // Optional: inline HTML for viewer
  externalUrl?: string; // Optional: link to external presentation
}

export type WizardStep = "topic" | "style" | "generate";

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  previewBg: string;
  accentColor: string;
}
```

- [ ] **Step 2: Create `data/presentations.json` with 4 sample entries**

```json
[
  {
    "id": "ai-teaching-tools-2026",
    "title": "用 AI 工具解放你的教學創造力",
    "summary": "從 NotebookLM、Napkin AI 到 Canva Code，帶你走一遍從靈感到課堂簡報的完整 AI 工作流。",
    "theme": "乾淨教育感",
    "tags": ["AI工具", "教師研習", "NotebookLM", "Canva Code", "Napkin AI"],
    "createdAt": "2026-04-17T00:00:00.000Z",
    "contributor": "Siyulio",
    "slideCount": 41,
    "externalUrl": ""
  },
  {
    "id": "notebook-lm-deep-dive",
    "title": "NotebookLM 深度解析：教師必學的 AI 研究助理",
    "summary": "以使用者為中心的研究助理，封閉式語義分析讓幻覺率降到最低，適合教材整理、備課與學生輔助。",
    "theme": "乾淨教育感",
    "tags": ["NotebookLM", "Google AI", "備課", "Podcast", "心智圖"],
    "createdAt": "2026-04-10T00:00:00.000Z",
    "contributor": "Siyulio",
    "slideCount": 20,
    "externalUrl": ""
  },
  {
    "id": "canva-code-interactive",
    "title": "Canva Code：不用寫程式也能做互動教學內容",
    "summary": "只需自然語言對話，就能產生抽籤機、配對遊戲、時間軸、閃卡等互動式教學工具。",
    "theme": "乾淨教育感",
    "tags": ["Canva Code", "互動教學", "遊戲化學習", "無程式"],
    "createdAt": "2026-04-05T00:00:00.000Z",
    "contributor": "Siyulio",
    "slideCount": 15,
    "externalUrl": ""
  },
  {
    "id": "napkin-ai-visual",
    "title": "Napkin AI：把文字瞬間變成漂亮圖表",
    "summary": "AI 驅動的視覺化圖表生成工具，貼上文字就能產生概念圖、流程圖、時程圖，直接用在簡報裡。",
    "theme": "乾淨教育感",
    "tags": ["Napkin AI", "圖表", "視覺化", "簡報設計"],
    "createdAt": "2026-03-28T00:00:00.000Z",
    "contributor": "Siyulio",
    "slideCount": 8,
    "externalUrl": ""
  }
]
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts data/presentations.json
git commit -m "feat: add shared types and sample presentation data"
```

---

## Task 3: NavBar Component

**Files:**
- Create: `components/NavBar.tsx`

- [ ] **Step 1: Create `components/NavBar.tsx`**

```tsx
// components/NavBar.tsx
import Link from "next/link";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-accent font-black text-base leading-none">S</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-black text-[13px] text-text-primary tracking-tight">
              Siyulio
            </span>
            <span className="text-[9px] text-text-muted tracking-widest uppercase">
              Slide Studio
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          <Link
            href="/gallery"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            瀏覽簡報
          </Link>
          <Link
            href="/create"
            className="bg-[#111111] text-accent text-sm font-bold px-4 py-2 rounded-md hover:bg-gray-900 transition-colors"
          >
            立即產生
          </Link>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Wire NavBar into root layout `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siyulio Slide Studio",
  description: "用 AI 打造屬於你的專業簡報風格",
  metadataBase: new URL("https://slide.siyulio.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <NavBar />
        <main>{children}</main>
        <footer className="border-t border-gray-100 py-6 mt-20">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-text-muted">
            <span>© 2026 Siyulio</span>
            <div className="flex gap-6">
              <a
                href="https://www.siyulio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-secondary transition-colors"
              >
                siyulio.com
              </a>
              <Link href="/design" className="hover:text-text-secondary transition-colors">
                DESIGN.md
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
```

Note: If `geist` package is not installed, run:
```bash
npm install geist
```
If geist import fails, fallback to:
```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
```

- [ ] **Step 3: Commit**

```bash
git add components/NavBar.tsx app/layout.tsx
git commit -m "feat: add NavBar and root layout"
```

---

## Task 4: Landing Page (/)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx` with the Hero landing page**

```tsx
// app/page.tsx
import Link from "next/link";
import { Presentation } from "@/lib/types";
import presentations from "@/data/presentations.json";
import PresentationCard from "@/components/PresentationCard";

export default function HomePage() {
  const recent = (presentations as Presentation[]).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-24">
        <p className="text-xs tracking-[0.3em] uppercase text-text-muted mb-4">
          AI Presentation Workflow
        </p>
        <h1 className="text-4xl md:text-6xl font-black text-text-primary leading-tight mb-6 max-w-3xl">
          用 AI 打造屬於你的<br />
          <span className="bg-accent px-2">專業簡報風格</span>
        </h1>
        <p className="text-text-secondary max-w-lg mb-10 leading-relaxed">
          輸入主題，選擇風格，立即生成可播放、可分享的投影片。
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/create"
            className="bg-[#111111] text-accent font-bold px-8 py-4 rounded-lg text-base hover:bg-gray-900 transition-colors shadow-lg"
          >
            立即產生簡報
          </Link>
          <Link
            href="/gallery"
            className="border-2 border-[#111111] text-text-primary font-bold px-8 py-4 rounded-lg text-base hover:bg-surface transition-colors"
          >
            瀏覽公開簡報
          </Link>
        </div>

        {/* DESIGN.md micro-link */}
        <Link
          href="/design"
          className="text-xs text-text-muted hover:text-text-secondary transition-colors tracking-wide"
        >
          熟悉 AI Skill？查看 DESIGN.md →
        </Link>
      </section>

      {/* Recent Presentations */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-black mb-8">最近的簡報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recent.map((p) => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/gallery"
            className="text-sm text-text-secondary border border-gray-200 px-6 py-3 rounded-lg hover:border-gray-400 transition-colors"
          >
            查看全部簡報 →
          </Link>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page with hero and recent presentations"
```

---

## Task 5: PresentationCard Component

**Files:**
- Create: `components/PresentationCard.tsx`

- [ ] **Step 1: Create `components/PresentationCard.tsx`**

```tsx
// components/PresentationCard.tsx
import Link from "next/link";
import { Presentation } from "@/lib/types";

interface Props {
  presentation: Presentation;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PresentationCard({ presentation }: Props) {
  const { id, title, summary, theme, tags, createdAt, contributor, slideCount } =
    presentation;

  return (
    <article className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      {/* Theme badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs bg-surface text-text-secondary px-2 py-1 rounded-full">
          {theme}
        </span>
        <span className="text-xs text-text-muted">{slideCount} 頁</span>
      </div>

      {/* Title + summary */}
      <div className="flex-1">
        <h3 className="font-bold text-text-primary leading-snug mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-[11px] bg-surface text-text-secondary px-2 py-0.5 rounded"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div>
          <p className="text-[11px] text-text-muted">{formatDate(createdAt)}</p>
          <p className="text-[11px] text-text-muted">by {contributor}</p>
        </div>
        <Link
          href={`/view/${id}`}
          className="bg-[#111111] text-accent text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
        >
          開啟
        </Link>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/PresentationCard.tsx
git commit -m "feat: add PresentationCard component"
```

---

## Task 6: Gallery Page (/gallery)

**Files:**
- Create: `app/gallery/page.tsx`

- [ ] **Step 1: Create `app/gallery/page.tsx`**

```tsx
// app/gallery/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Presentation } from "@/lib/types";
import PresentationCard from "@/components/PresentationCard";
import presentationsData from "@/data/presentations.json";

const presentations = presentationsData as Presentation[];

// Collect all unique tags with counts
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
      {/* Header */}
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

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋標題、摘要或關鍵字…"
          className="w-full border border-gray-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#111111] transition-colors"
        />
      </div>

      {/* Popular tags */}
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

      {/* Grid */}
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
```

- [ ] **Step 2: Commit**

```bash
git add app/gallery/page.tsx
git commit -m "feat: add gallery page with search and tag filtering"
```

---

## Task 7: Create Wizard (/create)

**Files:**
- Create: `components/CreateWizard.tsx`
- Create: `app/create/page.tsx`

- [ ] **Step 1: Create `components/CreateWizard.tsx`**

```tsx
// components/CreateWizard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardStep, StyleOption } from "@/lib/types";

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "clean-edu",
    name: "乾淨教育感",
    description: "白底 + 黃色強調，高可讀性，適合教學場合",
    previewBg: "#FFFBF0",
    accentColor: "#FFCC00",
  },
  {
    id: "dark-tech",
    name: "深色科技感",
    description: "深色背景 + 亮色強調，科技感強，適合科技主題",
    previewBg: "#0F0F1A",
    accentColor: "#7C3AED",
  },
  {
    id: "minimal",
    name: "極簡商務",
    description: "純白 + 黑色，無裝飾，最高資訊密度",
    previewBg: "#FFFFFF",
    accentColor: "#111111",
  },
  {
    id: "gradient",
    name: "漸層現代",
    description: "藍紫漸層，視覺衝擊力強，適合發表場合",
    previewBg: "linear-gradient(135deg,#667eea,#764ba2)",
    accentColor: "#FFFFFF",
  },
];

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "topic", label: "主題" },
  { id: "style", label: "風格" },
  { id: "generate", label: "生成" },
];

export default function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("topic");
  const [topic, setTopic] = useState("");
  const [outline, setOutline] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  function handleTopicNext() {
    if (!topic.trim()) return;
    setStep("style");
  }

  function handleStyleNext() {
    if (!selectedStyle) return;
    setStep("generate");
  }

  async function handleGenerate() {
    setIsGenerating(true);
    // Stub: simulate generation delay, then redirect to gallery
    await new Promise((r) => setTimeout(r, 2500));
    setIsGenerating(false);
    router.push("/gallery?generated=true");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-12">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i <= currentStepIndex
                  ? "bg-[#111111] text-accent"
                  : "bg-surface text-text-muted"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm ${
                i === currentStepIndex ? "font-bold text-text-primary" : "text-text-muted"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${i < currentStepIndex ? "bg-[#111111]" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Topic */}
      {step === "topic" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black">你的簡報主題是什麼？</h2>
          <div>
            <label className="block text-sm font-bold mb-2">主題標題</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：用 AI 工具提升教學效率"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#111111] transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleTopicNext()}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">
              大綱（選填）
            </label>
            <textarea
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              placeholder="貼上你的大綱，或直接跳過讓 AI 自動規劃…"
              rows={5}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#111111] transition-colors resize-none"
            />
          </div>
          <button
            onClick={handleTopicNext}
            disabled={!topic.trim()}
            className="w-full bg-[#111111] text-accent font-bold py-4 rounded-xl disabled:opacity-40 hover:bg-gray-900 transition-colors"
          >
            下一步：選擇風格 →
          </button>
        </div>
      )}

      {/* Step 2: Style */}
      {step === "style" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black">選擇簡報風格</h2>
          <div className="grid grid-cols-2 gap-4">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
                  selectedStyle === style.id
                    ? "border-[#111111] shadow-lg"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                {/* Preview swatch */}
                <div
                  className="h-20"
                  style={{ background: style.previewBg }}
                />
                <div className="p-3">
                  <p className="font-bold text-sm mb-1">{style.name}</p>
                  <p className="text-xs text-text-muted leading-snug">
                    {style.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("topic")}
              className="flex-1 border-2 border-gray-200 font-bold py-4 rounded-xl hover:border-gray-400 transition-colors"
            >
              ← 返回
            </button>
            <button
              onClick={handleStyleNext}
              disabled={!selectedStyle}
              className="flex-1 bg-[#111111] text-accent font-bold py-4 rounded-xl disabled:opacity-40 hover:bg-gray-900 transition-colors"
            >
              下一步：生成 →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generate */}
      {step === "generate" && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-black">確認並生成</h2>
          <div className="bg-surface rounded-xl p-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted font-bold">主題</span>
              <span className="text-text-primary">{topic}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted font-bold">風格</span>
              <span className="text-text-primary">
                {STYLE_OPTIONS.find((s) => s.id === selectedStyle)?.name}
              </span>
            </div>
            {outline && (
              <div className="text-sm">
                <span className="text-text-muted font-bold block mb-1">大綱</span>
                <span className="text-text-primary text-xs whitespace-pre-wrap">
                  {outline.slice(0, 200)}
                  {outline.length > 200 ? "…" : ""}
                </span>
              </div>
            )}
          </div>

          {isGenerating ? (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-accent border-t-[#111111] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">AI 正在生成你的簡報…</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setStep("style")}
                className="flex-1 border-2 border-gray-200 font-bold py-4 rounded-xl hover:border-gray-400 transition-colors"
              >
                ← 返回
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 bg-[#111111] text-accent font-bold py-4 rounded-xl hover:bg-gray-900 transition-colors"
              >
                開始生成 ✨
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/create/page.tsx`**

```tsx
// app/create/page.tsx
import CreateWizard from "@/components/CreateWizard";

export const metadata = {
  title: "立即產生簡報 | Siyulio Slide Studio",
};

export default function CreatePage() {
  return <CreateWizard />;
}
```

- [ ] **Step 3: Commit**

```bash
git add components/CreateWizard.tsx app/create/page.tsx
git commit -m "feat: add 3-step create wizard (stubbed generation)"
```

---

## Task 8: Slide Viewer (/view/[id])

**Files:**
- Create: `components/SlideViewer.tsx`
- Create: `app/view/[id]/page.tsx`

- [ ] **Step 1: Create `components/SlideViewer.tsx`**

```tsx
// components/SlideViewer.tsx
"use client";

import { useState, useCallback } from "react";
import { Presentation } from "@/lib/types";

interface Props {
  presentation: Presentation;
}

// Mock slide generator — creates HTML slides from presentation data
function generateMockSlides(p: Presentation): string[] {
  const accent = "#FFCC00";
  const slides: string[] = [
    // Cover slide
    `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;background:#FFFBF0;padding:60px;">
      <div style="font-size:11px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:16px;">Siyulio Slide Studio</div>
      <h1 style="font-size:40px;font-weight:900;color:#111;line-height:1.2;margin-bottom:20px;">${p.title}</h1>
      <div style="width:60px;height:4px;background:${accent};border-radius:2px;margin-bottom:20px;"></div>
      <p style="color:#555;font-size:16px;max-width:480px;line-height:1.6;">${p.summary}</p>
      <div style="margin-top:40px;font-size:12px;color:#aaa;">by ${p.contributor}</div>
    </div>`,

    // Tags slide
    `<div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:60px;">
      <p style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:12px;">關鍵詞</p>
      <h2 style="font-size:32px;font-weight:900;color:#111;margin-bottom:32px;">本簡報涵蓋</h2>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        ${p.tags.map((t) => `<span style="background:${accent};color:#111;font-weight:700;padding:8px 20px;border-radius:8px;font-size:15px;">${t}</span>`).join("")}
      </div>
    </div>`,

    // Summary slide
    `<div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:60px;">
      <p style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:12px;">摘要</p>
      <h2 style="font-size:32px;font-weight:900;color:#111;margin-bottom:24px;">簡報重點</h2>
      <p style="font-size:18px;color:#555;line-height:1.8;max-width:600px;">${p.summary}</p>
    </div>`,

    // End slide
    `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;background:#111;padding:60px;">
      <div style="font-size:48px;font-weight:900;color:${accent};margin-bottom:16px;">謝謝</div>
      <p style="color:#888;font-size:14px;">© Siyulio Slide Studio</p>
    </div>`,
  ];
  return slides;
}

export default function SlideViewer({ presentation }: Props) {
  const slides = generateMockSlides(presentation);
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(
    () => setCurrent((c) => Math.min(slides.length - 1, c + 1)),
    [slides.length]
  );

  const slideContent = (
    <div className="relative">
      {/* Slide canvas — 16:9 */}
      <div
        className="w-full rounded-xl overflow-hidden shadow-xl border border-gray-100"
        style={{ aspectRatio: "16/9" }}
        dangerouslySetInnerHTML={{ __html: slides[current] }}
      />

      {/* Navigation arrows */}
      <button
        onClick={prev}
        disabled={current === 0}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-30 shadow transition-all"
      >
        ←
      </button>
      <button
        onClick={next}
        disabled={current === slides.length - 1}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-30 shadow transition-all"
      >
        →
      </button>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-full max-w-5xl">
          {slideContent}
          <div className="flex items-center justify-between mt-4 text-white">
            <span className="text-sm opacity-60">
              {current + 1} / {slides.length}
            </span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              ✕ 離開全螢幕
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {slideContent}

      {/* Controls bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">
          {current + 1} / {slides.length} 頁
        </span>
        <div className="flex gap-2">
          {/* Dot indicators */}
          <div className="flex gap-1.5 items-center">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current
                    ? "w-4 h-2 bg-[#111111]"
                    : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setIsFullscreen(true)}
            className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors ml-2"
          >
            全螢幕 ⛶
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/view/[id]/page.tsx`**

```tsx
// app/view/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Presentation } from "@/lib/types";
import SlideViewer from "@/components/SlideViewer";
import presentationsData from "@/data/presentations.json";

const presentations = presentationsData as Presentation[];

export function generateStaticParams() {
  return presentations.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const p = presentations.find((p) => p.id === params.id);
  if (!p) return { title: "Not Found" };
  return { title: `${p.title} | Siyulio Slide Studio` };
}

export default function ViewPage({ params }: { params: { id: string } }) {
  const presentation = presentations.find((p) => p.id === params.id);
  if (!presentation) notFound();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
        <Link href="/gallery" className="hover:text-text-primary transition-colors">
          公開簡報
        </Link>
        <span>/</span>
        <span className="text-text-primary truncate">{presentation.title}</span>
      </div>

      {/* Viewer */}
      <SlideViewer presentation={presentation} />

      {/* Metadata */}
      <div className="mt-10 border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-2xl font-black mb-3">{presentation.title}</h1>
          <p className="text-text-secondary leading-relaxed">{presentation.summary}</p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted font-bold">貢獻者</span>
            <span>{presentation.contributor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted font-bold">主題風格</span>
            <span>{presentation.theme}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted font-bold">頁數</span>
            <span>{presentation.slideCount} 頁</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {presentation.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-surface text-text-secondary px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/SlideViewer.tsx app/view/
git commit -m "feat: add slide viewer with fullscreen mode"
```

---

## Task 9: DESIGN.md Page (/design)

**Files:**
- Create: `app/design/page.tsx`

- [ ] **Step 1: Create `app/design/page.tsx`**

```tsx
// app/design/page.tsx
import { readFileSync } from "fs";
import { join } from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata = {
  title: "DESIGN.md | Siyulio Slide Studio",
  description: "Design system specification for Siyulio Slide Studio",
};

export default function DesignPage() {
  const mdPath = join(process.cwd(), "DESIGN.md");
  const content = readFileSync(mdPath, "utf-8");

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header badge */}
      <div className="flex items-center gap-3 mb-8">
        <span className="bg-[#111111] text-accent text-xs font-mono font-bold px-3 py-1 rounded">
          DESIGN.md
        </span>
        <span className="text-sm text-text-muted">品牌脊柱 · 設計系統文件</span>
      </div>

      {/* Markdown content */}
      <article className="prose prose-slate max-w-none
        prose-headings:font-black prose-headings:text-text-primary
        prose-h1:text-3xl prose-h1:mb-6
        prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
        prose-h3:text-base prose-h3:mt-6
        prose-p:text-text-secondary prose-p:leading-relaxed
        prose-li:text-text-secondary
        prose-code:bg-surface prose-code:text-text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
        prose-pre:bg-[#111111] prose-pre:text-gray-100
        prose-table:text-sm
        prose-th:bg-surface prose-th:font-bold
        prose-strong:text-text-primary
        prose-a:text-[#1A73E8] prose-a:no-underline hover:prose-a:underline
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Install Tailwind Typography plugin for prose styles**

```bash
npm install @tailwindcss/typography
```

Then update `tailwind.config.ts` plugins array:

```typescript
plugins: [require("@tailwindcss/typography")],
```

- [ ] **Step 3: Commit**

```bash
git add app/design/page.tsx tailwind.config.ts
git commit -m "feat: add DESIGN.md renderer page"
```

---

## Task 10: Vercel Deployment Config

**Files:**
- Create: `vercel.json`
- Create: `.gitignore` (update)

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

- [ ] **Step 2: Ensure `.gitignore` covers Next.js + Vercel artifacts**

Verify these lines exist in `.gitignore` (create-next-app adds them):
```
.next/
out/
node_modules/
.env*.local
.vercel
.superpowers/
```

- [ ] **Step 3: Final production build check**

```bash
cd "C:/Users/user/Desktop/簡報樣板"
npm run build
```

Expected: Build completes with no TypeScript errors. Static pages listed for all routes.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Siyulio Slide Studio MVP"
```

- [ ] **Step 5: Deploy to Vercel**

```bash
npx vercel --prod
```

Or connect the GitHub repo to Vercel dashboard at vercel.com → Import Project → set domain to `slide.siyulio.com`.

---

## Self-Review

**Spec coverage:**
- [x] Landing page (Hero + 2 CTAs + DESIGN.md micro-link) — Task 4
- [x] `siyulio / Slide Studio` logo — Task 3
- [x] White + #FFCC00 + #111 color scheme — Task 1 (Tailwind config)
- [x] Gallery page with search + tag filter — Task 6
- [x] Create wizard (3 steps, mock generation) — Task 7
- [x] Slide viewer (scroll + fullscreen) — Task 8
- [x] DESIGN.md page — Task 9
- [x] `/data/presentations.json` as data source — Task 2
- [x] Next.js 14 App Router + TypeScript + Tailwind — Task 1
- [x] Vercel deployment config — Task 10

**Placeholder scan:** No TBD or TODO present. Generation stub clearly documented as "mock, future Gemini hookup."

**Type consistency:** `Presentation`, `WizardStep`, `StyleOption` defined in Task 2 and used consistently in Tasks 4–9. `PresentationCard` receives `Presentation` prop in Task 5 matching Task 4 usage.
