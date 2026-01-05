"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { CountryCard } from "@/components/CountryCard";
import { ArrowRight, Zap, Globe, Map, Shield, Lock, Clock, CheckCircle2, Star, Smartphone, Wifi, Plane, HelpCircle, ChevronRight } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { getRegionForCountry, REGION_NAMES, Region } from "@/lib/regions";
import { Button } from "@/components/ui/button";
import { PlanCard, Plan } from "@/components/PlanCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { filterVisiblePlans, deduplicatePlans } from "@/lib/plan-utils";
import { HomeReviewsSection } from "@/components/HomeReviewsSection";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
  type?: number; // 1 = country, 2 = region
}

export default function Home() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Country[]>([]);
  const [filtered, setFiltered] = useState<Country[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [popularPlans, setPopularPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        
        const locationArray = Array.isArray(data) ? data : (data.locationList || []);
        
        const countriesList = locationArray.filter((item: Country) => item.type === 1);
        const regionsList = locationArray.filter((item: Country) => item.type === 2);
        
        const sortedCountries = countriesList.sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        const sortedRegions = regionsList.sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        
        setCountries(sortedCountries);
        setRegions(sortedRegions);
        setFiltered(sortedCountries);
        setFilteredRegions(sortedRegions);
      } catch (error) {
        console.error("Failed to fetch countries", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (search) return;
    
    const fetchPopularPlans = async () => {
      setLoadingPlans(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const popularCountries = ['US', 'GB', 'FR', 'JP', 'AU'];
        const allPlans: Plan[] = [];
        
        for (const countryCode of popularCountries) {
          try {
            const data = await safeFetch<Plan[]>(`${apiUrl}/countries/${countryCode}/plans`, { showToast: false });
            if (Array.isArray(data) && data.length > 0) {
              const visiblePlans = filterVisiblePlans(data);
              const deduplicatedPlans = deduplicatePlans(visiblePlans);
              allPlans.push(...deduplicatedPlans.slice(0, 2));
            }
          } catch (error) {
            console.error(`Failed to fetch plans for ${countryCode}:`, error);
          }
        }
        
        const sorted = allPlans
          .sort((a, b) => a.price - b.price)
          .slice(0, 6);
        
        setPopularPlans(sorted);
      } catch (error) {
        console.error("Failed to fetch popular plans", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    
    fetchPopularPlans();
  }, [search]);

  useEffect(() => {
    if (!search) {
      setFiltered(countries);
      setFilteredRegions(regions);
    } else {
      const lower = search.toLowerCase();
      setFiltered(countries.filter(c => c.name.toLowerCase().includes(lower)));
      setFilteredRegions(regions.filter(r => r.name.toLowerCase().includes(lower)));
    }
  }, [search, countries, regions]);

  const regionGroups: Region[] = ["asia", "europe", "north-america", "south-america", "africa", "oceania", "global"];

  return (
    <div className="flex flex-col min-h-screen bg-white">
       {/* Hero Section - Cleaner, Friendlier, Professional */}
       <div className="relative bg-secondary/30 border-b border-black/10 pt-16 pb-20 md:pt-24 md:pb-32 px-4 md:px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-dark px-4 py-1.5 rounded-full text-sm font-bold tracking-wide border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Instant Activation
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black leading-[1.1]">
                Travel Data. <br className="hidden md:block" />
                Cheapest In <br className="hidden md:block" />
                <span className="relative inline-block px-2">
                   <span className="absolute inset-0 bg-primary transform -rotate-2 translate-y-2 opacity-100 -z-10 rounded-sm"></span>
                   The World.
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                 Connect instantly in 190+ countries. No physical SIMs, no contracts, just affordable data for your travels.
              </p>
            </div>

            <div className="max-w-xl mx-auto transform hover:-translate-y-1 transition-transform duration-300">
               <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-lg">
                  <SearchBar value={search} onChange={setSearch} placeholder="Where are you traveling to?" className="rounded-xl" />
               </div>
               <div className="mt-4 flex items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> Instant Delivery</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> Keep Your Number</span>
               </div>
            </div>

          </div>

          {/* Decorative Background Elements */}
          <div className="absolute top-10 left-10 opacity-10 animate-bounce duration-[3000ms]">
            <Globe className="w-24 h-24" />
          </div>
          <div className="absolute bottom-10 right-10 opacity-10 animate-bounce duration-[4000ms]">
             <Wifi className="w-32 h-32" />
          </div>
       </div>

       <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-12 md:py-20 space-y-20">
          
          {/* Trust Badges - Modern & Clean */}
          {!search && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100 pb-8">
              <div className="flex items-start gap-4 group p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-yellow-50 rounded-full shrink-0 group-hover:bg-yellow-100 transition-colors">
                  <Shield className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">Secure Payment</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-snug">Your data is protected with bank-level encryption.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 group p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-green-50 rounded-full shrink-0 group-hover:bg-green-100 transition-colors">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">Instant Activation</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-snug">Receive your QR code immediately via email.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-purple-50 rounded-full shrink-0 group-hover:bg-purple-100 transition-colors">
                  <Headset className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">24/7 Support</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-snug">Real humans ready to help you, anytime.</p>
                </div>
              </div>
            </div>
          )}

          {/* Popular Plans Section */}
          {!search && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-primary-dark font-bold tracking-wide uppercase text-sm">Top Picks</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">Trending Destinations</h2>
                  <p className="text-gray-500 max-w-md">Our most popular eSIM packages for travelers this week.</p>
                </div>
                <Link href="/regions/global">
                  <Button variant="outline" className="group border-2 border-black rounded-lg hover:bg-black hover:text-white transition-all">
                    View All Plans <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              {loadingPlans ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : popularPlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularPlans.map((plan) => (
                     <PlanCard key={plan.packageCode} plan={plan} />
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Shop by Region */}
          {!search && (
            <div className="space-y-8">
               <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-black tracking-tight">Shop by Region</h2>
                  <p className="text-gray-500">Visiting multiple countries? Choose a regional plan.</p>
               </div>
               <div className="flex flex-wrap gap-3">
                  {regionGroups.map((region) => (
                    <Link 
                      key={region} 
                      href={`/regions/${region}`}
                      className="group flex items-center gap-2 bg-white border border-gray-200 px-5 py-3 rounded-full font-bold hover:bg-black hover:text-white hover:border-black transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                      {REGION_NAMES[region]}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                    </Link>
                  ))}
               </div>
            </div>
          )}

          {/* All Countries Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
               <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                 <Globe className="h-6 w-6 text-primary-dark" /> 
                 {search ? `Results for "${search}"` : "All Destinations"}
               </h2>
               <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                 {filtered.length} Countries
               </span>
            </div>

            {loading ? (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {[...Array(10)].map((_, i) => (
                   <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-lg border border-gray-100"></div>
                 ))}
               </div>
            ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                 {filtered.map((country) => (
                    <CountryCard key={country.code} country={country} />
                 ))}
                 
                 {filtered.length === 0 && !loading && (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                      <p className="text-gray-500 font-medium">No countries found matching "{search}"</p>
                      <Button variant="link" onClick={() => setSearch("")} className="mt-2 text-primary-dark">Clear Search</Button>
                    </div>
                 )}
               </div>
            )}
          </div>

          {/* FAQ Section - Clean & Modern */}
          {!search && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-10">
              <div className="lg:col-span-1 space-y-4">
                <div className="inline-block p-3 bg-primary/20 rounded-xl">
                  <HelpCircle className="h-8 w-8 text-primary-dark" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
                <p className="text-gray-500 leading-relaxed">
                  Everything you need to know about getting connected with eSIMs. 
                  Can't find the answer? <Link href="/support" className="text-black font-bold underline decoration-primary decoration-2 underline-offset-2">Contact our support.</Link>
                </p>
              </div>
              
              <div className="lg:col-span-2">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {[
                    { q: "What is an eSIM?", a: "An eSIM (embedded SIM) is a digital SIM card built directly into your phone. It allows you to activate a cellular plan instantly without inserting a physical card." },
                    { q: "Will I keep my number?", a: "Yes! Your primary number remains active for calls and texts. The eSIM simply handles your data connection while you travel, saving you from expensive roaming fees." },
                    { q: "When will I receive it?", a: "Instantly. As soon as your payment is processed, you'll receive a QR code via email. Scan it in your phone settings, and you're ready to go." },
                    { q: "Is my device compatible?", a: "Most smartphones from 2018 onwards are compatible. This includes iPhone XR/XS and newer, Samsung Galaxy S20 and newer, and Google Pixel 3 and newer." }
                  ].map((item, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border border-gray-200 rounded-xl px-2 data-[state=open]:border-black/20 data-[state=open]:bg-gray-50 transition-all overflow-hidden mb-2">
                      <AccordionTrigger className="px-4 py-4 text-left font-bold text-lg hover:text-primary-dark hover:no-underline rounded-xl">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-gray-600 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {!search && (
            <div className="pt-10 border-t border-gray-100">
              <HomeReviewsSection />
            </div>
          )}
       </div>
    </div>
  );
}

// Icon component needed for the new design
function Headset({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 11v3a8 8 0 0 0 16 0v-3" />
      <path d="M12 6a8 8 0 0 0-6 2.5" />
      <path d="M18 8.5A8 8 0 0 0 12 6" />
      <path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
      <path d="M3 11h2" />
      <path d="M19 11h2" />
    </svg>
  );
}
