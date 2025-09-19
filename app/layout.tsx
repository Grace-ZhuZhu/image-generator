import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const baseUrl = process.env.BASE_URL
  ? `https://${process.env.BASE_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "AI-Petography - AI Pet Photo Generator",
  description: "Transform your beloved pets into stunning artistic creations with our advanced AI technology. Create professional-quality photos with holiday themes, fantasy adventures, and more.",
  keywords: "AI pet photos, pet photography, AI image generation, pet portraits, animal photos, pet art, AI pets",
  openGraph: {
    title: "AI-Petography - AI Pet Photo Generator",
    description: "Transform your beloved pets into stunning artistic creations with our advanced AI technology. Create professional-quality photos with holiday themes, fantasy adventures, and more.",
    type: "website",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Petography - AI Pet Photo Generator",
    description: "Transform your beloved pets into stunning artistic creations with AI.",
  },
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen">
            <Header user={user} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
