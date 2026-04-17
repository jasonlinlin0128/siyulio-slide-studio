# ingest-reference-slide

Jason 帶來一份新的參考簡報，系統性地把設計決策萃取進 DESIGN.md，並把該簡報加入 gallery。

## 使用方式

```
/project:ingest-reference-slide
```

執行前請先提供：簡報檔案（PDF / 截圖）或視覺風格描述。

---

## 執行流程

### Phase 1：視覺萃取

閱讀或觀察參考簡報，逐項記錄以下內容（不確定的先列出來問 Jason）：

**色彩**
- 主背景色是什麼？
- 強調色是什麼？哪些地方用到？
- 文字主色、次色分別是什麼？
- 是否有特定工具 / 標籤的品牌色？

**排版**
- 標題字重（Extra-bold / Bold）？大小範圍？
- 條列樣式（Bullet 形狀、縮排）？
- 是否有特殊的小節編號格式（如 `N｜ 標題`）？

**版面節奏**
- 封面、Section Divider、內容頁、結尾頁各有什麼視覺特徵？
- 留白習慣（padding 多大）？
- 是否有反覆出現的 UI 元素（標籤、卡片、圖示）？

**Anti-patterns（這份簡報刻意避開什麼）**
- 哪些設計選擇是明顯「不做」的？

---

### Phase 2：更新 DESIGN.md

打開 `DESIGN.md`，依萃取結果更新以下區塊：

1. **Section 2 Aesthetic Direction** — 若新簡報的風格方向補充或修正了現有描述，更新「一句話描述」或「關鍵風格關鍵字」
2. **Section 3 Design Tokens** — 若有新的色彩 token 或字型規格，補充表格
3. **Section 5 Slide Patterns** — 若發現現有 Pattern A–J 未涵蓋的新版型，新增 Pattern K 以後
4. **Section 6 Recurring UI Elements** — 新增反覆出現的 UI 元素
5. **Section 8 Decisions Log** — 新增一筆記錄，格式：

```
| YYYY-MM-DD | [決策內容] | [來源：參考簡報名稱] → [理由] |
```

---

### Phase 3：加入 Gallery

在 `data/presentations.json` 新增一筆資料：

```json
{
  "id": "kebab-case-id",
  "title": "簡報標題",
  "summary": "一句話摘要（40 字以內）",
  "tags": ["標籤1", "標籤2", "標籤3"],
  "theme": "乾淨教育感",
  "slideCount": 0,
  "contributor": "作者名稱",
  "createdAt": "YYYY-MM-DDT00:00:00.000Z"
}
```

> `slideCount` 填實際頁數，若不確定填 0。

---

### Phase 4：確認 & Commit

- 預覽 `DESIGN.md` 確認格式正確
- 確認 gallery 頁面出現新簡報
- Commit message 格式：

```
docs: ingest [簡報名稱] → update DESIGN.md + gallery

- 新增 Design Tokens: [列出新增的 token]
- 新增 Slide Pattern: [若有]
- Gallery 新增: [id]
```

---

## 注意事項

- **不要改動** Section 1 Product Context（那是 Siyulio 自己的定位，不受參考簡報影響）
- **不要刪除**現有的 Design Token，只新增或補充
- 如果新簡報的風格與現有 DESIGN.md 有明顯衝突，先列出差異讓 Jason 決定要不要更新
