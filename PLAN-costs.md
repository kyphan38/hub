# PLAN-costs: theo dõi chi phí GCP + AI ở hub

Chốt 2026-11-26. Hub chuyển sang Next.js trên Vercel, thêm trang `/costs`
(cần login). Trang chủ và `/links` vẫn public.

## Nguồn dữ liệu

| Nguồn | Cho biết | Ghi chú |
|---|---|---|
| Billing export sang BigQuery | Số tiền thật, theo project, service, SKU, ngày | Chỉ có từ ngày bật. Chậm vài giờ. Tiền tệ là VND (tiền của billing account). |
| `aiUsage/{YYYY-MM}` trong 7 project | Gemini ước tính theo app (usd, calls) | Có từ 2026-11-20. Không tính Search grounding. |

Gemini của cả 7 app dùng chung 1 key, nên billing chỉ có 1 dòng "Gemini API".
`aiUsage` dùng để chia dòng đó theo app.

## Cách hub đọc dữ liệu

Một service account `hub-costs`, chỉ đọc:

- `BigQuery Data Viewer` + `BigQuery Job User` trên project chứa dataset export.
- `Cloud Datastore Viewer` trên 7 project (fina, logi, hodi, legi, navi, noda, cogi).

Lý do chọn cách này: không phải sửa 7 app (4 app là static export, không có
API route). Rủi ro: role này đọc được mọi dữ liệu Firestore của 7 app. Key
chỉ nằm trong Vercel env của hub, giống các key Admin SDK đang có (các key đó
còn có quyền ghi). Có thể đổi sang Vercel OIDC + Workload Identity Federation
sau để bỏ file key.

Server cache kết quả 1 giờ (BigQuery có độ trễ, không cần mới hơn).

## Trang `/costs`

Dashboard, rộng khoảng 56rem. Owner cho phép (2026-11-26) trang này không
theo luật chỉ-màu-xám: được dùng màu cho chart. Mỗi dịch vụ giữ một màu cố
định ở mọi chart (Gemini xanh dương, Storage cam, Khác xanh lục, dự kiến xám).
Tối đa 3 màu, chỉ dùng trong chart. Không icon trên trang. Tên luôn ghi cạnh màu.

Trang trả lời 4 câu hỏi theo thứ tự: tốn bao nhiêu, có vượt không, cái gì tốn
nhất, có gì lạ.

1. **4 ô số**: tháng này (₫ + $), dự kiến cuối tháng (theo tốc độ 7 ngày gần
   nhất), so với tháng trước (%), % ngân sách + thanh.
2. **Worth a look**: 2-4 dòng chữ thường, không icon, không màu. Mở đầu mỗi
   dòng bằng một từ nhỏ màu faint (`up`, `spike`, `check`). Tự sinh từ dữ liệu
   (luật cố định, không dùng AI):
   dịch vụ chiếm nhiều nhất và mức tăng, app gọi Gemini nhiều nhất,
   ngày tăng đột biến (trên 3 lần trung bình) kèm project và SKU,
   độ lệch giữa `aiUsage` và billing.
3. **Per day**: bar chart cột chồng theo ngày, 3 nhóm + cột dự kiến màu xám.
   Hover xem số từng ngày.
4. **By service** và **Gemini by app** đặt cạnh nhau: thanh ngang xếp từ lớn
   đến nhỏ, có số ₫ và % thay đổi (hoặc % tỉ lệ). Theo app ghi rõ "estimate".
   USD đổi sang VND bằng `currency_conversion_rate` trong billing export.
5. **Last 6 months**: bar chart theo tháng, tháng này tô màu, các tháng khác xám.
6. Theo project: một bảng nhỏ ở cuối trang.

Không có bộ lọc, không có chọn khoảng ngày. Muốn xem sâu thì mở Billing
report của Google (link `open billing` ở cuối trang).

## Cảnh báo

Không làm trong hub. Dùng **Budget alert** của GCP (gửi email):
budget tháng cho cả billing account, báo ở 50%, 90%, 100% và 100% dự kiến.
Trang `/costs` đọc cùng con số budget (env `COSTS_BUDGET_VND`).

## Các phase

