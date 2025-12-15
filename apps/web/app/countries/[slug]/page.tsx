"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { PlanCard, Plan } from "@/components/PlanCard";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "@/components/FlagIcon";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { safeFetch } from "@/lib/safe-fetch";
import { EmptyState } from "@/components/ui/empty-state";
import { Package } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { getCodeFromSlug, getCountryName, getSlugFromCode } from "@/lib/country-slugs";
import {
  filterVisiblePlans,
  calculateGB,
  getFinalPriceUSD,
} from "@/lib/plan-utils";
import { getDiscount, fetchDiscounts } from "@/lib/admin-discounts";

export default function CountryPlansPageSlug({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const router = useRouter();
  
  const isCode = /^[A-Z]{2}$/i.test(slug);
  const countryCode = isCode ? slug.toUpperCase() : (getCodeFromSlug(slug) || slug.toUpperCase());
  const countryName = getCountryName(slug);
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(isCode);
  // Default to lowest price first so users see the cheapest option by default
  const [sortBy, setSortBy] = useState<"days" | "price" | "dataSize" | "name">("price");
  
  const { rates, convert, formatCurrency } = useCurrency();
  
  useEffect(() => {
    fetchDiscounts().catch(console.error);
  }, []);

  useEffect(() => {
    if (isCode) {
      const properSlug = getSlugFromCode(slug.toUpperCase()) || slug.toLowerCase();
      if (properSlug !== slug.toLowerCase()) {
        router.replace(`/countries/${properSlug}`);
      } else {
        setRedirecting(false);
      }
    } else {
      setRedirecting(false);
    }
  }, [slug, isCode, router]);
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await safeFetch<Plan[]>(`${apiUrl}/countries/${countryCode}/plans`, { showToast: false });
        setPlans(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [countryCode, apiUrl]);

  const visiblePlans = filterVisiblePlans(plans);
  
  const sortedPlans = useMemo(() => {
    const sorted = [...visiblePlans];
    
    switch (sortBy) {
      case "days":
        sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      case "price":
        sorted.sort((a, b) => {
          const aGB = calculateGB(a.volume);
          const bGB = calculateGB(b.volume);
          const aDiscount = getDiscount(a.packageCode, aGB);
          const bDiscount = getDiscount(b.packageCode, bGB);
          const aPrice = getFinalPriceUSD(a, aDiscount);
          const bPrice = getFinalPriceUSD(b, bDiscount);
          return aPrice - bPrice;
        });
        break;
      case "dataSize":
        sorted.sort((a, b) => calculateGB(a.volume) - calculateGB(b.volume));
        break;
      case "name":
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
    }
    return sorted;
  }, [visiblePlans, sortBy]);

  const flagUrl = `https://flagcdn.com/w320/${countryCode.toLowerCase().split('-')[0]}.png`;

  const lowestPriceUSD = sortedPlans.length > 0
    ? Math.min(...sortedPlans.map(p => {
        const planGB = calculateGB(p.volume);
        const discountPercent = getDiscount(p.packageCode, planGB);
        return getFinalPriceUSD(p, discountPercent);
      }))
    : 0;
  
  const lowestPriceConverted = convert(lowestPriceUSD);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:pl-2 hover:bg-transparent text-gray-500 hover:text-black transition-all font-mono uppercase text-sm font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
          </Button>
        </Link>
      </div>

      {/* Country Header - Neo-Brutalist Style */}
      <div className="bg-white border-2 border-black p-8 shadow-hard relative overflow-hidden">
        {/* Decorative 'Tag' */}
        <div className="absolute top-0 right-0 bg-black text-white px-4 py-2 font-mono text-xs uppercase font-bold">
            Destination Guide
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="h-24 w-36 md:h-32 md:w-48 border-2 border-black p-1 bg-white shadow-hard-sm shrink-0 transform -rotate-2 hover:rotate-0 transition-transform">
            <div className="h-full w-full border border-black overflow-hidden relative">
              <FlagIcon logoUrl={flagUrl} alt={countryCode} className="h-full w-full object-cover" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black leading-none">
              {countryName}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 font-mono text-sm uppercase font-bold">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Popular Destination</span>
            </div>
            {lowestPriceUSD > 0 && (
              <div className="inline-block px-4 py-1.5 bg-primary text-black font-black uppercase text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Plans starting from {formatCurrency(lowestPriceConverted)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans Display */}
      <div className="space-y-6">
        {redirecting ? (
          <div className="text-center py-20 font-mono text-gray-400">Redirecting...</div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 border-2 border-dashed border-gray-300 animate-pulse bg-gray-50"></div>
            ))}
          </div>
        ) : sortedPlans.length === 0 ? (
          <EmptyState
            title="No plans available"
            description={`No eSIM plans are currently available for ${countryName}.`}
            icon={Package}
            action={{
              label: "Browse All Countries",
              onClick: () => window.location.href = "/"
            }}
          />
        ) : (
          <>
            {/* Sort Filter - Neo Brutalist */}
            <div className="bg-white border-2 border-black p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-hard">
              <div className="font-mono text-sm font-bold uppercase text-gray-500">
                {sortedPlans.length} plan{sortedPlans.length !== 1 ? 's' : ''} available
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-black uppercase whitespace-nowrap">Sort by:</label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "days" | "price" | "dataSize" | "name")}
                    className="appearance-none bg-white border-2 border-black px-4 py-2 pr-10 text-sm font-bold uppercase focus:outline-none focus:shadow-hard-sm cursor-pointer min-w-[200px]"
                  >
                    <option value="price">Price (Low to High)</option>
                    <option value="dataSize">Data Size</option>
                    <option value="days">Duration</option>
                    <option value="name">Plan Name</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 4L6 8L10 4" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPlans.map((plan) => (
                <PlanCard key={plan.packageCode} plan={plan} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
