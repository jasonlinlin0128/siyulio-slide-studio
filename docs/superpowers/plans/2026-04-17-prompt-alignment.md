# Siyulio Phase 1 — Prompt Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/api/generate` runtime-read `DESIGN.md` via `<!-- prompt-include: ... -->` markers so LLM output aligns with the Siyulio brand spine (patterns / tokens / tone / UI rules).

**Architecture:** Runtime approach — `lib/design-spec.ts` reads `DESIGN.md` (mtime-cached) and extracts marker-delimited sections; `buildPrompt()` injects them as a `## Brand Spine` block after the base prompt's color config. Five sections (aesthetic / tokens / patterns / ui-elements / tone) become include blocks in DESIGN.md.

**Tech Stack:** Next.js 14 (App Router) · TypeScript 5 · Node fs · no test framework (manual verification per spec § 6.2)

**Spec:** [`docs/superpowers/specs/2026-04-17-prompt-alignment-design.md`](../specs/2026-04-17-prompt-alignment-design.md) (commit `61a8c82`)
**Roadmap:** [`docs/design.md`](../../design.md)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `DESIGN.md` | Modify | Add 5 `<!-- prompt-include -->` marker pairs wrapping sections 2/3/5/6/7 (content unchanged) |
| `lib/design-spec.ts` | Create | Export `loadDesignIncludes()` — parse DESIGN.md, mtime cache, return `DesignInclude[]` |
| `app/api/generate/route.ts` | Modify | `buildPrompt()` calls `loadDesignIncludes()` and injects `## Brand Spine` section before topic-specific lines |

Verification-only files (not committed):
- Use `curl` / Git Bash to hit `/api/generate` locally
- Use existing `data/presentations.json` topics for quality checklist

---

## Task 1: Add `prompt-include` markers to DESIGN.md

**Files:**
- Modify: `DESIGN.md` (5 locations)

No content changes — only wrapper markers around existing sections. Each section gets an opening `<!-- prompt-include: <name> -->` right after its `## N. Title` heading and a closing `<!-- /prompt-include -->` right before the trailing `---` separator.

Each edit below shows literal file content — pass the exact multi-line strings to the Edit tool (not the escaped-backslash form).

- [ ] **Step 1.1: Wrap Section 2 (Aesthetic Direction) — opening marker**

Edit `DESIGN.md`.

old_string:
```
## 2. Aesthetic Direction（美學方向）

### 整體風格定義
```

new_string:
```
## 2. Aesthetic Direction（美學方向）

<!-- prompt-include: aesthetic -->

### 整體風格定義
```

- [ ] **Step 1.2: Wrap Section 2 — closing marker**

Edit `DESIGN.md`.

old_string:
```
| 花體字、裝飾性英文字型 | 降低可讀性，不符合教學場合 |

---

## 3. Design Tokens
```

new_string:
```
| 花體字、裝飾性英文字型 | 降低可讀性，不符合教學場合 |

<!-- /prompt-include -->

---

## 3. Design Tokens
```

- [ ] **Step 1.3: Wrap Section 3 (Design Tokens) — both markers**

Edit `DESIGN.md`.

Opening — old_string:
```
## 3. Design Tokens（設計語彙）

### 色彩系統
```

Opening — new_string:
```
## 3. Design Tokens（設計語彙）

<!-- prompt-include: tokens -->

### 色彩系統
```

Closing — old_string:
```
| `space-xl` | 64px | 版面上下邊距 |

---

## 4. Content Architecture
```

Closing — new_string:
```
| `space-xl` | 64px | 版面上下邊距 |

<!-- /prompt-include -->

---

## 4. Content Architecture
```

- [ ] **Step 1.4: Wrap Section 5 (Slide Patterns) — both markers**

Edit `DESIGN.md`.

Opening — old_string:
```
## 5. Slide Patterns（投影片模板類型）

每種模板對應反覆出現的版面結構，便於 AI 工具或設計者快速套用。
```

Opening — new_string:
```
## 5. Slide Patterns（投影片模板類型）

<!-- prompt-include: patterns -->

每種模板對應反覆出現的版面結構，便於 AI 工具或設計者快速套用。
```

Closing — old_string:
```
- 下方：條列式經歷

---

## 6. Recurring UI Elements
```

Closing — new_string:
```
- 下方：條列式經歷

<!-- /prompt-include -->

---

## 6. Recurring UI Elements
```

- [ ] **Step 1.5: Wrap Section 6 (Recurring UI Elements) — both markers**

Edit `DESIGN.md`.

Opening — old_string:
```
## 6. Recurring UI Elements（反覆出現的 UI 元素）

| 元素 | 規格描述 |
```

Opening — new_string:
```
## 6. Recurring UI Elements（反覆出現的 UI 元素）

<!-- prompt-include: ui-elements -->

| 元素 | 規格描述 |
```

