# PLAN-redesign: hub mới + Daily tự động + dọn cost ở các app

Chốt 2026-11-26. Lấy ý từ mockup `hub_minimalist_app_launcher_mockup.html`,
nhưng giữ luật của `DESIGN.md`: chỉ màu xám (trừ chart ở `/costs`), không emoji,
font hệ thống, motion chỉ khi bấm. Hỏi owner trước mỗi phase.

## Quyết định

- **Daily tự động từ dữ liệu thật**, không có nút check-in, không localStorage,
  không KV. Hub đọc Firestore của 4 app bằng service account `hub-costs`
  (đã có Datastore Viewer trên fina, hodi, legi, logi).
- **Trang chủ vẫn public.** Chưa đăng nhập: chỉ thấy danh sách app. Đã đăng
  nhập (đúng `ALLOWED_USER_EMAIL`): thấy thêm Daily status, streak, heatmap,
  dòng chi phí.
- **Nav của hub:** `hub   apps · links · costs`, góc trên bên trái, sans 13px
  chữ thường, trang hiện tại ink `font-medium`, còn lại faint. Cập nhật bảng
  "Nav: one signature per app" trong `DESIGN.md`.
- **Không làm:** màu hổ phách/xanh ngọc, border beam, pulse, spotlight, text
  scramble, shockwave, hạt bắn, slot counter, aurora, blur-in, âm thanh, font
  Google, Tailwind CDN, nút Replay/Reset, `moni://`, command palette `⌘K` (để sau).

## Định nghĩa "đã làm hôm nay"

Một ngày bắt đầu lúc **04:00 giờ Việt Nam** cho cả 4 app (hodi, legi, logi
đã dùng mốc này; fina theo luôn để 4 app cùng một ngày). `dayKey = (now + 7h - 4h)`
lấy phần `YYYY-MM-DD`.

| App | Đường dẫn | Đã làm khi | Ghi chú |
|---|---|---|---|
| fina | `users/{uid}/transactions` | có doc `occurredAt` (millis) trong ngày, `source` là `web` hoặc `import` | bỏ allocation/opening/move; xóa thật, không có cờ |
| hodi | `users/{uid}/entries/{YYYY-MM-DD}` | doc của ngày có `words > 0` | id = ngày; text có thể bị xóa trống |
| legi | `users/{uid}/quotes` | có doc `createdAt` (millis) trong ngày, `deletedAt == null`, `kind` là quote hoặc thought | lọc `deletedAt` trong code, không cần index |
| logi | `users/{uid}/activities` | có doc `logicalDate == dayKey`, `status != 'scheduled'`, `category != 'sleep'` | app đã có query giống vậy |

- `uid`: lấy bằng `collection('users').listDocuments()` (mỗi app một user).
- Mỗi app chỉ cần **một query range 30 ngày** (field đơn, không cần composite
  index). Từ đó tính hôm nay, streak và heatmap.
- Một app lỗi không làm hỏng cả trang: app đó hiện `?`.

## Bố cục trang chủ

```
hub   apps · links · costs                         2/4 today · 14 days
                                                   ▪▪▪▫▪▪▪▪▫▪▪▪ (30 ngày)
01  Daily                                          next: hodi  [space]
    [fina  done]   [hodi  today]
    [legi  done]   [logi  today]
02  Learn
    [arca] [cogi] [noda] [navi]
03  Tools
    [mora] [moni] [cskills]

    Nov ₫244k · 49% of budget            (dòng này dẫn tới /costs)
    system · light · dark
```

- Ô app: bo 8-10px, hairline, không shadow. Tên, mô tả một dòng, domain mono
  faint. Phím tắt `1`-`9` ghi nhỏ màu faint ở góc.
- Daily: trạng thái là chữ, không màu. `done` màu faint, `today` màu ink.
  Sau 20:00, nếu còn thiếu, thêm dòng `2 left today` màu ink.
- Heatmap: 30 ô vuông nhỏ, ngày 4/4 tô ink, ngày thiếu tô line, ngày 0 để trống.
- Tab title: `(2/4) hub`, xong thì `hub`.
- Motion: chỉ lún khi bấm (`scale(0.98)`, 120ms) và dấu tích tự vẽ
  (`stroke-dashoffset`) khi một app chuyển sang `done` lúc đang mở trang.
  `prefers-reduced-motion` tắt cả hai.

## Các phase

### R0: dọn hiển thị cost ở 7 app (xong 2026-11-26)
Đã push 7 app, web deploy (navi bằng `vercel --prod`), rules deploy. Hub vẫn đọc `aiUsage`.
Hub `/costs` đã thay cho dòng "AI this month" trong Settings.
- Xóa `AiCostRow` và chỗ dùng nó trong fina, logi, hodi, legi, navi, noda, cogi.
- Xóa phần chỉ dùng cho hiển thị trong `ai-cost.ts` (`splitMonths`, `monthLabel`,
  `formatUsd` nếu không còn ai dùng) và test của chúng.
- **Giữ** `logAiCost`, `costUsd`, `monthKey`, bảng giá: hub vẫn đọc `aiUsage`.
- Rules: bỏ quyền client đọc `aiUsage` (chỉ Admin SDK ghi và đọc).
- Mỗi app một commit, theo luật của app đó (cogi chỉ commit). Deploy rules + web.
- Cập nhật Handbook của cogi nếu có nhắc tới dòng này.

### R1: khung mới + nav + costs
- Trang chủ thành `src/app/page.tsx` (bỏ rewrite `/` → `index.html`). Giữ nội
  dung, đổi sang 3 nhóm Daily / Learn / Tools và ô mới.
- Nav chung cho `/`, `/links`, `/costs`. `/links` có thể vẫn là HTML tĩnh, chỉ
  thêm nav.
- Theme `system · light · dark` ở footer, lưu localStorage.
- Cập nhật `DESIGN.md` (nav hub, motion hub).

### R2: `/api/today` + Daily status
- Logic thuần `src/lib/today/` (dayKey, streak, heatmap, next daily) có test.
- `src/lib/today/sources.ts` đọc 4 app như bảng trên. Cache 5 phút.
- UI: trạng thái từng ô, `2/4 today`, streak, heatmap, `next: hodi`.

### R3: phím tắt + tab title + dòng chi phí
- `1`-`9` mở app, `Space` mở Daily tiếp theo chưa làm.
- Tab title `(2/4) hub`.
- Dòng `Nov ₫244k · 49% of budget` lấy từ `/api/costs` (đã cache 1 giờ).

### R4: PWA
- `manifest.json`, icon, service worker cache trang chủ (theo mẫu fina/logi).

## Rủi ro

- Đổi schema ở 4 app sẽ làm hỏng `/api/today`. Ghi chú vào AGENTS.md của
  từng app: "hub đọc collection này".
- Trang chủ đang public: chỉ gọi `/api/today` sau khi đăng nhập, API trả 401
  với người khác.
