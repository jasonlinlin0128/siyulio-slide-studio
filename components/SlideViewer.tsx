"use client";

import { useState, useCallback } from "react";
import { Presentation } from "@/lib/types";

interface Props {
  presentation: Presentation;
  slides?: string[];
}

function generateMockSlides(p: Presentation): string[] {
  const accent = "#FFCC00";
  return [
    `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;background:#FFFBF0;padding:60px;">
      <div style="font-size:11px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:16px;">Siyulio Slide Studio</div>
      <h1 style="font-size:40px;font-weight:900;color:#111;line-height:1.2;margin-bottom:20px;">${p.title}</h1>
      <div style="width:60px;height:4px;background:${accent};border-radius:2px;margin-bottom:20px;"></div>
      <p style="color:#555;font-size:16px;max-width:480px;line-height:1.6;">${p.summary}</p>
      <div style="margin-top:40px;font-size:12px;color:#aaa;">by ${p.contributor}</div>
    </div>`,

    `<div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:60px;">
      <p style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:12px;">關鍵詞</p>
      <h2 style="font-size:32px;font-weight:900;color:#111;margin-bottom:32px;">本簡報涵蓋</h2>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        ${p.tags.map((t) => `<span style="background:${accent};color:#111;font-weight:700;padding:8px 20px;border-radius:8px;font-size:15px;">${t}</span>`).join("")}
      </div>
    </div>`,

    `<div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:60px;">
      <p style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:12px;">摘要</p>
      <h2 style="font-size:32px;font-weight:900;color:#111;margin-bottom:24px;">簡報重點</h2>
      <p style="font-size:18px;color:#555;line-height:1.8;max-width:600px;">${p.summary}</p>
    </div>`,

    `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;background:#111;padding:60px;">
      <div style="font-size:48px;font-weight:900;color:${accent};margin-bottom:16px;">謝謝</div>
      <p style="color:#888;font-size:14px;">© Siyulio Slide Studio</p>
    </div>`,
  ];
}

export default function SlideViewer({ presentation, slides: propSlides }: Props) {
  const slides = propSlides?.length ? propSlides : generateMockSlides(presentation);
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(
    () => setCurrent((c) => Math.min(slides.length - 1, c + 1)),
    [slides.length]
  );

  const slideContent = (
    <div className="relative">
      <div
        className="w-full rounded-xl overflow-hidden shadow-xl border border-gray-100"
        style={{ aspectRatio: "16/9" }}
        dangerouslySetInnerHTML={{ __html: slides[current] }}
      />
      <button
        onClick={prev}
        disabled={current === 0}
        aria-label="上一頁"
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-30 shadow transition-all"
      >
        ←
      </button>
      <button
        onClick={next}
        disabled={current === slides.length - 1}
        aria-label="下一頁"
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
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">
          {current + 1} / {slides.length} 頁
        </span>
        <div className="flex gap-1.5 items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`第 ${i + 1} 頁`}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-4 h-2 bg-[#111111]"
                  : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
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
