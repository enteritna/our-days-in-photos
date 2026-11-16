# Our Days In Photos

Hãy xây dựng website full-stack production-ready tên "My Love" dựa trên HTML nguồn được đính kèm bên dưới. Giữ lại tối đa bố cục, phong cách, thuật ngữ tiếng Việt, kho ảnh dạng film-strip theo ngày, viewer ảnh, thao tác thêm/xóa/tải ảnh, bộ đếm tình yêu và lịch tháng từ HTML nguồn, nhưng sửa các lỗi và hoàn thiện yêu cầu sau.

YÊU CẦU BẮT BUỘC:
1) Màn hình mở đầu lãng mạn, mềm mại, đồng bộ giao diện My Love, có ô nhập mật khẩu màu trắng. Mật khẩu chính xác là 27072026. Chỉ sau khi nhập đúng mới hiện/kích hoạt nút OPEN; bấm OPEN mới vào giao diện chính. Sai mật khẩu báo lỗi nhẹ. Đây là lớp khóa giao diện phía client, KHÔNG tuyên bố là bảo mật server-side vì trang được publish public.
2) Giao diện 1: giữ kho ảnh, upload nhiều ảnh, sắp theo ngày, mở viewer, điều hướng, tải xuống, xóa có xác nhận. Nhạc Lofi riêng cho giao diện 1, điều khiển bật/tắt rõ ràng. Do browser chặn autoplay, chỉ thử sau tương tác hoặc dùng nút bật nhạc; không giả định autoplay luôn hoạt động.
3) Giao diện 2/viewer: video riêng đặt trong khung bên phải cùng đồng hồ và lịch. Video không autoplay, không chạy nền, không phát tiếng khi viewer mở; chỉ chạy sau khi người dùng nhấn nút tam giác PLAY. Không dùng audio gốc của MP4. Thay bằng một bản nhạc Lofi nhẹ nhàng RIÊNG, khác hoàn toàn nhạc giao diện 1. Khi bấm PLAY, phát video cùng nhạc Lofi 2; khi pause/close/thoát viewer thì dừng video và nhạc 2. Không dùng track audio gốc của video.
4) Đồng hồ đếm từ mốc 27/07/2026 00:00 giờ địa phương, cập nhật mỗi giây; lịch luôn tính ngày/tháng/năm thực tế mỗi lần vào trang và tự đổi ngày/tháng.
5) Sao lưu ảnh/nội dung bền vững qua thiết bị: dùng cloud database + object storage, có xác thực/owner scope phù hợp, không chỉ IndexedDB/localStorage. Có chức năng export/backup và restore từ file; hiển thị trạng thái đồng bộ và lỗi rõ ràng. Không làm mất dữ liệu hiện tại. Nếu chưa cấu hình auth, đừng tuyên bố dữ liệu đã được cloud-backup.
6) Thiết kế responsive desktop/mobile, accessibility, loading/error/empty states. Tránh hardcode giả dữ liệu ảnh. Tạo sample UI rỗng cho tới khi user upload ảnh.
7) Chuẩn bị video asset tại public/video_1.mp4, nhưng file binary chưa thể được truyền vào lần tạo dự án này; không tự tạo file giả. Dùng placeholder dễ nhận biết và báo rằng cần thêm file video thật sau đó. Tạo cấu trúc để thay thế asset này dễ dàng.
8) Viết code thật trong project, không chỉ mô tả. Kiểm tra build/lint nếu có. Không publish ngay; trước hết hoàn thành preview và cho biết phần nào còn chờ asset MP4 hoặc cấu hình cloud.

