/* ===================================================================
   NOI NHAN XAC NHAN THAM DU CHO THIEP CUOI
   La Ngoc & Lan Huong - 17/10/2026

   Doan ma nay chay tren may chu cua Google, mien phi va khong bao gio
   ngu. Du lieu khach gui len duoc ghi thang vao bang tinh, khong mat.

   Cach cai dat xem trong file  HUONG-DAN.txt  cung thu muc.
   =================================================================== */

/**
 * Chi xin quyen voi DUNG bang tinh chua doan ma nay, khong dong vao cac
 * bang tinh khac trong tai khoan Google.
 * @OnlyCurrentDoc
 */

/* LUU Y: xem danh sach va xoa KHONG can ma quan tri (chu thiep chon vay
   vi chi minh ho dung trang quan tri). Ai biet duong dan /exec hoac trang
   lnismeee.github.io/Dartcode52-server/ deu xem va xoa duoc khach. */


const TEN_TRANG = 'RSVP';
const TIEU_DE = ['Ma', 'Ho va ten', 'Tham du', 'So khach', 'Loi chuc', 'Thoi diem gui'];

// Vi tri cot (dem tu 0) - dat ten cho de doc, khoi dem tay
const COT_MA = 0;
const COT_TEN = 1;
const COT_THAM_DU = 2;
const COT_SO_KHACH = 3;
const COT_LOI_CHUC = 4;
const COT_THOI_DIEM = 5;


/* ==================================================================
   CONG KHAI - ai mo thiep cung goi duoc
   ================================================================== */

/* So Luu But tren thiep goi vao day de lay danh sach loi chuc.
   Chi tra ve TEN va LOI CHUC. Khong tra trang thai tham du hay so khach,
   vi day la du lieu ai cung xem duoc tren thiep. */
function doGet() {
  const loiChuc = layTatCaDong()
    .filter((d) => String(d[COT_LOI_CHUC] || '').trim())
    .map((d) => ({
      id: String(d[COT_MA]),
      name: String(d[COT_TEN]),
      message: String(d[COT_LOI_CHUC]).trim(),
    }));

  return traVe(loiChuc);
}


/* Moi thu gui len deu di qua day. Phan biet bang truong "action".

     khong co action  ->  khach bam Gui Xac Nhan (cong khai)
     action: 'list'   ->  trang quan tri xin danh sach day du
     action: 'delete' ->  trang quan tri xoa mot xac nhan */
function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return traVe({ error: 'Du lieu gui len khong doc duoc' });
  }

  if (d.action === 'list') return danhSachDayDu();
  if (d.action === 'delete') return xoaXacNhan(d);

  return ghiXacNhan(d);
}


/* ==================================================================
   CAC VIEC CU THE
   ================================================================== */

/* Khach bam "Gui Xac Nhan" -> ghi mot dong moi vao bang tinh. */
function ghiXacNhan(d) {
  return trongKhoa(function () {
    const ten = String(d.name || '').trim();
    if (!ten) return traVe({ error: 'Ten khong duoc de trong' });

    const thamDu = ['yes', 'maybe', 'no'].includes(d.attending) ? d.attending : 'yes';

    const soKhach = Number(d.guests);
    const soKhachHopLe = Number.isFinite(soKhach) && soKhach > 0 ? soKhach : 1;

    const loiChuc = String(d.message || '').trim();
    const ma = String(Date.now());

    layTrang().appendRow([ma, ten, thamDu, soKhachHopLe, loiChuc, new Date()]);

    return traVe({ ok: true, id: ma });
  });
}


/* Trang quan tri xin danh sach day du, gom ca trang thai va so khach. */
function danhSachDayDu() {
  const danhSach = layTatCaDong().map((r) => ({
    id: String(r[COT_MA]),
    name: String(r[COT_TEN]),
    attending: String(r[COT_THAM_DU]),
    guests: Number(r[COT_SO_KHACH]) || 1,
    message: String(r[COT_LOI_CHUC] || ''),
    submittedAt: r[COT_THOI_DIEM] ? new Date(r[COT_THOI_DIEM]).toISOString() : '',
  }));

  return traVe(danhSach);
}


/* Xoa han mot dong khoi bang tinh theo ma. */
function xoaXacNhan(d) {
  const ma = String(d.id || '').trim();
  if (!ma) return traVe({ error: 'Thieu ma dong can xoa' });

  return trongKhoa(function () {
    const trang = layTrang();
    const dong = trang.getDataRange().getValues();

    // Bat dau tu 1 de bo qua dong tieu de.
    // getRange dem tu 1 nen so dong that = chi so + 1.
    for (let i = 1; i < dong.length; i++) {
      if (String(dong[i][COT_MA]) === ma) {
        trang.deleteRow(i + 1);
        return traVe({ ok: true, id: ma });
      }
    }
    return traVe({ error: 'Khong tim thay dong nao co ma ' + ma });
  });
}


/* ==================================================================
   TIEN ICH
   ================================================================== */

/* Hai nguoi thao tac cung luc co the ghi de len nhau. Khoa lai cho chac. */
function trongKhoa(viec) {
  const khoa = LockService.getScriptLock();
  try {
    khoa.waitLock(20000);
  } catch (err) {
    return traVe({ error: 'May chu dang ban, vui long thu lai' });
  }
  try {
    return viec();
  } catch (err) {
    return traVe({ error: String(err) });
  } finally {
    khoa.releaseLock();
  }
}


/* Tat ca cac dong du lieu, da bo dong tieu de. */
function layTatCaDong() {
  const dong = layTrang().getDataRange().getValues();
  dong.shift();
  return dong;
}


/* Lay trang tinh, tu tao kem dong tieu de neu chua co. */
function layTrang() {
  const bang = SpreadsheetApp.getActiveSpreadsheet();
  let trang = bang.getSheetByName(TEN_TRANG);

  if (!trang) {
    trang = bang.insertSheet(TEN_TRANG);
  }
  if (trang.getLastRow() === 0) {
    trang.appendRow(TIEU_DE);
    trang.getRange(1, 1, 1, TIEU_DE.length).setFontWeight('bold');
    trang.setFrozenRows(1);
  }
  return trang;
}


function traVe(duLieu) {
  return ContentService
    .createTextOutput(JSON.stringify(duLieu))
    .setMimeType(ContentService.MimeType.JSON);
}
