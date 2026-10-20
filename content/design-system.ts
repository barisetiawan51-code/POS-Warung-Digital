import type { BadgeVariant } from "@/components/ui/badge";
import type { ButtonSize, ButtonVariant } from "@/components/ui/button";

export type ColorToken = {
  name: string;
  className: string;
  usage: string;
};

export type TypeSample = {
  name: string;
  className: string;
  sample: string;
  usage: string;
};

export type IconInfo = {
  name: string;
  pack: string;
  usage: string;
};

export type IconSizeInfo = {
  size: string;
  usage: string;
};

export type RadiusToken = {
  name: string;
  className: string;
  usage: string;
};

export type ButtonVariantInfo = {
  variant: ButtonVariant;
  label: string;
  usage: string;
};

export type ButtonSizeInfo = {
  size: ButtonSize;
  label: string;
  usage: string;
};

export type BadgeVariantInfo = {
  variant: BadgeVariant;
  label: string;
  usage: string;
};

export type FormFieldInfo = {
  label: string;
  placeholder?: string;
  hint?: string;
  error?: string;
};

export type SelectFieldInfo = {
  label: string;
  options: string[];
};

export type CardExampleInfo = {
  badge: string;
  title: string;
  description: string;
  action: {
    label: string;
    href: string;
  };
};

export type LayoutTokenInfo = {
  name: string;
  usage: string;
};

export type MotionDurationInfo = {
  name: string;
  usage: string;
};

