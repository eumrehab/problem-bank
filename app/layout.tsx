import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '캠퍼스 문제은행',
  description: '대학생을 위한 모바일 보건의료 문제풀이 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
