import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "HeaterQuote — Water Heater Replacement Estimates",
  description:
    "Know your water heater replacement range before you call. Free instant estimates for Florida homeowners.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0081ce",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg">
                🔥
              </span>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                Heater<span className="text-brand-600">Quote</span>
              </span>
            </Link>
            <Link
              href="/estimate"
              className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Get Estimate
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} HeaterQuote · Serving Florida
            homeowners · Estimates only, not a final quote.
          </div>
        </footer>
      </body>
    </html>
  );
}
