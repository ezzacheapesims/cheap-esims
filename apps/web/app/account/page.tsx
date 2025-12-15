"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, ArrowRight, Wallet, MessageSquare } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
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
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-12">
      <div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-2">My Account</h1>
        <p className="text-gray-500 font-mono uppercase text-sm font-bold">Manage your wallet, rewards & settings</p>
      </div>

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
            <Link href="/account/spare-change">
                <Button variant="outline" className="border-2 border-black rounded-none shadow-hard-sm hover:shadow-none hover:bg-black hover:text-white font-bold uppercase transition-all">
                    View History <ArrowRight className="ml-2 h-4 w-4" />
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
                        <DollarSign className="h-6 w-6 text-black" />
                    </div>
                    <h2 className="text-2xl font-black uppercase">Affiliate Program</h2>
                </div>
                <p className="font-mono text-sm text-gray-600">
                    Earn <span className="font-black text-black bg-primary px-1">10% COMMISSION</span> on all referrals. Share your link and start earning real cash today.
                </p>
            </div>
            <div className="mt-8">
                <Link href="/account/affiliate">
                    <Button className="w-full bg-black text-white hover:bg-primary hover:text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                        Affiliate Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>

        {/* Support Tickets Card */}
        <div className="bg-white border-2 border-black p-8 shadow-hard hover:shadow-hard-lg transition-all flex flex-col justify-between">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 border-2 border-black bg-secondary">
                        <MessageSquare className="h-6 w-6 text-black" />
                    </div>
                    <h2 className="text-2xl font-black uppercase">Support Tickets</h2>
                </div>
                <p className="font-mono text-sm text-gray-600">
                    Need help? Track your existing requests or submit a new inquiry to our support team.
                </p>
            </div>
            <div className="mt-8 flex gap-4">
                <Link href="/account/support" className="flex-1">
                    <Button variant="outline" className="w-full border-2 border-black rounded-none font-bold uppercase hover:bg-secondary">
                        My Tickets
                    </Button>
                </Link>
                <Link href="/support/contact" className="flex-1">
                    <Button className="w-full bg-black text-white hover:bg-white hover:text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none">
                        New Ticket
                    </Button>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
