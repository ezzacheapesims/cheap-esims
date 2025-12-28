"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, ArrowRight, Wallet, MessageSquare, ShoppingBag } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { safeFetch } from "@/lib/safe-fetch";

interface SpareChangeBalance {
  balanceCents: number;
  currency: string;
}

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { formatCurrency: formatCurrencyContext, convert } = useCurrency();
  const [spareChangeBalance, setSpareChangeBalance] = useState<SpareChangeBalance | null>(null);
  const [loadingSpareChange, setLoadingSpareChange] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchSpareChange = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<SpareChangeBalance>(`${apiUrl}/spare-change`, {
          headers: {
            "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        });
        setSpareChangeBalance(data);
      } catch (error) {
        console.error("Failed to fetch Spare Change balance:", error);
      } finally {
        setLoadingSpareChange(false);
      }
    };

    fetchSpareChange();
  }, [user, isLoaded]);

  const formatCurrency = (cents: number) => {
    const amountUSD = cents / 100;
    const convertedAmount = convert(amountUSD);
    return formatCurrencyContext(convertedAmount);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Account' }]} />
      
      <div>
        <h1 className="text-3xl font-black uppercase text-black mb-2">ACCOUNT</h1>
        <p className="text-sm font-mono font-bold text-gray-600 uppercase">Manage your account settings</p>
      </div>

      {/* Continue Shopping Link */}
      <Link href="/" className="block group">
        <div className="bg-black text-white p-4 shadow-hard hover:bg-primary hover:text-black hover:shadow-hard-lg transition-all border-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 group-hover:bg-black/10 p-2 rounded-none">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tighter text-lg">Continue Shopping</h3>
              <p className="text-xs font-mono opacity-80 group-hover:opacity-100 uppercase">Browse more destinations</p>
            </div>
          </div>
          <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
        </div>
      </Link>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Spare Change Balance Card */}
      <div className="bg-white border-2 border-black p-8 shadow-hard relative overflow-hidden group hover:shadow-hard-lg transition-all">
        <div className="absolute top-0 right-0 bg-black text-white px-4 py-1 font-mono text-xs uppercase font-bold">
            Wallet
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 border-2 border-black bg-secondary">
                        <Wallet className="h-6 w-6 text-black" />
                    </div>
                    <h2 className="text-2xl font-black uppercase">Spare Change Balance</h2>
                </div>
                <div>
                    {loadingSpareChange ? (
                        <div className="h-12 w-48 bg-gray-100 animate-pulse border border-gray-200"></div>
                    ) : (
                        <p className="text-5xl font-black tracking-tighter text-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] text-stroke-1">
                            {spareChangeBalance ? formatCurrency(spareChangeBalance.balanceCents) : "$0.00"}
                        </p>
                    )}
                    <p className="text-sm font-mono text-gray-500 mt-2 max-w-md">
                        Store credit for future purchases. Non-expiring.
                    </p>
                </div>
            </div>
            <Link href="/account/spare-change" className="inline-block">
                <Button variant="outline" className="border-[var(--voyage-border)] w-full sm:w-auto">
                    View V-Cash Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Affiliate Program Card */}
        <div className="bg-white border-2 border-black p-8 shadow-hard hover:shadow-hard-lg transition-all flex flex-col justify-between">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 border-2 border-black bg-primary">
                        <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase text-black">AFFILIATE PROGRAM</h2>
                </div>
                <p className="font-mono text-sm text-gray-600">
                    Earn <span className="font-black text-black bg-primary px-1">10% COMMISSION</span> on all referrals. Share your link and start earning real cash today.
                </p>
            </div>
            <div className="mt-8">
                <Link href="/account/affiliate" className="inline-block w-full">
                    <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black rounded-none font-bold uppercase w-full">
                        AFFILIATE DASHBOARD
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>
            </div>
        </div>

        {/* Support Tickets Card */}
        <div className="bg-white border-2 border-black p-8 shadow-hard hover:shadow-hard-lg transition-all flex flex-col justify-between">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 border-2 border-black bg-white">
                        <MessageSquare className="h-6 w-6 text-black" />
                    </div>
                    <h2 className="text-2xl font-black uppercase text-black">SUPPORT TICKETS</h2>
                </div>
                <p className="font-mono text-sm text-gray-600">
                    Need help? Track your existing requests or submit a new inquiry to our support team.
                </p>
            </div>
            <div className="mt-8 flex gap-3">
                <Link href="/account/support" className="flex-1">
                    <Button variant="outline" className="border-2 border-black bg-white text-black hover:bg-gray-100 rounded-none font-bold uppercase w-full">
                        MY TICKETS
                    </Button>
                </Link>
                <Link href="/support/contact" className="flex-1">
                    <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black rounded-none font-bold uppercase w-full">
                        NEW TICKET
                    </Button>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
