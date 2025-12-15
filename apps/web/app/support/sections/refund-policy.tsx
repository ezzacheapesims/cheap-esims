"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function RefundPolicy() {
  return (
    <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
      <CardContent className="p-0">
        <div className="p-8 border-b-2 border-black bg-secondary">
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Refund Policy</h2>
          <p className="text-gray-600 font-mono text-sm font-bold uppercase">
            We want you to be completely satisfied with your eSIM purchase. Please read our refund policy carefully.
          </p>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-3">
              <div className="bg-green-100 p-1 border-2 border-black">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              Refund Conditions
            </h3>
            <div className="bg-green-50 border-2 border-green-600 p-6 shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]">
              <p className="text-green-900 font-black uppercase text-sm mb-2">Refunds are allowed ONLY if ALL of the following conditions are met:</p>
              <ul className="list-disc list-inside space-y-2 text-green-800 font-mono text-sm ml-2">
                <li><strong className="text-black">eSIM NOT installed:</strong> The eSIM profile has not been installed or activated on any device</li>
                <li><strong className="text-black">No data used:</strong> Zero data consumption has occurred on the eSIM</li>
                <li><strong className="text-black">eSIM ready but not activated:</strong> The eSIM must be ready for installation but not yet installed on any device</li>
                <li><strong className="text-black">Refund requested within validity period:</strong> Request must be made before the eSIM's validity period expires</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-3">
              <div className="bg-red-100 p-1 border-2 border-black">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              Non-Refundable Situations
            </h3>
            <div className="bg-red-50 border-2 border-red-600 p-6 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
              <p className="text-red-900 font-black uppercase text-sm mb-2">Refunds will NOT be provided in the following situations:</p>
              <ul className="list-disc list-inside space-y-2 text-red-800 font-mono text-sm ml-2">
                <li><strong className="text-black">eSIM already activated:</strong> Once the eSIM is installed and activated on a device</li>
                <li><strong className="text-black">Data has been used:</strong> Any data consumption has occurred, even if minimal</li>
                <li><strong className="text-black">Wrong device:</strong> You purchased for a device that doesn't support eSIM</li>
                <li><strong className="text-black">Wrong country/region:</strong> You purchased an eSIM for a different country than needed</li>
                <li><strong className="text-black">Poor local coverage:</strong> Network coverage issues at your location (check coverage maps before purchase)</li>
                <li><strong className="text-black">Validity expired:</strong> The eSIM's validity period has expired</li>
                <li><strong className="text-black">Change of mind:</strong> Simply deciding you don't need the eSIM anymore after purchase</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-3">
              <div className="bg-yellow-100 p-1 border-2 border-black">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              Refund Process
            </h3>
            <div className="bg-white border-2 border-black p-6 relative">
              <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold px-2 py-1 font-mono uppercase">Step by Step</div>
              <ol className="list-decimal list-inside space-y-3 text-gray-600 font-mono text-sm ml-2">
                <li>
                  <strong className="text-black uppercase">Submit refund request:</strong> Contact our support team via the contact form with your order ID and reason
                </li>
                <li>
                  <strong className="text-black uppercase">Email verification:</strong> We'll verify your email address matches the order
                </li>
                <li>
                  <strong className="text-black uppercase">Review period:</strong> Our team will review your request within 24-48 hours
                </li>
                <li>
                  <strong className="text-black uppercase">Refund processing:</strong> If approved, refund will be processed within 3-5 business days
                </li>
                <li>
                  <strong className="text-black uppercase">Refund method:</strong> Refunds are issued to the original payment method used for purchase
                </li>
              </ol>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black text-black uppercase mb-4">Important Notes</h3>
            <div className="space-y-3 text-gray-600 font-mono text-sm p-4 border-l-4 border-gray-300 bg-gray-50">
              <p>
                • All refund requests are reviewed on a case-by-case basis. We reserve the right to deny refunds that don't meet our policy criteria.
              </p>
              <p>
                • Refunds may take 3-5 business days to appear in your account after approval, depending on your bank or payment provider.
              </p>
              <p>
                • If you're unsure about device compatibility or coverage, please use our device checker and coverage information before purchasing.
              </p>
              <p>
                • Once an eSIM is activated and data is used, we cannot process a refund as the service has been consumed.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t-2 border-black">
            <p className="text-gray-500 font-mono text-sm mb-4 font-bold uppercase">
              Need to request a refund or have questions about our policy?
            </p>
            <Link href="/support/contact">
              <Button className="bg-black text-white hover:bg-primary hover:text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
