import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/layouts/skip-link";
import { ThemeScript } from "@/components/layouts/theme-script";
import { fetchStoreSettingsServer } from "@/lib/data/settings-server";
import { site } from "@/content/site";
import "@/styles/globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let storeName = site.name || "Warung";

  try {
    const settings = await fetchStoreSettingsServer();
    storeName = settings.store_name || storeName;
  } catch {
    // Auth and login pages may not have an authenticated database session.
  }

  return {
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description: "Sistem kasir dan manajemen warung",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeScript />
        <SkipLink label={site.skipLinkLabel} />
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
