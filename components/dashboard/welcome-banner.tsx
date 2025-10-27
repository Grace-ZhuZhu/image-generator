"use client";

import { useI18n } from "@/lib/i18n/index";

export function DashboardWelcomeBanner({ email }: { email: string }) {
  const { L } = useI18n();
  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border rounded-lg p-6 sm:p-8 mt-6 sm:mt-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
        {L.dashboard.welcomeTitlePrefix}{" "}
        <span className="block sm:inline mt-1 sm:mt-0">{email}</span>
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground">
        {L.dashboard.welcomeDesc}
      </p>
    </div>
  );
}

