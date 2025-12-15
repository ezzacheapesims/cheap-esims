"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { CountryCard } from "@/components/CountryCard";
import { CountrySkeleton } from "@/components/skeletons";
import { ArrowRight, Zap, Globe, Map } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { getRegionForCountry, REGION_NAMES, Region } from "@/lib/regions";
import { Button } from "@/components/ui/button";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

export default function Home() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [filtered, setFiltered] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        
        const countriesArray = Array.isArray(data) ? data : (data.locationList || []);
        const sorted = (countriesArray || []).sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        setCountries(sorted);
        setFiltered(sorted);
      } catch (error) {
        console.error("Failed to fetch countries", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const countriesByRegion = useMemo(() => {
    const grouped: Record<Region, Country[]> = {
      "asia": [],
      "europe": [],
      "north-america": [],
      "south-america": [],
      "africa": [],
      "oceania": [],
      "global": [],
    };

    countries.forEach((country) => {
      const region = getRegionForCountry(country.code);
      if (region) {
        grouped[region].push(country);
      }
    });

    return grouped;
  }, [countries]);

  useEffect(() => {
    if (!search) {
      setFiltered(countries);
    } else {
      const lower = search.toLowerCase();
      setFiltered(countries.filter(c => c.name.toLowerCase().includes(lower)));
    }
  }, [search, countries]);

  const regions: Region[] = ["asia", "europe", "north-america", "south-america", "africa", "oceania", "global"];

  return (
    <div className="flex flex-col min-h-screen">
       {/* Deal Finder / Hero Section */}
       <div className="bg-primary text-black border-b-4 border-black p-8 md:p-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
               <div className="inline-block bg-black text-white px-3 py-1 text-sm font-mono font-bold uppercase tracking-wider">
                  Price Watch: Live
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
                  Travel Data <br/>
                  <span className="text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] text-stroke-2">Cheapest in the World.</span>
                </h1>
                <p className="text-xl font-bold max-w-md">
                   Stop overpaying for roaming. Get instant eSIMs at wholesale prices.
                </p>
                <div className="bg-white border-2 border-black p-4 shadow-hard max-w-lg">
                   <SearchBar value={search} onChange={setSearch} placeholder="Where are you going?" />
                   <div className="mt-2 text-xs font-mono text-gray-500 uppercase flex justify-between">
                      <span>Instant Delivery</span>
                      <span>No Contracts</span>
                   </div>
                </div>
            </div>

            {/* Quick Region Links */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
                {regions.slice(0, 4).map(region => (
                   <Link key={region} href={`/regions/${region}`} className="bg-white border-2 border-black p-4 shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-between group">
                      <div>
                         <span className="block text-xs font-mono text-gray-500 uppercase">Region</span>
                         <span className="font-black text-xl uppercase">{REGION_NAMES[region]}</span>
                      </div>
                      <ArrowRight className="h-6 w-6 group-hover:text-primary transition-colors" />
                   </Link>
                ))}
            </div>
          </div>
       </div>

       <div className="flex-1 bg-white max-w-7xl mx-auto w-full p-4 md:p-8 space-y-12">
          
          {/* Region Tabs (Mobile/Desktop) */}
          {!search && (
            <div className="space-y-4">
               <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                     <Map className="h-6 w-6" /> Shop by Region
                  </h2>
               </div>
               <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {regions.map((region) => (
                    <Link 
                      key={region} 
                      href={`/regions/${region}`}
                      className="flex-shrink-0 bg-secondary border-2 border-black px-6 py-3 font-bold uppercase hover:bg-black hover:text-white transition-colors shadow-hard-sm hover:shadow-none whitespace-nowrap"
                    >
                      {REGION_NAMES[region]}
                    </Link>
                  ))}
               </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
               <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                 <Globe className="h-6 w-6" /> 
                 {search ? `Searching: "${search}"` : "All Destinations"}
               </h2>
               <span className="font-mono text-sm bg-black text-white px-2 py-1">
                 {filtered.length} AVAILABLE
               </span>
            </div>

            {loading ? (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {[...Array(10)].map((_, i) => (
                   <div key={i} className="h-24 bg-gray-100 animate-pulse border-2 border-gray-200"></div>
                 ))}
               </div>
            ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                 {filtered.map((country) => (
                    <CountryCard key={country.code} country={country} />
                 ))}
               </div>
            )}
            
            {!loading && filtered.length === 0 && (
               <div className="text-center py-20 border-2 border-dashed border-gray-300">
                  <p className="font-bold text-gray-400 text-lg">No destinations found.</p>
                  <Button variant="link" onClick={() => setSearch("")} className="text-primary font-bold text-xl">
                    View All
                  </Button>
               </div>
            )}
          </div>
       </div>
    </div>
  );
}
