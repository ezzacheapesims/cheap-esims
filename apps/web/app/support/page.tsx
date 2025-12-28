"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, FileText, Wrench, Smartphone, DollarSign, Scale, Mail, Users, ArrowRight } from "lucide-react";
import { InstallGuides } from "./sections/install-guides";
import { Troubleshooting } from "./sections/troubleshooting";
import { RefundPolicy } from "./sections/refund-policy";
import { TermsOfService } from "./sections/terms";

function SupportContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(tabParam || "install");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="min-h-screen py-6 md:py-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase text-black mb-2">HELP CENTER</h1>
          <p className="text-sm md:text-base text-gray-600 font-mono uppercase">
            FIND ANSWERS, INSTALLATION GUIDES, AND GET SUPPORT
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <TabsList className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 bg-transparent p-0 h-auto">
              <TabsTrigger value="install" className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase whitespace-nowrap px-4 py-3 h-auto bg-gray-100 text-gray-600 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black rounded-none">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span>INSTALL GUIDES</span>
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase whitespace-nowrap px-4 py-3 h-auto bg-gray-100 text-gray-600 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black rounded-none">
                <Wrench className="h-4 w-4 flex-shrink-0" />
                <span>TROUBLESHOOTING</span>
              </TabsTrigger>
              <TabsTrigger value="device" className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase whitespace-nowrap px-4 py-3 h-auto bg-gray-100 text-gray-600 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black rounded-none">
                <Smartphone className="h-4 w-4 flex-shrink-0" />
                <span>DEVICE CHECK</span>
              </TabsTrigger>
              <TabsTrigger value="refund" className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase whitespace-nowrap px-4 py-3 h-auto bg-gray-100 text-gray-600 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black rounded-none">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span>REFUND POLICY</span>
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase whitespace-nowrap px-4 py-3 h-auto bg-gray-100 text-gray-600 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black rounded-none">
                <Scale className="h-4 w-4 flex-shrink-0" />
                <span>TERMS</span>
              </TabsTrigger>
              <TabsTrigger value="affiliate-terms" className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase whitespace-nowrap px-4 py-3 h-auto bg-gray-100 text-gray-600 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black rounded-none">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>AFFILIATE TERMS</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase whitespace-nowrap px-4 py-3 h-auto bg-gray-100 text-gray-600 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black rounded-none col-span-3 sm:col-span-4 lg:col-span-6">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>CONTACT</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-white border-2 border-black p-8 shadow-hard min-h-[400px]">
            <TabsContent value="install" className="mt-0">
              <InstallGuides />
            </TabsContent>

            <TabsContent value="troubleshooting" className="mt-0">
              <Troubleshooting />
            </TabsContent>

            <TabsContent value="device" className="mt-0 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-secondary border-2 border-black">
                    <Smartphone className="h-8 w-8 text-black" />
                  </div>
                  <h2 className="text-2xl font-black uppercase">Device Compatibility Checker</h2>
                </div>
                <p className="text-gray-600 font-mono">
                  Check if your device supports eSIM technology before purchasing a plan. Most modern phones from Apple, Samsung, and Google are compatible.
                </p>
                <Link href="/support/device-check">
                  <Button className="w-full md:w-auto bg-black text-white hover:bg-primary hover:text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                    Check Device Compatibility <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
            </TabsContent>

            <TabsContent value="refund" className="mt-0">
              <RefundPolicy />
            </TabsContent>

            <TabsContent value="terms" className="mt-0">
              <TermsOfService />
            </TabsContent>

            <TabsContent value="affiliate-terms" className="mt-0 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-secondary border-2 border-black">
                    <Users className="h-8 w-8 text-black" />
                  </div>
                  <h2 className="text-2xl font-black uppercase">Affiliate Terms of Service</h2>
                </div>
                <p className="text-gray-600 font-mono mb-6">
                  Rules, guidelines, and payout conditions for Voyage affiliates. Learn about commission structure, referral rules, holding periods, and payout policies.
                </p>
                <Link href="/support/affiliate-terms">
                  <Button className="w-full md:w-auto bg-black text-white hover:bg-primary hover:text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                    View Affiliate Terms <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
            </TabsContent>

            <TabsContent value="contact" className="mt-0 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-secondary border-2 border-black">
                    <Mail className="h-8 w-8 text-black" />
                  </div>
                  <h2 className="text-2xl font-black uppercase">Contact Support</h2>
                </div>
                <p className="text-gray-600 font-mono mb-6">
                  Need help with your eSIM or account? Send us a message and we'll get back to you as soon as possible.
                </p>
                <Link href="/support/contact">
                  <Button className="w-full md:w-auto bg-black text-white hover:bg-primary hover:text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                    Open Contact Form <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-6 md:py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-black uppercase text-black mb-2">HELP CENTER</h1>
            <p className="text-sm md:text-base text-gray-600 font-mono uppercase">
              FIND ANSWERS, INSTALLATION GUIDES, AND GET SUPPORT
            </p>
          </div>
        </div>
      </div>
    }>
      <SupportContent />
    </Suspense>
  );
}
