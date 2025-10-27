"use client";

import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { Logo } from "./logo";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { useI18n } from "@/lib/i18n/index";

function LangSelector() {
  const { lang, setLang, L } = useI18n();
  return (
    <>
      <span className="text-xs text-muted-foreground">{L.ui.language}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        className="h-8 rounded-md border bg-background px-2 text-sm"
      >
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </>
  );
}


interface HeaderProps {
  user: any;
}

interface NavItem {
  label: string;
  href: string;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const { L } = useI18n();

  // Main navigation items for AI Pet Photography
  const mainNavItems: NavItem[] = [
    { label: L.header.navHome, href: "/" },
    { label: L.header.navGallery, href: "/gallery" },
  ];

  // Dashboard items - empty array as we don't want navigation items in dashboard
  const dashboardItems: NavItem[] = [];

  // Choose which navigation items to show
  const navItems = isDashboard ? dashboardItems : mainNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Centered Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-lg font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          {/* Language selector before auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            <LangSelector />
          </div>
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {isDashboard && (
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {user.email}
                </span>
              )}
              {!isDashboard && (
                <>
                  <Button asChild size="sm" variant="default">
                    <Link href="/profile">{L.header.profile}</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard">{L.header.dashboard}</Link>
                  </Button>
                </>
              )}
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  {L.header.signOut}
                </Button>
              </form>
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">{L.header.signIn}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">{L.header.signUp}</Link>
              </Button>
            </div>
          )}
          <MobileNav items={navItems} user={user} isDashboard={isDashboard} />
        </div>
      </div>
    </header>
  );
}
