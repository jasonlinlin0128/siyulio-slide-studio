# Siyulio Slide Studio — 自動化 Roadmap

> 這份文件是把 Siyulio 從「能一鍵產生簡報」升級成「真正一鍵」的 roadmap。
> Phase 1 可實作細節見 [`superpowers/specs/2026-04-17-prompt-alignment-design.md`](superpowers/specs/2026-04-17-prompt-alignment-design.md)。
> 專案品牌脊柱（設計規則的來源）見 [`../DESIGN.md`](../DESIGN.md)。

---

## 1. 現況

Siyulio 目前已有：

- **`/create` wizard** — 使用者輸入主題、大綱（選填）、選風格，點生成
- **`/api/generate`** — 呼叫 6-provider LLM fallback chain（Gemini → Groq → OpenRouter → Cerebras → Together → Mistral）
- **LLM 輸出** 8 張 HTML 投影片（inline style）
- **預覽頁** `/view/preview` 從 `sessionStorage` 讀暫存結果

已上線靜態簡報：`data/presentations.json` 3 筆（教學研習、NotebookLM、Canva Code）。

---

## 2. Gap Analysis — 為什麼現在還不夠「一鍵」

| Gap | 現象 | 影響 | Phase |
|-----|------|------|-------|
| **B. Prompt 品質不穩** | `/api/generate` 的 prompt 只告知色彩，沒連動 DESIGN.md 的 Pattern / Tone / UI 規則 | 生成結果時好時壞，要人工檢查品牌一致性 | **1** |
| **A. 持久化缺失** | 預覽存 `sessionStorage`，重新整理就沒 | 無法存進畫廊，每次都是即席展示 | 2 |
| **C. 輸入限制** | 大綱只能貼純文字 | 手上有 .md/.docx 講義時要人工轉 | 3 |
| **D. 缺 CLI 入口** | 只有網頁 | 從終端機發起需求時得先開瀏覽器 | 4 |
| **E. 無迭代** | 生完只能整份重跑 | 改一張就得全部再生 | 5 |

---

## 3. Phase 依賴關係

```
Phase 1 (prompt 對齊) ─┬─→ Phase 3 (素材輸入)
                      ├─→ Phase 4 (CLI 指令)
                      └─→ Phase 2 (持久化) ──→ Phase 5 (迭代)
```

Phase 1 是共同基座 — 後面每個 phase 都靠它產生高品質輸出。

---

## 4. Phases

### Phase 1 — Prompt 對齊 DESIGN.md（解 Gap B）

**Goal**：讓 `/api/generate` runtime 讀取 `DESIGN.md` 的標記段落，注入 prompt，讓 LLM 輸出符合品牌脊柱的 Pattern / Tone / UI 規則。

**Scope**：
- 修改 `app/api/generate/route.ts` 的 `buildPrompt()`
- 新增 `lib/design-spec.ts` 抽取 DESIGN.md include 區段
- 在 DESIGN.md Section 2/3/5/6/7 加 `<!-- prompt-include: <name> -->` marker

**細節**：[`superpowers/specs/2026-04-17-prompt-alignment-design.md`](superpowers/specs/2026-04-17-prompt-alignment-design.md)

**Status**：🟡 規劃完成，等實作

---

### Phase 2 — 持久化（解 Gap A）

**Goal**：預覽頁加「儲存到畫廊」按鈕，把產生的簡報寫回 `data/presentations.json` + HTML 檔。

**Scope**（預計）：
- 新 `POST /api/save` — 接收 preview payload，寫入 `data/presentations.json` + `data/slides/{id}.html`
- `SlideViewer` / preview 頁加按鈕 + 確認 dialog
- `Presentation` type 擴充（已有 `slideHtml?` 欄位）

**Open questions**：
- 是否要加刪除功能？目前先 read-only，從檔案層刪
- `data/` 是否要加 `.gitignore`？生成內容不進版本控制，但 presentations.json 作為 seed 要進

**Status**：⏸ 等 Phase 1 上線

---

### Phase 3 — 素材檔輸入（解 Gap C）

**Goal**：wizard 加檔案上傳，後端把 .md/.txt/.docx 解析成 outline 文字塞進 prompt。

**Scope**（預計）：
- `CreateWizard` 新增 file input（可多選 or 單檔）
- 新 `POST /api/parse-source` — 解析上傳檔案為純文字
  - `.md` / `.txt` → 直接讀
  - `.docx` → `mammoth` 或類似 library
  - （不支援 PDF / Excel 由 Phase 3.5 再說）
- 結果塞進 outline textarea（可再編輯）

**Open questions**：
- 上傳檔要不要存？預設 in-memory 處理完就丟
- 支援整個資料夾（`raw/`）嗎？先單檔

**Status**：⏸ 等 Phase 1

---

### Phase 4 — Claude Code `/new-slide` 指令（解 Gap D）

**Goal**：在 `~/.claude/commands/new-slide.md` 加指令，本地從 CLI 觸發 Siyulio 的 `/api/generate`。

**Scope**（預計）：
- 新 command 檔：接收 `$ARGUMENTS` 為主題 + 可選 `--style` / `--outline-file`
- 底層 `curl -X POST http://localhost:3000/api/generate` 或直接 `fetch`
- 結果開瀏覽器到 preview URL（如果 Phase 2 完成則直接寫進畫廊）

**Open questions**：
- 預設指向 localhost:3000 還是部署版（slide.siyulio.com）？本地 dev 時是 localhost，deploy 用的版本要改 env。建議 command 讀環境變數 `SIYULIO_URL`，預設 `http://localhost:3000`

**Status**：⏸ 等 Phase 1

---

### Phase 5 — 迭代編輯（解 Gap E）

**Goal**：對已生成的簡報做增量操作：改第 N 張、換風格重跑、加一張、刪一張。

**Scope**（預計）：
- 新 `POST /api/regenerate-slide` — 接收 `{ presentationId, slideIndex, instruction }`，只重生該張
- 新 `POST /api/restyle` — 接收 `{ presentationId, newStyle }`，只改色彩不改內容（若可能）
- `SlideViewer` 加單張操作按鈕（編輯 / 重生 / 刪）

**Open questions**：
- 重生單張時要保留相鄰上下文嗎？需要 context-aware prompt 設計
- 結構改動（加一張 / 刪一張）會改變 `slideCount` — 要同步更新 `presentations.json`

**Status**：⏸ 等 Phase 1 + Phase 2

---

## 5. Non-Goals

- **不做**：自建 LLM fine-tune；自動化評分簡報品質（太主觀，人工 review）
- **暫不做**：多語言（維持繁中）；即時協作；簡報版本控制 / diff
- **假設**：DESIGN.md 持續活躍維護，所有品牌決策都更新進去

---

## 6. 成功標準

- **Phase 1 ✓**：同樣主題重跑 3 次，HTML 全數符合 DESIGN.md 定義的某個 Pattern、且 tone rule 零違反（手動 review checklist）
- **Roadmap ✓**：Phase 5 做完後，從「有個主題想做簡報」到「畫廊裡看到最終結果」< 2 分鐘實際操作時間

---

## 7. 文件結構

```
簡報樣板/
├── DESIGN.md                          # 品牌脊柱（視覺／內容規則）
├── docs/
│   ├── design.md                      # 本文件：自動化 roadmap
│   └── superpowers/
│       ├── plans/                     # 既有：subagent-driven 計劃
│       └── specs/
│           └── 2026-04-17-prompt-alignment-design.md   # Phase 1 詳細 spec
└── ... (app/ components/ lib/ data/)
```
