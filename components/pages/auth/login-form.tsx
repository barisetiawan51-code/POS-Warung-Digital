"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuShoppingCart,
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle labels={site.theme} />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
            <LuShoppingCart className="size-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {settings.store_name || site.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistem Kasir & Manajemen Warung
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Masuk Pemilik Warung
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Masukkan kredensial akun terdaftar Anda untuk mengakses kasir dan
              data toko {settings.store_name || site.storeName}.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <LuCircleAlert className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <LuCircleCheck className="size-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Alamat Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <LuMail className="size-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan Email"
                  className="w-full rounded-lg border border-border bg-background py-2.5 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <LuLock className="size-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Password"
                  className="w-full rounded-lg border border-border bg-background py-2.5 pr-10 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <LuEyeOff className="size-4" />
                  ) : (
                    <LuEye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary/90 focus:outline-hidden disabled:opacity-50"
            >
              {isLoading ? "Memproses Masuk..." : "Masuk ke Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
