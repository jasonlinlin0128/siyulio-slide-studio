# Spec: Prompt Alignment — `/api/generate` reads DESIGN.md

**Date**: 2026-04-17
**Phase**: 1 of [自動化 Roadmap](../../design.md)
**Status**: 規劃完成，等實作

---

## 1. Goal

讓 `/api/generate` runtime 從 `DESIGN.md` 抽取標記段落，組成 prompt 的「品牌脊柱」部分，使 LLM 輸出符合 Siyulio 的 Pattern / Tokens / Tone / UI 規則。

**成功標準**：DESIGN.md 改了 → 下一次 generate 就反映出來；不用重啟、不用手改 prompt 字串。

---

## 2. Current Behavior

### 關鍵程式碼：`app/api/generate/route.ts:24-50`

```ts
function buildPrompt(topic: string, outline: string | undefined, style: string): string {
  const cfg = STYLE_CONFIGS[style] ?? STYLE_CONFIGS["clean-edu"];
  return `你是一個專業的簡報設計師...
色彩：背景色 ${cfg.bg}、強調色 ${cfg.accent}、主文字 ${cfg.text}、副文字 ${cfg.subtext}。
...
第 1 張：封面...
第 2 張：目錄
...`;
}
```

這個 prompt：
- ✓ 有色彩 4 個 token（來自 `STYLE_CONFIGS`）
- ✓ 有 8-slide 粗略結構
- ✗ **沒有** Pattern A-J 定義
- ✗ **沒有** tone rule（禁止誇飾詞等）
- ✗ **沒有** recurring UI elements（footer、小節編號）
- ✗ **沒有** anti-patterns（避免什麼）

---

## 3. Desired Behavior

Prompt build 時讀取 `DESIGN.md`，抽所有 `<!-- prompt-include: <section-name> -->` 到 `<!-- /prompt-include -->` 之間的內容，附在 base prompt 後面作為「Brand Spine（必須遵守）」section。

### DESIGN.md marker 範例

```markdown
## 5. Slide Patterns（投影片模板類型）

<!-- prompt-include: patterns -->
每種模板對應反覆出現的版面結構，便於 AI 工具或設計者快速套用。

### Pattern A：封面頁（Cover）
- 全版背景（白或淺色）
- 大型中文主標題（Extra-bold，居中或左對齊）
...
<!-- /prompt-include -->
```

Runtime 會抽出 marker 之間的內容（不含 marker 本身），組成：

```
## Brand Spine（必須遵守）

### patterns
每種模板對應反覆出現的版面結構...
### Pattern A：封面頁（Cover）
...
```

---

## 4. Architecture

### 4.1 Data flow

```
POST /api/generate { topic, outline, style }
      │
      ▼
buildPrompt(topic, outline, style)
      │
      ├─→ loadDesignIncludes()   [lib/design-spec.ts]
      │        │
      │        ├─ readFileSync('DESIGN.md')
      │        ├─ 檢查 mtime → cache hit 則直接回傳
      │        └─ regex 抽取 <!-- prompt-include:X --> 區段
      │
      ▼
composePrompt(base, cfg, includes)
      │
      ▼
provider chain (Gemini → Groq → ...)
      │
      ▼
parseResult → JSON response
```

### 4.2 New file: `lib/design-spec.ts`

```ts
import fs from "node:fs";
import path from "node:path";

export interface DesignInclude {
  section: string;   // e.g. "patterns"
  content: string;   // markdown (含子標題)
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
  const stat = fs.statSync(file);           // throws if missing → route handles 500

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

**特性**：
- mtime-based cache — DESIGN.md 沒改就 zero IO 後續呼叫
- regex 只抽 marker 配對成功的區段；單邊或巢狀不配對的直接略過
- Include 順序 = DESIGN.md 檔案中的順序

### 4.3 Modified file: `app/api/generate/route.ts`

```ts
import { loadDesignIncludes } from "@/lib/design-spec";

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
    // 失敗時靜默退回原 prompt，不中斷生成
  }

  return `你是一個專業的簡報設計師，精通用 HTML + inline style 製作投影片。
每張投影片都是一個獨立的 div，使用 flex 排版，高度固定為 100%，寬度固定為 100%，只用 inline style。
色彩：背景色 ${cfg.bg}、強調色 ${cfg.accent}、主文字 ${cfg.text}、副文字 ${cfg.subtext}。${brandSpine}

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
```

### 4.4 Modified file: `DESIGN.md`

在下列章節的開頭/結尾各加一組 marker（原內容不動）：

