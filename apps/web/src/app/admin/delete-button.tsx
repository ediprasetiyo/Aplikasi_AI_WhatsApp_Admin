'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { deleteWorkspace } from './actions';

export function DeleteButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    const confirmed = confirm(
      `⚠️ HAPUS workspace "${orgName}"?\n\nSemua data akan dihapus permanen:\n- Members\n- WhatsApp accounts\n- Conversations & messages\n- Knowledge base\n- Subscription\n\nKetik OK untuk konfirmasi.`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      const res = await deleteWorkspace(orgId);
      if (res.ok) {
        toast.success(`Workspace "${orgName}" dihapus`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      title="Hapus workspace"
    >
      <Trash2 className="h-3 w-3" />
      {pending ? '...' : 'Hapus'}
    </button>
  );
}
