"use client";

import { useState } from "react";
import Image from "next/image";
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

  // Example activation code format: LPA:1$SMDP_ADDRESS$ACTIVATION_CODE
  const exampleFullAc = "LPA:1$rsp-eu.redteamobile.com$451F9802E6";
  // Extract SM-DP+ Address (everything up to the last $)
  const exampleSmdp = exampleFullAc.substring(0, exampleFullAc.lastIndexOf('$'));
  // Extract Activation Code (everything after the last $)
  const exampleAc = exampleFullAc.substring(exampleFullAc.lastIndexOf('$') + 1);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-gray-600 font-mono font-bold">
          Follow these step-by-step guides to install your eSIM on your device. Installation usually takes less than 5 minutes.
        </p>
        <Link href="/support/device-check" className="inline-block mt-4">
          <Button className="bg-primary text-black hover:bg-black hover:text-white border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all w-full sm:w-auto">
            <Smartphone className="h-4 w-4 mr-2" />
            Check if your device supports eSIM
          </Button>
        </Link>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* iPhone Installation */}
        <AccordionItem value="iphone" className="border-2 border-black shadow-hard bg-white">
          <AccordionTrigger className="text-black text-lg md:text-xl font-black uppercase px-6 py-4 hover:bg-secondary hover:no-underline [&[data-state=open]]:bg-secondary transition-colors">
            <div className="flex items-center gap-2 sm:gap-3">
              <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="text-left">iPhone Installation Guide</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-4">
            <Card className="bg-white border-2 border-black rounded-none shadow-hard-sm">
              <CardContent className="p-4 sm:p-6 space-y-6 md:space-y-8">
                
                {/* Before You Begin */}
                <div className="bg-blue-50 border-2 border-blue-500 rounded-none p-4">
                  <h4 className="text-blue-900 font-black uppercase mb-2">Before You Begin</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 font-mono font-bold space-y-1">
                    <li>Ensure your iPhone is unlocked and supports eSIM (iPhone XS and newer).</li>
                    <li>Make sure you have a stable Wi-Fi or cellular data connection.</li>
                    <li>Have your eSIM QR code or activation details ready.</li>
                  </ul>
                </div>

                {/* Method 1: QR Code */}
                <div>
                  <h3 className="text-lg font-black uppercase text-black mb-4">Method 1: Install using QR Code (Recommended)</h3>
                  <div className="space-y-6">
                    
                    {/* Step 1 */}
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black text-sm sm:text-base">1</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-black font-black uppercase mb-1">Access Cellular Settings</h4>
                        <p className="text-gray-600 font-mono font-bold mb-2">
                          Open <strong className="text-black">Settings</strong> &gt; <strong className="text-black">Cellular</strong> (or <strong className="text-black">Mobile Data</strong>) &gt; <strong className="text-black">Add eSIM</strong>.
                        </p>
                        <div className="mt-3 rounded-none overflow-hidden border-2 border-black max-w-sm">
                          <Image
                            src="/install-guides/iphone-step1-cellular-add-esim.webp"
                            alt="iPhone Settings - Cellular - Add eSIM"
                            width={400}
                            height={800}
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black text-sm sm:text-base">2</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-black font-black uppercase mb-1">Scan QR Code</h4>
                        <p className="text-gray-600 font-mono font-bold mb-2">
                          Select <strong className="text-black">Use QR Code</strong> and scan the code provided in your Cheap eSIMs account.
                        </p>
                        <div className="mt-3 space-y-3">
                          <div className="rounded-none overflow-hidden border-2 border-black max-w-sm">
                            <Image
                              src="/install-guides/iphone-step2-setup-cellular-qr.webp"
                              alt="iPhone Set Up Cellular - Use QR Code option"
                              width={400}
                              height={800}
                              className="w-full h-auto"
                            />
                          </div>
                          <div className="rounded-none overflow-hidden border-2 border-black max-w-sm">
                            <Image
                              src="/install-guides/iphone-step2-scan-qr-code.webp"
                              alt="iPhone Scan QR Code screen"
                              width={400}
                              height={800}
                              className="w-full h-auto"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black text-sm sm:text-base">3</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-black font-black uppercase mb-1">Label Your eSIM</h4>
                        <p className="text-gray-600 font-mono font-bold mb-2">
                          Give your new eSIM a name like "Travel" or "Cheap eSIMs" to identify it easily.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black text-sm sm:text-base">4</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-black font-black uppercase mb-1">Set Default Line Preferences</h4>
                        <ul className="list-disc list-inside space-y-1 ml-1 text-gray-600 font-mono font-bold mb-2">
                          <li><strong className="text-black">Default Line:</strong> Primary (for calls/SMS)</li>
                          <li><strong className="text-black">Cellular Data:</strong> Select your new eSIM</li>
                        </ul>
                        <div className="mt-3 rounded-none overflow-hidden border-2 border-black max-w-sm">
                          <Image
                            src="/install-guides/iphone-step4-cellular-data-selection.webp"
                            alt="iPhone Cellular Data - Select Travel eSIM"
                            width={400}
                            height={800}
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-black text-white flex items-center justify-center font-bold font-mono border-2 border-black text-sm sm:text-base">5</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-black font-black uppercase mb-1">Configure Network Settings</h4>
                        <p className="text-gray-600 font-mono font-bold mb-2">
                          Go to <strong className="text-black">Settings</strong> &gt; <strong className="text-black">Cellular</strong> &gt; Select your new eSIM:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 font-mono font-bold space-y-1 ml-1">
                          <li>Turn <strong className="text-black">Data Roaming</strong> ON.</li>
                          <li>Ensure <strong className="text-black">Network Selection</strong> is set to Automatic.</li>
                          <li>In <strong className="text-black">Voice & Data</strong>, select LTE or 5G.</li>
                        </ul>
                        <div className="mt-3 rounded-none overflow-hidden border-2 border-black max-w-sm">
                          <Image
                            src="/install-guides/iphone-step5-data-roaming-settings.webp"
                            alt="iPhone eSIM Settings - Data Roaming toggle"
                            width={400}
                            height={800}
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="w-full h-px bg-black"></div>

                {/* Method 2: Manual */}
                <div>
                  <h3 className="text-lg font-black uppercase text-black mb-4">Method 2: Manual Entry (Alternative)</h3>
                  <div className="space-y-6">
                    <p className="text-gray-600 font-mono font-bold">If you cannot scan the QR code, enter details manually.</p>
                    
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm sm:text-base">1</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-black font-black uppercase mb-1">Enter Details Manually</h4>
                        <p className="text-gray-600 font-mono font-bold mb-2">
                          Go to <strong className="text-black">Settings</strong> &gt; <strong className="text-black">Cellular</strong> &gt; <strong className="text-black">Add eSIM</strong> &gt; <strong className="text-black">Enter Details Manually</strong>.
                        </p>
                        <div className="mt-3 rounded-none overflow-hidden border-2 border-black max-w-sm w-full">
                          <Image
                            src="/install-guides/enter-details-manually-esim-iphone-3bb03a24.webp"
                            alt="iPhone Enter Details Manually eSIM screen"
                            width={400}
                            height={800}
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm sm:text-base">2</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-black font-black uppercase mb-1">Copy & Paste Info</h4>
                        <p className="text-gray-600 font-mono font-bold mb-3">
                          Copy the SM-DP+ Address and Activation Code from your Cheap eSIMs account:
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-gray-500 font-mono font-bold uppercase block mb-1">SM-DP+ Address</span>
                            <div className="bg-gray-50 border-2 border-black rounded-none p-3 flex items-center justify-between">
                              <code className="text-sm text-black font-mono truncate mr-2 font-bold">
                                {exampleSmdp}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(exampleSmdp, "smdp")}
                                className="h-8 w-8 p-0 hover:bg-black hover:text-white rounded-none border border-transparent hover:border-black"
                              >
                                {copied === "smdp" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <span className="text-xs text-gray-500 font-mono font-bold uppercase block mb-1">Activation Code</span>
                            <div className="bg-gray-50 border-2 border-black rounded-none p-3 flex items-center justify-between">
                              <code className="text-sm text-black font-mono truncate mr-2 font-bold">
                                {exampleAc}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(exampleAc, "ac")}
                                className="h-8 w-8 p-0 hover:bg-black hover:text-white rounded-none border border-transparent hover:border-black"
                              >
                                {copied === "ac" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm sm:text-base">3</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-black font-black uppercase mb-1">Finish Setup</h4>
                        <p className="text-gray-600 font-mono font-bold">
                          Follow the prompts to label your plan and configure network settings as shown in Method 1 (Steps 3-5).
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </CardContent>
            </Card>

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
          </AccordionContent>
        </AccordionItem>

        {/* Android Installation */}
        <AccordionItem value="android" className="border-2 border-black shadow-hard bg-white">
          <AccordionTrigger className="text-black text-lg md:text-xl font-black uppercase px-6 py-4 hover:bg-secondary hover:no-underline [&[data-state=open]]:bg-secondary transition-colors">
            <div className="flex items-center gap-2 sm:gap-3">
              <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="text-left">Android Installation Guide <span className="hidden sm:inline">(Samsung, Google Pixel, etc.)</span></span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-4">
            <Card className="bg-white border-2 border-black rounded-none shadow-hard-sm">
              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="space-y-4">
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
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
