# 📖 MangaVerse – Web Đọc Truyện Online

Web đọc truyện tranh online với giao diện đẹp, upload ảnh lên **Cloudinary**, hoạt động hoàn toàn bằng 1 file HTML đơn.

## ✨ Tính năng

- **Thư viện truyện** – Duyệt, tìm kiếm, lọc theo thể loại
- **Đọc truyện** – 2 chế độ: cuộn trang (scroll) và lật trang (single)
- **Điều hướng bằng bàn phím** – ←/→/↑/↓ để lật trang, ESC để thoát
- **Upload Cloudinary** – Ảnh bìa và trang truyện được lưu trên cloud
- **Thanh tiến trình upload** – Hiển thị phần trăm upload theo thời gian thực
- **Admin panel** – Thêm truyện, thêm chapter, quản lý
- **Tìm kiếm** – Tìm theo tên, tác giả, thể loại
- **Giao diện dark** – Phong cách manga/anime đậm chất
- **Responsive** – Hỗ trợ mobile

## 🚀 Cách dùng

1. Mở `index.html` trên trình duyệt (hoặc deploy lên GitHub Pages)
2. Nhấn **⚙️ Quản lý** → **Thêm truyện**
3. Nhập thông tin và upload ảnh bìa
4. Chuyển tab **Thêm chapter** → chọn truyện → upload các trang ảnh
5. Về trang chủ và đọc!

## ☁️ Cloudinary

| Thông tin | Giá trị |
|-----------|---------|
| Cloud Name | `dlys3waqo` |
| Upload Preset | `manga_upload` |

Ảnh được lưu trong folder `mangaverse/` trên Cloudinary.

## 📦 Deploy lên GitHub Pages

1. Push `index.html` lên repo GitHub
2. Vào **Settings** → **Pages**
3. Chọn branch `main`, folder `/ (root)`
4. Website sẽ live tại `https://<username>.github.io/<repo-name>/`

## 🗃️ Lưu trữ dữ liệu

- **Metadata** (tên truyện, chapters, thứ tự trang): `localStorage` trên trình duyệt
- **Hình ảnh** (bìa, trang truyện): Cloudinary CDN

> ⚠️ Dữ liệu metadata lưu local — nếu đổi máy/trình duyệt sẽ mất. Để dùng nhiều người, cần kết nối backend/database.
