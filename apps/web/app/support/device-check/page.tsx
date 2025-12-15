"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Search, Globe, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { safeFetch } from "@/lib/safe-fetch";

interface Country {
  code: string;
  name: string;
}

interface DeviceCompatibility {
  model: string;
  brand: string;
  supported: boolean;
  notes: string[];
  regionalNotes: Record<string, string>;
}

export default function SupportDeviceCheckPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const [deviceQuery, setDeviceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeviceCompatibility | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        // Handle both array and { locationList: [...] } formats
        const countriesArray = Array.isArray(data) ? data : (data.locationList || []);
        setCountries(countriesArray.map((c: any) => ({ code: c.code, name: c.name || c.code })));
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    };
    fetchCountries();
  }, [apiUrl]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (deviceQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const data = await safeFetch<{ models: string[] }>(`${apiUrl}/device/models?q=${encodeURIComponent(deviceQuery)}`, { showToast: false });
        setSuggestions(data.models || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [deviceQuery, apiUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckCompatibility = async () => {
    if (!selectedDevice) {
      alert("Please select a device model");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ model: selectedDevice });
      if (selectedCountry) {
        params.append("country", selectedCountry);
      }

      const data = await safeFetch<DeviceCompatibility>(`${apiUrl}/device/check?${params.toString()}`, {
        errorMessage: "Failed to check device compatibility. Please try again.",
      });
      setResult(data);
      if (selectedDevice) {
        localStorage.setItem('deviceModel', selectedDevice);
      }
    } catch (error) {
      console.error("Failed to check compatibility:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (model: string) => {
    setSelectedDevice(model);
    setDeviceQuery(model);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen py-10 bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/support" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 font-mono font-bold uppercase text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </Link>

        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black mb-4 leading-none">
            Device Check
          </h1>
          <p className="text-gray-500 font-mono font-bold uppercase">
            Check if your device supports eSIM before purchasing
          </p>
        </div>

        <Card className="bg-white border-2 border-black rounded-none shadow-hard mb-8">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase text-2xl">Search Your Device</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="relative" ref={suggestionsRef}>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="e.g., iPhone 15, Samsung Galaxy S24..."
                  value={deviceQuery}
                  onChange={(e) => {
                    setDeviceQuery(e.target.value);
                    setSelectedDevice("");
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="pl-10 h-12 bg-white border-2 border-black rounded-none shadow-sm focus-visible:ring-0 focus-visible:border-primary text-black placeholder:text-gray-400 font-mono"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-none shadow-hard max-h-60 overflow-y-auto">
                  {suggestions.map((model) => (
                    <button
                      key={model}
                      onClick={() => handleSuggestionClick(model)}
                      className="w-full text-left px-4 py-3 hover:bg-secondary text-black font-mono text-sm border-b border-gray-100 last:border-0 transition-colors uppercase"
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative group">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-12 pl-10 pr-3 rounded-none border-2 border-black bg-white text-black font-mono focus:outline-none focus:border-primary shadow-sm appearance-none cursor-pointer"
              >
                <option value="">Select country (optional)</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleCheckCompatibility}
              disabled={!selectedDevice || loading}
              className="w-full h-12 bg-primary hover:bg-black hover:text-white text-black border-2 border-black rounded-none font-black uppercase tracking-wider text-lg shadow-hard-sm hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Checking..." : "Check Compatibility"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-secondary border-b-2 border-black p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-black font-black uppercase text-xl">Compatibility Result</CardTitle>
                <Badge
                  className={`rounded-none border-2 border-black px-3 py-1 font-black uppercase text-xs ${
                    result.supported
                      ? "bg-green-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {result.supported ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1 inline" />
                      SUPPORTED
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1 inline" />
                      NOT SUPPORTED
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Device Model</p>
                <p className="text-2xl font-black text-black uppercase tracking-tight">
                  {result.brand} {result.model}
                </p>
              </div>

              {result.notes && result.notes.length > 0 && (
                <div className="bg-yellow-50 border-2 border-black p-4 shadow-sm relative">
                  <div className="absolute -top-3 left-4 bg-yellow-400 text-black text-[10px] font-black uppercase px-2 py-0.5 border border-black">
                    Important Notes
                  </div>
                  <div className="space-y-2 mt-2">
                    {result.notes.map((note, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3"
                      >
                        <AlertTriangle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-mono text-black">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCountry && result.regionalNotes?.[selectedCountry.toUpperCase()] && (
                <div>
                  <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-2">Country-Specific Info</p>
                  <div className="p-4 bg-blue-50 border-2 border-black shadow-sm">
                    <p className="text-sm font-mono text-black font-bold">
                      {result.regionalNotes[selectedCountry.toUpperCase()]}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-black">
                {result.supported ? (
                  <>
                    <Link href="/countries" className="flex-1">
                      <Button className="w-full bg-black text-white hover:bg-primary hover:text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                        Browse Plans
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/support" className="flex-1">
                      <Button variant="outline" className="w-full border-2 border-black rounded-none font-bold uppercase hover:bg-secondary transition-all">
                        View Installation Guide
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/support/contact" className="flex-1">
                      <Button className="w-full bg-black text-white hover:bg-primary hover:text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                        Contact Support
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/support" className="flex-1">
                      <Button variant="outline" className="w-full border-2 border-black rounded-none font-bold uppercase hover:bg-secondary transition-all">
                        How to check eSIM support
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
