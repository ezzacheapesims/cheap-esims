"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TroubleshootingItem {
  id: string;
  title: string;
  content: React.ReactNode;
  keywords: string[];
}

export function Troubleshooting() {
  const [searchQuery, setSearchQuery] = useState("");

  const troubleshootingItems: TroubleshootingItem[] = [
    {
      id: "no-data",
      title: "No Data / No Internet Connection",
      keywords: ["no data", "no internet", "connection", "network", "roaming", "apn"],
      content: (
        <div className="space-y-4 font-mono text-sm">
          <div>
            <h4 className="font-bold mb-2 uppercase">1. Enable Roaming</h4>
            <p className="text-gray-600 mb-3">
              eSIM requires data roaming to be enabled even when you're in the destination country.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li><strong className="text-black">iPhone:</strong> Settings → Cellular → [Your eSIM] → Data Roaming (ON)</li>
              <li><strong className="text-black">Android:</strong> Settings → Network & Internet → [Your eSIM] → Data Roaming (ON)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">2. Restart Your Device</h4>
            <p className="text-gray-600">
              A simple restart often resolves connectivity issues. Turn off your device completely, wait 30 seconds, then turn it back on.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">3. Reinstall eSIM Profile</h4>
            <p className="text-gray-600 mb-3">
              If roaming is enabled but still no connection, try removing and reinstalling the eSIM:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li><strong className="text-black">iPhone:</strong> Settings → Cellular → [Your eSIM] → Remove Cellular Plan</li>
              <li><strong className="text-black">Android:</strong> Settings → SIM card manager → Remove eSIM</li>
              <li>Then reinstall using the QR code or activation code from your Voyage account</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">4. Configure APN Settings</h4>
            <p className="text-gray-600 mb-3">
              Some networks require manual APN configuration:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li>Go to your device's network settings for the eSIM</li>
              <li>Add a new APN with the name: <strong className="text-black">internet</strong></li>
              <li>Save and select this APN as the active one</li>
            </ul>
          </div>

          <div className="pt-4 border-t-2 border-black">
            <Link href="/support?tab=install">
              <Button variant="link" className="text-primary font-bold uppercase p-0 h-auto">
                View detailed installation guides →
              </Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "qr-scan",
      title: "QR Code Not Scanning",
      keywords: ["qr code", "scan", "scanning", "camera", "brightness", "download"],
      content: (
        <div className="space-y-4 font-mono text-sm">
          <div>
            <h4 className="font-bold mb-2 uppercase">1. Brighten Your Screen</h4>
            <p className="text-gray-600">
              Increase your device's screen brightness to maximum. A bright screen helps the camera read the QR code better.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">2. Use Fullscreen Mode</h4>
            <p className="text-gray-600">
              Open the QR code image in fullscreen on your computer or another device. Make sure the QR code fills most of the screen.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">3. Download and Print QR Code</h4>
            <p className="text-gray-600 mb-3">
              If scanning from a screen doesn't work:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li>Download the QR code image from your Voyage account</li>
              <li>Print it on a white piece of paper</li>
              <li>Ensure the printed QR code is clear and not smudged</li>
              <li>Scan from the printed copy</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">4. Use Manual Entry</h4>
            <p className="text-gray-600">
              If QR code scanning continues to fail, use the manual entry method with the SM-DP+ address and activation code provided in your eSIM details.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "invalid-code",
      title: "Invalid Activation Code",
      keywords: ["activation code", "invalid", "error", "code", "region"],
      content: (
        <div className="space-y-4 font-mono text-sm">
          <div>
            <h4 className="font-bold mb-2 uppercase">1. Verify Correct Region</h4>
            <p className="text-gray-600">
              Ensure you're using the eSIM for the correct region. Activation codes are region-specific and won't work if used in the wrong location.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">2. Wait 2 Minutes After Purchase</h4>
            <p className="text-gray-600">
              Your eSIM may take a few minutes to be fully activated on the provider's side. Wait 2-3 minutes after purchase before attempting installation.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">3. Copy Activation Code Correctly</h4>
            <p className="text-gray-600 mb-3">
              When copying the activation code manually:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li>Ensure no extra spaces are included</li>
              <li>Copy the entire code including all characters</li>
              <li>Paste it exactly as shown, without modifications</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">4. Try QR Code Method</h4>
            <p className="text-gray-600">
              If manual entry fails, try scanning the QR code instead, which automatically enters all required information.
            </p>
          </div>

          <div className="pt-4 border-t-2 border-black">
            <Link href="/support/contact">
              <Button variant="link" className="text-primary font-bold uppercase p-0 h-auto">
                Still having issues? Contact Support →
              </Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "data-fast",
      title: "Data Used Too Fast / High Consumption",
      keywords: ["data", "consumption", "usage", "fast", "background", "hotspot", "sync"],
      content: (
        <div className="space-y-4 font-mono text-sm">
          <div>
            <h4 className="font-bold mb-2 uppercase">1. Check Background App Sync</h4>
            <p className="text-gray-600 mb-3">
              Many apps sync data in the background, which can consume data quickly:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li>Disable background app refresh for non-essential apps</li>
              <li>Check social media apps (Instagram, Facebook, Twitter) - they often auto-play videos</li>
              <li>Review photo backup services (iCloud, Google Photos) - disable auto-upload on cellular</li>
              <li>Turn off automatic app updates over cellular</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">2. Avoid Using Hotspot</h4>
            <p className="text-gray-600">
              Using your eSIM as a mobile hotspot for other devices will consume data much faster. Only use hotspot when necessary and monitor usage closely.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">3. Monitor Data Usage</h4>
            <p className="text-gray-600 mb-3">
              Check your data usage regularly:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li><strong className="text-black">iPhone:</strong> Settings → Cellular → View data usage per app</li>
              <li><strong className="text-black">Android:</strong> Settings → Network & Internet → Data usage</li>
              <li>Review usage history in your Voyage account</li>
            </ul>
          </div>

          <div className="pt-4 border-t-2 border-black">
            <Link href="/my-esims">
              <Button variant="link" className="text-primary font-bold uppercase p-0 h-auto">
                View your usage history →
              </Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "not-supported",
      title: "Device Not Supported",
      keywords: ["device", "not supported", "incompatible", "compatibility", "model"],
      content: (
        <div className="space-y-4 font-mono text-sm">
          <div>
            <h4 className="font-bold mb-2 uppercase">1. Verify Device Compatibility</h4>
            <p className="text-gray-600 mb-3">
              Use our device compatibility checker to confirm if your device supports eSIM:
            </p>
            <Link href="/support/device-check">
              <Button className="bg-black hover:bg-white hover:text-black border-2 border-black text-white rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                Check Device Compatibility
              </Button>
            </Link>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">2. Common Incompatible Models</h4>
            <p className="text-gray-600 mb-3">
              Some device models don't support eSIM:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li>Older iPhone models (before iPhone XS/XR)</li>
              <li>Many budget Android phones</li>
              <li>China/Hong Kong versions of some devices</li>
              <li>Some carrier-locked devices may have eSIM disabled</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 uppercase">3. Check Carrier Lock Status</h4>
            <p className="text-gray-600">
              If your device is carrier-locked, eSIM functionality may be disabled. Contact your carrier to unlock your device or check if eSIM is available on your plan.
            </p>
          </div>

          <div className="pt-4 border-t-2 border-black">
            <Link href="/support/contact">
              <Button variant="link" className="text-primary font-bold uppercase p-0 h-auto">
                Need help? Contact Support →
              </Button>
            </Link>
          </div>
        </div>
      ),
    },
  ];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return troubleshootingItems;

    const query = searchQuery.toLowerCase();
    return troubleshootingItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.keywords.some((keyword) => keyword.toLowerCase().includes(query)) ||
        item.content?.toString().toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        <Input
          type="text"
          placeholder="Search troubleshooting topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-white border-2 border-black rounded-none shadow-hard-sm focus-visible:ring-0 focus-visible:border-primary text-black placeholder:text-gray-400 font-mono"
        />
      </div>

      {filteredItems.length === 0 ? (
        <Card className="bg-white border-2 border-black rounded-none shadow-hard">
          <CardContent className="p-8 text-center border-dashed">
            <p className="text-gray-500 font-mono font-bold uppercase">No troubleshooting topics found matching your search.</p>
            <Link href="/support/contact" className="inline-block mt-4">
              <Button variant="link" className="text-primary font-bold uppercase">
                Contact Support for help →
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {filteredItems.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border-2 border-black bg-white shadow-hard-sm hover:shadow-hard transition-all">
              <AccordionTrigger className="text-black font-black uppercase text-left hover:no-underline px-6 py-4 [&[data-state=open]]:bg-secondary [&[data-state=open]]:border-b-2 [&[data-state=open]]:border-black">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="bg-white px-6 py-6">
                 {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