DƯỚI ĐÂY LÀ HTML GỐC ĐỂ GIỮ LÀM CƠ SỞ THIẾT KẾ VÀ TÍNH NĂNG:
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My love - Kho ảnh kỷ niệm & Kỷ niệm tình yêu</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap">
<style>
:root {
  --white: #ffffff;
  --paper: #0f172a;
  --navy: #0f172a;
  --navy-soft: #94a3b8;
  --accent: #38bdf8;
  --font: "Be Vietnam Pro", "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html, body { margin: 0; min-height: 100vh; }
body { font-family: var(--font); background: var(--paper); color: var(--white); font-size: 14px; line-height: 1.4; position: relative; overflow-x: hidden; }

.main-bg-layer {
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  filter: blur(40px) brightness(0.35) saturate(1.2);
  transform: scale(1.1);
}

button, input { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 38px; padding: 6px 16px; border: none; border-radius: 999px; background: rgba(255,255,255,0.1); font-weight: 600; backdrop-filter: blur(10px); transition: all 0.2s ease; border: 1px solid rgba(255,255,255,0.1); }
.btn:hover { transform: scale(1.02); background: rgba(255,255,255,0.2); }
.btn.sun { background: #1db954; color: #fff; border: none; }
.btn.sun:hover { background: #1ed760; }
.btn.danger { background: #ef4444; color: var(--white); }

.top { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 12px max(24px, env(safe-area-inset-right)); background: rgba(15, 23, 42, 0.75); border-bottom: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(16px); }
.top .ttl { display: flex; align-items: center; gap: 12px; min-width: 0; }
.top .dot { width: 10px; height: 10px; border-radius: 50%; background: #1db954; box-shadow: 0 0 10px #1db954; flex: none; }
.top h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
.top .cnt { display: block; font-size: 11px; color: var(--navy-soft); font-weight: 500; }
.cloud-status { font-size: 11px; padding: 2px 8px; border-radius: 20px; background: rgba(29, 185, 84, 0.15); color: #1ed760; font-weight: 500; border: 1px solid rgba(29, 185, 84, 0.3); }

.feed { max-width: 1300px; margin: 0 auto; padding: 20px max(16px, env(safe-area-inset-left)) 80px max(16px, env(safe-area-inset-right)); }
.shelf { margin-top: 24px; background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(12px); }
.shelf-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.shelf-head .left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.day { margin: 0; padding: 4px 12px; border-radius: 8px; background: rgba(255,255,255,0.1); color: #fff; font-size: 13px; font-weight: 700; }
.shelf-head .n { font-size: 12px; color: var(--navy-soft); font-weight: 500; }
.arrows { display: flex; gap: 6px; flex: none; }
.arrow { width: 32px; height: 32px; padding: 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; background: rgba(255,255,255,0.05); font-size: 15px; font-weight: 700; display: grid; place-items: center; }
.arrow:hover { background: rgba(255,255,255,0.2); }

.film { overflow-x: auto; border-radius: 14px; scroll-snap-type: x proximity; scrollbar-width: thin; scrollbar-color: #334155 transparent; }
.frames { 
  --hole: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='14'%3E%3Crect x='6' y='2' width='12' height='10' rx='3' fill='%2364748b' opacity='0.4'/%3E%3C/svg%3E");
  display: flex; gap: 14px; width: max-content; min-width: 100%; padding: 30px 16px;
  background-color: rgba(5, 8, 15, 0.6); background-image: var(--hole), var(--hole); background-repeat: repeat-x; background-position: 0 8px, 0 calc(100% - 8px); 
}
.cover { flex: none; width: 160px; padding: 8px; border-radius: 12px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.06); scroll-snap-align: start; transition: transform 0.2s; }
.cover:hover { transform: translateY(-3px); background: rgba(255, 255, 255, 0.08); }
.tile { position: relative; display: block; width: 100%; aspect-ratio: 1; padding: 0; border: 0; border-radius: 8px; overflow: hidden; background: #1e293b; }
.tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tile .play { position: absolute; right: 8px; bottom: 8px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #1db954; color: #fff; opacity: 0; transform: translateY(6px); transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.4); }
.cover:hover .play { opacity: 1; transform: none; }
.cap { display: grid; margin-top: 6px; padding: 0 2px; }
.cap b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff; font-size: 12px; font-weight: 500; }
.cap span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--navy-soft); font-size: 10px; }

.empty { margin: 60px auto; padding: 40px 20px; text-align: center; border: 2px dashed rgba(255,255,255,0.15); border-radius: 20px; background: rgba(255,255,255,0.02); max-width: 480px; }
.empty h2 { margin: 0 0 6px; font-size: 18px; }
.empty p { margin: 0 0 16px; color: var(--navy-soft); }

/* Giao diện 2 chuẩn trọn vẹn kết cấu */
.viewer { position: fixed; inset: 0; z-index: 40; display: grid; grid-template-columns: minmax(0, 1fr) 420px; overflow: hidden; background: #121212; color: #fff; }
.vbg { position: absolute; inset: -60px; z-index: 0; background-size: cover; background-position: center; filter: blur(60px) saturate(1.8); opacity: 0.25; pointer-events: none; }
.viewer .main { position: relative; z-index: 1; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; min-height: 0; min-width: 0; }
.viewer .bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 20px; background: rgba(0,0,0,0.2); }
.viewer .info { min-width: 0; font-size: 13px; }
.viewer .info b { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.viewer .stage { 
  position: relative; 
  min-height: 0; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  padding: 20px; 
}
.viewer .stage img { 
  max-width: 100%; 
  max-height: 100%; 
  object-fit: contain; 
  border-radius: 10px; 
  box-shadow: 0 20px 50px rgba(0,0,0,0.7); 
  border: 1px solid rgba(255,255,255,0.08);
}
.viewer .nav { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border: none; border-radius: 50%; background: rgba(0,0,0,0.5); color: #fff; font-size: 22px; display: grid; place-items: center; backdrop-filter: blur(8px); transition: background 0.2s, transform 0.2s; }
.viewer .nav:hover { background: rgba(0,0,0,0.8); transform: translateY(-50%) scale(1.05); }
.viewer .prev { left: 16px; }
.viewer .next { right: 16px; }
.viewer .foot { display: flex; justify-content: center; gap: 10px; padding: 12px; background: rgba(0,0,0,0.3); }

/* Khung bên phải */
.viewer .side { 
  position: relative; 
  z-index: 1; 
  display: flex; 
  flex-direction: column; 
  gap: 14px; 
  min-height: 0; 
  overflow-y: auto; 
  padding: 16px 20px; 
  background: rgba(18, 18, 18, 0.95); 
  border-left: 1px solid rgba(255, 255, 255, 0.08); 
  backdrop-filter: blur(20px); 
}

/* Khung chữ nhật xanh chứa trọn vẹn video_1.mp4 */
.animation-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px;
  text-align: center;
  display: grid;
  gap: 8px;
}
.animation-screen {
  position: relative;
  width: 100%;
  height: 210px;
  background: #000;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}
.animation-screen video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.anim-title {
  font-size: 12px;
  font-weight: 600;
  color: #f472b6;
}

/* Đồng hồ đếm số ngày yêu nhau mốc cố định 27/07/2026 */
.love-counter-card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 16px 12px;
  text-align: center;
  border: 2px solid #f472b6;
  box-shadow: 0 0 15px rgba(244, 114, 182, 0.3);
  animation: borderPulse 2s infinite;
}
@keyframes borderPulse {
  0%, 100% { border-color: rgba(244, 114, 182, 0.6); box-shadow: 0 0 10px rgba(244, 114, 182, 0.2); }
  50% { border-color: rgba(244, 114, 182, 1); box-shadow: 0 0 22px rgba(244, 114, 182, 0.5); }
}
.counter-title { font-size: 11px; text-transform: uppercase; color: var(--navy-soft); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 4px; }
.counter-value { font-size: 20px; font-weight: 700; color: #f472b6; }

/* Lịch tháng thực tế */
.calendar-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
}
.cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-weight: 700; font-size: 13px; color: #fff; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-size: 11px; }
.cal-dow { color: var(--navy-soft); font-weight: 600; padding-bottom: 4px; }
.cal-day { padding: 6px 0; border-radius: 6px; background: rgba(255,255,255,0.02); color: #cbd5e1; position: relative; }
.cal-day.today { background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-weight: 700; border: 1px solid rgba(56,189,248,0.4); }
.cal-day.anniversary::after {
  content: '❤️';
  position: absolute;
  font-size: 8px;
  bottom: 1px;
  right: 2px;
}

.toast { position: fixed; z-index: 80; left: 50%; bottom: 24px; transform: translateX(-50%); padding: 10px 20px; border-radius: 999px; background: #121212; color: #fff; font-weight: 500; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); }

@media (max-width: 900px) {
  .viewer { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
  .viewer .side { max-height: 52vh; border-left: none; border-top: 1px solid rgba(255,255,255,0.08); }
}

.acts { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.feed.drag-over, .empty.drag-over {
  outline: 2px dashed var(--accent);
  outline-offset: -6px;
  background: rgba(56,189,248,.08);
}
.btn:disabled { opacity: .55; cursor: not-allowed; }
@media (max-width: 900px) {
  .viewer { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; }
  .viewer .side { max-height: 38dvh; }
  .viewer .stage { padding: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}

body[data-viewer-open="true"] { overflow: hidden; }
</style>
</head>
<body>

<div class="main-bg-layer" id="mainBgLayer"></div>

<div id="app">
  <header class="top">
    <div class="ttl">
      <span class="dot" aria-hidden="true"></span>
      <div>
        <h1>My love <span class="cnt" id="count">0 ảnh</span></h1>
        <div id="syncStatus" class="cloud-status">▣ Đang mở kho ảnh</div>
      </div>
    </div>
    <div class="acts">
      <button type="button" class="btn" id="musicBtn" aria-pressed="false">♫ Bật nhạc</button>
      <button type="button" class="btn sun" id="addBtn">+ Tải ảnh lên</button>
    </div>
  </header>
  
  <main class="feed">
    <div id="empty" class="empty">
      <h2>Chưa có ảnh nào trong My love</h2>
      <p>Bấm nút bên dưới để tải ảnh lên hoặc kéo thả trực tiếp vào đây.</p>
      <button type="button" class="btn sun" id="addBtn2">+ Thêm ảnh ngay</button>
    </div>
    <div id="feed"></div>
  </main>
</div>

<!-- Giao diện 2 hoàn chỉnh -->
<div id="viewer" class="viewer" role="dialog" aria-modal="true" aria-label="Xem ảnh" hidden>
  <div class="vbg" id="vBg" aria-hidden="true"></div>
  <div class="main">
    <div class="bar">
      <div class="info"><b id="vName"></b><span id="vMeta"></span></div>
      <button type="button" class="btn" id="vClose">Đóng</button>
    </div>
    <div class="stage">
      <img id="vImg" alt="">
      <button type="button" class="nav prev" id="vPrev" aria-label="Ảnh trước">‹</button>
      <button type="button" class="nav next" id="vNext" aria-label="Ảnh sau">›</button>
    </div>
    <div class="foot" id="vFoot"></div>
  </div>
  
  <aside class="side" aria-label="Tiện ích tình yêu">
    <!-- Khung chữ nhật xanh chứa trực tiếp video_1.mp4, âm lượng đã giảm -->
    <div class="animation-box">
      <div class="animation-screen">
        <video id="embeddedVideo" src="video_1.mp4" autoplay muted loop playsinline preload="metadata" aria-label="Video kỷ niệm"></video>
      </div>
      <div class="anim-title">🌹 Khoảnh khắc ngọt ngào bên nhau</div>
    </div>

    <!-- Đồng hồ đếm số ngày yêu nhau từ 27/07/2026 -->
    <div class="love-counter-card">
      <div class="counter-title">❤️ THỜI GIAN BÊN NHAU ❤️</div>
      <div class="counter-value" id="loveCounter">Đang tính...</div>
    </div>

    <!-- Lịch tháng thực tế kỷ niệm ngày 27 -->
    <div class="calendar-card" id="realCalendar"></div>
  </aside>
</div>

<!-- Nhạc nền Lofi / Chill nhẹ nhàng ở giao diện 1 -->
<audio id="bgAudio" src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf756.mp3?filename=lofi-study-112191.mp3" preload="none" loop></audio>

<input type="file" id="file" accept="image/*" multiple hidden>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>


<script>
(function () {
  'use strict';

  var DB_NAME = 'my-love-db';
  var DB_VERSION = 1;
  var STORE = 'photos';
  var LEGACY_KEY = 'my_love_photos_v16';
  var MAX_FILE_BYTES = 20 * 1024 * 1024;
  var photos = [];
  var order = [];
  var vIdx = 0;
  var vAsk = false;
  var toastTimer = 0;
  var counterTimer = 0;
  var objectUrls = new Map();
  var dbPromise;

  var $ = function (selector) { return document.querySelector(selector); };

  function toast(message) {
    var el = $('#toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3500);
  }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) {
        reject(new Error('Trình duyệt không hỗ trợ IndexedDB.'));
        return;
      }
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          var store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('Không mở được kho dữ liệu.')); };
      request.onblocked = function () { toast('Vui lòng đóng các tab My love khác để cập nhật kho dữ liệu.'); };
    });
    return dbPromise;
  }

  async function getAllRecords() {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, 'readonly');
      var req = tx.objectStore(STORE).getAll();
      req.onsuccess = function () { resolve(req.result || []); };
      req.onerror = function () { reject(req.error || new Error('Không đọc được dữ liệu ảnh.')); };
    });
  }

  async function putRecord(record) {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = resolve;
      tx.onerror = function () { reject(tx.error || new Error('Không lưu được ảnh.')); };
      tx.onabort = function () { reject(tx.error || new Error('Lưu ảnh đã bị hủy.')); };
    });
  }

  async function deleteRecord(id) {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = function () { reject(tx.error || new Error('Không xóa được ảnh.')); };
      tx.onabort = function () { reject(tx.error || new Error('Xóa ảnh đã bị hủy.')); };
    });
  }

  function validRecord(p) {
    return p && typeof p.id === 'string' && p.id.length > 0 &&
      typeof p.name === 'string' &&
      Number.isFinite(Number(p.createdAt)) &&
      Number.isFinite(Number(p.size)) &&
      (p.blob instanceof Blob || (typeof p.dataUrl === 'string' && /^data:image\//i.test(p.dataUrl)));
  }

  async function migrateLegacyData() {
    var raw;
    try { raw = localStorage.getItem(LEGACY_KEY); } catch (e) {
      throw new Error('Không thể đọc dữ liệu cũ từ bộ nhớ trình duyệt.');
    }
    if (!raw) return;
    var legacy;
    try { legacy = JSON.parse(raw); } catch (e) {
      toast('Dữ liệu cũ bị lỗi định dạng; bản gốc vẫn được giữ nguyên.');
      return;
    }
    if (!Array.isArray(legacy)) {
      toast('Dữ liệu cũ không đúng cấu trúc; bản gốc vẫn được giữ nguyên.');
      return;
    }
    var existing = await getAllRecords();
    if (existing.length) return;
    for (var i = 0; i < legacy.length; i++) {
      var item = legacy[i];
      if (!item || typeof item.dataUrl !== 'string' || !/^data:image\//i.test(item.dataUrl)) continue;
      try {
        var response = await fetch(item.dataUrl);
        var blob = await response.blob();
        var record = {
          id: String(item.id || ('legacy_' + Date.now() + '_' + i)),
          name: String(item.name || 'Ảnh kỷ niệm'),
          size: Number(item.size) || blob.size,
          createdAt: Number(item.createdAt) || Date.now(),
          blob: blob
        };
        await putRecord(record);
      } catch (e) {
        toast('Một số ảnh cũ không thể chuyển đổi. Dữ liệu gốc vẫn được giữ.');
      }
    }
    // Keep the legacy key as a safety copy; user can remove it manually after confirming migration.
  }

  function getUrl(photo) {
    if (!objectUrls.has(photo.id)) objectUrls.set(photo.id, URL.createObjectURL(photo.blob));
    return objectUrls.get(photo.id);
  }

  function releaseUrl(id) {
    if (objectUrls.has(id)) {
      URL.revokeObjectURL(objectUrls.get(id));
      objectUrls.delete(id);
    }
  }

  function fmtBytes(value) {
    var n = Number(value) || 0;
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return n.toLocaleString('vi-VN', { maximumFractionDigits: i < 2 ? 0 : 1 }) + ' ' + units[i];
  }

  function dayKey(ms) {
    return new Date(ms).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  function stripName(name) {
    return String(name || 'Ảnh').replace(/\.[^.]+$/, '');
  }

  function updateBackground() {
    var first = photos.slice().sort(function (a, b) {
      return b.createdAt - a.createdAt;
    })[0];
    $('#mainBgLayer').style.backgroundImage = first
      ? 'url("' + getUrl(first) + '")'
      : '';
  }

  async function loadPhotos() {
    await migrateLegacyData();
    var records = await getAllRecords();
    photos = records.filter(validRecord).map(function (p) {
      if (!p.blob && p.dataUrl) return p;
      return p;
    }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    order = photos.map(function (p) { return p.id; });
    updateBackground();
    render();
  }

  function cover(photo, index) {
    var box = document.createElement('div');
    box.className = 'cover';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    button.setAttribute('aria-label', 'Mở ' + (photo.name || 'ảnh'));
    var img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = photo.name || 'Ảnh kỷ niệm';
    img.src = getUrl(photo);
    var play = document.createElement('span');
    play.className = 'play';
    play.setAttribute('aria-hidden', 'true');
    play.textContent = '▶';
    button.appendChild(img);
    button.appendChild(play);
    button.addEventListener('click', function () { openViewer(index); });

    var caption = document.createElement('div');
    caption.className = 'cap';
    var title = document.createElement('b');
    title.textContent = stripName(photo.name);
    var meta = document.createElement('span');
    meta.textContent = dayKey(photo.createdAt) + ' · ' + fmtBytes(photo.size);
    caption.appendChild(title);
    caption.appendChild(meta);
    box.appendChild(button);
    box.appendChild(caption);
    return box;
  }

  function render() {
    var feed = $('#feed');
    feed.replaceChildren();
    $('#count').textContent = photos.length + ' ảnh';
    $('#empty').hidden = photos.length > 0;
    var sorted = photos.slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
    order = sorted.map(function (p) { return p.id; });
    var today = dayKey(Date.now());
    var groups = [];
    sorted.forEach(function (photo, index) {
      var key = dayKey(photo.createdAt);
      var group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key: key, items: [] };
        groups.push(group);
      }
      group.items.push({ photo: photo, index: index });
    });

    groups.forEach(function (group) {
      var section = document.createElement('section');
      section.className = 'shelf';
      var head = document.createElement('div');
      head.className = 'shelf-head';
      var left = document.createElement('div');
      left.className = 'left';
      var heading = document.createElement('h2');
      heading.className = 'day';
      heading.textContent = group.key === today ? 'Hôm nay' : group.key;
      var count = document.createElement('span');
      count.className = 'n';
      count.textContent = group.items.length + ' ảnh';
      left.appendChild(heading);
      left.appendChild(count);
      var arrows = document.createElement('div');
      arrows.className = 'arrows';
      var film = document.createElement('div');
      film.className = 'film';
      film.tabIndex = 0;
      var frames = document.createElement('div');
      frames.className = 'frames';
      group.items.forEach(function (item) {
        frames.appendChild(cover(item.photo, item.index));
      });
      film.appendChild(frames);
      [['‹', -1], ['›', 1]].forEach(function (entry) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'arrow';
        button.setAttribute('aria-label', entry[1] < 0 ? 'Cuộn sang trái' : 'Cuộn sang phải');
        button.textContent = entry[0];
        button.addEventListener('click', function () {
          film.scrollBy({ left: entry[1] * 320, behavior: 'smooth' });
        });
        arrows.appendChild(button);
      });
      head.appendChild(left);
      head.appendChild(arrows);
      section.appendChild(head);
      section.appendChild(film);
      feed.appendChild(section);
    });
  }

  async function addFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    var accepted = files.filter(function (file) {
      return file.type && /^image\//i.test(file.type) && file.size <= MAX_FILE_BYTES;
    });
    var rejected = files.length - accepted.length;
    if (rejected) toast(rejected + ' tệp bị bỏ qua (không phải ảnh hoặc vượt quá 20 MB).');
    if (!accepted.length) {
      if (!rejected) toast('Không tìm thấy ảnh hợp lệ.');
      return;
    }

    var added = 0;
    for (var i = 0; i < accepted.length; i++) {
      var file = accepted[i];
      try {
        // Decode once to reject corrupt or unsupported image files before persisting.
        var bitmap = await createImageBitmap(file);
        bitmap.close();
        var record = {
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10),
          name: file.name || 'Ảnh kỷ niệm',
          size: file.size,
          createdAt: Date.now() + i,
          blob: file.slice(0, file.size, file.type)
        };
        await putRecord(record);
        photos.push(record);
        added++;
      } catch (error) {
        toast('Không thể thêm "' + (file.name || 'ảnh') + '". Hãy thử ảnh khác.');
      }
    }
    photos.sort(function (a, b) { return b.createdAt - a.createdAt; });
    updateBackground();
    render();
    if (added) toast('Đã lưu ' + added + ' ảnh vào bộ nhớ thiết bị.');
  }

  function pick() { $('#file').click(); }
  $('#addBtn').addEventListener('click', pick);
  $('#addBtn2').addEventListener('click', pick);
  $('#file').addEventListener('change', function (event) {
    addFiles(event.target.files);
    event.target.value = '';
  });

  function setupDragDrop() {
    var targets = [$('#empty'), $('#feed')];
    targets.forEach(function (target) {
      ['dragenter', 'dragover'].forEach(function (name) {
        target.addEventListener(name, function (event) {
          event.preventDefault();
          target.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(function (name) {
        target.addEventListener(name, function (event) {
          event.preventDefault();
          target.classList.remove('drag-over');
        });
      });
      target.addEventListener('drop', function (event) {
        addFiles(event.dataTransfer && event.dataTransfer.files);
      });
    });
  }

  function findPhoto(id) {
    return photos.find(function (photo) { return photo.id === id; });
  }

  function openViewer(index) {
    vIdx = index;
    vAsk = false;
    var viewer = $('#viewer');
    viewer.hidden = false;
    document.body.dataset.viewerOpen = 'true';
    $('#vClose').focus();
    showViewer();
  }

  function closeViewer() {
    $('#viewer').hidden = true;
    delete document.body.dataset.viewerOpen;
    $('#vImg').removeAttribute('src');
    $('#vBg').style.backgroundImage = '';
    vAsk = false;
    var photoButton = document.querySelector('.tile');
    if (photoButton) photoButton.focus();
  }

  function showViewer() {
    var photo = findPhoto(order[vIdx]);
    if (!photo) { closeViewer(); return; }
    var url = getUrl(photo);
    $('#vImg').src = url;
    $('#vImg').alt = photo.name || 'Ảnh kỷ niệm';
    $('#vName').textContent = photo.name || 'Ảnh kỷ niệm';
    $('#vMeta').textContent = (vIdx + 1) + '/' + order.length + ' · ' +
      dayKey(photo.createdAt) + ' · ' + fmtBytes(photo.size);
    $('#vPrev').hidden = $('#vNext').hidden = order.length < 2;
    $('#vBg').style.backgroundImage = 'url("' + url + '")';

    var foot = $('#vFoot');
    foot.replaceChildren();
    if (vAsk) {
      var question = document.createElement('span');
      question.textContent = 'Xóa ảnh này?';
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn';
      cancel.textContent = 'Không';
      cancel.onclick = function () { vAsk = false; showViewer(); };
      var confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'btn danger';
      confirm.textContent = 'Xóa ảnh';
      confirm.onclick = removeCurrent;
      foot.append(question, cancel, confirm);
    } else {
      var download = document.createElement('button');
      download.type = 'button';
      download.className = 'btn sun';
      download.textContent = 'Tải xuống';
      download.onclick = function () {
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = photo.name || 'anh-ky-niem';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      };
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn';
      remove.textContent = 'Xóa ảnh';
      remove.onclick = function () { vAsk = true; showViewer(); };
      foot.append(download, remove);
    }
  }

  async function removeCurrent() {
    var photo = findPhoto(order[vIdx]);
    if (!photo) return;
    try {
      await deleteRecord(photo.id);
      releaseUrl(photo.id);
      photos = photos.filter(function (item) { return item.id !== photo.id; });
      render();
      updateBackground();
      if (!order.length) {
        closeViewer();
        toast('Đã xóa ảnh.');
        return;
      }
      vIdx = Math.min(vIdx, order.length - 1);
      vAsk = false;
      showViewer();
      toast('Đã xóa ảnh.');
    } catch (error) {
      toast('Không thể xóa ảnh. Dữ liệu vẫn được giữ nguyên.');
    }
  }

  function step(direction) {
    if (order.length < 2) return;
    vIdx = (vIdx + direction + order.length) % order.length;
    vAsk = false;
    showViewer();
  }

  $('#vClose').addEventListener('click', closeViewer);
  $('#vPrev').addEventListener('click', function () { step(-1); });
  $('#vNext').addEventListener('click', function () { step(1); });

  document.addEventListener('keydown', function (event) {
    if ($('#viewer').hidden) return;
    if (event.key === 'Escape') {
      if (vAsk) { vAsk = false; showViewer(); }
      else closeViewer();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'Tab') {
      var focusable = Array.prototype.slice.call(
        $('#viewer').querySelectorAll('button:not([hidden]), a[href], video[controls]')
      ).filter(function (el) { return !el.disabled; });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });

  function initLoveCounter() {
    var start = new Date(2026, 6, 27, 0, 0, 0);
    function update() {
      var now = new Date();
      var diff = Math.max(0, now.getTime() - start.getTime());
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var minutes = Math.floor((diff % 3600000) / 60000);
      var seconds = Math.floor((diff % 60000) / 1000);
      $('#loveCounter').textContent = days + ' ngày ' + hours + ' giờ ' +
        minutes + ' phút ' + seconds + ' giây';
    }
    update();
    counterTimer = window.setInterval(update, 1000);
  }

  function initCalendar() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var totalDays = new Date(year, month + 1, 0).getDate();
    var names = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
      'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
    var container = $('#realCalendar');
    container.replaceChildren();
    var header = document.createElement('div');
    header.className = 'cal-header';
    var label = document.createElement('span');
    label.textContent = '📅 ' + names[month] + ' ' + year;
    var note = document.createElement('span');
    note.textContent = 'Kỷ niệm ngày 27 ❤️';
    header.append(label, note);
    var grid = document.createElement('div');
    grid.className = 'cal-grid';
    ['CN','T2','T3','T4','T5','T6','T7'].forEach(function (day) {
      var cell = document.createElement('div');
      cell.className = 'cal-dow';
      cell.textContent = day;
      grid.appendChild(cell);
    });
    for (var i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));
    for (var day = 1; day <= totalDays; day++) {
      var cell = document.createElement('div');
      cell.className = 'cal-day' + (day === now.getDate() ? ' today' : '') +
        (day === 27 ? ' anniversary' : '');
      cell.textContent = day;
      grid.appendChild(cell);
    }
    container.append(header, grid);
  }

  function scheduleCalendarRefresh() {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    window.setTimeout(function () {
      initCalendar();
      scheduleCalendarRefresh();
    }, Math.max(1000, next.getTime() - now.getTime()));
  }

  function setupAudio() {
    var audio = $('#bgAudio');
    var button = $('#musicBtn');
    audio.volume = 0.22;
    button.addEventListener('click', async function () {
      if (audio.paused) {
        try {
          await audio.play();
          button.textContent = '♫ Tắt nhạc';
          button.setAttribute('aria-pressed', 'true');
        } catch (error) {
          button.textContent = 'Không phát được nhạc';
          button.setAttribute('aria-pressed', 'false');
          toast('Không tải được nhạc nền. Kiểm tra kết nối mạng rồi thử lại.');
        }
      } else {
        audio.pause();
        button.textContent = '♫ Bật nhạc';
        button.setAttribute('aria-pressed', 'false');
      }
    });
    audio.addEventListener('ended', function () {
      button.textContent = '♫ Bật nhạc';
      button.setAttribute('aria-pressed', 'false');
    });
    var video = $('#embeddedVideo');
    video.muted = true;
    video.volume = 0;
    video.play().catch(function () {
      // Video remains available with native playback controls if autoplay is blocked.
      video.setAttribute('controls', 'controls');
    });
  }

  async function initApp() {
    setupDragDrop();
    setupAudio();
    initLoveCounter();
    initCalendar();
    scheduleCalendarRefresh();
    try {
      await loadPhotos();
      $('#syncStatus').textContent = '▣ Đã lưu trên thiết bị';
    } catch (error) {
      $('#syncStatus').textContent = '⚠ Không truy cập được kho ảnh';
      toast(error.message || 'Không thể mở kho ảnh.');
    }
  }

  window.addEventListener('beforeunload', function () {
    clearTimeout(toastTimer);
    clearInterval(counterTimer);
    objectUrls.forEach(function (url) { URL.revokeObjectURL(url); });
  });

  initApp();
})();
</script>

</body>
</html>

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2633ac58-6beb-4069-b679-d3e957b8bccd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
