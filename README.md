# Dartcode52-server

Nơi nhận xác nhận tham dự và lời chúc cho thiệp cưới La Ngọc & Lan Hương.

- **Thiệp (gửi cho khách): https://lnismeee.github.io/Dartcode52/** — code ở repo [Dartcode52](https://github.com/Lnismeee/Dartcode52).
- **Trang quản trị khách: https://lnismeee.github.io/Dartcode52-server/** — xem, xoá, xuất Excel. Code ở thư mục [admin/](admin/).
  Trang này không có mật khẩu: ai có link đều xem và xoá được khách.

Có hai cách chạy, cùng một cách gọi nên thiệp dùng cách nào cũng được:

- **Google Sheets** (dùng khi thiệp đã lên mạng): xem [google-sheet/HUONG-DAN.txt](google-sheet/HUONG-DAN.txt).- **Chạy trên máy** (để thử): bấm đúp `chay-server.bat`, rồi trong `wedding-invitation/.env.local` đặt
  `VITE_API_URL=http://localhost:4000`.

Dữ liệu khách (`data/`) không được đẩy lên GitHub.
