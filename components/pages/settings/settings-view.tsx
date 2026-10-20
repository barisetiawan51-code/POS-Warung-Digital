"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LuStore,
  LuCreditCard,
  LuSave,
  LuCircleCheck,
  LuCircleAlert,
  LuQrCode,
  LuLock,
  LuMail,
  LuEye,
  LuEyeOff,
  LuKeyRound,
  LuUpload,
  LuRotateCcw,
  LuImage,
} from "react-icons/lu";
import type { StoreSettings } from "@/lib/types/pos";
import { updateStoreSettings } from "@/lib/data/store";
import {
  getClientStoredSettings,
  saveClientStoredSettings,
  syncAuthCredentialsFromSettings,
} from "@/lib/settings-client";
import { AppShell } from "@/components/layouts/app-shell";

interface SettingsViewProps {
  initialSettings: StoreSettings;
}

export function SettingsView({ initialSettings }: SettingsViewProps) {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const stored = getClientStoredSettings();
    return { ...stored, ...initialSettings };
  });
  const [storeName, setStoreName] = useState(() => settings.store_name);
  const [ownerName, setOwnerName] = useState(() => settings.owner_name);
  const [email, setEmail] = useState(() => settings.email || "owner@warungku.id");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState(() => settings.phone);
  const [address, setAddress] = useState(() => settings.address);
  const [bankName, setBankName] = useState(() => settings.bank_name);
  const [bankNumber, setBankNumber] = useState(() => settings.bank_account_number);
  const [bankHolder, setBankHolder] = useState(() => settings.bank_account_holder);
  const [qrisNmid, setQrisNmid] = useState(
    () => settings.qris_nmid || "ID1020261017001",
  );
  const [qrisImageUrl, setQrisImageUrl] = useState(
    () => settings.qris_image_url || "/qris-warung.svg",
  );
  const [defaultMinStock, setDefaultMinStock] = useState(
    () => settings.default_minimum_stock,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQrisFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File yang dipilih harus berupa format gambar (PNG, JPG, WebP, SVG).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Ukuran gambar QRIS maksimal 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setQrisImageUrl(result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetQrisImage = () => {
    setQrisImageUrl("/qris-warung.svg");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);

    if (!storeName.trim()) {
      setError("Nama warung/toko tidak boleh kosong.");
      setIsSubmitting(false);
      return;
    }

    if (!ownerName.trim()) {
      setError("Nama pemilik warung tidak boleh kosong.");
      setIsSubmitting(false);
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Format alamat email tidak valid.");
      setIsSubmitting(false);
      return;
    }

    if (password && password.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      setIsSubmitting(false);
      return;
    }

    try {
      const updated = await updateStoreSettings({
        store_name: storeName.trim(),
        owner_name: ownerName.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        address: address.trim(),
        bank_name: bankName.trim(),
        bank_account_number: bankNumber.trim(),
        bank_account_holder: bankHolder.trim(),
        qris_nmid: qrisNmid.trim(),
        qris_image_url: qrisImageUrl.trim() || "/qris-warung.svg",
        default_minimum_stock: defaultMinStock,
      });

      setSettings(updated);
      saveClientStoredSettings(updated);
      syncAuthCredentialsFromSettings(updated);
      setSuccess(
        "Pengaturan warung, identitas pemilik, email, dan kata sandi berhasil disimpan dan langsung disinkronkan ke seluruh sistem.",
      );
    } catch {
      setError("Gagal menyimpan pengaturan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      pageTitle="Pengaturan Warung & Toko"
      breadcrumb={`${settings.store_name || ""} / Pengaturan`}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <LuCircleCheck className="size-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <LuCircleAlert className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Store & Owner Identity */}
          <div className="bg-card space-y-4 rounded-xl border border-border p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <LuStore className="size-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Profil & Identitas Warung
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Perubahan nama toko dan nama pemilik akan otomatis langsung
                  terganti di seluruh tampilan sistem.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Nama Warung / Toko *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: Warung Barokah Rezeki"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Nama Pemilik Warung *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Contoh: Bari Setiawan"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Nomor WhatsApp / Kontak Toko *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Ambang Batas Peringatan Stok Minimum Default (pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={defaultMinStock}
                  onChange={(e) => setDefaultMinStock(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Alamat Fisik Warung
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 2: Account & Security (Ganti Email & Password) */}
          <div className="bg-card space-y-4 rounded-xl border border-border p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <LuKeyRound className="size-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Akun & Keamanan (Ganti Email & Kata Sandi)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Kelola email dan kata sandi login pemilik. Perubahan akan
                  langsung diterapkan pada autentikasi masuk.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Alamat Email Pemilik *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <LuMail className="size-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@warungku.id"
                    className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Kata Sandi Baru (Opsional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <LuLock className="size-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-lg border border-border bg-background py-2 pr-10 pl-9 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    title={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                  >
                    {showPassword ? (
                      <LuEyeOff className="size-4" />
                    ) : (
                      <LuEye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Konfirmasi Kata Sandi Baru (Opsional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <LuLock className="size-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full rounded-lg border border-border bg-background py-2 pr-10 pl-9 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-background/50 p-3 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Catatan Keamanan:</span>{" "}
              Saat kata sandi atau email diubah, Anda dapat menggunakan email dan
              kata sandi baru tersebut pada halaman login.
            </div>
          </div>

          {/* Section 3: Bank Transfer Destination */}
          <div className="bg-card space-y-4 rounded-xl border border-border p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <LuCreditCard className="size-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Rekening Tujuan Transfer Pelanggan (Manual)
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Nama Bank *
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Nomor Rekening *
                </label>
                <input
                  type="text"
                  required
                  value={bankNumber}
                  onChange={(e) => setBankNumber(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Atas Nama Pemilik Rekening *
                </label>
                <input
                  type="text"
                  required
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: QRIS Barcode (Scan Gambar Langsung) */}
          <div className="bg-card space-y-4 rounded-xl border border-border p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <LuQrCode className="size-5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Barcode QRIS Warung (Scan Gambar)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    QRIS statis standar nasional tanpa biaya gateway pihak
                    ketiga.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Aktif di Kasir
              </span>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-3">
              {/* Kolom Kiri: Pratinjau & Tombol Aksi Cepat */}
              <div className="dark:bg-card flex flex-col items-center justify-center rounded-xl border border-border bg-white p-4">
                <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-50/50 p-2 dark:bg-muted/10">
                  <Image
                    src={qrisImageUrl || "/qris-warung.svg"}
                    alt="Pratinjau Barcode QRIS Warung"
                    width={160}
                    height={192}
                    unoptimized={Boolean(qrisImageUrl?.startsWith("data:"))}
                    className="h-auto max-h-48 w-auto max-w-full object-contain"
                  />
                </div>
                <span className="mt-2 text-[10px] font-semibold text-muted-foreground">
                  Pratinjau Tampilan Kasir
                </span>

                <div className="mt-3 flex w-full flex-col gap-2">
                  <label className="cursor-pointer inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50">
                    <LuUpload className="size-3.5 text-primary" />
                    <span>Ganti Gambar QRIS</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onChange={handleQrisFileChange}
                      className="hidden"
                    />
                  </label>

                  {qrisImageUrl !== "/qris-warung.svg" && (
                    <button
                      type="button"
                      onClick={handleResetQrisImage}
                      className="cursor-pointer inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <LuRotateCcw className="size-3" />
                      <span>Kembalikan ke Default</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Pengaturan NMID & Detail Edit Gambar */}
              <div className="space-y-4 sm:col-span-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    NMID (National Merchant ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={qrisNmid}
                    onChange={(e) => setQrisNmid(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Nomor identifikasi merchant QRIS resmi dari Bank Indonesia
                    atau PJSP Anda.
                  </p>
                </div>

                {/* Upload & Edit Area */}
                <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 transition-colors hover:bg-muted/20">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <LuImage className="size-4.5" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-foreground">
                      Ubah / Unggah Barcode QRIS
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Mendukung file PNG, JPG, WebP, atau SVG (Ukuran file maks. 3 MB)
                    </p>

                    <label className="mt-3 cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary/90">
                      <LuUpload className="size-3.5" />
                      <span>Pilih File Gambar</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                        onChange={handleQrisFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* URL Gambar Alternatif */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    Atau Masukkan Tautan / URL Gambar QRIS:
                  </label>
                  <input
                    type="text"
                    value={qrisImageUrl.startsWith("data:") ? "" : qrisImageUrl}
                    placeholder="Contoh: https://domain.com/qris-toko.png atau /qris-warung.svg"
                    onChange={(e) => {
                      if (e.target.value) {
                        setQrisImageUrl(e.target.value.trim());
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {qrisImageUrl.startsWith("data:")
                      ? "✓ Menggunakan gambar kustom hasil unggahan file."
                      : "Gambar saat ini: " + qrisImageUrl}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-background/60 p-3 text-xs">
                  <p className="font-semibold text-foreground">
                    Keunggulan Scan Barcode Gambar:
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
                    <li>Tidak memerlukan saldo atau akun gateway tambahan.</li>
                    <li>
                      Uang pembayaran langsung masuk ke rekening/e-wallet
                      merchant terdaftar Anda.
                    </li>
                    <li>
                      Dapat dipindai dari semua aplikasi e-wallet & perbankan
                      Indonesia.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <LuSave className="size-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
