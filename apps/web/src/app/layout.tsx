import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Analytics } from '@/components/analytics';
import './globals.css';

export const metadata: Metadata = {
  title: 'Auto Balas — Auto-reply WhatsApp untuk UMKM',
  description: 'Bantu owner UMKM kurangi beban admin dan jangan sampai customer hilang.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Analytics />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
