# add-style-theme

新增一個風格主題（Style Theme），需要同步修改三個地方，缺一不可。

## 使用方式

```
/project:add-style-theme
```

執行前請先提供：
- 主題 ID（英文 kebab-case，如 `warm-sunset`）
- 主題名稱（中文，如「暖色日落」）
- 色彩定義：bg / accent / text / subtext
- 適用場合描述（一句話）

---

## 執行流程

### Step 1：確認色彩配置

在開始修改前，先驗證四個色彩值：

| 屬性 | 說明 | 範例 |
|------|------|------|
| `bg` | 背景色，可為純色或 CSS gradient | `#FFFBF0` 或 `linear-gradient(...)` |
| `accent` | 強調色，用於標題裝飾、按鈕、標籤 | `#FFCC00` |
| `text` | 主文字色 | `#111111` |
| `subtext` | 副文字色、說明文字 | `#555555` |

確認後繼續。

---

### Step 2：更新 `app/api/generate/route.ts`

在 `STYLE_CONFIGS` 物件新增一筆：

```typescript
"theme-id": { bg: "...", accent: "...", text: "...", subtext: "..." },
```

在 `STYLE_NAMES` 物件新增對應中文名：

```typescript
"theme-id": "中文主題名稱",
```

---

### Step 3：更新 `components/CreateWizard.tsx`

在 `STYLE_OPTIONS` 陣列（或對應的風格選項定義）新增：

```typescript
{
  id: "theme-id",
  name: "中文主題名稱",
  description: "適用場合一句話描述",
},
```

確認 UI 卡片在 Step 2 畫面正確顯示。

---

### Step 4：更新 DESIGN.md

在 `Section 4 Content Architecture` 的「風格主題系統」表格新增一行：

```markdown
| `theme-id` | 中文主題名稱 | 適用場合 |
```

在 `Section 8 Decisions Log` 新增記錄：

```
| YYYY-MM-DD | 新增風格主題 `theme-id` | [新增原因或參考來源] |
```

---

### Step 5：測試

用新主題生成一份測試簡報，確認：
- [ ] 背景色正確套用
- [ ] 強調色出現在標題或裝飾元素
- [ ] 文字在背景上可讀（對比度足夠）
- [ ] 8 張投影片都套用到正確色彩

若發現色彩對比不足，回 Step 1 調整後重試。

---

### Step 6：Commit + Deploy

```bash
git add app/api/generate/route.ts components/CreateWizard.tsx DESIGN.md
git commit -m "feat: add style theme [theme-id] (中文主題名稱)"
npx vercel --prod --scope jasons-projects-89e40db2
```
