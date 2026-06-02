import { Sparkles, BookOpen, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { requireActiveOrgId } from '@/lib/session';
import { requireActiveSubscription } from '@/lib/subscription-guard';
import { prisma } from '@wa-admin/db';
import { SettingForm } from './setting-form';
import { KbForm, KbList } from './kb-ui';
import { ImportButton } from './import-button';

const DEFAULT_PROMPT =
  'Anda adalah admin customer service yang ramah dan informatif. Jawab pertanyaan customer dengan singkat, sopan, dan akurat berdasarkan informasi yang tersedia. Kalau tidak tahu jawaban, bilang akan dihubungkan ke admin manusia.';

export default async function AiPage() {
  await requireActiveSubscription();
  const orgId = await requireActiveOrgId();

  const [setting, entries] = await Promise.all([
    prisma.aiSetting.findUnique({ where: { organizationId: orgId } }),
    prisma.knowledgeEntry.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const initialSetting = setting ?? {
    enabled: false,
    systemPrompt: DEFAULT_PROMPT,
    model: 'llama-3.3-70b-versatile',
    replyDelayMs: 1500,
  };

  const isActive = setting?.enabled ?? false;

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Sparkles className="h-7 w-7 text-brand" />
              AI Auto-Reply
            </h1>
            <p className="mt-2 text-gray-600">
              Atur AI untuk menjawab chat customer otomatis berdasarkan knowledge base.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                AI Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                <AlertCircle className="h-3.5 w-3.5" />
                AI Tidak Aktif
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              <BookOpen className="h-3.5 w-3.5" />
              {entries.length} knowledge
            </span>
          </div>
        </div>
      </div>

      {/* Tips banner */}
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900">
        💡 <strong>Tips format WhatsApp:</strong>{' '}
        <code className="rounded bg-yellow-100 px-1">*tebal*</code>{' '}
        <code className="rounded bg-yellow-100 px-1">_miring_</code>{' '}
        <code className="rounded bg-yellow-100 px-1">~coret~</code> · Enter = baris baru ·
        Format akan terkirim rapi ke customer di WhatsApp.
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Pengaturan AI — sticky di kiri */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-brand" />
                <h2 className="font-semibold">Pengaturan AI</h2>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Powered by Groq (gratis). Dapatkan API key di{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline"
                >
                  console.groq.com
                </a>
                .
              </p>
            </div>
            <div className="p-5">
              <SettingForm initial={initialSetting} />
            </div>
          </div>
        </div>

        {/* Knowledge Base — kolom kanan */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-brand" />
                <h2 className="font-semibold">Knowledge Base ({entries.length})</h2>
              </div>
              <ImportButton />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              FAQ, info produk, jam buka, harga, alamat — apapun yang sering ditanyakan
              customer.
            </p>
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-2">
            {/* Form tambah */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                + Tambah Knowledge Baru
              </h3>
              <KbForm />
            </div>

            {/* List existing */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Knowledge Tersimpan
              </h3>
              <KbList
                entries={entries.map((e) => ({
                  id: e.id,
                  title: e.title,
                  content: e.content,
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Help footer */}
      <div className="mt-8 rounded-lg border border-dashed bg-gray-50 p-4 text-xs text-gray-600">
        <strong className="text-gray-900">Cara kerja:</strong> Saat customer kirim chat
        WhatsApp, AI akan baca knowledge base ini + persona di system prompt, lalu generate
        balasan dalam {initialSetting.replyDelayMs / 1000} detik. Makin lengkap knowledge
        base, makin akurat jawaban AI. Target ideal: 10-30 entry untuk UMKM kecil-menengah.
      </div>
    </div>
  );
}
