"use client";

import { useI18n } from "@/lib/i18n/index";

export function DashboardPricingSection() {
  const { L } = useI18n();
  return (
    <section id="pricing" className="rounded-xl border bg-card p-6 mb-10">
      <h2 className="font-bold text-lg sm:text-xl mb-2">{L.dashboard.pricing.title}</h2>
      <p className="text-sm text-muted-foreground">{L.dashboard.pricing.comingSoon}</p>
    </section>
  );
}

