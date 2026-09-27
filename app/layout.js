import './globals.css';

export const metadata = {
  title: 'Study File Archive',
  description: '개인용 학습 자료 웹 스토리지 서비스',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}