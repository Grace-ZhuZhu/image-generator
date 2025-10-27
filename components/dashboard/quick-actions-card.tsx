"use client";

import { useI18n } from "@/lib/i18n/index";

type QuickAction = {
  label: string;
  href: string;
};

type QuickActionsCardProps = {
  actions?: QuickAction[];
};

export function QuickActionsCard({ actions }: QuickActionsCardProps) {
  const { L } = useI18n();
  const defaultActions: QuickAction[] = [
    { label: L.dashboard.quickActions.createPet, href: "/" },
    { label: L.dashboard.quickActions.viewGallery, href: "/gallery" },
    { label: L.dashboard.quickActions.buyCredits, href: "#pricing" },
  ];
  const actionsToUse = actions ?? defaultActions;
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="font-semibold mb-4">{L.dashboard.quickActions.title}</h3>
      <div className="space-y-2">
        {actionsToUse.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors"
          >
            <span className="text-sm">{action.label}</span>
            <span className="text-primary">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
