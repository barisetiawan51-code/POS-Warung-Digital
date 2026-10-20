# WarungKu — Sistem Kasir & Manajemen Warung

Aplikasi Point of Sale (POS) dan manajemen inventaris toko retail / warung kelontong berbasis web modern, responsif, dan aman untuk pemilik warung di Indonesia.

Dibangun di atas **Tokigo Starter** menggunakan **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **TypeScript strict**, dan **Supabase PostgreSQL / Auth**.

---

## 1. Fitur Utama

- **Dashboard Ringkasan (Kinerja Warung)**:
  - Metrik penjualan hari ini vs kemarin (+pertumbuhan %).
  - Jumlah transaksi lunas.
  - Peringatan stok produk menipis dengan jalan pintas kelola.
  - Grafik tren penjualan 7 hari terakhir (SVG interaktif dengan gradient fill & data points).
  - Daftar 5 produk paling laris berdasarkan kuantitas & nominal omzet.
  - Shortcut cepat "Buka Kasir Sekarang".
- **Kasir Digital (Point of Sale)**:
  - Pencarian cepat produk berdasarkan nama atau SKU/barcode.
  - Filter kategori fleksibel (Sembako, Minuman, Sabun & Kebersihan, dll).
  - Keranjang belanja interaktif dengan batas stok otomatis (mencegah overselling).
  - Pengurangan diskon/potongan harga langsung.
  - Pembayaran **Tunai (Cash - Utama)** dengan input nominal uang diterima, chip pecahan cepat (Rp 10.000, Rp 20.000, Rp 50.000, Rp 100.000, Uang Pas), dan kalkulator kembalian otomatis.
  - Pembayaran **QRIS (Scan Barcode Gambar)** standar nasional tanpa biaya pihak ketiga (Midtrans), pembeli scan barcode langsung dari layar/cetak dan kasir konfirmasi instan.
  - Pembayaran cadangan **Transfer Bank (Manual)** dengan nomor rekening warung & tombol salin.
  - Cetak struk belanja thermal/kertas standar (`window.print()`).
- **Manajemen Produk**:
  - Tabel produk lengkap: SKU, nama, kategori, satuan, harga beli/modal, harga jual, margin, stok, status aktif.
  - Tambah produk baru dengan validasi SKU unik per pemilik.
  - Edit produk & penonaktifan produk (soft deactivation tanpa menghapus histori).
- **Manajemen Kategori**:
  - Tambah, ubah, dan pantau jumlah produk per kategori.
- **Inventaris & Manajemen Stok**:
  - Status stok real-time vs ambang batas minimum.
  - Penyesuaian stok aman (Kulakan/Restock, Barang Rusak, Hilang, Koreksi Fisik).
  - Buku besar mutasi stok (_Stock Movement Ledger_) yang mencatat setiap pergerakan stok, waktu, petugas, dan alasan.
- **Riwayat Transaksi & Detail**:
  - Filter rentang waktu, metode pembayaran, dan status transaksi.
  - Snapshot historis produk, harga modal, dan harga jual yang tidak berubah walau harga produk diedit.
  - Alur pembatalan transaksi & _refund_ aman yang otomatis memulihkan stok ke gudang (dengan pencegahan duplicate refund).
- **Verifikasi Pembayaran Transfer**:
  - Konfirmasi dana masuk transfer bank manual dan penandaan lunas.
- **Laporan Penjualan & Ekspor CSV**:
  - Rekap penjualan harian, mingguan, dan bulanan.
  - Metrik penjualan kotor (gross), diskon, retur, penjualan bersih (net), dan estimasi laba.
  - Distribusi metode pembayaran.
  - Ekspor instan ke file spreadsheet **CSV RFC-4180**.
- **Pengaturan Warung**:
  - Konfigurasi nama warung, pemilik, nomor WhatsApp, dan alamat fisik.
  - Rekening transfer bank manual.
  - Ambang batas stok minimum default.
  - Barcode QRIS Warung (Scan Gambar) dan NMID resmi Bank Indonesia.
- **Tema Terang & Gelap**:
  - Dukungan penuh Light Mode & Dark Mode menggunakan `ThemeToggle` resmi starter Tokigo.

---

## 2. Struktur Teknologi

| Lapisan             | Pilihan                                                       |
| ------------------- | ------------------------------------------------------------- |
| **Framework**       | Next.js 16.3.8 (App Router, Turbopack, React 19)              |
| **Styling**         | Tailwind CSS v4 (`styles/theme.css` dengan token Modern Blue) |
| **Bahasa**          | TypeScript Strict                                             |
| **Paket**           | pnpm                                                          |
| **Database & Auth** | Supabase PostgreSQL & Supabase SSR                            |
| **Ikon**            | `react-icons/lu` (Lucide Icons)                               |
| **Testing**         | Node.js Test Runner via `tsx --test`                          |

---

## 3. Skema Database & Migrasi Supabase

File migrasi database tersedia di direktori `supabase/migrations/`:

1. `supabase/migrations/20261017000001_initial_schema.sql`
   - Tabel: `profiles`, `categories`, `products`, `orders`, `order_items`, `payments`, `stock_movements`, `audit_logs`, `store_settings`.
   - Indexing, foreign keys, constraints (non-negatif harga & stok, unique SKU/invoice).
   - Row Level Security (RLS) policies untuk kepemilikan data pemilik warung.
