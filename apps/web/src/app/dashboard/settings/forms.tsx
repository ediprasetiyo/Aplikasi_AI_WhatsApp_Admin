'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import { updateWorkspaceName, deleteOwnWorkspace } from './actions';

export function WorkspaceNameForm({
  currentName,
  canEdit,
}: {
  currentName: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [pending, startTransition] = useTransition();

  function onSave() {
    if (!name.trim() || name === currentName) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await updateWorkspaceName(name);
      if (res.ok) {
        toast.success('Nama workspace diupdate');
        setEditing(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onCancel() {
    setName(currentName);
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-3">
      <span className="text-sm text-gray-500">Nama Workspace</span>
      {editing ? (
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            autoFocus
          />
          <button
            onClick={onSave}
            disabled={pending}
            className="rounded-md bg-brand p-1.5 text-white hover:bg-brand-dark disabled:opacity-50"
            title="Simpan"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={onCancel}
            disabled={pending}
            className="rounded-md border p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            title="Batal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-medium">{currentName}</span>
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-brand"
              title="Edit nama"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function DeleteWorkspaceButton({ workspaceName }: { workspaceName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    const typed = prompt(
      `⚠️ Hapus workspace "${workspaceName}" PERMANEN?\n\nKetik nama workspace untuk konfirmasi:`,
    );
    if (typed !== workspaceName) {
      if (typed !== null) toast.error('Nama tidak match. Batal hapus.');
      return;
    }
    startTransition(async () => {
      const res = await deleteOwnWorkspace();
      if (res.ok) {
        toast.success('Workspace dihapus');
        router.push('/onboarding');
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
      className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? 'Menghapus...' : 'Hapus Workspace'}
    </button>
  );
}