Closing — old_string:
```
| **AI 工具名稱** | 首次出現時以粗體標示，後續維持正常字重 |

---

## 7. Content Tone
```

Closing — new_string:
```
| **AI 工具名稱** | 首次出現時以粗體標示，後續維持正常字重 |

<!-- /prompt-include -->

---

## 7. Content Tone
```

- [ ] **Step 1.6: Wrap Section 7 (Content Tone) — both markers**

Edit `DESIGN.md`.

Opening — old_string:
```
## 7. Content Tone（內容語氣）

| 面向 | 規則 |
```

Opening — new_string:
```
## 7. Content Tone（內容語氣）

<!-- prompt-include: tone -->

| 面向 | 規則 |
```

Closing — old_string:
```
| **禁止用語** | 避免「非常」「極其」「超級」等誇飾副詞，以具體數字或事實替代 |

---

## 8. Decisions Log
```

Closing — new_string:
```
| **禁止用語** | 避免「非常」「極其」「超級」等誇飾副詞，以具體數字或事實替代 |

<!-- /prompt-include -->

---

## 8. Decisions Log
```

- [ ] **Step 1.7: Verify marker count**

Run (in project root):
```bash
grep -c "prompt-include" DESIGN.md
```
Expected: `10` (5 opens + 5 closes).

Run:
```bash
grep -n "prompt-include" DESIGN.md
```
Expected: 10 lines, alternating `<!-- prompt-include: X -->` / `<!-- /prompt-include -->` in the order aesthetic → tokens → patterns → ui-elements → tone.

- [ ] **Step 1.8: Commit**

```bash
cd /c/Users/user/Desktop/簡報樣板
git add DESIGN.md
git commit -m "docs: add prompt-include markers to DESIGN.md brand spine

Wraps sections 2 (Aesthetic), 3 (Tokens), 5 (Patterns), 6 (UI), and
7 (Tone) with <!-- prompt-include -->markers so /api/generate can
extract them at runtime. Content unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Create `lib/design-spec.ts`

**Files:**
- Create: `lib/design-spec.ts`

- [ ] **Step 2.1: Write the module**

Create `lib/design-spec.ts` with exactly this content:

```ts
import fs from "node:fs";
import path from "node:path";

export interface DesignInclude {
  section: string;
  content: string;
}

interface Cache {
  mtimeMs: number;
  includes: DesignInclude[];
}

let cache: Cache | null = null;

const INCLUDE_RE =
  /<!-- prompt-include: ([a-z][a-z0-9-]*) -->([\s\S]*?)<!-- \/prompt-include -->/g;

export function loadDesignIncludes(): DesignInclude[] {
  const file = path.join(process.cwd(), "DESIGN.md");
  const stat = fs.statSync(file);

  if (cache && cache.mtimeMs === stat.mtimeMs) {
    return cache.includes;
  }

  const raw = fs.readFileSync(file, "utf-8");
  const includes: DesignInclude[] = [];
  for (const m of raw.matchAll(INCLUDE_RE)) {
    includes.push({ section: m[1], content: m[2].trim() });
  }
  cache = { mtimeMs: stat.mtimeMs, includes };
  return includes;
}
```

- [ ] **Step 2.2: Type-check**

Run (in project root):
```bash
npx tsc --noEmit
```
Expected: no errors (the project already typechecks; this module only adds to that).

If errors appear mentioning `node:fs` or `node:path`, verify `tsconfig.json` has `"types": [...]` containing `"node"` or `compilerOptions.moduleResolution` set to `bundler`/`node16`. Next.js default `tsconfig.json` handles this — no change expected.

- [ ] **Step 2.3: Commit**

```bash
git add lib/design-spec.ts
git commit -m "feat: add DESIGN.md include extractor

lib/design-spec.ts exposes loadDesignIncludes() which parses
DESIGN.md for <!-- prompt-include: X --> marker pairs and returns
an ordered array. Cached by mtime; re-reads when DESIGN.md changes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Update `/api/generate` to inject brand spine

**Files:**
- Modify: `app/api/generate/route.ts:24-50` (the `buildPrompt` function) + add import at top

- [ ] **Step 3.1: Add import**

Edit `app/api/generate/route.ts`:
- old_string:
```
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";
```
- new_string:
```
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { loadDesignIncludes } from "@/lib/design-spec";
```

- [ ] **Step 3.2: Replace `buildPrompt` body**

Edit `app/api/generate/route.ts`:
- old_string:
```
function buildPrompt(topic: string, outline: string | undefined, style: string): string {
  const cfg = STYLE_CONFIGS[style] ?? STYLE_CONFIGS["clean-edu"];
  return `你是一個專業的簡報設計師，精通用 HTML + inline style 製作投影片。
