"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/PriceTag";
import { Wifi, ArrowLeft, Signal, Globe, ArrowRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PlanListWithFilters } from "@/components/PlanListWithFilters";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { safeFetch } from "@/lib/safe-fetch";
import { EmptyState } from "@/components/ui/empty-state";
import { Package } from "lucide-react";
import { formatDataSize } from "@/lib/plan-utils";

interface TopUpOption {
  packageCode: string;
  name: string;
  price: number;
  currencyCode?: string;
  volume: number;
  duration: number;
  durationUnit: string;
  location: string;
}

export default function TopUpSelectionPage() {
  const { iccid } = useParams();
  const { user } = useUser();
  const { selectedCurrency, convert, formatCurrency } = useCurrency();
  const [options, setOptions] = useState<TopUpOption[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Fetch profile details for better title
      try {
        const profileData = await safeFetch<any>(`${apiUrl}/esim/${iccid}`, { showToast: false });
        setProfile(profileData);
      } catch (e) {
        console.error('Failed to fetch profile:', e);
      }

      // Fetch top-up options
      const data = await safeFetch<TopUpOption[]>(`${apiUrl}/esim/topup-options?iccid=${iccid}`, { showToast: false });
      setOptions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (iccid) fetchData();
  }, [iccid]);

  const handleCheckout = async (plan: TopUpOption) => {
    try {
      const priceUSD = plan.price || 0;
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      
      if (!userEmail) {
        console.error("User email not available");
        return;
      }
      
      const data = await safeFetch<{ url?: string }>(`${process.env.NEXT_PUBLIC_API_URL}/topup/checkout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({
          iccid,
          planCode: plan.packageCode,
          amount: priceUSD, // Send original USD price
          currency: selectedCurrency,
          displayCurrency: selectedCurrency,
        }),
        errorMessage: "Failed to start checkout. Please try again.",
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("TopUp Checkout error:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <Link href={`/my-esims/${iccid}`} className="inline-flex items-center text-gray-500 hover:text-black transition-colors mb-4 font-mono uppercase text-xs font-bold">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to eSIM Details
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter">
            Top-Up {profile?.planDetails?.name || 'eSIM'}
          </h1>
          {iccid && (
            <p className="text-sm text-gray-500 mt-1 font-mono font-bold">
              {iccid}
            </p>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} className="border-2 border-black rounded-none hover:bg-black hover:text-white transition-all">
           <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Header Card */}
      <div className="bg-white border-2 border-black rounded-none p-8 shadow-hard relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <Wifi className="h-64 w-64 text-black" />
          </div>
          
          <div className="relative z-10">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black mb-2">Select a Top-Up Plan</h2>
              <p className="text-gray-600 font-mono font-bold uppercase">Add more data to your existing eSIM. Instant activation.</p>
          </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-20 text-[var(--voyage-muted)]">Loading top-up options...</div>
      ) : options.length === 0 ? (
        <EmptyState
          title="No top-up plans available"
          description="No compatible top-up plans were found for this eSIM. Please contact support if you need assistance."
          icon={Package}
          action={{
            label: "Back to eSIM Details",
            onClick: () => window.location.href = `/my-esims/${iccid}`
          }}
        />
      ) : (
        <PlanListWithFilters
          plans={options}
          renderItem={(plan) => {
            const { value: sizeValue, unit: sizeUnit } = formatDataSize(plan.volume);
            const priceUSD = plan.price || 0;
            const convertedPrice = convert(priceUSD);
            
            return (
              <div key={plan.packageCode} className="group h-full flex flex-col bg-white border-2 border-black rounded-none p-6 shadow-hard hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer relative overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                   <div className="flex flex-col">
                      <div className="inline-block px-2 py-1 border border-black font-mono text-xs uppercase font-bold mb-2 bg-gray-100">
                         {plan.duration} {plan.durationUnit}s
                      </div>
                      <h3 className="text-3xl font-black text-black group-hover:text-primary transition-colors uppercase">
                         {sizeValue} {sizeUnit}
                      </h3>
                   </div>
                   <div className="h-10 w-10 border-2 border-black flex items-center justify-center bg-white group-hover:bg-primary transition-colors">
                      <Signal className="h-5 w-5 text-black" />
                   </div>
                </div>

                {/* Content */}
                <div className="flex-grow space-y-4">
                   <div className="text-sm font-bold uppercase line-clamp-2 min-h-[2.5rem] text-black">
                      {plan.name}
                   </div>
                   
                   <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-gray-600">
                      <Globe className="h-3 w-3 text-black" />
                      <span>{plan.location} Region</span>
                   </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold uppercase text-gray-500">Price</span>
                      <span className="text-2xl text-black font-black">
                        {formatCurrency(convertedPrice)}
                      </span>
                   </div>
                   <Button 
                      size="sm" 
                      onClick={() => handleCheckout(plan)}
                      className="bg-primary hover:bg-black hover:text-white text-black font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all rounded-none h-10 px-6"
                   >
                      Top Up <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
