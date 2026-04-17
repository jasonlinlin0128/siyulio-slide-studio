import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siyulio Slide Studio",
  description: "用 AI 打造屬於你的專業簡報風格",
  metadataBase: new URL("https://slide.siyulio.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <NavBar />
        <main>{children}</main>
        <footer className="border-t border-gray-100 py-6 mt-20">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-text-muted">
            <span>© 2026 Siyulio</span>
            <div className="flex gap-6">
              <a
                href="https://www.siyulio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-secondary transition-colors"
              >
                siyulio.com
              </a>
              <Link href="/design" className="hover:text-text-secondary transition-colors">
                DESIGN.md
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
