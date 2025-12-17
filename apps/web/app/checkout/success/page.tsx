'use client';

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Only fire Google Ads conversion event if we have a valid session_id
    // This ensures we only track actual successful checkouts
    if (sessionId && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-17809762142/17nICLP7stIbEN7OraxC',
        'value': 1.0,
        'currency': 'USD'
      });
    }
  }, [sessionId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-black flex items-center justify-center shadow-hard-sm">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-4xl font-black uppercase text-black">Payment Successful!</h1>
      <p className="text-gray-600 font-mono font-bold uppercase text-sm max-w-md">
        Your eSIM order has been confirmed. You will receive an email with installation instructions shortly.
      </p>
      <Link href="/my-esims">
        <Button className="bg-primary hover:bg-black hover:text-white text-black font-black uppercase border-2 border-black shadow-hard hover:shadow-none transition-all px-8 py-6 text-lg rounded-none">
          View My eSIMs
        </Button>
      </Link>
    </div>
  );
}
