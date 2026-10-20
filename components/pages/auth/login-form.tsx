"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuShoppingBasket,
  LuLock,
  LuMail,
  LuEye,
  LuEyeOff,
  LuCircleAlert,
  LuCircleCheck,
} from "react-icons/lu";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { site } from "@/content/site";
import { useStoreSettings } from "@/lib/settings-client";

export function LoginForm() {
  const router = useRouter();
  const settings = useStoreSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }

    try {
      setIsLoading(true);
      const client = getSupabaseClient();
      if (!client || !isSupabaseConfigured()) {
        setError("Supabase belum dikonfigurasi. Periksa environment variables.");
        return;
      }

      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message || "Email atau kata sandi tidak cocok.");
        return;
      }

      setSuccess("Autentikasi berhasil. Membuka dashboard...");
      router.refresh();
      const searchParams = new URLSearchParams(window.location.search);
      const nextPath = searchParams.get("next") || "/dashboard";
      router.push(nextPath);
    } catch {
      setError("Gagal masuk. Periksa kembali email dan kata sandi Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#f3f7fd] px-4 py-5 text-[#172b4d] transition-colors dark:bg-[#0b1322] dark:text-[#f1f5f9] sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeToggle labels={site.theme} />
      </div>

      <section className="grid w-full max-w-[1040px] overflow-hidden rounded-[24px] border border-[#dce6f2] bg-white transition-colors dark:border-[#1e293b] dark:bg-[#111c2e] md:grid-cols-[43%_57%]">
        <aside className="relative hidden min-h-[590px] overflow-hidden bg-[#eff6ff] p-7 transition-colors dark:bg-[#0c192d] md:flex md:flex-col md:justify-between lg:min-h-[650px] lg:p-10">
          <div className="relative z-10 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#2563eb] text-white">
              <LuShoppingBasket className="size-6" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-[22px] leading-tight font-bold tracking-[-0.03em] text-[#1e3a8a] dark:text-foreground lg:text-[27px]">
              GoletAja
            </h1>
            <p className="mt-1 text-[20px] font-bold text-primary dark:text-primary">Sistem Kasir &amp; Manajemen Warung</p>
            <p className="mx-auto mt-7 max-w-[230px] text-[14px] leading-5 text-[#64748b] dark:text-[#94a3b8] lg:mt-9">Kelola warung Anda dengan lebih mudah, cepat dan aman.</p>
          </div>

          <div className="relative mx-auto mt-6 w-full max-w-[300px] lg:mt-8 lg:max-w-[340px]">
            <Image
              src="/images/herologo.svg"
              alt="Hero POS GoletAja"
              width={721}
              height={747}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </aside>

        <div className="flex flex-col justify-center bg-white p-6 transition-colors dark:bg-[#111c2e] sm:p-9 lg:p-12">
          <div className="mb-7 flex items-center gap-3 md:hidden">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white">
              <LuShoppingBasket className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">GoletAja</h1>
              <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">Sistem Kasir &amp; Manajemen Warung</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[420px]">
            <h2 className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-[#172b4d] dark:text-[#f1f5f9] sm:text-[26px]">Masuk ke akun Anda</h2>
            <p className="mt-2 text-xs leading-5 text-[#64748b] dark:text-[#94a3b8] sm:text-sm">Silakan login untuk mengakses dashboard GoletAja.</p>

            {error && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[#dc2626]" role="alert">
                <LuCircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-[#059669]" role="status">
                <LuCircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-foreground">Email</label>
                <div className="relative">
                  <LuMail className="pointer-events-none absolute top-1/2 left-3 size-[17px] -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
                  <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Masukkan email" className="h-[46px] w-full rounded-lg border border-[#dce6f2] bg-white pr-3 pl-10 text-xs text-[#172b4d] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100 placeholder:text-[#94a3b8] sm:h-[50px] sm:text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-foreground">Kata Sandi</label>
                <div className="relative">
                  <LuLock className="pointer-events-none absolute top-1/2 left-3 size-[17px] -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
                  <input id="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" className="h-[46px] w-full rounded-lg border border-[#dce6f2] bg-white pr-11 pl-10 text-xs text-[#172b4d] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100 placeholder:text-[#94a3b8] sm:h-[50px] sm:text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="absolute top-1/2 right-0 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748b] transition hover:bg-[#eff6ff] hover:text-[#2563eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">
                    {showPassword ? <LuEyeOff className="size-[17px]" /> : <LuEye className="size-[17px]" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="mt-1 flex h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] text-xs font-bold text-white transition duration-200 hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a8a] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[52px] sm:text-sm">
                {isLoading ? "Memproses masuk..." : "Masuk ke Dashboard"}
                {!isLoading && <span className="text-base" aria-hidden="true">→</span>}
              </button>
            </form>
            <p className="mt-7 text-center text-[10px] text-[#94a3b8] sm:mt-10 sm:text-xs">© 2026 GoletAja</p>
          </div>
        </div>
      </section>
    </main>
  );
}
