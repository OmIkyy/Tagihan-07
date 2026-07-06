# 🌐 Panduan Integrasi Supabase - KOMINDO NETWORK

Selamat! Aplikasi E-Billing Wi-Fi Anda telah memiliki skema database relasional **PostgreSQL** yang dirancang khusus untuk **Supabase**. Halaman ini menjelaskan skema database, cara menjalankan kueri SQL di Supabase, penjelasan tentang fitur **Realtime Replication** (agar pembayaran sinkron instan di HP lain), dan keindahan format **Excel Export** yang sudah kami rapikan.

---

## 📋 1. Skema Database PostgreSQL (Supabase)

File skema database Anda sudah tersedia di root project dengan nama `supabase_schema.sql`. Berikut adalah struktur tabel yang digunakan:

1. **`system_settings`**: Menyimpan konfigurasi branding seperti Nama Brand (`brand_name`), Suffix Brand (`brand_suffix`), Tema Warna (`logo_color`), Jenis Logo (`logo_type`), Data Logo Kustom (`custom_logo_data`), dan Kredensial Admin (`admin_username` & `admin_password`).
2. **`internet_packages`**: Menyimpan daftar paket Wi-Fi aktif beserta harga (`price`) dan kecepatan (`speed`).
3. **`customers`**: Tabel utama pelanggan yang menyimpan ID Pelanggan unik, nama, nomor WhatsApp, relasi ke paket internet, tanggal jatuh tempo, nominal tagihan, riwayat invoice (`payment_history` dalam format JSONB), status pembayaran (`LUNAS`, `BELUM_BAYAR`, dll), bukti pembayaran kustom, dan link QRIS dinamis.
4. **`message_templates`**: Menyimpan template pesan WhatsApp dinamis untuk Penagihan (`TAGIHAN`) dan Pemasangan Baru (`PSB`).
5. **`payment_notifications`**: Menyimpan log notifikasi real-time ketika ada transaksi pembayaran masuk, pengajuan QRIS, atau unggah bukti bayar.

---

## ⚡ 2. Fitur Sinkronisasi Real-Time (Antar HP & Admin)

Agar aksi pembayaran dari pelanggan langsung memicu notifikasi suara di dashboard admin (dan status berubah otomatis di HP admin/pelanggan lain tanpa perlu refresh), kami telah menambahkan konfigurasi **Supabase Realtime Replication** di dalam skema SQL:

```sql
alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table payment_notifications;
alter publication supabase_realtime add table system_settings;
```

### Cara Kerja Sinkronisasi:
- Ketika Pelanggan mengklik **"Konfirmasi Bayar"** atau mengunggah bukti pembayaran di HP mereka, aplikasi akan memperbarui baris data pelanggan di tabel `customers` dan memasukkan baris baru ke tabel `payment_notifications`.
- Berkat perintah `alter publication supabase_realtime`, Supabase akan memancarkan event perubahan data tersebut melalui WebSockets.
- Dashboard Admin di browser/HP lain yang sedang aktif akan langsung mendengar event tersebut, memutar efek suara ringtone pemberitahuan, memunculkan **Toast Notification**, dan memperbarui baris data tabel secara instan di layar admin!

---

## 🛠️ 3. Langkah-Langkah Menghubungkan ke Supabase

Ikuti panduan berikut untuk memasang skema SQL ini di proyek Supabase Anda:

### Langkah A: Jalankan Skema SQL di Supabase
1. Masuk ke dashboard [Supabase](https://supabase.com/) Anda dan buka proyek Anda.
2. Di menu navigasi sebelah kiri, klik **SQL Editor** (ikon terminal `>_`).
3. Klik **New Query** untuk membuat lembar kerja SQL baru.
4. Buka file `supabase_schema.sql` dari aplikasi ini, salin seluruh kodenya, dan tempel (paste) ke SQL Editor Supabase Anda.
5. Klik tombol **Run** di pojok kanan bawah.
6. Anda akan melihat pesan sukses dan semua tabel beserta data awal (seed data) akan terbuat otomatis!

### Langkah B: Instalasi Library Client di React (Jika Migrasi ke Supabase JS)
Jika Anda ingin mengganti Firestore SDK bawaan dengan Supabase JS client di masa mendatang:
1. Instal SDK resmi Supabase:
   ```bash
   npm install @supabase/supabase-js
   ```
2. Buat file inisialisasi di `src/lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```
3. Gunakan listener real-time di `App.tsx` menggunakan `supabase.channel`:
   ```typescript
   useEffect(() => {
     const channels = supabase
       .channel('custom-all-channel')
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'customers' },
         (payload) => {
           console.log('Perubahan data pelanggan masuk!', payload);
           // Perbarui state lokal React Anda secara instan di sini
         }
       )
       .subscribe();

     return () => {
       supabase.removeChannel(channels);
     };
   }, []);
   ```

---

## 📊 4. Apakah Fitur Export Excel Sudah Rapi?

**Ya, Export Excel sudah kami rapikan dan didesain secara profesional!** 

Alih-alih menggunakan ekspor CSV sederhana yang sering kali berantakan jika dibuka langsung di Microsoft Excel, kami menggunakan format **XML Spreadsheet 2003 (SpreadsheetML)** dengan struktur visual yang matang:

* **Header & Judul Eksklusif**: Baris judul di-merge di atas tabel dengan font ukuran besar `15pt` berwarna biru gelap (`#1E3A8A`) untuk estetika premium.
* **Metadata Cetak**: Disertai informasi otomatis "Dicetak otomatis pada tanggal [WAKTU]" dan rangkuman total pelanggan yang lunas.
* **Gaya Baris Kepala (Table Header)**: Header tabel memiliki background biru tua presisi (`#1E3A8A`) dengan teks putih tebal (`bold`), tinggi baris proporsional (`26px`), dan border penegas di sekelilingnya.
* **Lebar Kolom yang Sesuai**: Kolom No, ID Pelanggan, Nama, WhatsApp, Paket, Jatuh Tempo, Nominal, Metode, dan Status memiliki pengaturan lebar kolom (`ss:Width`) kustom yang presisi agar data tidak terpotong (tidak ada simbol `###` di Excel).
* **Format Mata Uang (Format Currency)**: Kolom nominal menggunakan representasi numerik riil yang langsung diformat oleh Excel sebagai mata uang Indonesia asli (`"Rp " #,##0`), memudahkan pengguna melakukan rumus sum/aritmatika lebih lanjut.
* **Badge Status Lunas**: Kolom status memiliki warna background hijau muda lembut (`#DCFCE7`) dengan teks hijau gelap tebal (`#15803D`) untuk memberikan indikasi visual cepat.
* **Baris Total Pendapatan**: Di bagian bawah tabel, terdapat baris Grand Total berlatar abu-abu terang (`#F1F5F9`) yang menjumlahkan seluruh nominal pendapatan bersih secara dinamiis!

---

💡 *Skema dan petunjuk di atas telah divalidasi dan siap digunakan. Anda dapat mengunduh database relasional ini kapan saja dari file `supabase_schema.sql` di ruang kerja Anda!*