2. `supabase/migrations/20261017000002_checkout_rpc.sql`
   - Fungsi PostgreSQL RPC `process_checkout` (transaksi atomik, locking `FOR UPDATE`, validasi stok, pencatatan snapshot item, mutasi stok & ledger).
   - Fungsi PostgreSQL RPC `process_refund` (pembatalan transaksi aman dan pemulihan stok).
3. `supabase/migrations/20261017000003_seed_data.sql`
   - Data katalog awal sembako warung Indonesia (Bimoli, Telur, Aqua, Lifebuoy, Kapal Api, Beras Ramos, Gulaku, Indomie).

### Cara Menjalankan Migrasi ke Supabase:

Jika menggunakan Supabase CLI:

```bash
supabase db push
# atau jalankan script SQL di Supabase SQL Editor pada dashboard project Anda
```

---

## 4. Konfigurasi Lingkungan (.env)

Salin `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel kredensial berikut:

```env
# Supabase PostgreSQL & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Alur Pembayaran:
# - Utama: Tunai (Cash) dengan kalkulator pecahan uang & kembalian otomatis
# - Digital: QRIS Scan Barcode langsung dari gambar (public/qris-warung.svg) tanpa Midtrans
```

_Catatan: Jika variabel Supabase belum diisi (misal saat evaluasi lokal pertama kali), aplikasi otomatis menggunakan in-memory state store yang telah diisi data ritel warung terverifikasi sehingga seluruh fungsionalitas kasir, mutasi stok, laporan, dan cetak struk dapat dicoba secara utuh._

---

## 5. Menjalankan Aplikasi

1. **Instal dependensi:**

   ```bash
   pnpm install
   ```

2. **Jalankan development server:**

   ```bash
   pnpm dev
   ```

   Buka [http://localhost:3000](http://localhost:3000) di browser.

3. **Jalankan Pengujian Unit & Logika Bisnis:**

   ```bash
   pnpm test
   ```

4. **Jalankan Pengecekan Kualitas Kode (Quality Gates):**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm format:check
   pnpm build
   ```

---

## 6. Daftar Halaman Rute

- `/login` — Halaman Masuk Pemilik Warung.
- `/dashboard` — Ringkasan Kinerja Penjualan, Metrik, Grafik 7 Hari, dan Produk Terlaris.
- `/kasir` — Kasir POS, Keranjang Belanja, Pembayaran Tunai/Transfer/Online, & Cetak Struk.
- `/produk` — Daftar & Tabel Inventaris Produk.
- `/produk/tambah` — Form Tambah Produk Baru.
- `/produk/[id]` — Form Edit Data Produk.
- `/kategori` — Manajemen Kategori Produk.
- `/stok` — Status Stok & Buku Mutasi Stok (Ledger).
- `/transaksi` — Riwayat Seluruh Transaksi Penjualan.
- `/transaksi/[id]` — Rincian Detail Invoice, Snapshot Historis & Fitur Refund Stok.
- `/pembayaran/[id]` — Layar Verifikasi Pembayaran Transfer Bank.
- `/laporan` — Laporan Keuangan, Pembagian Metode Bayar & Ekspor CSV.
- `/pengaturan` — Pengaturan Toko, Rekening Bank, & Info Gateway.
- `/design-system` — Living Design System Reference Tokigo Starter.

---

## 7. Panduan Verifikasi Visual untuk Developer Manusia

Sesuai aturan `AGENTS.md` (Aturan 13 & 27), verifikasi visual dilakukan secara langsung oleh developer manusia di browser:

- [ ] **Mode Terang & Gelap**: Klik tombol `ThemeToggle` di header atas. Pastikan kontras teks, tabel, badge, dan modal tetap terbaca jelas di kedua mode.
- [ ] **Responsif Mobile (375px - 768px)**:
  - Buka menu hamburger di ponsel untuk memastikan drawer navigasi terbuka dengan mulus.
  - Pada halaman `/kasir`, pastikan grid katalog produk dan keranjang belanja tertata rapi tanpa horizontal scroll yang tidak diinginkan.
  - Pada halaman `/transaksi` dan `/produk`, pastikan tabel dapat digeser horizontal atau responsif.
- [ ] **Alur Kasir & Cetak Struk**:
  - Masuk ke `/kasir`, tambahkan produk ke keranjang.
  - Masukkan diskon atau biarkan 0, klik "Bayar Transaksi".
  - Pilih pembayaran tunai, coba masukkan uang pas atau nominal lebih besar, lihat perhitungan kembalian.
  - Konfirmasi pembayaran dan klik "Cetak Struk" untuk melihat tampilan struk belanja.
- [ ] **Alur Refund & Pemulihan Stok**:
  - Buka `/transaksi`, klik detail salah satu transaksi, klik "Batalkan & Refund Stok".
  - Masuk ke `/stok` tab "Buku Mutasi Stok (Ledger)" dan verifikasi bahwa stok barang telah bertambah kembali dengan alasan "refund".
- [ ] **Ekspor Laporan CSV**:
  - Buka `/laporan`, pilih rentang waktu ("Hari Ini", "7 Hari Terakhir", "Bulan Ini"), lalu klik "Ekspor ke CSV".
  - Buka file CSV hasil unduhan di Excel / Google Sheets untuk memeriksa format rupiah dan tanggalnya.
