"use client";

import { useI18n } from "@/lib/i18n/index";

export function DashboardPlaceholderGallery() {
  const { L } = useI18n();
  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <h3 className="font-semibold text-lg mb-2">{L.dashboard.comingSoon.title}</h3>
      <p className="text-muted-foreground">{L.dashboard.comingSoon.desc}</p>
    </div>
  );
}

