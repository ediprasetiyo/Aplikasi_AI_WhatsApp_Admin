'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { adminUpdateWorkspaceName, deleteWorkspace } from '../../actions';

export function AdminWorkspaceActions({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(orgName);
  const [pending, startTransition] = useTransition();

  function onSave() {
    if (!name.trim() || name === orgName) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await adminUpdateWorkspaceName(orgId, name);
      if (res.ok) {
        toast.success('Nama workspace diupdate');
        setEditing(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onDelete() {
    const typed = prompt(
      `⚠️ HAPUS workspace "${orgName}" PERMANEN?\n\nSemua data (chat, KB, member, WA, subscription) akan hilang.\n\nKetik nama workspace untuk konfirmasi:`,
    );
    if (typed !== orgName) {
      if (typed !== null) toast.error('Nama tidak match. Batal hapus.');
      return;
    }
    startTransition(async () => {
      const res = await deleteWorkspace(orgId);
      if (res.ok) {
        toast.success(`Workspace "${orgName}" dihapus`);
        router.push('/admin/workspaces');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          autoFocus
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          onClick={onSave}
          disabled={pending}
          className="rounded-md bg-brand p-1.5 text-white hover:bg-brand-dark disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setName(orgName);
            setEditing(false);
          }}
          disabled={pending}
          className="rounded-md border p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit Nama
      </button>
      <button
        onClick={onDelete}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Hapus
      </button>
    </div>
  );
}
