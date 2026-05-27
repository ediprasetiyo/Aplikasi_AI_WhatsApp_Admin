'use client';

import Link from 'next/link';
import { Zap, Shield } from 'lucide-react';

export function ModeTabs({ active }: { active: string }) {
  const tabs = [
    {
      id: 'qr',
      label: 'Scan QR (Cepat)',
      icon: Zap,
      desc: '60 detik, untuk UMKM',
    },
    {
      id: 'cloud',
      label: 'Cloud API Meta (Resmi)',
      icon: Shield,
      desc: 'Untuk bisnis skala besar',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={`/dashboard/whatsapp?mode=${tab.id}`}
            className={`flex items-start gap-3 rounded-lg border p-4 transition ${
              isActive
                ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${
                isActive ? 'text-brand' : 'text-gray-400'
              }`}
            />
            <div>
              <div className={`font-semibold ${isActive ? 'text-brand' : 'text-gray-900'}`}>
                {tab.label}
              </div>
              <div className="text-xs text-gray-500">{tab.desc}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
