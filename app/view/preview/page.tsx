"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SlideViewer from "@/components/SlideViewer";
import { Presentation } from "@/lib/types";

export default function PreviewPage() {
  const router = useRouter();
  const [presentation, setPresentation] = useState<(Presentation & { slides: string[] }) | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("preview_presentation");
    if (!raw) {
      setError(true);
      return;
    }
    try {
      setPresentation(JSON.parse(raw));
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-text-muted mb-4">找不到簡報資料，請重新生成。</p>
        <Link href="/create" className="bg-[#111111] text-accent font-bold px-6 py-3 rounded-xl">
          重新生成
        </Link>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-10 h-10 border-4 border-accent border-t-[#111111] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
        <Link href="/create" className="hover:text-text-primary transition-colors">
          生成簡報
        </Link>
        <span>/</span>
        <span className="text-text-primary truncate">{presentation.title}</span>
        <span className="ml-auto bg-accent text-[#111] text-xs font-bold px-2 py-0.5 rounded">
          AI 生成預覽
        </span>
      </div>

      <SlideViewer presentation={presentation} slides={presentation.slides} />

      <div className="mt-10 border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-2xl font-black mb-3">{presentation.title}</h1>
          <p className="text-text-secondary leading-relaxed">{presentation.summary}</p>
        </div>
        <div className="space-y-3 text-sm">
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
              <span key={tag} className="text-xs bg-surface text-text-secondary px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
          <div className="pt-4">
            <button
              onClick={() => {
                router.push("/create");
              }}
              className="w-full border-2 border-gray-200 font-bold py-3 rounded-xl hover:border-gray-400 transition-colors text-sm"
            >
              重新生成 ↺
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
