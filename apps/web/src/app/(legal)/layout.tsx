import Link from 'next/link';
import { ArrowLeft, MessageCircleReply } from 'lucide-react';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <ArrowLeft className="h-5 w-5" />
            <MessageCircleReply className="h-6 w-6 text-brand" />
            Auto Balas
          </Link>
        </div>
      </header>
      <article className="container max-w-3xl py-12 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-gray-700 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:text-gray-700 [&_li]:leading-relaxed [&_strong]:text-gray-900">
        {children}
      </article>
    </div>
  );
}