每張投影片都是一個獨立的 div，使用 flex 排版，高度固定為 100%，寬度固定為 100%，只用 inline style。
色彩：背景色 ${cfg.bg}、強調色 ${cfg.accent}、主文字 ${cfg.text}、副文字 ${cfg.subtext}。

請為以下主題製作一份專業簡報：
```
- new_string:
```
function buildPrompt(topic: string, outline: string | undefined, style: string): string {
  const cfg = STYLE_CONFIGS[style] ?? STYLE_CONFIGS["clean-edu"];

  let brandSpine = "";
  try {
    const includes = loadDesignIncludes();
    if (includes.length) {
      brandSpine =
        "\n\n## Brand Spine（必須遵守，覆寫任何與之衝突的預設行為）\n\n" +
        includes.map((i) => `### ${i.section}\n\n${i.content}`).join("\n\n");
    }
  } catch (err) {
    console.warn("[buildPrompt] DESIGN.md load failed, falling back:", (err as Error).message);
  }

  return `你是一個專業的簡報設計師，精通用 HTML + inline style 製作投影片。
每張投影片都是一個獨立的 div，使用 flex 排版，高度固定為 100%，寬度固定為 100%，只用 inline style。
色彩：背景色 ${cfg.bg}、強調色 ${cfg.accent}、主文字 ${cfg.text}、副文字 ${cfg.subtext}。${brandSpine}

請為以下主題製作一份專業簡報：
```

- [ ] **Step 3.3: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors. The `@/lib/design-spec` alias should already be set up by the existing `tsconfig.json` (Next.js default `"@/*": ["./*"]`).

If an error says "Cannot find module '@/lib/design-spec'", verify `tsconfig.json` `paths`. If the project doesn't have the alias, change the import to relative: `import { loadDesignIncludes } from "../../../lib/design-spec";`

- [ ] **Step 3.4: Commit**

```bash
git add app/api/generate/route.ts
git commit -m "feat: inject DESIGN.md brand spine into /api/generate prompt

buildPrompt() now calls loadDesignIncludes() and appends the
extracted sections as a '## Brand Spine' block after the color
config. Falls back silently to the base prompt if DESIGN.md is
missing or has no markers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: End-to-end smoke test

**Files:**
- Temporarily add a console.log to `app/api/generate/route.ts` (revert before committing)

- [ ] **Step 4.1: Add temporary prompt logging**

Edit `app/api/generate/route.ts` to log the built prompt once per request. Find the POST handler where `buildPrompt` is called:

- old_string: `    const prompt = buildPrompt(topic, outline, style ?? "clean-edu");`
- new_string:
```
    const prompt = buildPrompt(topic, outline, style ?? "clean-edu");
    console.log("=== PROMPT START ===\n" + prompt + "\n=== PROMPT END ===");
```

This is **temporary** — will be removed in Step 4.4.

- [ ] **Step 4.2: Start dev server**

Ensure `.env.local` has at least one API key (already set; verify `.env.local` has `GEMINI_API_KEY=` or similar).

Run in background:
```bash
cd /c/Users/user/Desktop/簡報樣板 && npm run dev
```

Wait for output: `✓ Ready in <Xs>` and listening on `http://localhost:3000`.

- [ ] **Step 4.3: POST a test request**

Run:
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"測試品牌脊柱","style":"clean-edu"}'
```

Expected (in curl output): a JSON response with `title`, `summary`, `tags`, `slides` (array of 8).

Expected (in `npm run dev` console output): the prompt includes a section starting with `## Brand Spine（必須遵守，覆寫任何與之衝突的預設行為）` followed by `### aesthetic`, `### tokens`, `### patterns`, `### ui-elements`, `### tone`.

If `## Brand Spine` is **missing** from the logged prompt:
- Check `grep -c "prompt-include" DESIGN.md` == 10 (Task 1 marker count)
- Check `lib/design-spec.ts` path (run `ls lib/design-spec.ts`)
- Check console for `[buildPrompt] DESIGN.md load failed` warning → read the error message

If the prompt IS logged with Brand Spine but the API returns 500 / empty slides:
- Provider chain failure (unrelated to this change) — check which providers have keys set
- Token limit — DESIGN.md 5 sections may exceed some free-tier providers' context windows; check failed-provider messages. This is **expected behavior** (the chain falls back); note which providers succeeded.

- [ ] **Step 4.4: Remove temporary log and stop dev server**

Revert the log added in Step 4.1:
- old_string:
```
    const prompt = buildPrompt(topic, outline, style ?? "clean-edu");
    console.log("=== PROMPT START ===\n" + prompt + "\n=== PROMPT END ===");
```
- new_string: `    const prompt = buildPrompt(topic, outline, style ?? "clean-edu");`

Stop the dev server (kill the background process).

