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
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-2">Help Center</h1>
          <p className="text-gray-500 font-mono font-bold uppercase text-sm">
            Find answers, installation guides, and get support
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="w-full flex flex-wrap justify-start gap-2 bg-transparent p-0 h-auto">
            {[
              { value: "install", icon: FileText, label: "Install Guides" },
              { value: "troubleshooting", icon: Wrench, label: "Troubleshooting" },
              { value: "device", icon: Smartphone, label: "Device Check" },
              { value: "refund", icon: DollarSign, label: "Refund Policy" },
              { value: "terms", icon: Scale, label: "Terms" },
              { value: "affiliate-terms", icon: Users, label: "Affiliate Terms" },
              { value: "contact", icon: Mail, label: "Contact" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-hard-sm rounded-none px-4 py-2 font-bold uppercase text-gray-500 hover:text-black transition-all bg-gray-100"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

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
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-2">Help Center</h1>
            <div className="h-6 w-48 bg-gray-200 animate-pulse"></div>
          </div>
        </div>
      </div>
    }>
      <SupportContent />
    </Suspense>
  );
}
