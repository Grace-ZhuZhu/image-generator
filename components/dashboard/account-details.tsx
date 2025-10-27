"use client";

import { useI18n } from "@/lib/i18n/index";

export function DashboardAccountDetails({ email, userId }: { email: string; userId: string }) {
  const { L } = useI18n();
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6 mb-6">
      <h2 className="font-bold text-lg sm:text-xl mb-4">{L.dashboard.account.title}</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">{L.dashboard.account.email}</p>
            <p className="font-medium break-all">{email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">{L.dashboard.account.userId}</p>
            <p className="font-medium break-all">{userId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

