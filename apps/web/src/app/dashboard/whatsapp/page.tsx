import { Zap, Shield } from 'lucide-react';
import { requireActiveOrgId } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { BaileysConnect } from './baileys-connect';
import { ConnectForm } from './connect-form';
import { DisconnectButton } from './disconnect-button';
import { ModeTabs } from './mode-tabs';

export default async function WhatsappPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const orgId = await requireActiveOrgId();

  const { mode = 'qr' } = await searchParams;

  const accounts = await prisma.whatsappAccount.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  });

  const baileysAccount = accounts.find((a) => a.provider === 'baileys');
  const cloudApiAccounts = accounts.filter((a) => a.provider === 'cloud_api');

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold">WhatsApp</h1>
      <p className="mt-2 text-gray-600">
        Hubungkan nomor WhatsApp untuk mulai terima chat customer & jawab otomatis dengan AI.
      </p>

      <div className="mt-6">
        <ModeTabs active={mode} />
      </div>

      {mode === 'qr' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <Zap className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-medium">Mode Cepat (QR Scan)</p>
                <p className="mt-1 text-xs">
                  Setup 60 detik. Cocok untuk volume normal UMKM (auto-reply chat customer).
                  Jangan dipakai untuk broadcast marketing massal — resiko nomor di-suspend WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <BaileysConnect
            existingAccountId={baileysAccount?.id}
            existingStatus={baileysAccount?.status}
            existingPhone={baileysAccount?.displayPhoneNumber}
          />
        </div>
      )}

      {mode === 'cloud' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-medium">Mode Resmi (WhatsApp Cloud API)</p>
                <p className="mt-1 text-xs">
                  Pakai API resmi Meta. Aman dari ban, cocok untuk broadcast & volume tinggi.
                  Setup lebih kompleks — butuh Meta Business account. Lihat{' '}
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    panduan Meta
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {cloudApiAccounts.length > 0 && (
            <div className="space-y-3">
              {cloudApiAccounts.map((a) => (
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
                    {a.lastError && (
                      <div className="mt-1 text-xs text-red-600">Error: {a.lastError}</div>
                    )}
                  </div>
                  <DisconnectButton accountId={a.id} />
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border bg-white p-6">
            <h2 className="font-semibold">Tambah Nomor (Cloud API)</h2>
            <p className="mt-1 text-sm text-gray-600">
              Dapatkan kredensial dari Meta Developers → app Anda → WhatsApp → API Setup.
            </p>
            <div className="mt-4">
              <ConnectForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
