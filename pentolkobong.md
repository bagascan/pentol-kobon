# Rencana Pengembangan Aplikasi Kasir "PENTOL KOBONG"

Dokumen ini berisi rencana strategis untuk perancangan, pengembangan, dan deployment aplikasi kasir untuk usaha "PENTOL KOBONG".

---

## 1. Ringkasan Proyek

Tujuan utama proyek ini adalah membuat sistem kasir digital (Point of Sale - POS) yang sederhana dan efisien. Aplikasi ini tidak hanya akan memproses transaksi penjualan, tetapi juga akan memberikan laporan penting bagi pemilik (owner) untuk memantau bisnis secara real-time, mengelola inventaris, dan melacak keuangan harian.

---

## 2. Fitur Utama

Berdasarkan diskusi, berikut adalah fitur-fitur utama yang akan dikembangkan:

### a. Modul Kasir (Point of Sale)
- **Pencatatan Pesanan:** Kasir dapat dengan mudah memilih produk (berbagai jenis pentol dan minuman), mengatur jumlah, dan melihat total pesanan.
- **Proses Pembayaran:** Mencatat pembayaran tunai, menghitung total belanja, dan menampilkan jumlah kembalian secara otomatis.
- **Struk Digital:** Setelah transaksi selesai, sistem akan menghasilkan struk digital yang bisa disimpan atau dibagikan (misalnya via WhatsApp).

### e. Modul Otentikasi & Manajemen Pengguna
- **Login Kustom:** Form login khusus untuk karyawan/owner dengan email dan password.
- **Registrasi Karyawan:** Form registrasi untuk calon karyawan baru.
- **Lupa Password:** Fitur untuk mereset password.
- **Verifikasi oleh Owner:** Owner memiliki dasbor untuk melihat daftar pendaftar baru dan dapat menyetujui (verifikasi) pendaftaran.
- **Manajemen Peran:** Setelah diverifikasi oleh owner, akun baru secara otomatis mendapatkan peran "karyawan".

### b. Modul Manajemen Inventaris & Modal
- **Pencatatan Modal Awal:** Owner dapat memasukkan jumlah modal (uang tunai) yang dibawa di awal hari.
- **Manajemen Bahan Baku:**
    - Mencatat semua bahan yang digunakan (daging, tepung, bumbu, gas, dll.).
    - Setiap produk yang terjual akan otomatis mengurangi stok bahan baku sesuai resep yang telah ditentukan.
    - Owner dapat melihat sisa stok bahan di akhir hari.
- **Manajemen Peralatan:** Sebuah checklist sederhana untuk memastikan semua peralatan yang dibutuhkan untuk operasional harian sudah disiapkan.

### c. Modul Laporan & Analitik
- **Laporan Penjualan Harian:** Menampilkan ringkasan semua transaksi yang terjadi, total pendapatan, dan produk terlaris.
- **Laporan Keuangan Harian:**
    - **Perhitungan Laba/Rugi (Profitability):**
        - **Modal Bahan Baku Terpakai (HPP/COGS):** Dihitung secara otomatis berdasarkan total biaya bahan dari semua produk yang terjual selama sehari.
        - **Laba Kotor:** Dihitung dengan rumus: `Total Pendapatan Harian - Modal Bahan Baku Terpakai`.
    - **Laporan Arus Kas (Cash Flow):**
        - Menampilkan rincian modal awal (uang tunai), total pendapatan (tunai), dan sisa uang tunai di laci pada akhir hari.
- **Laporan Stok:** Menampilkan sisa stok semua bahan baku di akhir hari.

### d. Modul Notifikasi Real-time
- **Notifikasi per Transaksi:** Setiap kali ada transaksi penjualan yang berhasil, sistem akan mengirimkan notifikasi instan ke owner. Notifikasi ini berisi detail transaksi (item, jumlah, total harga).
- **Notifikasi Laporan Harian:** Di akhir hari (atau saat "tutup toko" di aplikasi), sistem akan mengirimkan ringkasan laporan penjualan dan keuangan harian ke owner.

---

## 3. Arsitektur & Teknologi yang Diusulkan

Kita akan menggunakan tumpukan teknologi modern yang efisien dan mudah untuk di-deploy.

- **Desain & Frontend:**
    - **Framework:** **Next.js (React)** dengan **Tailwind CSS**.
    - **Tema:** Desain modern dengan palet warna **merah dan gradasi oranye**.
    - **Pendekatan Desain:** **Mobile-First**. Seluruh antarmuka akan dirancang dan dioptimalkan untuk penggunaan di perangkat mobile, sebelum diadaptasi ke layar yang lebih besar jika diperlukan.
    - **Tipografi:** Menggunakan font **Poppins** atau **Inter** untuk tampilan yang bersih dan modern.
    - **Layout Mobile:** Navigasi menu utama akan berada di bagian **bawah layar** untuk kemudahan penggunaan dengan satu tangan.
    - **PWA (Progressive Web App):** Aplikasi akan dibuat sebagai PWA agar bisa di-"install" di layar utama HP owner untuk akses cepat seperti aplikasi native.
- **Backend & Database:**
    - **Database:** **MongoDB** yang di-hosting di **MongoDB Atlas** (menyediakan *free tier* yang memadai).
    - **ODM (Object-Document Mapper):** **Mongoose** untuk mempermudah interaksi antara aplikasi Next.js dan database MongoDB.
