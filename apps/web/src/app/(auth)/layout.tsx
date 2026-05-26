import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 font-bold text-xl">
          <MessageCircle className="h-7 w-7 text-brand" />
          WA Admin AI
        </Link>
        <div className="rounded-lg border bg-white p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
