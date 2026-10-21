import Script from "next/script";

const themeScript = `(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : prefersDark;
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  } catch (error) {}
})();`;

export function ThemeScript() {
  return <Script id="theme-initializer" strategy="beforeInteractive">{themeScript}</Script>;
}
