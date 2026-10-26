"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LuLayoutDashboard,
  LuStore,
  LuPackage,
  LuTags,
  LuBoxes,
  LuReceipt,
  LuChartColumn,
  LuSettings,
  LuLogOut,
  LuUser,
  LuMenu,
  LuX,
  LuShoppingBasket,
} from "react-icons/lu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { site } from "@/content/site";
import { useStoreSettings as useDatabaseStoreSettings } from "@/lib/hooks/useRealtime";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumb?: string;
  lowStockCount?: number;
}

export function AppShell({
  children,
  pageTitle = "Dashboard",
  breadcrumb = "Warung / Dashboard",
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { data: settings } = useDatabaseStoreSettings();
  const storeName = settings?.store_name || site.name;
  const ownerName = settings?.owner_name || site.ownerName;
  const profileImageUrl = settings?.profile_image_url || "";

  useEffect(() => setIsMounted(true), []);


  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LuLayoutDashboard,
    },
    {
      label: "Kasir",
      href: "/kasir",
      icon: LuStore,
      badge: "POS",
    },
    {
      label: "Produk",
      href: "/produk",
      icon: LuPackage,
    },
    {
      label: "Kategori",
      href: "/kategori",
      icon: LuTags,
    },
    {
      label: "Stok & Inventaris",
      href: "/stok",
      icon: LuBoxes,
    },
    {
      label: "Riwayat Transaksi",
      href: "/transaksi",
      icon: LuReceipt,
    },
    {
      label: "Laporan",
      href: "/laporan",
      icon: LuChartColumn,
    },
    {
      label: "Pengaturan",
      href: "/pengaturan",
      icon: LuSettings,
    },
  ];

  const primaryNavItems = navItems;

  const handleLogout = async () => {
    // Clear demo cookie
    document.cookie = "warungku_demo_auth=; path=/; max-age=0";
    try {
      const { getSupabaseClient } = await import("@/lib/supabaseClient");
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut();
      }
    } catch {
      // Ignore if supabase not available
    }
    router.refresh();
    router.push("/login");
  };

  const requestLogout = () => setLogoutConfirmOpen(true);

  return (
    <div className="flex min-h-screen min-w-0 bg-background text-foreground">
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b border-sidebar-border/40 px-6 py-6">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/20 text-primary-foreground shadow-sm">
              <LuShoppingBasket className="size-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg leading-none font-bold tracking-tight text-primary-foreground">
                GoletAja
              </h1>
              <p className="mt-1 text-xs text-primary-foreground">
                Kasir Digital & Warung
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="mt-4 space-y-1 px-3">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard" || pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-primary-foreground hover:bg-white/10 hover:text-primary-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-2 border-t border-white/10 p-4">
          <ThemeToggle
            labels={site.theme}
            showLabel
            className="text-blue-100 hover:bg-white/10 hover:text-white"
          />
          <button
            onClick={requestLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Logout"
          >
            <LuLogOut className="size-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-[#173d6b] bg-[#0d2b52] text-white transition-transform duration-200 lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div>
          <div className="flex items-center justify-between border-b border-sidebar-border/40 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/20 text-primary-foreground">
                <LuShoppingBasket className="size-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base leading-none font-bold text-primary-foreground">
                  {storeName}
                </h2>
                <p className="mt-1 text-[11px] text-primary-foreground">
                  Kasir Digital & Warung
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1 text-primary-foreground hover:text-primary-foreground"
            >
              <LuX className="size-5" />
            </button>
          </div>
          <nav className="mt-4 space-y-1 px-3">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard" || pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-primary-foreground hover:bg-white/10 hover:text-primary-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-white/10 p-4">
          <ThemeToggle labels={site.theme} showLabel className="text-blue-100 hover:bg-white/10 hover:text-white" />
          <button
            onClick={requestLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Logout"
          >
            <LuLogOut className="size-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-30 grid grid-cols-5 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navigasi mobile">
        {[
          { label: "Dashboard", href: "/dashboard", icon: LuLayoutDashboard },
          { label: "Produk", href: "/produk", icon: LuPackage },
          { label: "Kasir", href: "/kasir", icon: LuStore, featured: true },
          { label: "Transaksi", href: "/transaksi", icon: LuReceipt },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard" || pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                item.featured && "-mt-4 min-h-20",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn(
                "flex items-center justify-center",
                item.featured && "size-12 rounded-2xl bg-primary text-white ring-4 ring-background",
              )}>
                <Icon className={cn("size-5", item.featured && "size-6")} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Buka semua menu navigasi"
        >
          <LuMenu className="size-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background px-3 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <LuMenu className="size-5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight text-foreground sm:text-xl">{pageTitle}</h2>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{breadcrumb}</p>
            </div>
          </div>
          <div
            className="flex shrink-0 items-center gap-2 rounded-xl p-1.5 text-left sm:gap-3 sm:p-2"
            aria-label={`Profil ${ownerName}`}
          >
            <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
              {isMounted && profileImageUrl ? (
                <Image src={profileImageUrl} alt={`Foto profil ${ownerName}`} width={36} height={36} unoptimized={profileImageUrl.startsWith("data:")} className="size-full object-cover" />
              ) : (
                <LuUser className="size-4" />
              )}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-32 truncate text-xs font-semibold text-foreground">{ownerName}</span>
              <span className="block max-w-32 truncate text-[11px] text-muted-foreground">{storeName}</span>
            </span>
            <span className="size-4" aria-hidden="true" />
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">{children}</main>
      </div>

      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLogoutConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card bg-white dark:bg-slate-900 p-6 text-center shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                aria-label="Tutup dialog logout"
              >
                <LuX className="size-4" />
              </button>
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <LuLogOut className="size-7" />
              </div>
            </div>
            <h2 id="logout-dialog-title" className="mt-6 text-xl font-bold text-foreground">
              Keluar dari akun?
            </h2>
            <p id="logout-dialog-description" className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Anda akan keluar dari sesi {storeName}. Pastikan semua pekerjaan sudah tersimpan.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
