'use client';

import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  Eye,
  EyeOff,
  Link as LinkIcon,
} from 'lucide-react';
import { renderWhatsappText } from '@/lib/wa-format';

export type RichTextareaHandle = {
  focus: () => void;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  name?: string;
};

export const RichTextarea = forwardRef<RichTextareaHandle, Props>(function RichTextarea(
  { value, onChange, placeholder, rows = 8, name },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  function wrap(prefix: string, suffix: string = prefix) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    const placeholderText = selected || 'teks';
    const newValue = `${before}${prefix}${placeholderText}${suffix}${after}`;
    onChange(newValue);
    // Restore selection to wrapped text
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + prefix.length,
        start + prefix.length + placeholderText.length,
      );
    }, 0);
  }

  function prependLines(prefix: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || 'item';
    const after = value.slice(end);
    const lines = selected.split('\n');
    const prefixed = lines.map((l) => (l ? `${prefix}${l}` : l)).join('\n');
    const newValue = `${before}${prefixed}${after}`;
    onChange(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, start + prefixed.length);
    }, 0);
  }

  function insertLink() {
    const url = prompt('Masukkan URL (mis. https://...)');
    if (!url) return;
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(start);
    const newValue = `${before}${url}${after}`;
    onChange(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + url.length, start + url.length);
    }, 0);
  }

  return (
    <div className="rounded-md border border-gray-300 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-gray-50 px-2 py-1.5">
        <ToolBtn
          onClick={() => wrap('*')}
          title="Tebal — Ctrl+B"
          icon={<Bold className="h-3.5 w-3.5" />}
        />
        <ToolBtn
          onClick={() => wrap('_')}
          title="Miring — Ctrl+I"
          icon={<Italic className="h-3.5 w-3.5" />}
        />
        <ToolBtn
          onClick={() => wrap('~')}
          title="Coret"
          icon={<Strikethrough className="h-3.5 w-3.5" />}
        />
        <ToolBtn
          onClick={() => wrap('`')}
          title="Monospace / kode"
          icon={<Code className="h-3.5 w-3.5" />}
        />
        <div className="h-4 w-px bg-gray-300" />
        <ToolBtn
          onClick={() => prependLines('- ')}
          title="List bullet"
          icon={<List className="h-3.5 w-3.5" />}
        />
        <ToolBtn
          onClick={insertLink}
          title="Sisipkan link"
          icon={<LinkIcon className="h-3.5 w-3.5" />}
        />
        <div className="ml-auto" />
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10"
          title="Preview tampilan WhatsApp"
        >
          {preview ? (
            <>
              <EyeOff className="h-3 w-3" /> Edit
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" /> Preview WA
            </>
          )}
        </button>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div className="min-h-[160px] bg-[#e5ddd5] p-3">
          <div className="max-w-[85%] rounded-lg bg-white p-3 text-sm shadow-sm">
            <div className="whitespace-pre-wrap break-words">
              {value ? (
                renderWhatsappText(value)
              ) : (
                <span className="text-gray-400 italic">Preview kosong</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'b') {
              e.preventDefault();
              wrap('*');
            } else if (e.ctrlKey && e.key === 'i') {
              e.preventDefault();
              wrap('_');
            }
          }}
          className="w-full resize-y border-0 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-0"
        />
      )}
    </div>
  );
});

function ToolBtn({
  onClick,
  title,
  icon,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900"
    >
      {icon}
    </button>
  );
}
