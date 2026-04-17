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

  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, outline, style: selectedStyle }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "生成失敗");
      }
      const data = await res.json();
      sessionStorage.setItem("preview_presentation", JSON.stringify(data));
      router.push("/view/preview");
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "生成失敗，請稍後再試");
      setIsGenerating(false);
    }
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
              <div
                className={`h-px w-8 ${i < currentStepIndex ? "bg-[#111111]" : "bg-gray-200"}`}
              />
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
            <label className="block text-sm font-bold mb-2">大綱（選填）</label>
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
                <div className="h-20" style={{ background: style.previewBg }} />
                <div className="p-3">
                  <p className="font-bold text-sm mb-1">{style.name}</p>
                  <p className="text-xs text-text-muted leading-snug">{style.description}</p>
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

          {generateError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm text-left">
              {generateError}
            </div>
          )}

          {isGenerating ? (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-accent border-t-[#111111] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">AI 正在生成你的簡報，約需 15-30 秒…</p>
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