### C0: owner tự làm (Cloud Console)
- Bật Billing export > **Standard usage cost** sang dataset BigQuery
  (ví dụ `billing_export` trong project của Gemini key).
- Tạo budget + alert như phần "Cảnh báo".
- Tạo Firebase project `kyphan38-hub-app` (chỉ dùng cho login).
- Tạo service account `hub-costs` với các role ở trên, đưa key JSON vào
  Vercel env của hub. Claude không đọc key.

### C1: chuyển hub sang Next.js trên Vercel
- Giữ nguyên nội dung và giao diện của `index.html` và `links.html`.
- Không login ở C1. Kiểm tra trên URL preview trước.
- Đổi DNS trên Cloudflare sang Vercel, để **DNS only** (không proxy).

### C2: login + `/costs` với dữ liệu billing
- Login chung như các app khác, proxy `/__/auth`, Theme trong Settings.
- Chỉ email của owner được xem. API trả 401 cho người khác.
- `/api/costs`: query BigQuery cho mục 1, 2, 3, 5, 6.
- Logic thuần (gộp nhóm dịch vụ, dự kiến cuối tháng, % thay đổi,
  định dạng tiền) nằm trong `src/lib/costs/` và có unit test.
- Chạy `moni/cleanup/check-app-signin.sh hub`.

### C3: Gemini theo app
- Đọc `aiUsage` từ 7 project, thêm mục 4 và dòng so sánh ước tính với billing.
- Nếu lệch nhiều: sửa bảng giá trong `ai-cost.ts` của các app (việc riêng).

## Chưa làm (để sau)
- Vercel usage (Hobby, gần như $0).
- Search grounding chưa có trong `aiUsage`.
- Thông báo trên điện thoại.

## Trạng thái (2026-11-26)

Claude đã làm (branch `feat/costs`, chưa merge vào `main`):
- Project `kyphan38-hub-app` (Firebase + GCP), gắn billing account, web app.
- Dataset BigQuery `billing_export` (US). Service account `hub-costs`, chỉ đọc:
  BigQuery trên hub, Datastore Viewer trên 7 app. Đã thử: đọc được `aiUsage` của cả 7 app.
- Budget: giữ budget "alert" ₫500k có sẵn (50/90/100/150%). `COSTS_BUDGET_VND=500000`.
- Hub chạy Next.js: `public/index.html`, `public/links.html` giữ nguyên, thêm `/costs`,
  `/api/costs` (401 nếu không phải owner). 8 unit test pass.
- Vercel project `hub`, env đủ, deploy ở https://hub-virid-tau.vercel.app.
  `kyphan38.com` đã gắn vào project nhưng DNS vẫn trỏ Cloudflare Pages.
- `moni/cleanup/check-app-signin.sh hub` kiểm tra `kyphan38.com`.

Owner làm, theo thứ tự:
1. Bật billing export: Billing > Billing export > BigQuery export > Standard usage
   cost > Edit settings > project `kyphan38-hub-app`, dataset `billing_export` > Save.
2. Firebase console `kyphan38-hub-app` > Authentication > Get started > Google > Enable.
3. Báo Claude: Claude thêm authorized domains (`kyphan38.com`,
   `hub-virid-tau.vercel.app`) qua API.
4. GCP Credentials (`kyphan38-hub-app`) > Web client (auto created) > thêm
   origin `https://kyphan38.com` và redirect `https://kyphan38.com/__/auth/handler`.
5. Thử đăng nhập ở https://hub-virid-tau.vercel.app/costs.
6. Cloudflare: gỡ custom domain `kyphan38.com` khỏi Pages project, đặt DNS
   `A @ 76.76.21.21`, DNS only (đám mây xám).
7. Báo Claude: chạy check sign-in, merge `feat/costs` vào `main`, push,
   nối Vercel với GitHub, thêm `hub` vào danh sách mặc định của script.
8. Tắt Cloudflare Pages project của hub (để push `main` không build ở đó nữa).

Không merge `feat/costs` vào `main` trước bước 6: Cloudflare Pages build từ
`main`, mà `index.html` đã chuyển vào `public/`, nên trang hiện tại sẽ hỏng.
