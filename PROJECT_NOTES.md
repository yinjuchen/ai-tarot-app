# AI Tarot App — 開發筆記

## 目前狀態(2026-07-12)
- 前端:React + Vite + Tailwind
- 後端:Vercel serverless function (`/api/tarot`),伺服器端持有 `OPENAI_API_KEY`,前端不直接接觸 key
- AI 模型:`gpt-4o-mini`(原本用 gpt-3.5-turbo,已換成更便宜、非棄用的模型)
- 卡牌:22 張大阿爾克那(標準塔羅大牌全套),圖片已從 PNG 轉 WebP 並縮到顯示尺寸(63MB → 2.8MB)
- 目前互動:三張牌排陣(處境 / 挑戰 / 建議),不重複抽牌、有機率逆位,一張一張翻牌(儀式感),可輸入今日提問,GPT 隨機用一種占卜師語氣生成整合中英文解讀,詩的長短形式每次不同
- 已上線:https://ai-tarot-app-jjey.vercel.app/(尚未部署本輪改動)
- Repo:github.com/yinjuchen/ai-tarot-app
- 費用備忘:gpt-4o-mini 約 $0.15 / 百萬 input token、$0.60 / 百萬 output token,單次三張牌請求約 $0.0002-0.0004,加提問欄位後成本增加可忽略不計

## 專案初衷
喜歡塔羅牌,原本想做一個「今日運勢指引」的 AI app——透過抽牌給使用者當日的方向感或心理指引,而不只是單純的隨機抽卡展示。

## 三張牌排陣(Spread)— 已實作(2026-07-12)
**動機**:單抽一張牌,AI 能發揮的空間有限(只是解讀一張牌)。三張牌排陣需要 AI 理解「牌與牌之間的關係、位置意義」,互動更有深度,也更貼近「指引」的初衷,而不是「隨機解讀」。

**設計決定**
1. 位置意義:處境(Situation) / 挑戰(Challenge) / 建議(Advice)
2. 抽牌不重複(Fisher-Yates 洗牌後取前三張)
3. 排版:三張卡片並排(手機版直向堆疊,`sm:` 以上橫向排列)
4. Prompt:`api/tarot.js` 接收三張牌 + 位置,要求 GPT 生成「一段連貫敘事」而非三段獨立解讀拼接,中英文各一版本、互相獨立創作

**實作內容**
- `src/spread.js`:定義三個位置(key/en/zh)
- `src/cardData.js`:新增 `drawThreeCards()`,Fisher-Yates 洗牌抽三張不重複的牌
- `src/gpt.js`:`getGptAnswer` 改為 `getGptSpreadAnswer(spreadCards)`,傳送三張牌名 + 位置到後端
- `api/tarot.js`:改接收 `cards` 陣列(3 張,含 positionEn/positionZh),prompt 要求整合敘事而非三段拼接,`max_tokens` 從 250 提高到 500
- `src/App.jsx`:`card` state 改為 `spread`(陣列),三張卡片並排渲染(含位置標籤),GPT 整合解讀顯示在卡片下方單一區塊

## 讓解讀更有生命力、不死板 — 已實作(2026-07-12)
**動機**:三張牌排陣做出來後,GPT 解讀變成「一段英文接一段中文」的固定長格式,使用者反饋覺得像逐句對照翻譯,失去原本單抽版本短詩的精煉感與詩意,也覺得整體互動太像制式網站、每次體驗都差不多。

**決定加入的功能**(使用者從建議清單中挑選)
1. 詩的長短形式隨機化 — 不再固定 4-6 行,`api/tarot.js` 的 `LENGTH_FORMS` 陣列每次隨機挑一種(精煉 2-3 行 / 舒展 4-6 行 / 不規則自由詩),避免每次輸出都是同個模板
2. 占卜師語氣人格隨機化 — `PERSONAS` 陣列(月之語者 / 烈焰先知 / 沉默智者),伺服器端隨機挑一種聲音,回傳給前端顯示在解讀上方(如「— The Ember Prophet —」)
3. 逆位牌 — `drawThreeCards()` 每張牌約 35% 機率逆位,圖片視覺上旋轉 180 度,位置標籤加註「· Reversed」,prompt 明確要求 GPT 讓逆位牌的能量方向影響解讀
4. 使用者提問織入解讀 — 抽牌前可輸入一句今日提問或心情(選填),傳給 GPT 並要求「真正回應這句話,不是硬接在後面」
5. 逐張翻牌儀式感 — 三張牌不再一次彈出,改成間隔 650ms 依序翻出(`revealedCount` state + `animate-card-in` CSS 動畫),GPT 解讀等三張都翻完才出現

**討論但沒選的方向**
- 三張牌共用一個貫穿意象(如月光/水/灰燼)取代處境/挑戰/建議的報告式結構 — 使用者這輪沒選,之後有興趣可再考慮

**位置標籤決定**:卡片上的位置標籤拿掉了中文(「處境 · SITUATION」→「SITUATION」),因為使用者覺得中英並列的小標籤加深了「翻譯對照」的觀感。`POSITIONS` 資料裡的 `zh` 欄位仍保留給後端 prompt 使用,只是 UI 不顯示。

**實作內容**
- `src/cardData.js`:`drawThreeCards()` 回傳的每張牌多一個 `reversed` boolean
- `api/tarot.js`:新增 `PERSONAS`、`LENGTH_FORMS`,接收 `question` 欄位,`temperature: 1`,回傳 `{ message, persona }`
- `src/gpt.js`:`getGptSpreadAnswer(spreadCards, question)` 回傳 `{ message, persona }`
- `src/App.jsx`:新增提問輸入框、`revealedCount` 控制逐張翻牌、逆位圖片旋轉樣式、persona 顯示
- `src/index.css`:新增 `animate-card-in` 進場動畫

## 下一步(未決定)
- [ ] 部署到 Vercel 並實際測試新版 prompt 的回應品質、逆位牌解讀是否合理
- [ ] 視覺打磨:三張卡片間距、手機版排版是否需要進一步調整
- [ ] 考慮「三張牌共用一個貫穿意象」是否要加入
- [ ] 考慮是否保留「單抽一張」作為次要模式,或完全以三張牌排陣為主
