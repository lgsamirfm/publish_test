import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بافخانه | فروشگاه عروسک، کلیدچین و گل کروشه",
  description:
    "بافخانه، خانهٔ عروسک‌های آمیگورومی، کلیدچین‌های کروشه و گل‌های ماندگار دست‌ساز. خرید الگوی کروشه، عروسک و کلیدچین.",
  keywords: [
    "کروشه",
    "آمیگورومی",
    "عروسک دست‌بافت",
    "کلیدچین کروشه",
    "گل کروشه",
    "بافخانه",
    "الگوی کروشه",
  ],
  icons: { icon: "/logo.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getSession();

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader initialUser={initialUser} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
        <SonnerToaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}