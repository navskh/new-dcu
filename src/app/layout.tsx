import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "DCU - Daily Check-Up",
  description: "매일 목표를 기록하고 달성을 확인하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
        <Toaster
          position="bottom-center"
          theme="dark"
          toastOptions={{
            style: { fontSize: '16px' }
          }}
        />
      </body>
    </html>
  );
}
