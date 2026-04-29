import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "リサイザー | SNS画像一括変換",
  description: "SNS向けに画像を6サイズへ一括リサイズ・ダウンロードできるツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
