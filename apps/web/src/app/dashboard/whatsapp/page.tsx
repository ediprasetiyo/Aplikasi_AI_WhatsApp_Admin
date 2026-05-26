import { requireSession } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { ConnectForm } from './connect-form';
import { DisconnectButton } from './disconnect-button';

export default async function WhatsappPage() {
  const session = await requireSession();
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return <div className="p-8">Pilih workspace dulu.</div>;

  const accounts = await prisma.whatsappAccount.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold">WhatsApp</h1>
      <p className="mt-2 text-gray-600">
        Hubungkan nomor WhatsApp Business Anda lewat Meta Cloud API. Aman, tidak akan ke-banned.
      </p>

      {accounts.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed bg-yellow-50 p-4 text-sm text-yellow-900">
          Belum ada nomor terhubung. Lihat{' '}
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline"
          >
            panduan setup Meta
          </a>{' '}
          untuk dapatkan <code>Phone Number ID</code> dan <code>Access Token</code>.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border bg-white p-4"
            >
              <div>
                <div className="font-semibold">{a.displayPhoneNumber}</div>
                <div className="text-sm text-gray-500">
                  {a.verifiedName ?? 'Belum verified'} ·{' '}
                  <span
                    className={
                      a.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {a.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Phone Number ID: <code>{a.phoneNumberId}</code>
                </div>
                {a.lastError && (
                  <div className="mt-1 text-xs text-red-600">Error: {a.lastError}</div>
                )}
              </div>
              <DisconnectButton accountId={a.id} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-lg border bg-white p-6">
        <h2 className="font-semibold">Tambah Nomor</h2>
        <p className="mt-1 text-sm text-gray-600">
          Dapatkan kredensial dari{' '}
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline"
          >
            developers.facebook.com
          </a>{' '}
          → app Anda → WhatsApp → API Setup.
        </p>
        <div className="mt-4">
          <ConnectForm />
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Webhook URL untuk Meta:</p>
        <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-xs">
          {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/whatsapp/webhook
        </code>
        <p className="mt-2 text-xs">
          Untuk dev lokal, expose port 3001 dengan{' '}
          <a
            href="https://ngrok.com/download"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            ngrok
          </a>
          : <code>ngrok http 3001</code>, lalu pakai URL https-nya di Meta.
        </p>
        <p className="mt-1 text-xs">
          Verify Token (dari .env <code>WHATSAPP_VERIFY_TOKEN</code>): copy ke field "Verify token"
          di Meta.
        </p>
      </div>
    </div>
  );
}