- **Otentikasi:** **Next-Auth.js**.
    - **Alasan:** Fleksibel dan terintegrasi baik dengan Next.js. Kita akan menggunakan **CredentialsProvider** untuk membuat alur login, registrasi, dan lupa password kustom dari nol, sesuai permintaan.
- **Notifikasi:** **Web Push API**.
    - **Alasan:** Mengirim notifikasi push standar web langsung ke browser owner (di HP atau desktop), bahkan saat website tidak dibuka. Ini memberikan pengalaman yang lebih terintegrasi. Membutuhkan persetujuan sekali dari owner untuk menerima notifikasi dan implementasi **Service Worker**.
- **Deployment:** **Vercel**.
    - **Alasan:** Vercel adalah platform yang dibuat oleh pengembang Next.js, sehingga proses deployment menjadi sangat mudah (cukup hubungkan dengan repositori GitHub). Vercel juga memiliki *free tier* yang sangat baik.

---

## 4. Tahapan Pengembangan (Roadmap)

Proyek akan dibagi menjadi beberapa fase agar lebih terkelola.

### Fase 1: Fondasi dan Desain (Estimasi: 1 Minggu)
1.  **Desain UI/UX:** Membuat wireframe dan desain antarmuka modern berdasarkan tema warna (merah/oranye), tipografi (Poppins/Inter), dan layout (navigasi bawah untuk mobile).
2.  **Setup Database & Otentikasi:**
    - Membuat akun **MongoDB Atlas** dan setup cluster gratis.
    - Merancang skema (schema) untuk koleksi di MongoDB menggunakan Mongoose: `users`, `products`, `transactions`, `ingredients`, `daily_reports`.
    - Menginstal dan mengkonfigurasi **Express.js** serta library otentikasi (misalnya `jsonwebtoken` atau `express-session`).
3.  **Inisialisasi Proyek:**
    - Menyiapkan struktur proyek Express.js.
    - Menghubungkan aplikasi Express.js dengan MongoDB Atlas.
    - Membuat struktur dasar untuk menyajikan file statis (HTML, CSS, JS) atau menggunakan templating engine jika diperlukan.

### Fase 2: Pengembangan Fitur Inti (Estimasi: 2-3 Minggu)
1.  **Modul Otentikasi:**
    - Membuat **API endpoints** dan logika untuk **Login, Register, dan Lupa Password** menggunakan Express.
    - Membuat **API endpoint** dan UI (jika ada) khusus Owner untuk **verifikasi pendaftar baru**.
    - Mengimplementasikan alur verifikasi yang mengubah status dan peran pengguna di database melalui API.
2.  **Modul Kasir (setelah login):**
    - Membuat **API endpoints** untuk mengelola produk dan transaksi.
    - Mengembangkan antarmuka kasir (HTML/JS) yang berinteraksi dengan API Express untuk menampilkan daftar produk, mengelola keranjang belanja, memproses pembayaran, dan mencatat transaksi ke koleksi `transactions`.
3.  **Manajemen Produk & Stok:**
    - Membuat **API endpoints** untuk owner bisa menambah/mengubah produk dan resepnya (misal: 1 porsi pentol butuh 50gr daging, 20gr tepung).
    - Mengimplementasikan logika pengurangan stok bahan (`ingredients`) setiap kali transaksi terjadi melalui API.

### Fase 3: Fitur Laporan dan Notifikasi (Estimasi: 2 Minggu)
1.  **Modul Laporan:**
    - Membuat **API endpoints** untuk laporan yang mengambil data dari database (penjualan harian, produk terlaris, sisa stok).
    - Mengembangkan antarmuka laporan (HTML/JS) untuk menampilkan data ini dan untuk input modal awal serta kalkulasi sisa modal di akhir hari.
2.  **Integrasi Web Push Notifikasi:**
    - Setup **Service Worker** untuk menerima push event di background.
    - Membuat UI dan logika pada sisi klien bagi owner untuk *subscribe* (berlangganan) notifikasi.
    - Menyimpan detail *push subscription* (endpoint, keys) ke database MongoDB di koleksi `users`.
    - Membuat **API endpoints** di Express backend yang menggunakan library seperti `web-push` untuk mengirim notifikasi ke owner setiap ada transaksi baru.

### Fase 4: Pengujian dan Deployment (Estimasi: 1 Minggu)
1.  **Pengujian:** Melakukan tes end-to-end untuk semua fitur, memastikan kalkulasi sudah benar dan tidak ada bug.
2.  **Konfigurasi PWA:** Menyiapkan file `manifest.json` (berisi nama, ikon, warna tema) dan memastikan Service Worker terkonfigurasi dengan benar untuk fungsionalitas offline dan notifikasi pada sisi klien.
3.  **Persiapan Deployment:**
    - Membuat repositori di GitHub.
    - Mendorong (push) kode ke GitHub.
4.  **Deployment:**
    - Membuat akun Vercel dan menghubungkannya ke repositori GitHub.
    - Mengkonfigurasi environment variables (MongoDB Connection String, Next-Auth secrets, VAPID Keys untuk Web Push) di Vercel.
    - Melakukan deployment pertama.
5.  **Serah Terima:** Memberikan akses aplikasi kepada owner dan memberikan panduan singkat cara penggunaan serta cara "Add to Home Screen".

---

Dokumen ini akan menjadi acuan utama selama proses pengembangan. Setiap perubahan atau penambahan fitur akan diperbarui di sini.

---