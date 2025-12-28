"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Globe, Package, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { safeFetch } from "@/lib/safe-fetch";
import { getSlugFromCode } from "@/lib/country-slugs";

interface SearchResult {
  countries: Array<{
    code: string;
    name: string;
    locationLogo?: string;
  }>;
  plans: Array<{
    packageCode: string;
    name: string;
    location: string;
  }>;
}

export function SearchDropdown() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ countries: [], plans: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ countries: [], plans: [] });
      setIsOpen(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await safeFetch<SearchResult>(`${apiUrl}/search?q=${encodeURIComponent(query)}`, { showToast: false });
        setResults(data || { countries: [], plans: [] });
        setIsOpen(true);
      } catch (error) {
        console.error("Search failed:", error);
        setResults({ countries: [], plans: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, apiUrl]);

  const handleCountryClick = (code: string) => {
    const slug = getSlugFromCode(code) || code.toLowerCase();
    router.push(`/countries/${slug}`);
    setIsOpen(false);
    setQuery("");
  };

  const handlePlanClick = (packageCode: string) => {
    router.push(`/plans/${packageCode}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search countries or plans..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 && (results.countries.length > 0 || results.plans.length > 0)) {
              setIsOpen(true);
            }
          }}
          className="pl-10 pr-4 h-10 bg-white border-2 border-black rounded-none font-mono text-sm"
        />
      </div>

      {isOpen && (results.countries.length > 0 || results.plans.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black shadow-hard z-50 max-h-96 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {results.countries.length > 0 && (
                <div className="border-b-2 border-black">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-xs font-black uppercase text-gray-600">Countries</h3>
                  </div>
                  {results.countries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountryClick(country.code)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary hover:text-black transition-colors text-left"
                    >
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span className="font-bold text-sm">{country.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.plans.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-xs font-black uppercase text-gray-600">Plans</h3>
                  </div>
                  {results.plans.map((plan) => (
                    <button
                      key={plan.packageCode}
                      onClick={() => handlePlanClick(plan.packageCode)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary hover:text-black transition-colors text-left"
                    >
                      <Package className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{plan.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{plan.location}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