export const designSystem = {
  hero: {
    eyebrow: "Design System",
    title: "Satu sumber kebenaran untuk tampilan proyek.",
    description:
      "Semua warna, tipografi, radius, dan komponen inti terdokumentasi di halaman ini. Setiap token, komponen, atau varian baru wajib ditambahkan ke sini agar desain proyek tetap konsisten.",
  },
  colors: {
    title: "Warna",
    description:
      "Warna hanya berasal dari token di styles/theme.css. Ganti nilai token untuk mengubah brand, bukan class di komponen.",
    tokens: [
      {
        name: "--background",
        className: "bg-background",
        usage: "Latar halaman.",
      },
      {
        name: "--foreground",
        className: "bg-foreground",
        usage: "Teks utama dan elemen gelap.",
      },
      {
        name: "--primary",
        className: "bg-primary",
        usage: "Aksi utama seperti tombol dan tautan penting.",
      },
      {
        name: "--primary-foreground",
        className: "bg-primary-foreground",
        usage: "Teks dan ikon di atas warna primary.",
      },
      {
        name: "--muted",
        className: "bg-muted",
        usage: "Latar sekunder, hover, dan kartu.",
      },
      {
        name: "--muted-foreground",
        className: "bg-muted-foreground",
        usage: "Teks sekunder dan keterangan.",
      },
      {
        name: "--border",
        className: "bg-border",
        usage: "Garis batas dan pemisah.",
      },
      {
        name: "--ring",
        className: "bg-ring",
        usage: "Ring fokus untuk navigasi keyboard.",
      },
      {
        name: "--destructive",
        className: "bg-destructive",
        usage: "Error validasi dan aksi berbahaya.",
      },
      {
        name: "--sidebar",
        className: "bg-sidebar",
        usage: "Latar navigasi sidebar WarungKu.",
      },
      {
        name: "--sidebar-foreground",
        className: "bg-sidebar-foreground",
        usage: "Teks pada sidebar.",
      },
      {
        name: "--sidebar-muted",
        className: "bg-sidebar-muted",
        usage: "Teks dan ikon sekunder sidebar.",
      },
      {
        name: "--sidebar-border",
        className: "bg-sidebar-border",
        usage: "Pemisah pada sidebar.",
      },
      {
        name: "--success",
        className: "bg-success",
        usage: "Status transaksi lunas dan stok aman.",
      },
      {
        name: "--warning",
        className: "bg-warning",
        usage: "Peringatan stok menipis dan verifikasi transfer.",
      },
    ] satisfies ColorToken[],
  },
  theme: {
    title: "Tema",
    description:
      "Light dan dark mode memakai token yang sama; nilai gelap ada di blok .dark di styles/theme.css. Pasang ThemeToggle di header atau footer, dan pastikan semua halaman tetap nyaman serta kontras di dua mode.",
    toggleNote: "Klik tombol untuk mencoba light/dark.",
  },
  typography: {
    title: "Tipografi",
    scaleTitle: "Skala teks",
    description:
      "Gunakan skala bawaan Tailwind. Judul memakai font-semibold dan tracking-tight, teks isi memakai leading yang lega.",
    samples: [
      {
        name: "Display",
        className: "text-4xl font-semibold tracking-tight sm:text-5xl",
        sample: "Judul utama halaman.",
        usage: "Satu per halaman, dipakai di hero.",
      },
      {
        name: "Judul section",
        className: "text-2xl font-semibold sm:text-3xl",
        sample: "Judul bagian konten.",
        usage: "Pembuka setiap section.",
      },
      {
        name: "Judul kartu",
        className: "text-lg font-semibold",
        sample: "Nama kartu atau item.",
        usage: "Judul di dalam kartu dan daftar.",
      },
      {
        name: "Isi",
        className: "text-base leading-7",
        sample: "Paragraf untuk penjelasan panjang.",
        usage: "Teks isi utama.",
      },
      {
        name: "Keterangan",
        className: "text-sm text-muted-foreground",
        sample: "Catatan pendukung yang lebih kecil.",
        usage: "Teks sekunder dan bantuan.",
      },
    ] satisfies TypeSample[],
  },
  font: {
    title: "Font",
    sample: "Contoh tampilan font proyek.",
    current: "--font-sans",
    description:
      "Font dipilih per proyek lewat next/font di app/layout.tsx, lalu dipetakan ke token --font-sans di styles/theme.css. Bawaan starter memakai system font stack.",
  },
  radius: {
    title: "Radius",
    description:
      "Radius mengikuti satu token dasar --radius di styles/theme.css, sehingga satu perubahan terasa di seluruh komponen.",
    tokens: [
      {
        name: "--radius-sm",
        className: "rounded-sm",
        usage: "Elemen kecil seperti badge.",
      },
      {
        name: "--radius-md",
        className: "rounded-md",
        usage: "Default untuk tombol, input, dan kartu kecil.",
      },
      {
        name: "--radius-lg",
        className: "rounded-lg",
        usage: "Kartu dan panel besar.",
      },
    ] satisfies RadiusToken[],
  },
  layout: {
    title: "Layout",
    description:
      "Section mengatur ritme jarak vertikal, Container mengatur lebar dan padding horizontal, dan melebar di layar besar (2xl). Semua section memakai keduanya.",
    tokens: [
      { name: "Section", usage: "py-16 sm:py-20 lg:py-24" },
      {
        name: "Container",
        usage: "max-w-6xl · 2xl:max-w-7xl · px-4 sm:px-6 lg:px-8",
      },
    ] satisfies LayoutTokenInfo[],
  },
  buttons: {
    title: "Tombol",
    description:
      "Tombol dan tautan bergaya tombol selalu memakai Button atau buttonStyles() dari components/ui/button.tsx, bukan class buatan sendiri.",
    variants: [
      {
        variant: "primary",
        label: "Primary",
        usage: "Aksi utama. Maksimal satu per layar.",
      },
      {
        variant: "secondary",
        label: "Secondary",
        usage: "Aksi pendukung dengan latar lembut.",
      },
      {
        variant: "outline",
        label: "Outline",
        usage: "Aksi alternatif dengan garis batas.",
      },
      {
        variant: "ghost",
        label: "Ghost",
        usage: "Aksi tersier tanpa latar.",
      },
    ] satisfies ButtonVariantInfo[],
    sizes: [
      { size: "sm", label: "Kecil (sm)", usage: "Untuk area rapat." },
      { size: "md", label: "Sedang (md)", usage: "Ukuran default." },
      { size: "lg", label: "Besar (lg)", usage: "Untuk CTA utama." },
    ] satisfies ButtonSizeInfo[],
    linkNote:
      "Tautan yang terlihat seperti tombol memakai buttonStyles() agar gayanya identik dengan Button.",
  },
  badges: {
    title: "Badge",
    description:
      "Label kecil untuk kategori, promo, atau status. Gunakan varian yang tersedia, bukan warna baru.",
    variants: [
      {
        variant: "neutral",
        label: "Neutral",
        usage: "Kategori dan label umum.",
      },
      {
        variant: "primary",
        label: "Primary",
        usage: "Status atau penawaran utama.",
      },
      {
        variant: "outline",
        label: "Outline",
        usage: "Label ringan di atas latar terang.",
      },
      {
        variant: "success",
        label: "Success",
        usage:
          "Status transaksi lunas, pembayaran terverifikasi, dan stok aman.",
      },
      {
        variant: "warning",
        label: "Warning",
        usage: "Status pembayaran pending dan stok menipis.",
      },
      {
        variant: "destructive",
        label: "Destructive",
        usage: "Status transaksi gagal, dibatalkan, atau stok habis.",
      },
    ] satisfies BadgeVariantInfo[],
  },
  forms: {
    title: "Form",
    description:
      "Input selalu dibungkus Field agar label, hint, error, dan aria-describedby ditangani otomatis.",
    name: {
      label: "Nama lengkap",
      placeholder: "Contoh: Siti Rahma",
      hint: "Tulis sesuai kartu identitas.",
    } satisfies FormFieldInfo,
    email: {
      label: "Email",
      placeholder: "nama@email.com",
      error: "Email wajib diisi.",
    } satisfies FormFieldInfo,
    service: {
      label: "Layanan",
      options: [
        "Pilih layanan",
        "Website UMKM",
        "Website Sekolah",
        "Website Kampus",
        "Lainnya",
      ],
    } satisfies SelectFieldInfo,
    message: {
      label: "Pesan",
      placeholder: "Ceritakan kebutuhan Anda.",
    } satisfies FormFieldInfo,
  },
  cards: {
    title: "Card",
    description:
      "Pembungkus standar untuk produk, berita, atau program. Gunakan Card agar border, radius, dan padding konsisten.",
    example: {
      badge: "Promo",
      title: "Judul kartu",
      description:
        "Deskripsi singkat satu atau dua baris tentang item di dalam kartu.",
      action: { label: "Lihat detail", href: "/" },
    } satisfies CardExampleInfo,
  },
  icons: {
    title: "Ikon",
    description:
      "Beberapa paket react-icons tersedia supaya desain tiap project bisa bervariasi: lu (Lucide), tb (Tabler), pi (Phosphor), ri (Remix), hi2 (Heroicons), bs (Bootstrap), dan fa6/si untuk logo brand. Pilih maksimal dua paket UI per project; ikon mewarisi warna teks dan ukurannya diatur dengan utility size-*.",
    sizes: [
      { size: "size-4", usage: "Ikon kecil di dalam teks." },
      { size: "size-5", usage: "Default di dalam tombol dan tautan." },
      { size: "size-6", usage: "Ikon mandiri di kartu." },
      { size: "size-8", usage: "Ikon dekoratif besar." },
    ] satisfies IconSizeInfo[],
    items: [
      { name: "LuPhone", pack: "lu", usage: "Kontak telepon." },
      { name: "LuMapPin", pack: "lu", usage: "Alamat dan lokasi." },
      { name: "TbChefHat", pack: "tb", usage: "Kuliner dan F&B." },
      { name: "PiStorefront", pack: "pi", usage: "Toko dan retail." },
      { name: "RiScissorsLine", pack: "ri", usage: "Fashion dan jasa." },
      { name: "HiMiniSparkles", pack: "hi2", usage: "Aksen dekoratif." },
      { name: "FaWhatsapp", pack: "fa6", usage: "Logo WhatsApp." },
      { name: "FaInstagram", pack: "fa6", usage: "Logo Instagram." },
    ] satisfies IconInfo[],
  },
  motion: {
    title: "Motion",
    description:
      "Animasi dipakai saat brand menuntut (fashion, footwear, portfolio elegan). Satu bahasa gerak per proyek: durasi dan easing yang sama di semua animasi, dan selalu hormati prefers-reduced-motion.",
    durations: [
      { name: "150ms", usage: "Micro-interaction: hover, fokus, tombol." },
      { name: "250ms", usage: "Transisi komponen: dropdown, kartu, tab." },
      {
        name: "400ms",
        usage: "Reveal section dan transisi halaman yang lembut.",
      },
    ] satisfies MotionDurationInfo[],
    easing: {
      name: "ease-smooth",
      usage: "Easing default proyek untuk semua gerakan.",
    },
    demoHint: "Arahkan kursor ke kotak untuk melihat easing.",
  },
};
