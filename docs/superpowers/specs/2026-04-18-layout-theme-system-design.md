# Spec: Phase 2 — Layout Components + Theme System + Structured LLM Output

**Date**: 2026-04-18
**Phase**: 2 of [自動化 Roadmap](../../design.md)
**Status**: 🟡 規劃完成，等實作

---

## 1. Goal

讓 Siyulio 的視覺品質從「LLM 吐 raw HTML 的天花板」躍升到「layout component library 渲染的專業級簡報」，品質對標 [presentation.stingtao.info](https://presentation.stingtao.info/)。

**技術核心變化**：
- 舊：`/api/generate` → LLM 吐 `slides: string[]`（raw HTML）
- 新：`/api/generate` → LLM 吐 `SlideSpec[]`（`{ layout, props }`）→ Server-side React render 成 HTML

**成功標準**（對應 roadmap 的 Phase 2 ✓）：
- 同樣主題（如「用 AI 工具解放教學創造力」）生成的簡報，每張 layout 各不相同、theme 視覺連貫、typography 有層次
- 手動對比 stingtao.info 範例，能看出「套到了 Pattern」而非「一堆 flex + list」

---

## 2. Current Behavior（Phase 1 後）

### 關鍵檔案
- `app/api/generate/route.ts` — 6-provider fallback，prompt 含 Brand Spine（來自 DESIGN.md）
- `lib/design-spec.ts` — `loadDesignIncludes()` 抽 DESIGN.md marker 段
- `components/CreateWizard.tsx` — 主題 → 大綱 → 選風格（4 個色系）→ 生成
- `app/view/preview/page.tsx` — 從 `sessionStorage.preview_presentation` 讀 `{ slides: string[] }`

### 限制
- LLM 產出都是 `<div><h1>...</h1><p>...</p></div>` 層級的結構
- 4 個風格只改 4 個色彩 token，沒有真正的視覺差異
- 圖片都是假 URL（`https://example.com/ai.png`）
- 每張投影片用同一個 layout 骨架（flex column + list + 2col）

---

## 3. Desired Behavior

### 使用者流程

`/create`：輸入主題 → **選主題 Theme（8 個具名 theme）** → AI 生成 → 預覽 8-10 張投影片（每張 layout 不同、所有張共用選到的 theme）。

### API 回傳 shape（新）

```ts
{
  id: string;
  title: string;
  summary: string;
  tags: string[];
  theme: ThemeName;           // e.g. "晨霧"
  slides: string[];           // 已經 server-render 好的 HTML（preview 頁照用）
  slideSpecs: SlideSpec[];    // 結構化，供 Phase 3 持久化 / Phase 7 單張重生
  _provider: string;
}
```

`slides`（rendered HTML）向下相容 Phase 1 的 preview 頁；`slideSpecs`（structured）是新欄位。

---

## 4. Architecture

### 4.1 Data flow

```
POST /api/generate { topic, outline, theme }
        │
        ▼
buildStructuredPrompt(topic, outline, theme)
        │   (includes DESIGN.md brand spine from Phase 1
        │    + layout catalog + theme catalog)
        ▼
tryGeminiStructured(prompt, ResponseSchema)  ← responseSchema enforced
        │   若失敗 → tryGroqJsonMode → tryOpenRouter → ...
        ▼
Zod validate → `{ title, summary, tags, theme, slides: SlideSpec[] }`
        │
        ▼
renderSlides(slideSpecs, theme)
        │   (loads theme tokens, renders each spec via its React layout,
        │    injects <SlideContainer> wrapper with footer)
        ▼
API response: { ..., slides: string[], slideSpecs: SlideSpec[] }
```

### 4.2 Core types (`lib/slide-types.ts`)

```ts
export const LAYOUT_NAMES = [
  "Cover",
  "SectionDivider",
  "StatCallout",
  "Comparison2Col",
  "NumberedCards",
  "FeatureCards3",
  "BulletListIcons",
  "ThankYou",
] as const;
export type LayoutName = (typeof LAYOUT_NAMES)[number];

export const THEME_IDS = [
  "morning-mist",  // 晨霧
  "ivory",         // 象牙
  "forest",        // 森林
  "handwritten",   // 手寫
  "starry",        // 星空
  "sunrise",       // 日出
  "clean-edu",     // 乾淨教育感（Phase 1 保留）
  "minimal-gray",  // 極簡灰
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export type SlideSpec =
  | { layout: "Cover"; props: CoverProps }
  | { layout: "SectionDivider"; props: SectionDividerProps }
  | { layout: "StatCallout"; props: StatCalloutProps }
  | { layout: "Comparison2Col"; props: Comparison2ColProps }
  | { layout: "NumberedCards"; props: NumberedCardsProps }
  | { layout: "FeatureCards3"; props: FeatureCards3Props }
  | { layout: "BulletListIcons"; props: BulletListIconsProps }
  | { layout: "ThankYou"; props: ThankYouProps };

export interface CoverProps {
  title: string;            // ≤ 60 字元
  subtitle?: string;        // ≤ 120
  presenter?: string;       // ≤ 40
  // heroImagePrompt 欄位 Phase 4 再填，Phase 2 用 theme.ambiance 的 CSS gradient 佔位
}

export interface SectionDividerProps {
  sectionNumber: string;    // e.g. "Part 1", "第一章"
  title: string;            // section 大標
  description?: string;     // 下方小描述
}

export interface StatCalloutProps {
  stat: string;             // e.g. "2,000 億美元" — 大字
  label?: string;           // e.g. "總資本支出"
  description: string;      // 解釋段落
}

export interface Comparison2ColProps {
  title: string;
  leftColumnTitle: string;
  leftItems: string[];      // 最多 5 項
  rightColumnTitle: string;
  rightItems: string[];     // 最多 5 項
}

export interface NumberedCardsProps {
  title: string;
  cards: Array<{
    number: string;         // "1" ~ "4"（字串，LLM 輸出穩定）
    title: string;
    description: string;
  }>;                       // 固定 4 張
}

export interface FeatureCards3Props {
  title: string;
  cards: Array<{
    title: string;
    description: string;
  }>;                       // 固定 3 張
}

export interface BulletListIconsProps {
  title: string;
  bullets: Array<{
    icon?: string;          // emoji 或 unicode 符號
    text: string;
  }>;                       // 3-6 項
}

export interface ThankYouProps {
  message?: string;         // 預設「謝謝聆聽」
  contactInfo?: string;
}
```

### 4.3 LLM output schema (`lib/slide-schema.ts`)

用 Zod 定義，提供兩用：（a）production 驗證 LLM 回傳；（b）轉 Gemini 的 `responseSchema` JSON（用 `zod-to-json-schema`）。

```ts
import { z } from "zod";
import { LAYOUT_NAMES, THEME_IDS } from "./slide-types";

const CoverSpec = z.object({
  layout: z.literal("Cover"),
  props: z.object({
    title: z.string().min(1).max(60),
    subtitle: z.string().max(120).optional(),
    presenter: z.string().max(40).optional(),
  }),
});

const SectionDividerSpec = z.object({
  layout: z.literal("SectionDivider"),
  props: z.object({
    sectionNumber: z.string().min(1).max(15),
    title: z.string().min(1).max(40),
    description: z.string().max(80).optional(),
  }),
});

const StatCalloutSpec = z.object({
  layout: z.literal("StatCallout"),
  props: z.object({
    stat: z.string().min(1).max(20),
    label: z.string().max(20).optional(),
    description: z.string().min(1).max(200),
  }),
});

const Comparison2ColSpec = z.object({
  layout: z.literal("Comparison2Col"),
  props: z.object({
    title: z.string().min(1).max(60),
    leftColumnTitle: z.string().min(1).max(30),
    leftItems: z.array(z.string().max(60)).min(2).max(5),
    rightColumnTitle: z.string().min(1).max(30),
    rightItems: z.array(z.string().max(60)).min(2).max(5),
  }),
});

const NumberedCardsSpec = z.object({
  layout: z.literal("NumberedCards"),
  props: z.object({
    title: z.string().min(1).max(60),
    cards: z
      .array(
        z.object({
          number: z.string().min(1).max(3),
          title: z.string().min(1).max(20),
          description: z.string().min(1).max(100),
        }),
      )
      .length(4),
  }),
});

const FeatureCards3Spec = z.object({
  layout: z.literal("FeatureCards3"),
  props: z.object({
    title: z.string().min(1).max(60),
    cards: z
      .array(
        z.object({
          title: z.string().min(1).max(30),
          description: z.string().min(1).max(120),
        }),
      )
      .length(3),
  }),
});

const BulletListIconsSpec = z.object({
  layout: z.literal("BulletListIcons"),
  props: z.object({
    title: z.string().min(1).max(60),
    bullets: z
      .array(
        z.object({
          icon: z.string().max(4).optional(),
          text: z.string().min(1).max(120),
        }),
      )
      .min(3)
      .max(6),
  }),
});

const ThankYouSpec = z.object({
  layout: z.literal("ThankYou"),
  props: z.object({
    message: z.string().max(40).optional(),
    contactInfo: z.string().max(80).optional(),
  }),
});

export const SlideSpecSchema = z.discriminatedUnion("layout", [
  CoverSpec,
  SectionDividerSpec,
  StatCalloutSpec,
  Comparison2ColSpec,
  NumberedCardsSpec,
  FeatureCards3Spec,
  BulletListIconsSpec,
  ThankYouSpec,
]);

export const GenerationResultSchema = z.object({
  title: z.string().min(1).max(60),
  summary: z.string().min(1).max(80),
  tags: z.array(z.string().min(1).max(12)).length(4),
  theme: z.enum(THEME_IDS),
  slides: z.array(SlideSpecSchema).min(6).max(12),
});

export type GenerationResult = z.infer<typeof GenerationResultSchema>;
```

### 4.4 Layout catalog（8 個）

每個 layout 是 React functional component，接收 `{ props, theme }`，回傳 JSX。渲染時 server-side 呼叫 `renderToStaticMarkup`。

| Layout | 對應 DESIGN.md Pattern | 適用場景 |
|--------|----------------------|---------|
| `Cover` | A | 首張；標題 + 副標 + 簡報者；theme.ambiance.heroPlaceholder 當背景 |
| `SectionDivider` | B | 章節分隔；`Part N` 標籤 + 大標題，theme 決定背景 |
| `StatCallout` | — | 單一大數字／關鍵引言，底下一段解釋 |
| `Comparison2Col` | D | 兩欄對比，各自標題 + 條列 |
| `NumberedCards` | F | 2×2 編號卡，步驟流程 / 階段演進 |
| `FeatureCards3` | E | 1×3 卡片，風險 / 優勢 / 特色三點 |
| `BulletListIcons` | — | 條列式重點，每項前有 emoji/icon |
| `ThankYou` | — | 結尾頁 |

**通用封裝**：所有 layout 被包在 `SlideContainer`（固定 16:9 = 1280×720，`overflow:hidden`，底部 right 絕對定位放「Siyulio Slide Studio」footer）。

**Component 介面範例**（`components/slides/layouts/Cover.tsx`）：

```tsx
import type { CoverProps } from "@/lib/slide-types";
import type { Theme } from "@/lib/themes/types";

export function Cover({ props, theme }: { props: CoverProps; theme: Theme }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px",
        background: theme.ambiance.heroPlaceholder,
        color: theme.tokens.textPrimary,
        fontFamily: theme.typography.titleFont,
      }}
    >
      <h1 style={{
        fontSize: "52px",
        fontWeight: theme.typography.titleWeight,
        lineHeight: 1.15,
        margin: 0,
      }}>{props.title}</h1>
      {props.subtitle && (
        <p style={{
          fontSize: "22px",
          color: theme.tokens.textSecondary,
          marginTop: "24px",
          fontFamily: theme.typography.bodyFont,
        }}>{props.subtitle}</p>
      )}
      {props.presenter && (
        <p style={{
          fontSize: "16px",
          color: theme.tokens.textSecondary,
          position: "absolute",
          bottom: "30px",
          left: "80px",
          fontFamily: theme.typography.bodyFont,
        }}>{props.presenter}</p>
      )}
    </div>
  );
}
```

### 4.5 Theme catalog（8 個）

**型別**（`lib/themes/types.ts`）：

```ts
export interface Theme {
  id: ThemeId;
  name: string;           // 顯示名，如「晨霧」
  mood: string;           // 一句話氛圍，用於 LLM 選 theme 時參考
  tokens: {
    bg: string;           // 主背景
    surface: string;      // 卡片／容器背景
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentSoft: string;
    border: string;
  };
  typography: {
    titleFont: string;    // CSS font-family
    bodyFont: string;
    monoFont: string;
    titleWeight: 700 | 800 | 900;
    bodyWeight: 400 | 500;
  };
  ambiance: {
    heroPlaceholder: string;      // CSS gradient 或 SVG url()，用於 Cover 背景
    sectionPlaceholder?: string;  // SectionDivider 背景
  };
  logo: {
    position: "bottom-right" | "top-left";
    opacity: number;
  };
}
```

**初版 8 個 theme 定義概念**（具體 tokens 在實作時調整）：

| ID | 顯示名 | 氛圍 | tokens 走向 |
|----|--------|------|-------------|
| `morning-mist` | 晨霧 | 研究報告、金融分析 | 深藍灰底 + 冷白字 + 淡銀 accent |
| `ivory` | 象牙 | 董事會、企業正式 | 米白底 + 深棕字 + 金 accent |
| `forest` | 森林 | 環境、自然、成長 | 暗綠底 + 米黃字 + 嫩葉 accent |
| `handwritten` | 手寫 | 筆記、教學親切 | 米紙背景 + 靛藍字 + 手寫感字體 |
| `starry` | 星空 | 未來、科技、願景 | 深夜藍底 + 白字 + 紫色 accent |
| `sunrise` | 日出 | 新創、希望、能量 | 暖橙漸層 + 深棕字 + 金黃 accent |
| `clean-edu` | 乾淨教育感 | 一般教學（Phase 1 沿用） | 白底 + 黑字 + 螢光黃 accent |
| `minimal-gray` | 極簡灰 | 商務 / 投影效率 | 純白底 + 深灰字 + 純黑 accent |

每個 theme 放在 `lib/themes/<id>.ts` export default 一個 Theme 物件。`lib/themes/index.ts` 匯總成 `Record<ThemeId, Theme>` 供 lookup。

### 4.6 Server-side render (`lib/render-slides.ts`)

```ts
import { renderToStaticMarkup } from "react-dom/server";
import type { SlideSpec } from "./slide-types";
import type { Theme } from "./themes/types";
import { SlideContainer } from "@/components/slides/SlideContainer";
import { Cover } from "@/components/slides/layouts/Cover";
import { SectionDivider } from "@/components/slides/layouts/SectionDivider";
// ...

const LAYOUT_MAP = {
  Cover,
  SectionDivider,
  StatCallout,
  Comparison2Col,
  NumberedCards,
  FeatureCards3,
  BulletListIcons,
  ThankYou,
};

export function renderSlides(specs: SlideSpec[], theme: Theme): string[] {
  return specs.map((spec) => {
    const LayoutComponent = LAYOUT_MAP[spec.layout];
    if (!LayoutComponent) {
      // 理論不會發生（Zod 已驗證），defensive fallback
      return `<div>Unknown layout: ${spec.layout}</div>`;
    }
    return renderToStaticMarkup(
      <SlideContainer theme={theme}>
        {/* @ts-expect-error — union narrow at this point */}
        <LayoutComponent props={spec.props} theme={theme} />
      </SlideContainer>,
    );
  });
}
```

`SlideContainer` 提供：
- 固定 16:9 比例（1280×720）容器
- `position:relative` 讓 footer 能絕對定位
- 共通 footer「Siyulio Slide Studio」右下角（theme.logo 控制位置/透明度）

### 4.7 `/api/generate` 路由改寫重點

1. `buildStructuredPrompt(topic, outline, themeId)`：把 base prompt（主題／大綱）+ Phase 1 Brand Spine（loadDesignIncludes）+ **layout catalog 說明**（何時用哪個 layout）+ **theme 資訊** 組起來
2. 優先呼叫 **Gemini 2.0 Flash** 的 `generateContent`，傳入 `responseSchema`（由 `zod-to-json-schema` 從 `GenerationResultSchema` 產）→ 得保證 JSON shape 回傳
3. Gemini 失敗 → Groq / OpenRouter / etc. 用 `response_format: { type: "json_object" }` 降級，結果仍要過 `GenerationResultSchema.parse()` 驗證
4. 驗證通過 → `renderSlides(result.slides, themes[result.theme])`
5. 回傳 `{ ...result, slides: renderedHtml[], slideSpecs: result.slides }`

**Fallback 順序**：Gemini（有 schema）→ Groq（json_object） → OpenRouter free → 若全失敗回傳 500 明確錯誤

---

## 5. Sub-phases

### 5.1 Phase 2.1 — Layout 元件庫 + `SlideContainer`（bedrock）

**Scope**：
- `lib/slide-types.ts`（所有 `*Props` 介面）
- `components/slides/SlideContainer.tsx`
- `components/slides/layouts/*.tsx` 共 8 個
- 手工測試：每個 layout 搭配一個預設 theme 在本機 `next dev` 預覽（temp page `/test-layouts`）

**不在此 scope**：Theme 系統（先 hardcode 一個 theme 做 placeholder 色），LLM 相關改動

**預估**：2-3 天

### 5.2 Phase 2.2 — Theme 系統

**Scope**：
- `lib/themes/types.ts` + 8 個 `lib/themes/<id>.ts` + `lib/themes/index.ts`
- 把 `SlideContainer` 和 8 個 layouts 改成真正吃 `theme` prop
- 手工測試：同一個 SlideSpec 配 8 個不同 theme 渲染，視覺真的區分得出來

**不在此 scope**：LLM 整合

**預估**：1-2 天

### 5.3 Phase 2.3 — LLM 結構化輸出 + render pipeline

**Scope**：
- `lib/slide-schema.ts`（Zod schemas）
- `npm i zod zod-to-json-schema`
- `lib/render-slides.ts`
- `app/api/generate/route.ts` 大改：`buildStructuredPrompt`、Gemini schema 呼叫、其他 providers 的 JSON mode、Zod 驗證、render pipeline
- 端到端測試：POST topic 取得含 rendered HTML + slideSpecs 的 response

**預估**：2-3 天

### 5.4 Phase 2.4 — Wizard UI + preview page

**Scope**：
- `components/CreateWizard.tsx`：4 個 style 選項 → 8 個 theme 卡片（顯示 name + mood + mini preview）
- `app/view/preview/page.tsx`：繼續用 `slides: string[]`（已經 rendered HTML）即可，相容
- `lib/types.ts`：`Presentation` interface 加 `slideSpecs?: SlideSpec[]`、`theme: ThemeId`

**預估**：0.5-1 天

**Phase 2 總計**：5-8 天

---

## 6. LLM Choice Rationale

**選定：Gemini 2.0 Flash（主）+ Groq / OpenRouter（fallback）**

**為何不用 Claude API**：Claude Max 訂閱不含 API 額度，Anthropic API 要另開 pay-as-you-go 帳戶。此專案 side project，希望維持免費 tier 營運。

**為何 Gemini 為主**：
1. **`responseSchema` 原生支援** — 可以把 `GenerationResultSchema` 轉 JSON Schema 直接塞給 Gemini，guarantee shape 正確
2. **Free tier 寬鬆** — `gemini-2.0-flash` 免費 1500 req/day，個人用量綽綽有餘
3. **Phase 1 code 已有 Gemini 呼叫** — 改動最少
4. **本機 dev 若 SSL 掛**（已知問題，見 Phase 1 smoke test）會自動 fallback 到 Groq

**為何保留 Groq/OpenRouter fallback**：
- Gemini 有時 quota 打滿、短暫 outage → 降級到 `json_object` mode 仍能跑（會有格式風險，但 Zod 驗證會抓）
- 確保 uptime 優先於結構正確性；若 fallback 回傳不合 schema，`GenerationResultSchema.parse()` throw，route 返回 500 並 log

---

## 7. File Structure（Phase 2 完成後）

```
簡報樣板/
├── app/
│   ├── api/generate/route.ts         # 大改
│   ├── create/page.tsx               # 小改（用新 wizard）
│   └── view/preview/page.tsx         # 不動（`slides` 欄位仍是 HTML）
├── components/
│   ├── CreateWizard.tsx              # 大改 — theme 選單
│   ├── SlideViewer.tsx               # 不動
│   └── slides/                       # 🆕
│       ├── SlideContainer.tsx
│       └── layouts/
│           ├── Cover.tsx
│           ├── SectionDivider.tsx
│           ├── StatCallout.tsx
│           ├── Comparison2Col.tsx
│           ├── NumberedCards.tsx
│           ├── FeatureCards3.tsx
│           ├── BulletListIcons.tsx
│           └── ThankYou.tsx
├── lib/
│   ├── design-spec.ts                # Phase 1
│   ├── slide-types.ts                # 🆕 types
│   ├── slide-schema.ts               # 🆕 Zod
│   ├── render-slides.ts              # 🆕 SSR
│   ├── types.ts                      # Presentation type 擴充
│   └── themes/                       # 🆕
│       ├── types.ts
│       ├── index.ts
│       ├── morning-mist.ts
│       ├── ivory.ts
│       ├── forest.ts
│       ├── handwritten.ts
│       ├── starry.ts
│       ├── sunrise.ts
│       ├── clean-edu.ts
│       └── minimal-gray.ts
└── package.json                      # +zod, +zod-to-json-schema
```

---

## 8. Error Handling

| 情境 | 行為 |
|------|------|
| Gemini 回傳但 Zod validate fail | log 原文 + error，降級到 Groq |
| 所有 provider 都回傳但 Zod fail | 500 response `{ error: "生成結果格式驗證失敗" }` |
| Theme id 不在 catalog | Zod enum 會擋（不可能發生） |
| Layout name 不在 catalog | Zod discriminated union 會擋 |
| `render-slides` import 的 layout component 發生 runtime error | 該張 slide 用 `<div>Render failed</div>` 替代，其他張照常 |
| Missing API keys | 早在路由進入就擋（Phase 1 已有邏輯，保留） |
| Phase 1 `loadDesignIncludes` 空陣列 | 不阻擋；prompt 沒 Brand Spine 也可運作，LLM 仍有 layout catalog |

---

## 9. Testing

### 9.1 單元 / 整合測試 — Phase 2 仍不引入 test framework

沿用 Phase 1 方針（manual verification）。若未來 Phase 3+ 需要（例如 `/api/save` 寫檔邏輯值得測），屆時再引入 vitest。

### 9.2 Phase 2.1 手動驗證

建一個暫存頁 `app/test-layouts/page.tsx`，每個 layout 搭配硬寫的 props + 一個 placeholder theme 渲染。確認：
- [ ] 8 個 layout 都能在 `next dev` 下顯示無錯
- [ ] 每個 layout 在 1280×720 容器內排版不溢出
- [ ] Footer 位置正確（右下角，不擋內容）
- [ ] Cover / SectionDivider 的 hero/section placeholder 視覺不簡陋

### 9.3 Phase 2.2 手動驗證

修改 `app/test-layouts/page.tsx` 接受 `?theme=<id>` query，遍歷 8 個 theme 確認：
- [ ] 同一組 props 在 8 個 theme 下視覺真的不同
- [ ] 所有 theme tokens 無對比度問題（白字白底 / 深字深底）

### 9.4 Phase 2.3 端到端驗證

`next dev` + curl：

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"NotebookLM 深度解析","theme":"morning-mist"}'
```

- [ ] Response 含 `slides: string[]`（8-10 張 HTML）
- [ ] Response 含 `slideSpecs: SlideSpec[]`，每張 layout 合法
- [ ] `GenerationResultSchema.parse()` 對整個 response 有效
- [ ] 跑 3 個主題各兩次，至少一次走 Gemini 成功（另一次可走 fallback）

### 9.5 視覺品質驗證（Phase 2 整體成功標準）

同 roadmap Phase 2 的成功條件：
- [ ] 三個主題（教學創造力、NotebookLM、Canva Code）生成後，手動比對 stingtao.info「AI 投資泡沫化」範例
- [ ] 主觀判斷：「看起來是同一個水準」通過
- [ ] 每張 layout 不同 ≥ 6/8 張（可能有 2 張重複 layout 可接受）
- [ ] 8 個 theme 至少 6 個視覺獨特（不跟其他 theme 搞混）

---

## 10. Non-Goals

- ❌ 真實圖片（Phase 4）
- ❌ 持久化到 `data/presentations.json`（Phase 3）
- ❌ 單張重生 / 迭代編輯（Phase 7）
- ❌ 超過 12 張的簡報（Zod max: 12）
- ❌ 使用者自訂 theme（THEME_IDS 寫死在 enum）
- ❌ 動畫 / transitions（靜態 HTML）
- ❌ 匯出 PDF / PPTX（未來 phase，現階段 HTML + print-friendly CSS 即可）
- ❌ 多語言（維持繁中）
- ❌ `.env.local` 的 provider API keys 更新（沿用 Phase 1 key，Vercel env vars 已設）

---

## 11. Rollout

1. 建 feature branch `phase-2-layouts-themes`（per global CLAUDE.md：非 docs 實作不在 master 上動）
2. **Sub-phase 2.1** commit sequence：`feat: add slide types` → `feat: add SlideContainer` → 每個 layout 各一個 feat commit（8 commits）
3. **Sub-phase 2.2** commits：`feat: add Theme types` + 8 個 theme 檔（可分一或多 commit）+ `refactor: wire layouts to theme props`
4. **Sub-phase 2.3** commits：`feat: add Zod schemas` → `feat: add render-slides pipeline` → `feat: rewrite /api/generate for structured output`
5. **Sub-phase 2.4** commits：`feat: update CreateWizard to theme selection` → `feat: extend Presentation type`
6. 每個 sub-phase 後手動驗證（§ 9.x）通過才進下一個
7. Phase 2.3 跑完 § 9.4 端到端 + § 9.5 視覺品質驗證
8. 通過 → PR / FF-merge 到 master → Vercel 自動部署
9. 更新本 spec status: 🟡 規劃完成 → ✅ 已上線 `YYYY-MM-DD`
10. 更新 `docs/design.md` Phase 2 status

---

## 12. Open Questions（不阻實作）

1. **Theme 新增時是否需要規格檢查？** 目前 enum 寫死，新增 theme 要改 3 處（`slide-types.ts` 的 `THEME_IDS`、`themes/index.ts` lookup、`themes/<id>.ts`）。可寫個 unit test 在有 test framework 後確認三處同步。
2. **LLM 若頻繁選到少數幾個 layout 怎辦？** 觀察 8 個主題的 layout 分布後再決定是否在 prompt 加「必須使用至少 5 種不同 layout」約束。
3. **字體載入**：theme 的 `titleFont: "Noto Serif TC"` 等若客戶端沒裝需要 CDN 載入。Phase 2.2 實作時一併引入 `@next/font` 或 `next/font/google`。
4. **SSR render 成本**：8 張 slide × `renderToStaticMarkup` 可能各 10-30ms，總體加 generate 時間 < 300ms，可接受。若擴到 20 張再評估 streaming。
5. **`data/presentations.json` 現有 3 筆靜態簡報** 沒有 `slideSpecs` 欄位；是否要 backfill？可選，Phase 3 持久化上線前不需處理（preview 頁仍讀 `slides` 即可）。
