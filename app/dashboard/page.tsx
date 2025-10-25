import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionStatusCard } from "@/components/dashboard/subscription-status-card";
import { CreditsBalanceCard } from "@/components/dashboard/credits-balance-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import AnnouncementNotify from "@/components/announcement-notify";
import { DashboardWelcomeBanner } from "@/components/dashboard/welcome-banner";
import { DashboardPlaceholderGallery } from "@/components/dashboard/placeholder-gallery";
import { DashboardAccountDetails } from "@/components/dashboard/account-details";
import { DashboardPricingSection } from "@/components/dashboard/pricing-section";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get customer data including credits and subscription
  const { data: customerData } = await supabase
    .from("customers")
    .select(
      `
      *,
      subscriptions (
        status,
        current_period_end,
        creem_product_id
      ),
      credits_history (
        amount,
        type,
        created_at
      )
    `
    )
    .eq("user_id", user.id)
    .single();

  const subscription = customerData?.subscriptions?.[0];
  const credits = customerData?.credits || 0;
  const recentCreditsHistory = customerData?.credits_history?.slice(0, 2) || [];

  return (
    <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8 px-4 sm:px-8 container">
      {/* Welcome Banner */}
      <DashboardWelcomeBanner email={user.email ?? ""} />

      {/* Announcement under Hero */}
      <AnnouncementNotify />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SubscriptionStatusCard subscription={subscription} />
        <CreditsBalanceCard
          credits={credits}
          recentHistory={recentCreditsHistory}
        />
        <QuickActionsCard />
      </div>

      {/* Main Content Grid - Coming Soon */}
      <div className="grid gap-6">
        <DashboardPlaceholderGallery />
      </div>

      {/* Account Details Section */}
      <DashboardAccountDetails email={user.email ?? ""} userId={user.id} />

      {/* Pricing Anchor */}
      <DashboardPricingSection />
    </div>
  );
}
