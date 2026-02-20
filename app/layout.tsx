import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "한글 발음 카드",
  description: "140개 한글 글자 연습 카드 + 로컬 오디오 재생"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

