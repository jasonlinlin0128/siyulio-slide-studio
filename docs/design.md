# Siyulio Slide Studio — 自動化 Roadmap

> 這份文件是把 Siyulio 從「能一鍵產生簡報」升級成「真正一鍵，且視覺品質對得起 DESIGN.md」的 roadmap。
> 品牌脊柱見 [`../DESIGN.md`](../DESIGN.md)。
>
> **2026-04-17 重要修正**：原 Phase 2-5（持久化 / 素材 / CLI / 迭代）都建立在「LLM 產 raw HTML」的舊假設上。實測對照 [presentation.stingtao.info](https://presentation.stingtao.info/) 後確認：該假設是視覺品質天花板的根源。**Phase 2 已重新定義為架構重設（Layout 元件庫 + Theme 系統 + 結構化 LLM 輸出）**，其他 phase 依序後移。

---

## 1. 現況（2026-04-17）

### 已上線
- **`/create` wizard** — 主題 + 大綱（選填）+ 4 個色彩風格
- **`/api/generate`** — 6-provider LLM fallback（Gemini → Groq → OpenRouter → Cerebras → Together → Mistral）
- **Phase 1 ✅**：prompt 動態讀 `DESIGN.md` 的 `<!-- prompt-include -->` marker，注入 Brand Spine（commit `92ee298`）
- **預覽頁** `/view/preview`（sessionStorage 暫存）
- **靜態畫廊** `data/presentations.json` 3 筆

### Phase 1 成果實測
Prompt 強化後（commit `92ee298`）重跑驗證 — 每張投影片有 Pattern 指令、footer 強制、多要點要求：
- ✅ Slide 字元數 ~250 → ~600-1200
- ✅ Footer 出現在每一張
- ✅ 開始出現 Pattern C（工具定義頁 2 欄）、Pattern E（卡片陣列）
- ❌ **但**視覺精緻度與真實產品仍有數量級差距

---

## 2. Gap Analysis — 現在的真正瓶頸

| Gap | 現象 | 影響 | Phase |
|-----|------|------|-------|
| ~~B. Prompt 品質~~ | ~~prompt 沒讀 DESIGN.md~~ | | ~~Phase 1~~ ✅ |
| **F. 架構瓶頸 — LLM 產 raw HTML 有天花板** | 即使 prompt 再強，LLM 也只能生出「flex + list + 2col」水平的結構；背景圖是佔位 URL、typography 粗糙、layout 沒有變化 | 視覺精緻度無法追上 stingtao.info / Gamma.app / Canva 等成熟產品 | **2**（新） |
| A. 持久化缺失 | 預覽存 sessionStorage，刷新就沒 | 無法存進畫廊 | 3 |
| G. 圖片資產 | 生成的 HTML 用假 URL 圖片 | 即使 layout 對了，沒圖就空洞 | 4 |
| C. 輸入限制 | 只能貼純文字大綱 | 有 .md/.docx 要人工轉 | 5 |
| D. 缺 CLI 入口 | 只有網頁 | | 6 |
| E. 無迭代編輯 | 整份重生才能改 | 改一張等於重新擲骰 | 7 |

## 3. stingtao.info 對照（benchmark）

實測對照「AI 投資泡沫化」那份（10 張 slide），他們做到的關鍵差異：

| 維度 | stingtao | Siyulio 現況 |
|------|----------|--------------|
| Layout 種類 | 每張不同版面：封面大圖 / 章節分隔 / 大數字單點 / 2 欄比較 / 4 卡片 numbered / 3 風險卡 / 勾選項 bullet / action list | 每張都是 flex 直排 + 2 欄或 list |
| Theme | 20+ 具名 theme（象牙董事會、森林檔案、晨霧研究、都會叢林、手寫筆記、星空、日出、科技、海洋、極簡灰、復古、秋葉、常青、寧靜、深海、薄荷巧克力…），各自有視覺身份 | 4 個色系 token |
| 圖片 | 真實 hero 大圖、icon、氛圍照，符合 theme 調性 | 佔位 URL `example.com/*.png` |
| 內容深度 | 真數字（2000 億、70%、15%）、真公司名、具體 action | 泛用詞彙 |
| 輸出形式 | 推測：LLM 吐結構化 JSON（layout + 欄位）→ React 元件 render | LLM 吐 raw HTML 字串 |

**結論**：prompt 層已經極限。下一步必須換架構。

---

## 4. Phase 依賴（修正版）

```
Phase 1 ✅ (prompt alignment, 2026-04-17)
        │
        ▼
Phase 2 — Layout 元件庫 + Theme 系統 + 結構化 LLM 輸出（新基座）
        │
        ├─→ Phase 3 (持久化 / 畫廊)
        │      │
        │      └─→ Phase 7 (迭代編輯)
        ├─→ Phase 4 (圖片資產整合)
        ├─→ Phase 5 (素材檔輸入)
        └─→ Phase 6 (CLI 指令)
```

**Phase 2 是新的單點瓶頸** — 所有視覺品質相關的後續 phase 都得等它先動。

---

## 5. Phases

### Phase 1 — Prompt 對齊 DESIGN.md ✅

**Goal**：`/api/generate` runtime 讀 DESIGN.md 的標記區段注入 prompt。

**Scope**：`lib/design-spec.ts`（新）+ `app/api/generate/route.ts::buildPrompt` 改寫 + DESIGN.md section 2/3/5/6/7 加 `<!-- prompt-include: ... -->` marker。

**Status**：✅ 已上線 2026-04-17。commit 序列：`6900aad`（markers）→ `05d0dcc`（extractor）→ `eb88e51`（prompt 注入）→ `92ee298`（投影片要求強化）

**細節**：[`superpowers/specs/2026-04-17-prompt-alignment-design.md`](superpowers/specs/2026-04-17-prompt-alignment-design.md)

---

### Phase 2 — 架構重設：Layout 元件庫 + Theme 系統 + 結構化 LLM 輸出（解 Gap F）🆕

**Goal**：從「LLM 產 raw HTML」轉向「LLM 選 layout + 填欄位 → React 元件 render」，讓視覺品質能逼近 stingtao.info 水準。

**核心概念變化**：
- 現況：`/api/generate` → LLM → `slides: string[]`（raw HTML）
- 新架構：`/api/generate` → LLM → `slides: SlideSpec[]`（`{ layout: string, theme: string, props: {...} }`）→ server-side render 成 HTML

**Scope**（分 3 個 sub-phase）：

#### 2.1 Layout 元件庫
建立 10-15 個 layout React components 在 `components/slides/`：
- `CoverSlide` — hero 圖 + 標題 + 副標題
- `SectionDivider` — 大標題 + 背景圖 + 段落編號
- `StatCallout` — 大數字 + 解釋段落
- `Comparison2Col` — 兩欄對比（列表）
- `NumberedCards` — 2×2 / 1×4 編號卡片
- `RiskCards` — 3 欄風險 / feature 卡片
- `BulletListIcons` — bullet + icon
- `ActionList` — action items 列表
- `QuoteHighlight` — 引言強調
- `StepFlow` — 水平/垂直步驟流程
- `ThankYou` — 結尾

每個元件：
- 純 props-driven（無業務邏輯）
- 支援 theme tokens 注入
- 固定 16:9 aspect ratio
- 列印 / export-safe（無 JS 相依）

#### 2.2 Theme 系統
`lib/themes.ts` 定義 `Theme` interface + 初版 8-10 個 theme：
- 每 theme：名稱（如「晨霧研究」「象牙董事會」）+ 色彩 tokens + font stack + image treatment（濾鏡、對比、暖色調）+ element style hints（圓角 / 陰影 / 邊框）
- Theme 可用 JSON 持久化，未來能擴充
- `/create` wizard 把「風格」從 4 個色系擴到實際 theme 選單

#### 2.3 結構化 LLM 輸出
改寫 `buildPrompt` 與 `/api/generate`：
- prompt 要求 LLM 輸出 JSON schema：`{ title, summary, tags, theme, slides: [{ layout: "CoverSlide", props: { title, subtitle, heroImagePrompt } }, ...] }`
- 每張 slide 指定一個 layout（LLM 從可用 layout 清單挑）
- `heroImagePrompt` 是給 Phase 4 圖片整合用的提示詞，現階段可先空
- 新 `lib/renderSlides.ts`：接收 `SlideSpec[]` + theme → 回傳 HTML 字串陣列（server render React component 到 HTML）

**技術選擇關鍵**：
- Server-side render React components：用 `react-dom/server` 的 `renderToStaticMarkup`
- LLM JSON 結構驗證：用 zod schema 在 route handler 驗證 LLM 輸出
- Theme 注入：每個 layout component 透過 context 取 theme

**Open questions（實作前要決定）**：
- 選 LLM：Groq / Claude / GPT-5 — 結構化 JSON 輸出穩定度哪個最好？推測 Claude 最穩
- Layout 數量：初版做 5-6 個夠不夠（涵蓋大多數場景）？
- Theme JSON schema：放 codebase 還是 `data/themes/*.json` 讓使用者可自加？

**成功標準**：同樣主題（例「用 AI 工具解放教學創造力」）生成的簡報，視覺精緻度應對標 stingtao.info「AI 投資泡沫化」那份 — 每張 layout 不同、theme 一致、typography 有層次、footer 與 branding 一致。

**Status**：🟡 規劃中（spec 待寫）

**預估工作量**：2-3 週（Layout 元件庫最花時間，Theme 次之，LLM 結構化輸出最快）

---

### Phase 3 — 持久化 / 畫廊（解 Gap A）

**Goal**：預覽頁加「儲存到畫廊」按鈕，把生成結果寫回 `data/presentations.json` + 對應檔案。

**Scope**：
- 新 `POST /api/save` — 寫入 presentations.json 並存 `data/slides/{id}.json`（儲存 `SlideSpec[]`，而非 HTML）
- `SlideViewer` / preview 頁加按鈕 + 確認 dialog
- `Presentation` type 調整：`slideSpecs: SlideSpec[]` 取代 `slideHtml?`

**Status**：⏸ 等 Phase 2

---

### Phase 4 — 圖片資產整合（解 Gap G）🆕

**Goal**：layout 需要的圖片從假 URL 換成真實來源，且與 theme 調性一致。

**Scope**：
- LLM 產生的 `heroImagePrompt` 欄位送到圖片服務
- 初版：Unsplash API 搜關鍵字，回傳適合的免費圖
- Theme-matched filter：用 CSS filter（`saturate`、`contrast`、`hue-rotate`）讓圖片對齊 theme 氛圍
- （進階）：DALL-E / Stable Diffusion 生成原創圖，但成本 & 延遲要評估

**Status**：⏸ 等 Phase 2

---

### Phase 5 — 素材檔輸入（解 Gap C）

**Goal**：wizard 加檔案上傳，後端把 .md/.txt/.docx 解析成大綱塞進 prompt。

**Scope**：
- `CreateWizard` 加 file input
- `POST /api/parse-source` — 解析 .md/.txt/.docx 為純文字
- 結果塞進 outline textarea（可再編輯）

**Open questions**：
- 支援整個資料夾嗎？先單檔
- 要不要支援從 Notion / Google Docs URL 直接匯入？可列入 Phase 5.5

**Status**：⏸ 等 Phase 2

---

### Phase 6 — Claude Code `/new-slide` 指令（解 Gap D）

**Goal**：`~/.claude/commands/new-slide.md` 加指令，從 CLI 觸發本地或部署版 Siyulio API。

**Scope**：接收 `$ARGUMENTS` 為主題 + 可選 `--theme` / `--outline-file`；用 `curl` / `fetch` 呼叫 API。

**Open questions**：讀環境變數 `SIYULIO_URL`，預設 `http://localhost:3000`。

**Status**：⏸ 等 Phase 2

---

### Phase 7 — 迭代編輯（解 Gap E）

**Goal**：對已存的簡報做增量修改：改第 N 張、換 theme 重 render、加一張、刪一張、重跑單張。

**Scope**：
- `POST /api/regenerate-slide`（重生單張）
- `POST /api/restyle`（僅換 theme，re-render 不 re-generate）
- `POST /api/reorder-slides`（拖拉重排）
- `SlideViewer` 加單張操作按鈕

**為什麼依賴 Phase 2**：有了 `SlideSpec[]` 結構化儲存，單張操作才可能 — 不然改一張 HTML 得靠 diff 或整份重生。

**Status**：⏸ 等 Phase 2 + Phase 3

---

## 6. Non-Goals

- ❌ 自建 LLM fine-tune
- ❌ 自動評分簡報品質（人工審查 + checklist）
- ❌ 多語言（維持繁中）
- ❌ 即時協作
- ❌ 簡報版本控制 / git-style diff
- ❌ 在 Phase 2 前就做持久化 / 迭代（舊架構資料無法用於新架構，白做工）

---

## 7. 成功標準

- **Phase 1** ✅ 已達成（2026-04-17）
- **Phase 2** ✓：生成結果視覺精緻度對標 stingtao.info；每張 layout 不同、theme 一致；手動比對 3 個主題各自能看出明確的「某 layout 套對了」而非「一堆 flex+list」
- **Roadmap ✓**（Phase 7 完成後）：「有想法 → 畫廊有成品」實際操作 < 2 分鐘、視覺品質達到可對外展示的程度

---

## 8. 文件結構

```
簡報樣板/
├── DESIGN.md                          # 品牌脊柱（視覺 / 內容規則）
├── docs/
│   ├── design.md                      # 本文件：自動化 roadmap
│   └── superpowers/
│       ├── plans/                     # subagent-driven 執行計劃
│       │   └── 2026-04-17-prompt-alignment.md
│       └── specs/
│           ├── 2026-04-17-prompt-alignment-design.md   # Phase 1 ✅
│           └── (待寫) 2026-04-??-layout-theme-system-design.md  # Phase 2
└── app/ components/ lib/ data/ ...
```

---

## 9. Benchmark 參考

**[presentation.stingtao.info](https://presentation.stingtao.info/)** — 目標對標。重點研究：
- Layout 類型清單（看 10 個以上範例後歸納）
- Theme 命名慣例（具象名稱優於形容詞，如「晨霧研究」不是「極簡深色」）
- Cover slide 的 hero image 用法
- Section divider 如何分節奏
- 大數字 / 大引言 slide 如何做視覺強調

其他可參考：Gamma.app、Beautiful.ai、Canva Presentations、tl;dr presentations。
