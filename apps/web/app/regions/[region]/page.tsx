"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, ArrowRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryCard } from "@/components/CountryCard";
import { safeFetch } from "@/lib/safe-fetch";
import { getCountriesForRegion, REGION_NAMES, Region } from "@/lib/regions";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

export default function RegionPage({ params }: { params: { region: string } }) {
  const regionSlug = params.region as Region;
  const regionName = REGION_NAMES[regionSlug] || regionSlug;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip fetching for global region
    if (regionSlug === "global") {
      setLoading(false);
      return;
    }

    const fetchCountries = async () => {
      try {
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        const countriesArray = Array.isArray(data) ? data : (data.locationList || []);
        
        const regionCountryCodes = getCountriesForRegion(regionSlug);
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
  }, [regionSlug, apiUrl]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:pl-2 hover:bg-transparent text-gray-500 hover:text-black transition-all font-mono uppercase text-sm font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      {/* Region Header - Neo-Brutalist */}
      <div className="bg-white border-2 border-black p-8 shadow-hard relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-black text-white px-4 py-2 font-mono text-xs uppercase font-bold">
            Region Guide
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="h-24 w-24 bg-white border-2 border-black flex items-center justify-center shadow-hard-sm">
            <Globe className="h-12 w-12 text-black" />
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black">
              {regionName}
            </h1>
            <p className="text-gray-600 font-mono font-bold uppercase text-sm">
              {regionSlug === "global" 
                ? "World coverage • Multiple Networks • Best Value"
                : `eSIM Coverage for ${regionName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Global Region - Show Global Plan Cards */}
      {regionSlug === "global" ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b-2 border-black pb-4">
             <Map className="h-6 w-6" />
             <h2 className="text-2xl font-black uppercase">Global eSIM Plans</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GL-120 Card */}
            <Link
              href="/countries/global-120-esim"
              className="group bg-white border-2 border-black p-6 hover:shadow-hard transition-all flex items-center justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 bg-primary w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-16 bg-black text-white flex items-center justify-center font-black text-xl border border-black">
                  GL
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase mb-1">Global (120+ areas)</h3>
                  <p className="text-xs font-mono text-gray-500 uppercase">Best for multi-continent trips</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* GL-139 Card */}
            <Link
              href="/countries/global-139-esim"
              className="group bg-white border-2 border-black p-6 hover:shadow-hard transition-all flex items-center justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 bg-primary w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-16 bg-black text-white flex items-center justify-center font-black text-xl border border-black">
                  GL+
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase mb-1">Global (130+ areas)</h3>
                  <p className="text-xs font-mono text-gray-500 uppercase">Maximum Coverage</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        /* Countries Grid for other regions */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-4">
            <h2 className="text-2xl font-black uppercase">
              Countries in {regionName} <span className="text-gray-400 ml-2 text-lg font-mono">({countries.length})</span>
            </h2>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 border-2 border-gray-200 animate-pulse bg-gray-50"></div>
              ))}
            </div>
          ) : countries.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-300 font-mono text-gray-400">
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
