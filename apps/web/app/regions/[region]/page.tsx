"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, ArrowRight, Map, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryCard } from "@/components/CountryCard";
import { PlanCard } from "@/components/PlanCard";
import { safeFetch } from "@/lib/safe-fetch";
import { getCountriesForRegion, REGION_NAMES, Region } from "@/lib/regions";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { getDiscount, fetchDiscounts } from "@/lib/admin-discounts";
import { calculateGB, calculateFinalPrice, filterVisiblePlans, isDailyUnlimitedPlan, deduplicatePlans } from "@/lib/plan-utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
  type?: number;
}

interface Plan {
  packageCode: string;
  name: string;
  price: number;
  currencyCode?: string;
  volume: number;
  duration: number;
  durationUnit: string;
  speed: string;
  location: string;
  locationNetworkList?: { locationCode: string }[];
}

export default function RegionPage({ params }: { params: { region: string } }) {
  const regionSlug = params.region;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  // Check if it's a region name (like "europe") or a region code (like "EU-42")
  const isRegionName = regionSlug in REGION_NAMES;
  const regionName = isRegionName ? REGION_NAMES[regionSlug as Region] : regionSlug.toUpperCase();
  const regionCode = isRegionName ? null : regionSlug.toUpperCase(); // If not a region name, treat as region code
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionInfo, setRegionInfo] = useState<Country | null>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "unlimited">("standard");
  
  const { convert, formatCurrency } = useCurrency();

  useEffect(() => {
    fetchDiscounts().catch(console.error);
  }, []);

  useEffect(() => {
    // If it's a region code (like EU-42), fetch plans directly
    if (regionCode) {
      const fetchRegionPlans = async () => {
        try {
          // First, try to get region info from countries list
          const locationsData = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
          const locationsArray = Array.isArray(locationsData) ? locationsData : (locationsData.locationList || []);
          const region = locationsArray.find((loc: Country) => 
            loc.code.toUpperCase() === regionCode && loc.type === 2
          );
          
          if (region) {
            setRegionInfo(region);
          }
          
          // Fetch plans for this region code
          const plansData = await safeFetch<Plan[]>(`${apiUrl}/countries/${regionCode}/plans`, { showToast: false });
          const visiblePlans = filterVisiblePlans(plansData || []);
          // Deduplicate plans: prefer IIJ versions when duplicates exist
          const deduplicatedPlans = deduplicatePlans(visiblePlans);
          setPlans(deduplicatedPlans);
        } catch (error) {
          console.error("Failed to fetch region plans", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchRegionPlans();
      return;
    }

    // If it's a region name (like "europe"), show countries
    if (regionSlug === "global") {
      setLoading(false);
      return;
    }

    const fetchCountries = async () => {
      try {
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        const countriesArray = Array.isArray(data) ? data : (data.locationList || []);
        
        const regionCountryCodes = getCountriesForRegion(regionSlug as Region);
        const regionCountries = countriesArray.filter((country: Country) =>
          regionCountryCodes.includes(country.code.toUpperCase())
        );
        
        const sorted = regionCountries.sort((a: Country, b: Country) =>
          a.name.localeCompare(b.name)
        );
        
        setCountries(sorted);
      } catch (error) {
        console.error("Failed to fetch countries", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [regionSlug, regionCode, apiUrl]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:pl-2 hover:bg-transparent text-gray-500 hover:text-black transition-all font-medium text-sm rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      {/* Region Header */}
      <div className="bg-white border border-gray-200 p-8 shadow-lg rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-black text-white px-4 py-2 text-xs font-bold rounded-bl-xl">
            {regionCode ? "REGION" : "REGION GUIDE"}
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          {regionInfo?.locationLogo ? (
            <div className="h-24 w-24 bg-white border border-gray-200 flex items-center justify-center shadow-sm overflow-hidden rounded-xl">
              <img src={regionInfo.locationLogo} alt={regionName} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-24 w-24 bg-white border border-gray-200 flex items-center justify-center shadow-sm rounded-xl">
              <Globe className="h-12 w-12 text-black" />
            </div>
          )}
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
              {regionCode || regionName}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 font-medium uppercase text-sm justify-center md:justify-start">
              <MapPin className="h-4 w-4" />
              <span>POPULAR DESTINATION</span>
            </div>
          </div>
          
          {regionCode && (
            <Link href="/" className="ml-auto">
              <Button className="bg-black text-white hover:bg-gray-800 border border-black rounded-full font-bold uppercase px-6">
                DESTINATION GUIDE
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Region Code - Show Plans */}
      {regionCode ? (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 border-2 border-gray-200 animate-pulse bg-gray-50"></div>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white border-2 border-black p-12 shadow-hard text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-mono font-bold mb-6">
                No eSIM plans are currently available for {regionCode.toLowerCase()}.
              </p>
              <Link href="/">
                <Button className="bg-primary text-black hover:bg-black hover:text-white border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                  BROWSE ALL COUNTRIES
                </Button>
              </Link>
            </div>
          ) : (
            (() => {
              // Separate plans into Standard and Unlimited
              const standardPlans = plans.filter(plan => !isDailyUnlimitedPlan(plan));
              const unlimitedPlans = plans.filter(plan => isDailyUnlimitedPlan(plan));
              
              return (
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
                          ({standardPlans.length})
                        </span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="unlimited" 
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 font-semibold text-gray-600 data-[state=active]:text-black"
                      >
                        Unlimited
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({unlimitedPlans.length})
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Standard Tab Content */}
                  <TabsContent value="standard" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {standardPlans.map((plan) => (
                        <PlanCard key={plan.packageCode} plan={plan} />
                      ))}
                    </div>
                  </TabsContent>

                  {/* Unlimited Tab Content */}
                  <TabsContent value="unlimited" className="mt-6">
                    {unlimitedPlans.length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                        <p className="text-gray-500 font-medium">No unlimited plans available at this time.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {unlimitedPlans.map((plan) => (
                          <PlanCard key={plan.packageCode} plan={plan} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              );
            })()
          )}
        </div>
      ) : regionSlug === "global" ? (
        /* Global Region - Show Global Plan Cards */
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b-2 border-black pb-4">
             <Map className="h-6 w-6" />
             <h2 className="text-2xl font-black uppercase">Global eSIM Plans</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GL-120 Card */}
            <Link
              href="/countries/global-120-esim"
              className="group bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-lg transition-all flex items-center justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 bg-primary w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-16 bg-black text-white flex items-center justify-center font-bold text-xl rounded-lg">
                  GL
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Global (120+ areas)</h3>
                  <p className="text-xs text-gray-500 uppercase font-medium">Best for multi-continent trips</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* GL-139 Card */}
            <Link
              href="/countries/global-139-esim"
              className="group bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-lg transition-all flex items-center justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 bg-primary w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-16 bg-black text-white flex items-center justify-center font-bold text-xl rounded-lg">
                  GL+
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Global (130+ areas)</h3>
                  <p className="text-xs text-gray-500 uppercase font-medium">Maximum Coverage</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        /* Countries Grid for other regions */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold">
              Countries in {regionName} <span className="text-gray-400 ml-2 text-lg font-normal">({countries.length})</span>
            </h2>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 border border-gray-200 animate-pulse bg-gray-50 rounded-xl"></div>
              ))}
            </div>
          ) : countries.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl text-gray-400">
              No countries found for this region
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {countries.map((country) => (
                <CountryCard key={country.code} country={country} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
