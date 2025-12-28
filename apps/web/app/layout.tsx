import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import {
  ClerkProvider,
  SignedIn,
} from "@clerk/nextjs";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { ReferralTracker } from "@/components/ReferralTracker";
import { SignupTracker } from "@/components/SignupTracker";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ErrorToastProvider } from "@/components/ui/error-toast-provider";
import { Toaster } from "@/components/ui/toaster";
import { KeyboardNavigationProvider } from "@/components/KeyboardNavigationProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LiveChat } from "@/components/LiveChat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cheap eSIMs | Discount Travel Data",
  description: "The cheapest eSIMs for global travel. Instant delivery. No contracts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ErrorBoundary>
      <ClerkProvider>
        <CurrencyProvider>
          <ErrorToastProvider>
            <KeyboardNavigationProvider>
              <html lang="en">
                <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased flex flex-col`}>
                  {/* Google tag (gtag.js) */}
                  <Script
                    src="https://www.googletagmanager.com/gtag/js?id=AW-17809762142"
                    strategy="afterInteractive"
                  />
                  <Script id="google-analytics" strategy="afterInteractive">
                    {`
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', 'AW-17809762142');
                    `}
                  </Script>
                  
                  <Navbar />
                  
                  <main className="flex-1 w-full">
                     <ReferralTracker />
                     <SignedIn>
                       <SignupTracker />
                     </SignedIn>
                     {children}
                  </main>

                  <Footer />
                  <Toaster />
                  <LiveChat />
                </body>
              </html>
            </KeyboardNavigationProvider>
          </ErrorToastProvider>
        </CurrencyProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
