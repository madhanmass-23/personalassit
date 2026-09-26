import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Personal Assistant",
  description: "Premium personal productivity application",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Assistant",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen-safe bg-background text-foreground antialiased selection:bg-primary/20">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <main className="pb-16 max-w-md mx-auto min-h-screen-safe relative shadow-2xl shadow-black/5 sm:border-x">
            <Providers>
              {children}
            </Providers>
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
