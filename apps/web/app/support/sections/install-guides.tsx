"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, CheckCircle2, Smartphone, AlertTriangle, ChevronDown, QrCode } from "lucide-react";
import Link from "next/link";

export function InstallGuides() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exampleSmdp = "LPA:1$rsp-eu.redteamobile.com$451F9802E6";
  const exampleAc = "LPA:1$rsp-eu.redteamobile.com$451F9802E6";

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-gray-600 font-mono">
          Follow these step-by-step guides to install your eSIM on your device. Installation usually takes less than 5 minutes.
        </p>
        <Link href="/support/device-check" className="inline-block mt-4">
          <Button className="bg-primary text-black hover:bg-black hover:text-white border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
            <Smartphone className="h-4 w-4 mr-2" />
            Check if your device supports eSIM
          </Button>
        </Link>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* iPhone Installation */}
        <AccordionItem value="iphone" className="border-2 border-black shadow-hard bg-white">
          <AccordionTrigger className="px-6 py-4 hover:bg-secondary hover:no-underline [&[data-state=open]]:bg-secondary transition-colors">
            <div className="flex items-center gap-3 text-black text-xl font-black uppercase">
              <Smartphone className="h-5 w-5" />
              iPhone Installation Guide
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-4">
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-black font-bold uppercase mb-2">Scan QR Code (Recommended)</h3>
                    <p className="text-gray-600 font-mono text-sm mb-3">
                      If you received a QR code, this is the easiest method:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600 font-mono text-sm ml-4">
                      <li>Open your <strong className="text-black bg-secondary px-1 border border-black">Settings</strong> app</li>
                      <li>Tap <strong className="text-black bg-secondary px-1 border border-black">Cellular</strong> or <strong className="text-black bg-secondary px-1 border border-black">Mobile Data</strong></li>
                      <li>Tap <strong className="text-black bg-secondary px-1 border border-black">Add Cellular Plan</strong> or <strong className="text-black bg-secondary px-1 border border-black">Add eSIM</strong></li>
                      <li>Point your camera at the QR code shown in your Cheap eSIMs account</li>
                      <li>Follow the on-screen prompts to complete installation</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-black font-bold uppercase mb-2">Manual Entry (Alternative)</h3>
                    <p className="text-gray-600 font-mono text-sm mb-3">
                      If QR code scanning doesn't work, you can enter the details manually:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600 font-mono text-sm ml-4">
                      <li>Go to <strong className="text-black bg-secondary px-1 border border-black">Settings</strong> → <strong className="text-black bg-secondary px-1 border border-black">Cellular</strong></li>
                      <li>Tap <strong className="text-black bg-secondary px-1 border border-black">Add Cellular Plan</strong></li>
                      <li>Tap <strong className="text-black bg-secondary px-1 border border-black">Enter Details Manually</strong></li>
                      <li>Enter the SM-DP+ address from your eSIM details</li>
                      <li>Enter the activation code (AC) when prompted</li>
                      <li>Complete the setup process</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-black font-bold uppercase mb-2">Using SM-DP+ Address</h3>
                    <p className="text-gray-600 font-mono text-sm mb-3">
                      You'll find your SM-DP+ address in your eSIM details. It looks like:
                    </p>
                    <div className="bg-gray-50 border-2 border-black p-4 flex items-center justify-between">
                      <code className="text-sm text-black font-mono break-all font-bold">
                        {exampleSmdp}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(exampleSmdp, "smdp")}
                        className="ml-2 hover:bg-black hover:text-white rounded-none border border-transparent hover:border-black"
                      >
                        {copied === "smdp" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-black p-4 mt-4 shadow-hard-sm">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-black font-black uppercase mb-1 text-sm">Important Notes</h4>
                    <ul className="text-sm text-gray-600 font-mono space-y-1">
                      <li>• Ensure you have a stable internet connection (Wi-Fi recommended)</li>
                      <li>• Keep your phone unlocked during installation</li>
                      <li>• Some iPhone models may require iOS 12.1 or later</li>
                      <li>• China/Hong Kong iPhone models may not support eSIM</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black border-dashed">
                <Link href="/support?tab=troubleshooting">
                  <Button variant="outline" className="border-2 border-black rounded-none font-bold uppercase hover:bg-black hover:text-white w-full sm:w-auto">
                    Having issues? Check Troubleshooting →
                  </Button>
                </Link>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Android Installation */}
        <AccordionItem value="android" className="border-2 border-black shadow-hard bg-white">
          <AccordionTrigger className="px-6 py-4 hover:bg-secondary hover:no-underline [&[data-state=open]]:bg-secondary transition-colors">
            <div className="flex items-center gap-3 text-black text-xl font-black uppercase">
              <Smartphone className="h-5 w-5" />
              Android Installation Guide
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-4">
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-black font-bold uppercase mb-2">Scan QR Code</h3>
                    <p className="text-gray-600 font-mono text-sm mb-3">
                      For most Android devices with eSIM support:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600 font-mono text-sm ml-4">
                      <li>Open <strong className="text-black bg-secondary px-1 border border-black">Settings</strong></li>
                      <li>Tap <strong className="text-black bg-secondary px-1 border border-black">Connections</strong> or <strong className="text-black bg-secondary px-1 border border-black">Network & Internet</strong></li>
                      <li>Tap <strong className="text-black bg-secondary px-1 border border-black">SIM card manager</strong> or <strong className="text-black bg-secondary px-1 border border-black">Mobile networks</strong></li>
                      <li>Tap <strong className="text-black bg-secondary px-1 border border-black">Add mobile plan</strong> or <strong className="text-black bg-secondary px-1 border border-black">Add eSIM</strong></li>
                      <li>Select <strong className="text-black bg-secondary px-1 border border-black">Scan QR code</strong> and scan the QR code</li>
                      <li>Follow the on-screen instructions</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-black font-bold uppercase mb-2">Samsung Devices</h3>
                    <p className="text-gray-600 font-mono text-sm mb-3">
                      For Samsung Galaxy devices:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600 font-mono text-sm ml-4">
                      <li>Open <strong className="text-black bg-secondary px-1 border border-black">Settings</strong> → <strong className="text-black bg-secondary px-1 border border-black">Connections</strong></li>
                      <li>Tap <strong className="text-black bg-secondary px-1 border border-black">SIM card manager</strong></li>
                      <li>Tap <strong className="text-black bg-secondary px-1 border border-black">Add mobile plan</strong></li>
                      <li>Select <strong className="text-black bg-secondary px-1 border border-black">Add using QR code</strong></li>
                      <li>Scan the QR code from your Cheap eSIMs account</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-black p-4 mt-4 shadow-hard-sm">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-black font-black uppercase mb-1 text-sm">Dual SIM Behavior</h4>
                    <ul className="text-sm text-gray-600 font-mono space-y-1">
                      <li>• You can use both physical SIM and eSIM simultaneously</li>
                      <li>• Choose which SIM to use for calls, messages, and data</li>
                      <li>• Some Android devices may require you to set a default data SIM</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black border-dashed">
                <Link href="/support?tab=troubleshooting">
                  <Button variant="outline" className="border-2 border-black rounded-none font-bold uppercase hover:bg-black hover:text-white w-full sm:w-auto">
                    Having issues? Check Troubleshooting →
                  </Button>
                </Link>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
