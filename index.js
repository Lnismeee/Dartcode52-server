import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "rsvp.json");

/* Server nay noi cung "ngon ngu" voi google-sheet/Code.gs, de khi chay thu
   tren may chi can dat  VITE_API_URL=http://localhost:4000  la dung duoc:

     GET  /                         -> danh sach loi chuc (cong khai)
     POST /  (khong co action)      -> khach gui xac nhan
     POST /  { action: 'list' }     -> trang quan tri xin danh sach (can ma)
     POST /  { action: 'delete' }   -> trang quan tri xoa mot dong (can ma)

   Loi tra ve dang { error } voi ma 200, giong het Apps Script. */

// Ma quan tri: lay tu bien moi truong ADMIN_KEY, neu khong co thi doc
// VITE_ADMIN_KEY trong guest-admin/.env.local de khoi khai bao hai noi.
function docMaQuanTri() {
  if (process.env.ADMIN_KEY) return process.env.ADMIN_KEY;
  try {
    const env = fs.readFileSync(path.join(__dirname, "..", "guest-admin", ".env.local"), "utf-8");
    const dong = env.match(/^\s*VITE_ADMIN_KEY\s*=\s*(.+?)\s*$/m);
    return dong ? dong[1].replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}
const MA_QUAN_TRI = docMaQuanTri();

function readRsvps() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  if (!raw.trim()) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // File hong thi khong ghi de len, de con cuu duoc du lieu cu.
    throw new Error(`File du lieu bi hong: ${DATA_FILE}`);
  }
}

function writeRsvps(rsvps) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  // Ghi ra file tam roi doi ten, tat ngang giua chung cung khong mat file.
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(rsvps, null, 2), "utf-8");
  fs.renameSync(tmp, DATA_FILE);
}

function danhSachLoiChuc() {
  return readRsvps()
    .filter((entry) => entry.message && entry.message.trim())
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      message: entry.message.trim(),
    }));
}

function ghiXacNhan(d) {
  const name = typeof d.name === "string" ? d.name.trim() : "";
  if (!name) return { status: 400, body: { error: "Tên không được để trống" } };

  const attending = ["yes", "maybe", "no"].includes(d.attending) ? d.attending : "yes";
  const guestsCount = Number(d.guests);
  const entry = {
    id: Date.now().toString(),
    name,
    attending,
    guests: Number.isFinite(guestsCount) && guestsCount > 0 ? guestsCount : 1,
    message: typeof d.message === "string" ? d.message.trim() : "",
    submittedAt: new Date().toISOString(),
  };

  const rsvps = readRsvps();
  rsvps.push(entry);
  writeRsvps(rsvps);
  return { status: 201, body: { ok: true, ...entry } };
}

function dungMa(d) {
  return Boolean(MA_QUAN_TRI) && String(d.key || "") === MA_QUAN_TRI;
}

function xoaXacNhan(d) {
  const id = String(d.id || "").trim();
  if (!id) return { error: "Thiếu mã dòng cần xoá" };

  const rsvps = readRsvps();
  const conLai = rsvps.filter((r) => String(r.id) !== id);
  if (conLai.length === rsvps.length) return { error: "Không tìm thấy dòng nào có mã " + id };

  writeRsvps(conLai);
  return { ok: true, id };
}

const app = express();
app.use(cors());
// Thiep gui bang text/plain (tranh preflight), nen doc ca hai loai roi tu parse.
app.use(express.text({ type: ["text/plain", "application/json"], limit: "100kb" }));
app.use((req, res, next) => {
  if (typeof req.body === "string") {
    if (!req.body.trim()) {
      req.body = {};
    } else {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        return res.json({ error: "Dữ liệu gửi lên không đọc được" });
      }
    }
  }
  if (!req.body || typeof req.body !== "object") req.body = {};
  next();
});

/* ---------- Giong Apps Script ---------- */

app.get("/", (req, res) => {
  res.json(danhSachLoiChuc());
});

app.post("/", (req, res) => {
  const d = req.body;

  if (d.action === "list" || d.action === "delete") {
    if (!dungMa(d)) return res.json({ error: "Sai mã quản trị" });
    if (d.action === "list") return res.json(readRsvps());
    return res.json(xoaXacNhan(d));
  }

  res.json(ghiXacNhan(d).body);
});

/* ---------- Duong dan cu, giu lai cho tuong thich ---------- */

app.get("/api/rsvp", (req, res) => {
  res.json(readRsvps());
});

// Chi tra ten va loi chuc - khong lo trang thai tham du hay so luong khach.
app.get("/api/wishes", (req, res) => {
  res.json(danhSachLoiChuc());
});

app.post("/api/rsvp", (req, res) => {
  const { status, body } = ghiXacNhan(req.body);
  res.status(status).json(body);
});

// Loi bat ngo (vd file du lieu hong) -> tra JSON thay vi trang HTML.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Lỗi máy chủ" });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Wedding RSVP server running on http://localhost:${PORT}`);
  if (!MA_QUAN_TRI) {
    console.log("Chua co ma quan tri (ADMIN_KEY / guest-admin/.env.local) - trang quan tri se bi tu choi.");
  }
});
