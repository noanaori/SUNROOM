# Sunroom Moods — Music & Color Moodboard

**Sunroom Moods** adalah aplikasi web Front End interaktif yang mengubah gambar *cover* lagu dan album favorit menjadi **5 warna palet** beserta suasana perasaannya (*emotional tone*). Pengguna dapat menjelajahi lagu berdasarkan *mood*, melihat detail kode warna HEX dari setiap *artwork*, dan mengumpulkan lagu favorit ke ruang pribadi (**My Space**) untuk dijadikan poster *moodboard* yang dapat diunduh.

Proyek ini dibuat sebagai **Final Project Study Club Vtech 2026 Batch 2 (Front End Basic)**.

---

## Fitur Utama

- **Ekstraksi 5 Warna Palet Otomatis (HTML5 Canvas)**  
  Membaca data piksel langsung dari gambar *cover* album menggunakan elemen `<canvas>` (`getImageData`) untuk menghasilkan 5 warna dominan yang akurat beserta kode HEX-nya.
- **Penentuan Mood Otomatis dari Warna Cover**  
  Mengonversi nilai RGB palet ke HSL (*Hue, Saturation, Lightness*) untuk menentukan *emotional tone* (*Dreamy, Golden hour, Afterglow, Nostalgic, Melancholy, Euphoric, Serene, Tranquil*) dan kalimat kutipan yang sesuai dengan nuansa warna album.
- **3 Halaman Utama (Multi-Page Navigation)**
  1. **Home (`/`)**: Menampilkan *hero preview* interaktif (default pada lagu *Gravits*), deretan 5 lagu pilihan (*Lifelike, night is young, purple, Gravits, kinoue64*), dan panggung *moodboard* interaktif yang warna latarnya berubah mengikuti *Palette Swatches* (`Tone 01`–`Tone 05`).
  2. **Discover (`/discover`)**: Menjelajahi album dan lagu secara *real-time* melalui integrasi **Apple iTunes Search API**, dilengkapi filter kategori *mood* (menampilkan 25+ lagu per kategori) dan penyaring otomatis untuk memastikan daftar lagu bersih dari konten eksplisit/sensitif.
  3. **My Space (`/my-space`)**: Mengumpulkan lagu pilihan menjadi panggung *moodboard* personal. Mendukung tampilan per satu lagu maupun **Combined Mix (All)** yang mencampur warna palet seluruh lagu dan menyusun kolase mosaik *cover* album.
- **Ekspor Poster Moodboard ke PNG**  
  Tersedia 3 pilihan rasio tampilan poster (**Board 4:3**, **Square 1:1**, dan **Story 9:16**) yang dapat langsung diunduh sebagai gambar PNG beresolusi tinggi atau dibagikan.
- **Mode Gelap & Terang (Transisi Sunrise / Sunset)**  
  Menggunakan mode gelap (*Dark Mode*) sebagai tampilan bawaan dengan efek langit berbintang, animasi meteor jatuh, dan transisi halus layaknya pergantian langit pagi dan senja.
- **Penyimpanan Lokal (`localStorage`) & Desain Responsif**  
  Koleksi lagu di *My Space* dan pilihan tema tersimpan otomatis di browser. Seluruh tata letak responsif untuk layar Desktop, Tablet, dan Mobile (dilengkapi *Hamburger Menu* dinamis).

---

## Teknologi yang Digunakan (Tech Stack)

