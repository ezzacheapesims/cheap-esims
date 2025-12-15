import type { Metadata } from "next";
import { AffiliateTermsOfService } from "../sections/affiliate-terms";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Affiliate Terms of Service — Cheap eSIMs",
  description: "Rules, guidelines, and payout conditions for Cheap eSIMs affiliates. Learn about commission structure, referral rules, holding periods, and payout policies.",
  openGraph: {
    title: "Affiliate Terms of Service — Cheap eSIMs",
    description: "Rules, guidelines, and payout conditions for Cheap eSIMs affiliates.",
  },
};

export default function AffiliateTermsPage() {
  return (
    <div className="min-h-screen py-10 bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/support" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 font-mono font-bold uppercase text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </Link>
        <AffiliateTermsOfService />
      </div>
    </div>
  );
}
