import { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'SMTP Forge Admin',
  description: 'Transactional Email Platform Administration',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
