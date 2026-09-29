# Color Clash

Game kartu matching warna (gaya klasik) — vs AI + multiplayer lokal (pass & play).

Nama game ini **Color Clash** (bukan merek UNO). Boleh diubah di `index.html`.

## Isi folder

```
color-clash/
  index.html          ← buka file ini di browser
  css/style.css
  js/game.js
  index.single.html   ← versi 1 file (semua digabung)
  README.md
```

## Cara buka di VS Code

1. Extract zip ini
2. Di VS Code: **File → Open Folder** → pilih folder `color-clash`
3. Klik kanan `index.html` → **Open with Live Server**  
   (install ekstensi **Live Server** kalau belum ada)
4. Atau double-click `index.html` / `index.single.html` di File Explorer

Tidak butuh Node.js, npm, atau framework. HTML + CSS + JS murni.

## Fitur

- Mode **vs AI**: Easy / Normal / Impossible
- Mode **Multiplayer** 2–4 pemain (pass & play di 1 HP/laptop)
- Kartu Skip, Reverse, +2, Wild, Wild +4 (bisa stacking)
- Tombol LAST saat sisa 2 kartu
- Musik background + SFX
- Game over: Coba Lagi / Kembali ke Lobby
- Responsive mobile

## Deploy

Bisa di-upload ke:

- Netlify / Vercel (drag folder)
- GitHub Pages
- itch.io (HTML game)

Cukup upload seluruh isi folder. File utama: `index.html`.

Musik memakai file royalty-free dari soundimage.org. Ganti `src` di tag `<audio>` kalau mau pakai musik sendiri.

## Catatan hukum

Jangan pakai nama, logo, atau aset resmi merek kartu komersial kalau mau publish ke store. Color Clash adalah game original dengan aturan matching warna.
