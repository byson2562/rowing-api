import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RowingAPI",
  description: "日本ローイング大会記録の検索・可視化"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
