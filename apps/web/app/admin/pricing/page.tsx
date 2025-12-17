"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchPricing,
  savePricing,
  exportPricing,
  importPricing,
  PricingMap,
  clearPricingCache,
  clearPricing,
} from "@/lib/admin-pricing";
import { safeFetch } from "@/lib/safe-fetch";
import { Plan } from "@/components/PlanCard";
import { Download, Upload, Trash2, Save, Search, ArrowLeft } from "lucide-react";
import { calculateGB, filterVisiblePlans, formatDataSize } from "@/lib/plan-utils";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

export default function AdminPricingPage() {
  const { user } = useUser();
  const [pricing, setPricingState] = useState<PricingMap>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countryPlans, setCountryPlans] = useState<(Plan & { countryCode?: string; countryName?: string })[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"code" | "name" | "dataSize" | "duration" | "price">("code");

  // Load pricing and countries on mount
  useEffect(() => {
    const loadData = async () => {
      // Fetch pricing from backend
      const pricingData = await fetchPricing();
      setPricingState(pricingData);

      // Fetch countries only (lightweight)
      const fetchCountries = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
          const countriesData = await safeFetch<Country[]>(`${apiUrl}/countries`, { showToast: false });
          const sortedCountries = (countriesData || []).sort((a, b) => a.name.localeCompare(b.name));
          setCountries(sortedCountries);
        } catch (error) {
          console.error("Failed to fetch countries:", error);
        } finally {
          setLoadingCountries(false);
        }
      };

      fetchCountries();
    };

    loadData();
  }, []);

  // Load plans when country is selected
  useEffect(() => {
    if (!selectedCountry) {
      setCountryPlans([]);
      return;
    }

    const fetchCountryPlans = async () => {
      setLoadingPlans(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const plans = await safeFetch<Plan[]>(
          `${apiUrl}/countries/${selectedCountry.code}/plans`,
          { showToast: false }
        );

        const plansWithCountry = (plans || []).map(plan => ({
          ...plan,
          countryCode: selectedCountry.code,
          countryName: selectedCountry.name,
        }));

        const filteredPlans = filterVisiblePlans(plansWithCountry);
        setCountryPlans(filteredPlans);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setCountryPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchCountryPlans();
  }, [selectedCountry]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const adminEmail = user?.primaryEmailAddress?.emailAddress || "";
      await savePricing(pricing, adminEmail);
      clearPricingCache();
      alert("Pricing saved successfully!");
    } catch (error) {
      console.error("Failed to save pricing:", error);
      alert("Failed to save pricing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePricingChange = (planCode: string, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      if (value === "") {
        const newPricing = { ...pricing };
        delete newPricing[planCode];
        setPricingState(newPricing);
      }
      return;
    }

    if (num < 0) {
      return;
    }

    setPricingState({
      ...pricing,
      [planCode]: num,
    });
  };

  const handleExport = () => {
    const json = exportPricing();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voyage-pricing-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setImportError(null);
    try {
      const adminEmail = user?.primaryEmailAddress?.emailAddress || "";
      const result = await importPricing(importText, adminEmail);
      if (result.success) {
        const loaded = await fetchPricing();
        setPricingState(loaded);
        setImportText("");
        clearPricingCache();
        alert("Pricing imported successfully!");
      } else {
        setImportError(result.error || "Import failed");
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed");
    }
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear all pricing overrides? This cannot be undone.")) {
      try {
        const adminEmail = user?.primaryEmailAddress?.emailAddress || "";
        await clearPricing(adminEmail);
        setPricingState({});
        clearPricingCache();
        alert("All pricing overrides cleared successfully!");
      } catch (error) {
        console.error("Failed to clear pricing:", error);
        alert("Failed to clear pricing. Please try again.");
      }
    }
  };

  // Filter and sort plans for selected country
  let filteredPlans = [...countryPlans];

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredPlans = filteredPlans.filter((plan) => {
      const planName = plan.name?.toLowerCase() || "";
      const codeLower = plan.packageCode.toLowerCase();
      return codeLower.includes(query) || planName.includes(query);
    });
  }

  filteredPlans.sort((a, b) => {
    switch (sortBy) {
      case "code":
        return a.packageCode.localeCompare(b.packageCode);
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "dataSize": {
        const gbA = calculateGB(a.volume);
        const gbB = calculateGB(b.volume);
        return gbB - gbA;
      }
      case "duration": {
        const daysA = a.durationUnit?.toLowerCase() === "day" ? a.duration : a.duration * 30;
        const daysB = b.durationUnit?.toLowerCase() === "day" ? b.duration : b.duration * 30;
        return daysB - daysA;
      }
      case "price":
        return (pricing[b.packageCode] || a.price || 0) - (pricing[a.packageCode] || b.price || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">
          Admin Pricing
        </h1>
        <p className="text-gray-600 font-mono font-bold uppercase text-sm">
          Set individual prices for plans. Pricing overrides global markup. Leave blank to use automatic pricing.
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex gap-4 items-center flex-wrap">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-black hover:text-white text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="border-2 border-black rounded-none font-bold uppercase hover:bg-secondary"
        >
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          className="border-2 border-black rounded-none font-bold uppercase hover:bg-red-100 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Overrides
        </Button>
      </div>

      {/* Import Section */}
      <div className="bg-white border-2 border-black rounded-none shadow-hard p-4 space-y-3">
        <Label htmlFor="import-pricing" className="text-black font-black uppercase text-sm">
          Import Pricing (JSON)
        </Label>
        <textarea
          id="import-pricing"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-32 bg-white border-2 border-black rounded-none p-3 text-black font-mono text-sm shadow-inner"
          placeholder='{"PLAN_CODE_1": 3.5, "PLAN_CODE_2": 9.99}'
        />
        {importError && (
          <p className="text-red-600 font-bold uppercase text-xs">{importError}</p>
        )}
        <Button
          variant="outline"
          onClick={handleImport}
          className="border-2 border-black rounded-none font-bold uppercase hover:bg-secondary"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </div>

      {/* Country Selection View */}
      {!selectedCountry && (
        <>
          {loadingCountries ? (
            <div className="text-center py-20 text-gray-500 font-mono uppercase font-bold">
              Loading countries...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country)}
                  className="bg-white border-2 border-black rounded-none p-4 hover:bg-primary hover:text-black transition-all text-left shadow-hard-sm hover:shadow-hard hover:-translate-y-1"
                >
                  <div className="font-black uppercase">{country.name}</div>
                  <div className="text-xs font-mono mt-1 opacity-70">{country.code}</div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Plans View for Selected Country */}
      {selectedCountry && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCountry(null);
                setSearchQuery("");
              }}
              className="text-gray-500 hover:text-black font-mono uppercase font-bold text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Countries
            </Button>
            <div>
              <h2 className="text-xl font-black text-black uppercase">
                {selectedCountry.name}
              </h2>
              <p className="text-sm text-gray-600 font-mono">
                Plans: 100MB+ (displays as MB if &lt; 1GB, GB if &gt;= 1GB)
              </p>
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black" />
                <Input
                  type="text"
                  placeholder="Search by plan code or plan name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-2 border-black rounded-none text-black font-mono shadow-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="sort-select"
                className="text-gray-600 font-bold uppercase text-xs whitespace-nowrap"
              >
                Sort by:
              </Label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2 bg-white border-2 border-black rounded-none text-black font-mono text-sm focus:outline-none focus:border-primary shadow-sm appearance-none pr-8 cursor-pointer"
                >
                  <option value="code">Plan Code</option>
                  <option value="name">Plan Name</option>
                  <option value="dataSize">Data Size (GB)</option>
                  <option value="duration">Duration</option>
                  <option value="price">Price</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black">
                  <svg
                    className="h-4 w-4 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Table */}
          {loadingPlans ? (
            <div className="text-center py-20 text-gray-500 font-mono uppercase font-bold">
              Loading plans...
            </div>
          ) : (
            <div className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary border-b-2 border-black">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase text-black tracking-wider">
                        Plan Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase text-black tracking-wider">
                        Plan Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase text-black tracking-wider">
                        Current Price (Auto)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase text-black tracking-wider">
                        Price Override (USD)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPlans.map((plan) => {
                      const { value: sizeValue, unit: sizeUnit } = formatDataSize(plan.volume);
                      const planName =
                        plan.name || `${sizeValue} ${sizeUnit}, ${plan.duration} ${plan.durationUnit}s`;

                      return (
                        <tr
                          key={plan.packageCode}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-mono text-sm font-bold text-black">
                              {plan.packageCode}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="text-black font-bold uppercase text-sm">
                                {planName}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {sizeValue} {sizeUnit} • {plan.duration} {plan.durationUnit}s
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-mono text-gray-800">
                              ${plan.price?.toFixed(2)} USD
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  pricing[plan.packageCode] !== undefined
                                    ? pricing[plan.packageCode]
                                    : ""
                                }
                                onChange={(e) =>
                                  handlePricingChange(plan.packageCode, e.target.value)
                                }
                                className="w-32 bg-white border-2 border-black rounded-none text-black font-mono shadow-sm h-8"
                                placeholder={plan.price?.toFixed(2) || "Auto"}
                              />
                              <span className="text-gray-500 font-black text-xs">USD</span>
                            </div>
                            {pricing[plan.packageCode] !== undefined && (
                              <div className="mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newPricing = { ...pricing };
                                    delete newPricing[plan.packageCode];
                                    setPricingState(newPricing);
                                  }}
                                  className="text-xs font-bold uppercase hover:bg-secondary rounded-none h-7 text-red-600 hover:text-red-700"
                                >
                                  Remove Override
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredPlans.length === 0 && !loadingPlans && (
            <div className="text-center py-20 text-gray-500 font-mono uppercase font-bold border-2 border-dashed border-gray-300">
              {searchQuery ? (
                <>No plans found matching "{searchQuery}"</>
              ) : (
                <>No plans available for {selectedCountry.name}. Plans must be &gt;= 100MB.</>
              )}
            </div>
          )}

          {filteredPlans.length > 0 && !loadingPlans && (
            <div className="text-xs text-gray-500 font-mono text-center uppercase font-bold mt-4">
              Showing {filteredPlans.length} plan
              {filteredPlans.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}
        </>
      )}
    </div>
  );
}









