# Dartcode52-server

Nơi nhận xác nhận tham dự và lời chúc cho thiệp cưới La Ngọc & Lan Hương.

**Xem thiệp: https://lnismeee.github.io/Dartcode52/** — code thiệp ở repo [Dartcode52](https://github.com/Lnismeee/Dartcode52).
Repo này không có trang thiệp, chỉ có phần nhận xác nhận.

Có hai cách chạy, cùng một cách gọi nên thiệp dùng cách nào cũng được:

- **Google Sheets** (dùng khi thiệp đã lên mạng): xem [google-sheet/HUONG-DAN.txt](google-sheet/HUONG-DAN.txt).
  Nhớ thay `DOI_MA_NAY` trong `Code.gs` bằng mã quản trị thật khi dán vào Apps Script.
- **Chạy trên máy** (để thử): bấm đúp `chay-server.bat`, rồi trong `wedding-invitation/.env.local` đặt
  `VITE_API_URL=http://localhost:4000`.

Dữ liệu khách (`data/`) không được đẩy lên GitHub.
