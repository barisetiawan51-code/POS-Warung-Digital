"use client";

import { useState } from "react";
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
  LuShoppingCart,
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
  pageTitle = "Dashboard Ringkasan",
  breadcrumb = "Warung / Dashboard",
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: settings } = useDatabaseStoreSettings();
  const storeName = settings?.store_name || site.name;
  const ownerName = settings?.owner_name || site.ownerName;


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
      label: "Laporan Penjualan",
      href: "/laporan",
      icon: LuChartColumn,
    },
    {
      label: "Pengaturan Warung",
      href: "/pengaturan",
      icon: LuSettings,
    },
  ];

  const primaryNavItems = navItems.filter((item) => item.href !== "/pengaturan");

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

  return (
      <div className="flex min-h-screen min-w-0 bg-background text-foreground">
        {/* Desktop Sidebar (Fixed Left) */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b border-sidebar-border/40 px-6 py-6">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/20 text-white shadow-sm">
              <LuShoppingCart className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg leading-none font-bold tracking-tight text-white">
                {storeName}
              </h1>
              <p className="mt-1 text-xs text-sidebar-muted">
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
                    "group flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-sidebar-muted hover:bg-white/10 hover:text-white",
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
        <div className="space-y-1.5 border-t border-sidebar-border/40 p-4">
          <Link
            href="/pengaturan"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <LuSettings className="size-4 shrink-0" />
            <span>Pengaturan Warung</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <LuLogOut className="size-4 shrink-0" />
            <span>Keluar (Logout)</span>
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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between bg-background border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div>
          <div className="flex items-center justify-between border-b border-sidebar-border/40 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/20 text-white">
                <LuShoppingCart className="size-4 text-white" />
              </div>
              <div>
                <h2 className="text-base leading-none font-bold text-white">
                  {storeName}
                </h2>
                <p className="mt-1 text-[11px] text-sidebar-muted">
                  Kasir Digital & Warung
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1 text-sidebar-muted hover:text-white"
            >
              <LuX className="size-5" />
            </button>
          </div>

          <nav className="mt-4 space-y-1 px-3">
            {navItems.map((item) => {
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
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-sidebar-muted hover:bg-white/10 hover:text-white",
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

        <div className="space-y-1.5 border-t border-sidebar-border/40 p-4">
          <Link
            href="/pengaturan"
            onClick={() => setMobileMenuOpen(false)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <LuSettings className="size-4 shrink-0" />
            <span>Pengaturan Warung</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:bg-white/10 hover:text-white"
          >
            <LuLogOut className="size-4 shrink-0" />
            <span>Keluar (Logout)</span>
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
                "relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
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
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Buka semua menu navigasi"
        >
          <LuMenu className="size-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Top Navigation Bar */}
        <header className="bg-card/95 sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border px-3 py-3 bg-background sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <LuMenu className="size-5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight text-foreground sm:text-xl">
                {pageTitle}
              </h2>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {breadcrumb}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
            <Link
              href="/kasir"
              className="inline-flex size-10 items-center justify-center rounded-full border border-primary/30 bg-primary text-xs font-semibold text-white transition-colors hover:bg-primary/90 sm:size-auto sm:gap-2 sm:rounded-lg sm:px-3.5 sm:py-2 sm:text-sm"
            >
              <LuStore className="size-4 shrink-0" />
              <span className="hidden sm:inline">Buka Kasir</span>
            </Link>

            <div className="hidden items-center gap-2.5 border-l border-border pl-4 md:flex">
              <div className="flex size-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                <LuUser className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-xs leading-none font-semibold text-foreground">
                  {ownerName}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {storeName}
                </p>
              </div>
            </div>

            <ThemeToggle labels={site.theme} />
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
