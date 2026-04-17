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
            <PresentationCard key={p.id} presentation={p as Presentation} />
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
