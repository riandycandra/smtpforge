import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import './globals.css';

import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'SMTP Forge Admin',
  description: 'Transactional Email Platform Administration',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
