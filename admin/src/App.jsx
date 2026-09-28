import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

// Cung dia chi Google Sheets voi thiep (wedding-invitation/src/config.js).
// Muon xem server tren may thi dat VITE_API_URL=http://localhost:4000 trong .env.local
const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwd5pH5UG1zK0SuTpOOFaZ_rKIJ1F5wrc-d4GGOKq0i-oHF8NDj_nnsGrGe685eNpWA/exec";
const API_URL = import.meta.env.VITE_API_URL || GOOGLE_SHEETS_URL;

/* Trang nay KHONG co mat khau (chu thiep chon vay): ai co link deu xem va
   xoa duoc khach. Gui bang text/plain (mac dinh cua fetch) de trinh duyet
   khong hoi truoc bang OPTIONS - Apps Script khong tra loi OPTIONS. */
async function goiApi(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Không kết nối được máy chủ");
  const data = await response.json();
  if (data && data.error) throw new Error(data.error);
  return data;
}

const ATTENDING_LABELS = {
  yes: "Chắc chắn tham dự",
  maybe: "Có thể tham dự",
  no: "Vắng mặt",
};

function formatDate(isoString) {
  return new Date(isoString).toLocaleString("vi-VN");
}

function App() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGuests = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await goiApi({ action: "list" });
      setGuests(data.slice().reverse());
    } catch {
      setError("Không thể tải danh sách khách mời. Kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Tai danh sach mot lan khi mo trang; cac lan sau do nguoi dung bam.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGuests();
  }, []);

  const [dangXoa, setDangXoa] = useState(null);

  // Xoa han ca dong: ten, xac nhan tham du, so nguoi va loi chuc.
  const handleXoaDong = async (guest) => {
    const dongY = window.confirm(
      `Xoá hẳn "${guest.name}" khỏi danh sách?\n\nXác nhận tham dự và lời chúc của khách này sẽ bị xoá, không khôi phục được.`,
    );
    if (!dongY) return;

    setDangXoa(guest.id);
    try {
      await goiApi({ action: "delete", id: guest.id });
      setGuests((prev) => prev.filter((g) => g.id !== guest.id));
    } catch (err) {
      window.alert("Không xoá được: " + err.message);
    } finally {
      setDangXoa(null);
    }
  };

  const totalGuests = guests.reduce((sum, g) => sum + g.guests, 0);
  const attendingCount = guests.filter((g) => g.attending === "yes").length;

  const handleExportExcel = () => {
    const rows = guests.map((guest) => ({
      "Họ và tên": guest.name,
      "Tham dự": ATTENDING_LABELS[guest.attending] || guest.attending,
      "Số người": guest.guests,
      "Lời chúc": guest.message || "",
      "Thời gian gửi": formatDate(guest.submittedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 18 },
      { wch: 10 },
      { wch: 40 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Khach moi");
    XLSX.writeFile(workbook, "danh-sach-khach-moi.xlsx");
  };

  return (
    <div className="page">
      <header className="page__header">
        <h1>Danh Sách Khách Mời</h1>
        <p>Lã Ngọc &amp; Lan Hương</p>
        <div className="page__actions">
          <button type="button" className="refresh" onClick={loadGuests}>
            Làm mới
          </button>
          <button
            type="button"
            className="export"
            onClick={handleExportExcel}
            disabled={guests.length === 0}
          >
            Xuất Excel
          </button>        </div>
      </header>

      <section className="summary">
        <div className="summary__card">
          <span className="summary__value">{guests.length}</span>
          <span className="summary__label">Phản hồi</span>
        </div>
        <div className="summary__card">
          <span className="summary__value">{attendingCount}</span>
          <span className="summary__label">Sẽ tham dự</span>
        </div>
        <div className="summary__card">
          <span className="summary__value">{totalGuests}</span>
          <span className="summary__label">Tổng số người</span>
        </div>
      </section>

      {loading && <p className="status">Đang tải...</p>}
      {error && <p className="status status--error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Tham dự</th>
                <th>Số người</th>
                <th>Lời chúc</th>
                <th>Thời gian gửi</th>
                <th>Xoá</th>
              </tr>
            </thead>
            <tbody>
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    Chưa có khách mời nào xác nhận.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id}>
                    <td>{guest.name}</td>
                    <td>
                      <span className={`badge badge--${guest.attending}`}>
                        {ATTENDING_LABELS[guest.attending] || guest.attending}
                      </span>
                    </td>
                    <td>{guest.guests}</td>
                    <td>{guest.message || "—"}</td>
                    <td>{formatDate(guest.submittedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="xoa"
                        onClick={() => handleXoaDong(guest)}
                        disabled={dangXoa === guest.id}
                      >
                        {dangXoa === guest.id ? "Đang xoá..." : "Xoá"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