Verify clean diff:
```bash
git diff app/api/generate/route.ts
```
Expected: empty output (log fully reverted).

No commit for this task — it's verification only. If diff is non-empty, re-edit until clean.

---

## Task 5: Manual quality review on 3 existing topics

**Files:** none (review only)

Apply spec § 6.2 checklist to 3 topics from `data/presentations.json`:
1. `用 AI 工具解放你的教學創造力`
2. `NotebookLM 深度解析：教師必學的 AI 研究助理`
3. `Canva Code：不用寫程式也能做互動教學內容`

- [ ] **Step 5.1: Re-generate each topic**

Dev server running (restart from Task 4.2 if stopped). For each of the 3 topics:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"<TOPIC>","style":"clean-edu"}' \
  > /tmp/slide-<shortname>.json
```

Or use the `/create` UI (http://localhost:3000/create) for each topic and click 「開始生成 ✨」. Preview HTML appears at http://localhost:3000/view/preview.

- [ ] **Step 5.2: Score each topic against checklist**

For each generated result, tick ✓/✗ against spec § 6.2 checklist:

| # | Checklist item | 教學創造力 | NotebookLM | Canva Code |
|---|---|---|---|---|
| 1 | ≥ 3 投影片明確套某個 Pattern A-J | | | |
| 2 | 色彩只用 DESIGN.md token（無雜色） | | | |
| 3 | 無超過 7 個要點的投影片 | | | |
| 4 | 無「非常」「極其」「超級」等誇飾詞 | | | |
| 5 | Footer 有「Siyulio Slide Studio」 | | | |

- [ ] **Step 5.3: Determine pass/fail**

**Pass standard**: 3 份結果各自 ≥ 4/5 checklist 項目通過。

If **pass**: proceed to Task 6.

If **fail**: do NOT mark Phase 1 complete. Common failure modes and remediation:
- Checklist item 1 (Patterns) fails → the prompt is too long, some providers drop detail; restrict `loadDesignIncludes()` to return only `patterns` + `tone` + `ui-elements` (drop `aesthetic` + `tokens`), re-test
- Checklist item 4 (誇飾詞) fails → the tone section wasn't reaching the LLM; verify the `## tone` block is in the logged prompt from Task 4
- Checklist item 5 (Footer) fails → base prompt doesn't mention footer; consider adding `- 每張右下角需顯示「Siyulio Slide Studio」` to the base prompt's 投影片要求 block

Record results in a scratch file (not committed) for reference.

---

## Task 6: Mark spec as shipped

**Files:**
- Modify: `docs/superpowers/specs/2026-04-17-prompt-alignment-design.md` (status line at top)

- [ ] **Step 6.1: Update spec status**

Edit `docs/superpowers/specs/2026-04-17-prompt-alignment-design.md`:
- old_string: `**Status**: 規劃完成，等實作`
- new_string: `**Status**: ✅ 已上線 2026-04-17`

(Update the date if implementation happens on a later date.)

- [ ] **Step 6.2: Update roadmap phase status**

Edit `docs/design.md`:
- old_string: `**Status**：🟡 規劃完成，等實作`
- new_string: `**Status**：✅ 已上線 2026-04-17`

- [ ] **Step 6.3: Commit**

```bash
git add docs/superpowers/specs/2026-04-17-prompt-alignment-design.md docs/design.md
git commit -m "docs: mark prompt-alignment Phase 1 as shipped

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6.4: Verify clean working tree**

```bash
git status
git log --oneline -6
```

Expected: working tree clean; recent 4 commits include:
- `docs: mark prompt-alignment Phase 1 as shipped`
- `feat: inject DESIGN.md brand spine into /api/generate prompt`
- `feat: add DESIGN.md include extractor`
- `docs: add prompt-include markers to DESIGN.md brand spine`

---

## Self-Review Summary

- **Spec coverage**: Task 1 ↔ spec § 4.4 (DESIGN.md markers); Task 2 ↔ § 4.2 (`lib/design-spec.ts`); Task 3 ↔ § 4.3 (`buildPrompt`); Task 4 ↔ § 6.1/6.2 (smoke); Task 5 ↔ § 6.2 (quality); Task 6 ↔ § 8 rollout step 6. All spec sections have mapped tasks.
- **No placeholders**: Every step has concrete Edit anchor strings, full file contents, or exact commands. No "handle edge cases" or "add tests later".
- **Type consistency**: `loadDesignIncludes()` / `DesignInclude` / `brandSpine` naming identical across Tasks 2, 3, 4.
- **Dependencies**: Task N relies only on Tasks 1..N-1. Task 5 depends on Tasks 1-4 passing; Task 6 depends on Task 5 passing.
- **Known risk**: Token count — if any provider rejects the longer prompt, the 6-provider fallback should handle it. Task 5 § remediation covers the "prompt too long" case.