| Section | Marker name | 為什麼要進 prompt |
|---------|-------------|------------------|
| 2. Aesthetic Direction | `aesthetic` | 讓 LLM 避免 anti-patterns（過度裝飾、暗色全版、過多色） |
| 3. Design Tokens | `tokens` | 色彩／字型／間距細節，超過 STYLE_CONFIGS 的 4 個 token |
| 5. Slide Patterns | `patterns` | 核心 — 讓 LLM 套用 Pattern A-J |
| 6. Recurring UI Elements | `ui-elements` | Footer、小節編號、代碼區塊等細節 |
| 7. Content Tone | `tone` | 短句、禁用誇飾詞、行動導向 |

**不納入**：
- Section 1 (Product Context) — LLM 不需要市場定位
- Section 4 (Content Architecture) — base prompt 已有 8-slide 結構
- Section 8 (Decisions Log) — 歷史決策對 prompt 沒用

---

## 5. Error Handling

| 情境 | 行為 |
|------|------|
| `DESIGN.md` 不存在 | `statSync` throw → `loadDesignIncludes` 讓 error 冒出 → `buildPrompt` catch 並 console.warn，退回原 prompt（無 brandSpine） |
| `DESIGN.md` 存在但無 marker | `includes = []` → `brandSpine = ""` → 等價於原 prompt |
| Marker 單邊（只有開頭沒結尾） | regex 不匹配 → 該段被略過，其他 marker 正常 |
| Marker 巢狀 / 異常字元 | regex `[a-z][a-z0-9-]*` 嚴格限制 section name；異常的整段略過 |
| DESIGN.md 修改中被讀到中間狀態 | mtime 改變 → 下次呼叫 re-read；最差情況是該次 request 用到舊版，可接受 |

---

## 6. Testing

### 6.1 Unit / integration tests — **Phase 1 不加**

專案目前沒 test runner。Phase 1 純粹靠 § 6.2 手動驗證；等 Phase 2+ 需要 test framework 時（例如 Phase 2 的 `/api/save` 寫檔邏輯值得測），再一併引入 vitest。

可驗證邏輯先記錄如下，供未來加測試時參考：

- `loadDesignIncludes()` 給 fixture markdown → 正確抽出陣列
- 同一 mtime 第二次呼叫 → cache hit
- mtime 變更 → re-read
- 無 marker 的 .md → 空陣列
- 單邊 marker → 忽略該段
- `POST /api/generate` mock provider → prompt 含 `## Brand Spine`

### 6.2 手動品質驗證（Phase 1 必做）

對 `data/presentations.json` 現有 3 個 topic 各重跑一次：

| Topic | Before HTML | After HTML |
|-------|-------------|------------|
| 用 AI 工具解放你的教學創造力 | sessionStorage 或 /view/{id} | 新的 preview |
| NotebookLM 深度解析 | ... | ... |
| Canva Code | ... | ... |

**Checklist（人工 review 每份 after HTML）**：
- [ ] 至少 3 張有明確套到某個 Pattern（Cover / Section Divider / Feature Cards / ...）
- [ ] 色彩只用 DESIGN.md 定義的 token（螢光黃、不出現雜色）
- [ ] 無超過 7 個要點的投影片
- [ ] 無「非常」「極其」「超級」等誇飾詞
- [ ] Footer 有「Siyulio Slide Studio」

**Pass 標準**：3 份 after 全部 ≥ 4/5 checklist 項目通過。

---

## 7. Non-Goals

- ❌ LLM 輸出自動評分 / auto-grading
- ❌ A/B 測試不同 prompt 變體（之後有需要再加）
- ❌ Style-specific prompt（4 個風格共用同一份 brand spine；色彩用 STYLE_CONFIGS 分）
- ❌ DESIGN.md 版本化（mtime 當 invalidation 訊號夠了）
- ❌ Token 最佳化（trim / summarize）— Phase 1 先求品質，token 成本觀察後再調

---

## 8. Rollout

1. 在 `DESIGN.md` 加 5 組 marker（section 2, 3, 5, 6, 7），不改原內容
2. 新增 `lib/design-spec.ts`
3. 改 `app/api/generate/route.ts` 的 `buildPrompt()`
4. 本地 `next dev`，對 3 個 topic 手動重跑（§ 6.2）
5. Checklist 通過 → commit + push + Vercel deploy
6. 更新本 spec 頂部 status: 🟡 規劃完成 → ✅ 上線，記錄日期

---

## 9. Open Questions（不阻實作）

- **Token 成本**：DESIGN.md 5 節段預估 2.5k-3.5k tokens；加 base prompt ~4k tokens 總量。Free tier 足夠。觀察後如要 trim，可在 `loadDesignIncludes` 加「trimmed」版本（移除例子、保留規則）
- **其他 API 複用**：Phase 5 的 `/api/regenerate-slide` 可直接 `import { loadDesignIncludes }`，無需重構
- **DESIGN.md 新增 marker 時的 PR review**：加 marker 等於改 LLM 行為。建議在 CHANGELOG 或 commit message 註明「prompt-affecting」
