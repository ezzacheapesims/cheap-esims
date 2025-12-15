"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  Settings,
  QrCode,
  Copy,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface InstallStepsDialogProps {
  activationCode?: string | null;
  smdpAddress?: string | null;
  trigger?: React.ReactNode;
}

export function InstallStepsDialog({
  activationCode,
  smdpAddress,
  trigger,
}: InstallStepsDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeDevice, setActiveDevice] = useState<"ios" | "android" | null>(null);

  const extractSmdpFromAc = (ac: string | null | undefined): string | null => {
    if (!ac) return null;
    if (ac.includes("$")) {
      const parts = ac.split("$");
      return parts.length >= 2 ? parts[1] : null;
    }
    return null;
  };

  const extractActivationCodeFromAc = (ac: string | null | undefined): string | null => {
    if (!ac) return null;
    if (ac.includes("$")) {
      const parts = ac.split("$");
      return parts.length >= 3 ? parts[2] : null;
    }
    return ac;
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: "Copied",
        description: "Copied to clipboard",
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const smdpFromAc = extractSmdpFromAc(activationCode || null);
  const activationCodeOnly = extractActivationCodeFromAc(activationCode || null);
  const displaySmdp = smdpAddress || smdpFromAc || "Not available";

  const defaultTrigger = (
    <Button className="bg-white border-2 border-black text-black font-black uppercase hover:bg-black hover:text-white transition-all rounded-none shadow-hard-sm hover:shadow-none flex items-center gap-2">
      <QrCode className="h-4 w-4" />
      How to Install
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogOverlay className="bg-black/60" />
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-2 border-black rounded-none shadow-hard p-0 [&>button]:text-black [&>button]:hover:bg-black [&>button]:hover:text-white [&>button]:border-2 [&>button]:border-black [&>button]:rounded-none">
        <DialogHeader className="p-6 border-b-2 border-black">
          <DialogTitle className="text-3xl font-black uppercase text-black">eSIM Installation Guide</DialogTitle>
          <DialogDescription className="text-gray-600 font-mono font-bold uppercase text-sm mt-2">
            Follow these step-by-step instructions to install your eSIM on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
          <div className="flex gap-4">
            <Button
              onClick={() => setActiveDevice("ios")}
              className={`flex-1 border-2 border-black font-black uppercase rounded-none shadow-hard-sm hover:shadow-none transition-all ${
                activeDevice === "ios" 
                  ? "bg-primary text-black" 
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              iPhone
            </Button>
            <Button
              onClick={() => setActiveDevice("android")}
              className={`flex-1 border-2 border-black font-black uppercase rounded-none shadow-hard-sm hover:shadow-none transition-all ${
                activeDevice === "android" 
                  ? "bg-primary text-black" 
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Android
            </Button>
          </div>

          {(!activeDevice || activeDevice === "ios") && (
            <Card className="bg-white border-2 border-black rounded-none shadow-hard-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-black uppercase text-black">iPhone Installation</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      1
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Open Settings</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Open the <strong className="text-black">Settings</strong> app on your iPhone.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      2
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Navigate to Cellular</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Tap <strong className="text-black">Cellular</strong> or <strong className="text-black">Mobile Data</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      3
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Add eSIM</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Tap <strong className="text-black">Add Cellular Plan</strong> or <strong className="text-black">Add eSIM</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      4
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Scan QR Code</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Point your camera at the QR code shown in your account. Your iPhone will automatically detect and scan it.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      5
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Manual Entry (Alternative)</h4>
                      <p className="text-gray-600 font-mono font-bold mb-2">
                        If QR scanning doesn't work, you can enter details manually:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600 font-mono font-bold ml-2">
                        <li>Tap <strong className="text-black">Enter Details Manually</strong></li>
                        <li>Enter the SM-DP+ address: <code className="text-xs bg-gray-100 border border-black px-2 py-1 font-mono font-bold">{displaySmdp}</code></li>
                        {activationCodeOnly && (
                          <li>Enter the activation code when prompted</li>
                        )}
                      </ol>
                      {displaySmdp !== "Not available" && (
                        <Button
                          size="sm"
                          onClick={() => handleCopy(displaySmdp, "smdp")}
                          className="mt-2 bg-white border-2 border-black text-black font-black uppercase rounded-none shadow-hard-sm hover:shadow-none hover:bg-black hover:text-white"
                        >
                          {copied === "smdp" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy SM-DP+ Address
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      6
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Complete Setup</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Follow the on-screen prompts to complete the installation. You may be asked to:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 font-mono font-bold ml-2">
                        <li>Label your eSIM (e.g., "Cheap eSIMs Data")</li>
                        <li>Choose which SIM to use for data</li>
                        <li>Enable or disable the eSIM line</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(!activeDevice || activeDevice === "android") && (
            <Card className="bg-white border-2 border-black rounded-none shadow-hard-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-black uppercase text-black">Android Installation (Samsung / Pixel)</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      1
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Open Settings</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Open the <strong className="text-black">Settings</strong> app on your Android device.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      2
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Navigate to Connections</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Tap <strong className="text-black">Connections</strong> (Samsung) or <strong className="text-black">Network & internet</strong> (Pixel).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      3
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">SIM Manager</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Tap <strong className="text-black">SIM Manager</strong> or <strong className="text-black">SIMs</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      4
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Add eSIM</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Tap <strong className="text-black">Add eSIM</strong> or <strong className="text-black">Add mobile plan</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      5
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Scan QR Code or Enter Code</h4>
                      <p className="text-gray-600 font-mono font-bold mb-2">
                        Choose one of these options:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-600 font-mono font-bold ml-2">
                        <li>
                          <strong className="text-black">Scan QR Code:</strong> Point your camera at the QR code
                        </li>
                        <li>
                          <strong className="text-black">Enter Activation Code:</strong> Manually enter the activation code
                        </li>
                      </ul>
                      {activationCodeOnly && (
                        <div className="mt-3">
                          <div className="p-3 bg-white border-2 border-black">
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-sm text-black font-mono break-all flex-1 font-bold">
                                {activationCodeOnly}
                              </code>
                              <Button
                                size="sm"
                                onClick={() => handleCopy(activationCodeOnly, "ac")}
                                className="bg-white border-2 border-black text-black font-black uppercase rounded-none shadow-hard-sm hover:shadow-none hover:bg-black hover:text-white"
                              >
                                {copied === "ac" ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 border-2 border-black bg-primary text-black flex items-center justify-center font-black text-lg">
                      6
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-black font-black uppercase">Complete Setup</h4>
                      <p className="text-gray-600 font-mono font-bold">
                        Follow the on-screen prompts to complete the installation. Your eSIM will be activated once the download is complete.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="p-4 bg-gray-100 border-2 border-black">
            <p className="text-sm text-black font-mono font-bold">
              <strong className="uppercase">Note:</strong> If you encounter any issues during installation, check our{" "}
              <a href="/support?tab=troubleshooting" className="underline hover:text-primary font-black">
                troubleshooting guide
              </a>{" "}
              or{" "}
              <a href="/support/contact" className="underline hover:text-primary font-black">
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