- **Framework & Library**: [React 19](https://react.dev/), [React Router DOM v7](https://reactrouter.com/)
- **Build Tool & Runtime**: [Vite 8](https://vite.dev/), [Node.js](https://nodejs.org/)
- **Markup & Styling**: HTML5 Semantik, CSS3 Murni (CSS Variables, Flexbox, CSS Grid, Positioning, Media Queries)
- **Web APIs**:
  - **Apple iTunes Search API** (Pencarian metadata lagu, artis, dan *artwork* album)
  - **HTML5 Canvas 2D API** (Ekstraksi warna piksel *cover* & pembuatan gambar poster PNG)
  - **Web Storage API (`localStorage`)** (Penyimpanan daftar lagu koleksi, cache palet, dan tema)

---

## Implementasi Materi Study Club Front End Basic

Proyek ini mengimplementasikan seluruh materi dari Pertemuan 1 hingga Pertemuan 7:

| Kategori Materi | Implementasi di Proyek | Lokasi File Utama |
| :--- | :--- | :--- |
| **HTML Semantik** | `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` | `src/App.jsx`, `src/components/Header.jsx`, `src/components/AlbumCard.jsx` |
| **3 Jenis List HTML** | Unordered (`<ul>`), Ordered (`<ol>`), Description List (`<dl>`, `<dt>`, `<dd>`) | `Header.jsx`, `MySpacePage.jsx`, `AlbumDetailsModal.jsx` |
| **Tabel HTML** | `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` untuk data kode warna HEX | `src/components/AlbumDetailsModal.jsx` |
| **Form & Input** | `<form>`, `<label>`, `<input type="text">`, `<button type="submit">` | `src/pages/HomePage.jsx`, `src/components/SearchBar.jsx` |
| **3 Jenis Link HTML** | Navigasi halaman, anchor intra-page (`#main-content`), eksternal (`target="_blank"`), & `mailto:` | `src/components/Footer.jsx`, `src/components/AlbumCard.jsx` |
| **3 Metode CSS** | Internal CSS (`<style>`), External CSS (`global.css`, `components.css`), & Inline CSS (`style={{...}}`) | `index.html`, `src/main.jsx`, `src/components/Header.jsx` |
| **CSS Layout & Responsive** | Flexbox, CSS Grid, Positioning (`sticky`, `fixed`, `relative`, `absolute`), & Media Queries | `src/styles/global.css`, `src/styles/components.css` |
| **Manipulasi DOM & Event** | `getElementById`, `querySelector`, `setAttribute('data-theme')`, event klik, input, submit, & keyboard (`Escape`) | `src/main.jsx`, `src/context/AppContext.jsx`, `src/components/AlbumDetailsModal.jsx` |
| **Logika JavaScript** | Fungsi deklaratif & *arrow function*, percabangan (`if-else`, `switch-case`), perulangan (`for`, `do-while`, `while`), `async/await` Fetch API | `src/utils/colorPalette.js`, `src/services/itunesApi.js` |

---

## Struktur Folder Proyek

```text
Final Project/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AlbumCard.jsx          # Kartu album dengan cover dan 5 warna palet
│   │   ├── AlbumDetailsModal.jsx  # Pop-up modal detail album, <dl>, dan <table> kode HEX
│   │   ├── Footer.jsx             # Footer dengan navigasi, link anchor, dan mailto
│   │   ├── Header.jsx             # Header sticky, menu mobile, dan tombol ganti tema
│   │   ├── MeteorBackground.jsx   # Latar langit senja/malam, bintang, dan animasi meteor
│   │   ├── MoodFilters.jsx        # Tombol filter kategori mood di halaman Discover
│   │   ├── PaletteStrip.jsx       # Komponen baris 5 kotak warna palet
│   │   └── SearchBar.jsx          # Form input pencarian lagu/artis
│   ├── constants/
│   │   └── moods.js               # Daftar kategori mood dan kata kunci pencarian artis
│   ├── context/
│   │   ├── AppContext.jsx         # State global tema gelap/terang dan koleksi lagu
│   │   └── useApp.js              # Custom hook untuk mengakses AppContext
│   ├── pages/
│   │   ├── HomePage.jsx           # Halaman utama (Landing Page)
│   │   ├── DiscoverPage.jsx       # Halaman eksplorasi lagu berdasarkan mood & pencarian
│   │   └── MySpacePage.jsx        # Halaman poster moodboard personal & unduh PNG
│   ├── services/
│   │   ├── fallbackAlbums.js      # Data 5 lagu pilihan awal dan cadangan saat offline
│   │   └── itunesApi.js           # Pemanggilan iTunes Search API & filter konten aman
│   ├── styles/
│   │   ├── global.css             # Variabel CSS (Light/Dark), tipografi, dan reset dasar
│   │   └── components.css         # Styling komponen, layout Grid/Flexbox, & Media Queries
│   ├── utils/
│   │   ├── colorPalette.js        # Ekstraksi 5 warna Canvas & kalkulasi mood warna (HSL)
│   │   └── storage.js             # Fungsi baca-tulis localStorage browser
│   ├── App.jsx                    # Struktur utama (<Header>, <main>, <Footer>) & Routing
│   └── main.jsx                   # Entry point React ke elemen #root
├── index.html
├── package.json
└── vite.config.js
```

---

## Cara Menjalankan Proyek di Lokal

Pastikan **Node.js** sudah terpasang di perangkat kamu, lalu jalankan perintah berikut di terminal:

1. **Instal seluruh *dependencies***:
   ```bash
   npm install
   ```

2. **Jalankan *development server***:
   ```bash
   npm run dev
   ```
   Buka URL yang muncul di terminal (biasanya `http://localhost:5173`) pada browser.

3. **Build untuk *production***:
   ```bash
   npm run build
   ```
   Hasil *build* yang sudah dioptimasi akan tersimpan di dalam folder `dist/`.
