"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, ArrowDownUp, ChevronDown } from "lucide-react";
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
  isDailyUnlimitedPlan,
  deduplicatePlans,
} from "@/lib/plan-utils";
import { getDiscount, fetchDiscounts } from "@/lib/admin-discounts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function CountryPlansPageSlug({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const router = useRouter();
  
  const isCode = /^[A-Z]{2}$/i.test(slug);
  const countryCode = isCode ? slug.toUpperCase() : (getCodeFromSlug(slug) || slug.toUpperCase());
  const countryName = getCountryName(slug);
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(true);
  const [isRegion, setIsRegion] = useState(false);
  // Default to lowest price first so users see the cheapest option by default
  const [sortBy, setSortBy] = useState<"days" | "price" | "dataSize" | "name">("price");
  const [activeTab, setActiveTab] = useState<"standard" | "unlimited">("standard");
  
  const { rates, convert, formatCurrency } = useCurrency();
  
  useEffect(() => {
    fetchDiscounts().catch(console.error);
  }, []);

  useEffect(() => {
    // Check if this is a region code (like EU-42) and redirect to /regions/
    const checkAndRedirect = async () => {
      try {
        const locationsData = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        const locationsArray = Array.isArray(locationsData) ? locationsData : (locationsData.locationList || []);
        const location = locationsArray.find((loc: any) => 
          loc.code.toUpperCase() === slug.toUpperCase()
        );
        
        // If it's a region (type 2), redirect to /regions/
        if (location && location.type === 2) {
          setIsRegion(true);
          router.replace(`/regions/${slug.toLowerCase()}`);
          return;
        }
      } catch (e) {
        console.error("Failed to check location type", e);
      }
      
      setIsRegion(false);
      // Otherwise, handle as country
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
    };
    
    checkAndRedirect();
  }, [slug, isCode, router, apiUrl]);
  
  useEffect(() => {
    // Don't fetch plans if redirecting or if it's a region
    if (redirecting || isRegion) {
      return;
    }
    
    const fetchPlans = async () => {
      try {
        // Backend still uses country code
        const data = await safeFetch<Plan[]>(`${apiUrl}/countries/${countryCode}/plans`, { showToast: false });
        
        // Filter to only show country-specific plans (exclude multi-country/regional plans)
        // Multi-country plans have comma-separated location codes, single-country plans match exactly
        const countrySpecificPlans = (data || []).filter((plan: Plan) => {
          // Only include plans where location exactly matches the country code (single country)
          // Exclude plans with commas (multi-country regions)
          return plan.location && !plan.location.includes(',') && plan.location.trim().toUpperCase() === countryCode.toUpperCase();
        });
        
        setPlans(countrySpecificPlans);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [countryCode, apiUrl, redirecting, isRegion]);

  const visiblePlans = filterVisiblePlans(plans);
  
  // Deduplicate plans: prefer IIJ versions when duplicates exist
  const deduplicatedPlans = deduplicatePlans(visiblePlans);
  
  // Separate plans into Standard and Unlimited
  const standardPlans = deduplicatedPlans.filter(plan => !isDailyUnlimitedPlan(plan));
  const unlimitedPlans = deduplicatedPlans.filter(plan => isDailyUnlimitedPlan(plan));
  
  const sortedPlans = useMemo(() => {
    const sorted = [...standardPlans];
    
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
  }, [standardPlans, sortBy]);
  
  const sortedUnlimitedPlans = useMemo(() => {
    const sorted = [...unlimitedPlans];
    
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
  }, [unlimitedPlans, sortBy]);

  const flagUrl = `https://flagcdn.com/w320/${countryCode.toLowerCase().split('-')[0]}.png`;

  const lowestPriceUSD = (sortedPlans.length > 0 || sortedUnlimitedPlans.length > 0)
    ? Math.min(
        ...sortedPlans.map(p => {
          const planGB = calculateGB(p.volume);
          const discountPercent = getDiscount(p.packageCode, planGB);
          return getFinalPriceUSD(p, discountPercent);
        }),
        ...sortedUnlimitedPlans.map(p => {
          const planGB = calculateGB(p.volume);
          const discountPercent = getDiscount(p.packageCode, planGB);
          return getFinalPriceUSD(p, discountPercent);
        })
      )
    : 0;
  
  const lowestPriceConverted = convert(lowestPriceUSD);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:pl-2 hover:bg-transparent text-gray-500 hover:text-black transition-all font-medium text-sm rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
          </Button>
        </Link>
      </div>

      {/* Country Header - Professional Rounded Style */}
      <div className="bg-white border border-gray-200 p-8 shadow-lg rounded-2xl relative overflow-hidden">
        {/* Decorative 'Tag' */}
        <div className="absolute top-0 right-0 bg-black text-white px-4 py-2 text-xs font-bold rounded-bl-xl">
            Destination Guide
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="h-24 w-36 md:h-32 md:w-48 border border-gray-200 p-1 bg-white shadow-sm shrink-0 rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <div className="h-full w-full rounded-lg overflow-hidden relative">
              <FlagIcon logoUrl={flagUrl} alt={countryCode} className="h-full w-full object-cover" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-black leading-none">
              {countryName}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
              <MapPin className="h-4 w-4 text-primary-dark" />
              <span>Popular Destination</span>
            </div>
            {lowestPriceUSD > 0 && (
              <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary-dark font-bold text-sm border border-primary/20 rounded-full">
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "standard" | "unlimited")} className="space-y-6">
            {/* Tab Headers */}
            <div className="flex items-center justify-between border-b border-gray-200">
              <TabsList className="bg-transparent p-0 h-auto gap-0">
                <TabsTrigger 
                  value="standard" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 font-semibold text-gray-600 data-[state=active]:text-black"
                >
                  Standard
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({sortedPlans.length})
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="unlimited" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 font-semibold text-gray-600 data-[state=active]:text-black"
                >
                  Unlimited
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({sortedUnlimitedPlans.length})
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Standard Tab Content */}
            <TabsContent value="standard" className="space-y-6 mt-6">
              {/* Sort Filter */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                  {/* Sort Control */}
                  <div className="flex items-center gap-2 min-w-fit">
                    <ArrowDownUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-bold text-gray-700 hidden sm:inline">Sort by:</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "days" | "price" | "dataSize" | "name")}
                        className="appearance-none bg-gray-50 text-black text-sm font-medium border border-gray-200 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <option value="price">Price: Low to High</option>
                        <option value="dataSize">Data: Low to High</option>
                        <option value="days">Duration: Short to Long</option>
                        <option value="name">Plan Name</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {sortedPlans.length} plan{sortedPlans.length !== 1 ? 's' : ''} available
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedPlans.map((plan) => (
                  <PlanCard key={plan.packageCode} plan={plan} />
                ))}
              </div>
            </TabsContent>

            {/* Unlimited Tab Content */}
            <TabsContent value="unlimited" className="mt-6">
              {sortedUnlimitedPlans.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                  <p className="text-gray-500 font-medium">No unlimited plans available at this time.</p>
                </div>
              ) : (
                <>
                  {/* Sort Filter */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm mb-6">
                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                      {/* Sort Control */}
                      <div className="flex items-center gap-2 min-w-fit">
                        <ArrowDownUp className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-bold text-gray-700 hidden sm:inline">Sort by:</span>
                        <div className="relative">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "days" | "price" | "dataSize" | "name")}
                            className="appearance-none bg-gray-50 text-black text-sm font-medium border border-gray-200 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <option value="price">Price: Low to High</option>
                            <option value="dataSize">Data: Low to High</option>
                            <option value="days">Duration: Short to Long</option>
                            <option value="name">Plan Name</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {sortedUnlimitedPlans.length} plan{sortedUnlimitedPlans.length !== 1 ? 's' : ''} available
                    </div>
                  </div>

                  {/* Plans Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedUnlimitedPlans.map((plan) => (
                      <PlanCard key={plan.packageCode} plan={plan} />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
