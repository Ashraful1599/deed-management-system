import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://dolilbd.com'),
  title: {
    default: 'DolilBD — Find Licensed Dolil Writers in Bangladesh',
    template: '%s | DolilBD',
  },
  description: "Bangladesh's trusted platform for finding licensed dolil writers across all 64 districts. Search, compare, and book verified professionals.",
  openGraph: {
    siteName: 'DolilBD',
    type: 'website',
    locale: 'en_BD',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <ToastContainer position="top-right" autoClose={3000} />
        </Providers>
      </body>
    </html>
  );
}
