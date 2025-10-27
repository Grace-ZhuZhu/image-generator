"use client";

import { Coins } from "lucide-react";
import { CreditTransaction } from "@/types/creem";
import { useI18n } from "@/lib/i18n/index";

type CreditsBalanceCardProps = {
  credits: number;
  recentHistory: CreditTransaction[];
};

export function CreditsBalanceCard({
  credits,
  recentHistory,
}: CreditsBalanceCardProps) {
  const { L } = useI18n();
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{L.dashboard.credits.available}</p>
          <h3 className="text-2xl font-bold mt-1">{credits}</h3>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-muted-foreground">{L.dashboard.credits.recent}</p>
        <div className="space-y-1">
          {recentHistory.map((history, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span
                className={
                  history.type === "add" ? "text-primary" : "text-destructive"
                }
              >
                {history.type === "add" ? "+" : "-"}
                {history.amount}
              </span>
              <span className="text-muted-foreground">
                {new Date(history.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
