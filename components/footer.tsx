"use client";

import { Logo } from "./logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/index";



export function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            {/* Footer branding removed per request */}
          </div>
        </div>
      </footer>
    );
  }
  const { L } = useI18n();
  const footerLinks = [
    {
      title: L.footer.product.title,
      links: [
        { label: L.footer.product.features, href: "/#features" },
        { label: L.footer.product.pricing, href: "/#pricing" },
      ],
    },
    {
      title: L.footer.company.title,
      links: [
        { label: L.footer.company.about, href: "/about" },
        { label: L.footer.company.blog, href: "#blog" },
      ],
    },
    {
      title: L.footer.legal.title,
      links: [
        { label: L.footer.legal.privacy, href: "/privacy" },
        { label: L.footer.legal.terms, href: "/terms" },
      ],
    },
  ] as const;


  return (
    <footer className="border-t">
      <div className="container px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-full lg:col-span-2">
            <Logo />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-4">
            {footerLinks.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">{group.title}</h3>
                <nav className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
