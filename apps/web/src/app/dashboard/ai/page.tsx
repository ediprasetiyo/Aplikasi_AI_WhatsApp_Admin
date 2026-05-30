import { requireActiveOrgId } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { SettingForm } from './setting-form';
import { KbForm, KbList } from './kb-ui';

export default async function AiPage() {
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
    systemPrompt:
      'Anda adalah admin customer service yang ramah dan informatif. Jawab pertanyaan customer dengan singkat, sopan, dan akurat berdasarkan informasi yang tersedia. Kalau tidak tahu jawaban, bilang akan dihubungkan ke admin manusia.',
    model: 'llama-3.3-70b-versatile',
    replyDelayMs: 1500,
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold">AI Auto-Reply</h1>
      <p className="mt-2 text-gray-600">
        Atur AI untuk menjawab chat customer otomatis berdasarkan knowledge base.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Pengaturan AI</h2>
          <p className="mt-1 text-xs text-gray-500">
            Powered by Groq (gratis). Dapatkan API key di{' '}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              console.groq.com
            </a>{' '}
            lalu tempel di <code>GROQ_API_KEY</code> di file <code>.env</code>.
          </p>
          <div className="mt-4">
            <SettingForm initial={initialSetting} />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Knowledge Base ({entries.length})</h2>
          <p className="mt-1 text-xs text-gray-500">
            FAQ, info produk, jam buka, harga, alamat — apapun yang sering ditanyakan customer.
          </p>
          <div className="mt-4">
            <KbForm />
          </div>
          <div className="mt-6">
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
  );
}
