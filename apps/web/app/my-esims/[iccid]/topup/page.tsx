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
import { formatDataSize, isDailyUnlimitedPlan } from "@/lib/plan-utils";
import { getPlanFlagLabels } from "@/lib/plan-flags";
import { PlanFlags } from "@/components/PlanFlags";

interface TopUpOption {
  packageCode: string;
  name: string;
  price: number;
  currencyCode?: string;
  volume: number;
  duration: number;
  durationUnit: string;
  location: string;
  speed?: string; // Optional for top-up options
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
      <Link href={`/my-esims/${iccid}`} className="inline-flex items-center text-gray-500 hover:text-black transition-colors mb-4 text-sm font-medium">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to eSIM Details
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
            Top-Up {profile?.planDetails?.name || 'eSIM'}
          </h1>
          {iccid && (
            <p className="text-sm text-gray-500 mt-2 font-mono">
              {iccid}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={fetchData} 
          className="border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
        >
           <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <Wifi className="h-64 w-64 text-black" />
          </div>
          
          <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight text-black mb-2">Select a Top-Up Plan</h2>
              <p className="text-gray-600 text-base">Add more data to your existing eSIM. Instant activation.</p>
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
            // Cast to Plan type for isDailyUnlimitedPlan check (speed is optional for top-up)
            const isUnlimitedPlan = isDailyUnlimitedPlan(plan as any); // 2GB + FUP1Mbps plans
            const priceUSD = plan.price || 0;
            const convertedPrice = convert(priceUSD);
            
            // Extract flags and get cleaned name
            const flagInfo = getPlanFlagLabels(plan);
            let displayName = flagInfo.cleanedName || plan.name;
            
            // Replace "2GB" with "Unlimited" for unlimited plans (2GB + FUP1Mbps)
            if (isUnlimitedPlan) {
              displayName = displayName
                .replace(/\b2\s*gb\b/gi, 'Unlimited')
                .replace(/\b2gb\b/gi, 'Unlimited')
                .replace(/\s+/g, ' ')
                .trim();
            }
            
            return (
              <div key={plan.packageCode} className="group h-full flex flex-col bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer relative overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                   <div className="flex flex-col">
                      <div className="inline-block px-3 py-1 border border-gray-200 text-xs font-medium mb-2 bg-gray-50 rounded-full text-gray-600">
                         {plan.duration} {plan.durationUnit}s
                      </div>
                      <h3 className="text-3xl font-bold text-black group-hover:text-primary transition-colors">
                         {isUnlimitedPlan ? "Unlimited" : `${sizeValue} ${sizeUnit}`}
                      </h3>
                   </div>
                   <div className="h-10 w-10 border border-gray-200 flex items-center justify-center bg-gray-50 group-hover:bg-primary transition-colors rounded-xl">
                      <Signal className="h-5 w-5 text-gray-600 group-hover:text-black" />
                   </div>
                </div>

                {/* Content */}
                <div className="flex-grow space-y-4">
                   <div className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] text-black">
                      {displayName}
                   </div>
                   
                   {/* Plan Flags (IP type, FUP, etc.) - neutral variant for list page */}
                   <PlanFlags plan={plan} variant="neutral" />
                   
                   <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Globe className="h-3 w-3 text-gray-400" />
                      <span>{plan.location} Region</span>
                   </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-xs text-gray-500 font-medium">Price</span>
                      <span className="text-2xl text-black font-bold">
                        {formatCurrency(convertedPrice)}
                      </span>
                   </div>
                   <Button 
                      size="sm" 
                      onClick={() => handleCheckout(plan)}
                      className="bg-black hover:bg-gray-800 text-white font-bold border border-transparent shadow-md hover:shadow-lg transition-all rounded-xl h-10 px-6"
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
