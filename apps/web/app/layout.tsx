import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
            <html lang="en">
              <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased flex flex-col`}>
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
              </body>
            </html>
          </ErrorToastProvider>
        </CurrencyProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
