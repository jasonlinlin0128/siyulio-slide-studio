import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";

// ─── Style configs ────────────────────────────────────────────────────────────

const STYLE_CONFIGS: Record<string, { bg: string; accent: string; text: string; subtext: string }> = {
  "clean-edu": { bg: "#FFFBF0", accent: "#FFCC00", text: "#111111", subtext: "#555555" },
  "dark-tech":  { bg: "#0F0F1A", accent: "#7C3AED", text: "#FFFFFF",  subtext: "#AAAAAA" },
  "minimal":    { bg: "#FFFFFF",  accent: "#111111", text: "#111111", subtext: "#555555" },
  "gradient":   { bg: "linear-gradient(135deg,#667eea,#764ba2)", accent: "#FFFFFF", text: "#FFFFFF", subtext: "rgba(255,255,255,0.8)" },
};

const STYLE_NAMES: Record<string, string> = {
  "clean-edu": "乾淨教育感",
  "dark-tech":  "深色科技感",
  "minimal":    "極簡商務",
  "gradient":   "漸層現代",
};

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(topic: string, outline: string | undefined, style: string): string {
  const cfg = STYLE_CONFIGS[style] ?? STYLE_CONFIGS["clean-edu"];
  return `你是一個專業的簡報設計師，精通用 HTML + inline style 製作投影片。
每張投影片都是一個獨立的 div，使用 flex 排版，高度固定為 100%，寬度固定為 100%，只用 inline style。
色彩：背景色 ${cfg.bg}、強調色 ${cfg.accent}、主文字 ${cfg.text}、副文字 ${cfg.subtext}。

請為以下主題製作一份專業簡報：
主題：${topic}
${outline ? `大綱：\n${outline}` : "（請自動規劃大綱）"}

請輸出符合以下格式的 JSON（不要有任何其他文字）：
{
  "title": "簡報標題",
  "summary": "一句話摘要（40字以內）",
  "tags": ["標籤1", "標籤2", "標籤3", "標籤4"],
  "slides": ["投影片1的HTML", "投影片2的HTML", "...共8張"]
}

投影片要求：
- 共 8 張投影片
- 第 1 張：封面（大標題、品牌標示 Siyulio Slide Studio）
- 第 2 張：目錄
- 第 3-7 張：內容投影片，每張聚焦一個概念，有標題有說明
- 第 8 張：謝謝結尾
- 每張外層 div 必須有 style：display:flex; flex-direction:column; height:100%; padding:60px; background:${cfg.bg}; box-sizing:border-box;
- 使用繁體中文，內容要具體充實，不要用佔位符`;
}

// ─── Result parser ────────────────────────────────────────────────────────────

function parseResult(raw: string, topic: string, style: string) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("回應中找不到 JSON");

  let parsed: { title?: string; summary?: string; tags?: string[]; slides?: string[] };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    const cleaned = jsonMatch[0].replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    parsed = JSON.parse(cleaned);
  }

  const slides = Array.isArray(parsed.slides) ? parsed.slides : [];
  return {
    id: `gen-${Date.now()}`,
    title: parsed.title ?? topic,
    summary: parsed.summary ?? "",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    theme: STYLE_NAMES[style] ?? "乾淨教育感",
    slideCount: slides.length,
    contributor: "AI 生成",
    createdAt: new Date().toISOString(),
    slides,
  };
}

// ─── Provider implementations ─────────────────────────────────────────────────

async function tryGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  for (const modelName of ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"]) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn(`Gemini ${modelName} failed:`, (err as Error).message?.substring(0, 80));
    }
  }
  throw new Error("All Gemini models failed");
}

async function tryGroq(prompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 8192,
  });
  return res.choices[0].message.content ?? "{}";
}

// OpenAI-compatible helper used by OpenRouter / Cerebras / Together / Mistral
function makeOpenAIClient(baseURL: string, apiKey: string) {
  return new OpenAI({ baseURL, apiKey });
}

async function tryOpenRouter(prompt: string): Promise<string> {
  const client = makeOpenAIClient("https://openrouter.ai/api/v1", process.env.OPENROUTER_API_KEY!);
  // Try free models in priority order (verified working 2026-04)
  for (const model of [
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "google/gemma-4-31b-it:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
  ]) {
    try {
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 8192,
      });
      console.log(`OpenRouter success with model: ${model}`);
      return res.choices[0].message.content ?? "{}";
    } catch (err) {
      console.warn(`OpenRouter ${model} failed:`, (err as Error).message?.substring(0, 80));
    }
  }
  throw new Error("All OpenRouter free models failed");
}

async function tryCerebras(prompt: string): Promise<string> {
  const client = makeOpenAIClient("https://api.cerebras.ai/v1", process.env.CEREBRAS_API_KEY!);
  const res = await client.chat.completions.create({
    model: "llama-3.3-70b",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 8192,
  });
  return res.choices[0].message.content ?? "{}";
}

async function tryTogether(prompt: string): Promise<string> {
  const client = makeOpenAIClient("https://api.together.xyz/v1", process.env.TOGETHER_API_KEY!);
  const res = await client.chat.completions.create({
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 8192,
  });
  return res.choices[0].message.content ?? "{}";
}

async function tryMistral(prompt: string): Promise<string> {
  const client = makeOpenAIClient("https://api.mistral.ai/v1", process.env.MISTRAL_API_KEY!);
  const res = await client.chat.completions.create({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 8192,
  });
  return res.choices[0].message.content ?? "{}";
}

// ─── Provider chain ───────────────────────────────────────────────────────────

type Provider = { name: string; envKey: string; fn: (p: string) => Promise<string> };

const PROVIDERS: Provider[] = [
  { name: "Gemini",     envKey: "GEMINI_API_KEY",     fn: tryGemini },
  { name: "Groq",       envKey: "GROQ_API_KEY",       fn: tryGroq },
  { name: "OpenRouter", envKey: "OPENROUTER_API_KEY", fn: tryOpenRouter },
  { name: "Cerebras",   envKey: "CEREBRAS_API_KEY",   fn: tryCerebras },
  { name: "Together",   envKey: "TOGETHER_API_KEY",   fn: tryTogether },
  { name: "Mistral",    envKey: "MISTRAL_API_KEY",    fn: tryMistral },
];

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { topic, outline, style } = await req.json();

    if (!topic?.trim()) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const available = PROVIDERS.filter((p) => !!process.env[p.envKey]);
    if (available.length === 0) {
      return NextResponse.json(
        { error: "請至少設定一個 AI API Key（GEMINI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY ...）" },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(topic, outline, style ?? "clean-edu");

    for (const provider of available) {
      try {
        console.log(`Trying ${provider.name}...`);
        const rawText = await provider.fn(prompt);
        const result = parseResult(rawText, topic, style ?? "clean-edu");
        console.log(`✓ ${provider.name} generated ${result.slideCount} slides for "${topic}"`);
        return NextResponse.json({ ...result, _provider: provider.name });
      } catch (err) {
        console.warn(`✗ ${provider.name} failed:`, (err as Error).message?.substring(0, 100));
      }
    }

    return NextResponse.json({ error: "所有 AI 服務均失敗，請稍後再試" }, { status: 500 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "伺服器錯誤" },
      { status: 500 }
    );
  }
}
