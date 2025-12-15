"use client";

import { useState, useEffect } from "react";
import { Check, Wifi, Globe, AlertTriangle, X, ExternalLink, Wallet, CreditCard, ChevronRight, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "./FlagIcon";
import { useCurrency } from "./providers/CurrencyProvider";
import { getStoredReferralCode } from "@/lib/referral";
import { getDiscount, fetchDiscounts } from "@/lib/admin-discounts";
import { calculateGB, calculateFinalPrice, formatDataSize } from "@/lib/plan-utils";
import Link from "next/link";
import { safeFetch } from "@/lib/safe-fetch";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { getCountryName } from "@/lib/country-slugs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PlanDetails({ plan }: { plan: any }) {
  const { selectedCurrency, convert, formatCurrency } = useCurrency();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const { value: sizeValue, unit: sizeUnit } = formatDataSize(plan.volume);
  const [showDeviceWarning, setShowDeviceWarning] = useState(false);
  const [deviceCompatibility, setDeviceCompatibility] = useState<any>(null);
  const [proceedWithCheckout, setProceedWithCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'vcash'>('stripe');
  const [vcashBalance, setVcashBalance] = useState<number | null>(null);
  const [loadingVCash, setLoadingVCash] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const planGB = calculateGB(plan.volume || 0);
  const discountPercent = getDiscount(plan.packageCode, planGB);
  const basePriceUSD = plan.price || 0;
  const finalPriceUSD = calculateFinalPrice(basePriceUSD, discountPercent);
  const convertedPrice = convert(finalPriceUSD);
  const priceUSDCents = Math.round(finalPriceUSD * 100);

  useEffect(() => {
    fetchDiscounts().catch(console.error);
  }, []);

  useEffect(() => {
    const checkDeviceCompatibility = async () => {
      const savedDevice = localStorage.getItem('deviceModel');
      if (!savedDevice) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<any>(`${apiUrl}/device/check?model=${encodeURIComponent(savedDevice)}`, { showToast: false });
        if (!data.supported) {
          setDeviceCompatibility(data);
        }
      } catch (error) {
        console.error("Failed to check device compatibility:", error);
      }
    };
    checkDeviceCompatibility();
  }, []);

  useEffect(() => {
    if (!userLoaded || !user) {
      setVcashBalance(null);
      return;
    }
    const fetchVCashBalance = async () => {
      setLoadingVCash(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
          setLoadingVCash(false);
          return;
        }
        const data = await safeFetch<{ balanceCents: number }>(`${apiUrl}/vcash`, {
          headers: { 'x-user-email': userEmail },
          showToast: false,
        });
        setVcashBalance(data.balanceCents);
      } catch (error) {
        console.error("Failed to fetch V-Cash balance:", error);
        setVcashBalance(null);
      } finally {
        setLoadingVCash(false);
      }
    };
    fetchVCashBalance();
  }, [userLoaded, user]);

  async function buyNow() {
    if (paymentMethod === 'vcash' && (!userLoaded || !user)) {
      toast({ title: "Sign in required", description: "Please sign in to use V-Cash.", variant: "destructive" });
      return;
    }

    const savedDevice = localStorage.getItem('deviceModel');
    if (savedDevice && deviceCompatibility && !deviceCompatibility.supported && !proceedWithCheckout) {
      setShowDeviceWarning(true);
      return;
    }

    if (paymentMethod === 'vcash') {
      if (vcashBalance === null || vcashBalance < priceUSDCents) {
        toast({ title: "Insufficient V-Cash", description: `Balance too low.`, variant: "destructive" });
        return;
      }
    }

    setProcessing(true);
    try {
      const referralCode = getStoredReferralCode();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (paymentMethod === 'vcash' && user?.primaryEmailAddress?.emailAddress) {
        headers['x-user-email'] = user.primaryEmailAddress.emailAddress;
      }

      const requestBody: any = {
        planCode: plan.packageCode,
        currency: selectedCurrency,
        displayCurrency: selectedCurrency,
        amount: finalPriceUSD,
        planName: plan.name,
        referralCode: referralCode || undefined,
        paymentMethod: paymentMethod,
      };

      const data = await safeFetch<{ url?: string; success?: boolean; orderId?: string; message?: string }>(
        `${apiUrl}/orders`,
        { method: "POST", headers, body: JSON.stringify(requestBody), errorMessage: "Checkout failed." }
      );

      if (paymentMethod === 'vcash' && data.success) {
        toast({ title: "Success", description: "Order placed via V-Cash." });
        router.push('/my-esims');
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto items-start">
      {/* Left: Spec Sheet */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white border-2 border-black p-8 shadow-hard relative">
            <div className="absolute top-0 right-0 bg-black text-white px-4 py-2 font-mono font-bold uppercase text-sm">
                Spec Sheet
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2">
                {plan.name}
            </h1>
            <div className="flex flex-wrap gap-4 mb-8">
                <span className="bg-primary text-black px-3 py-1 font-bold border border-black text-sm uppercase">
                    Data Only
                </span>
                <span className="bg-secondary text-black px-3 py-1 font-bold border border-black text-sm uppercase">
                    eSIM
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="border-2 border-black p-4 text-center">
                    <div className="text-xs font-mono text-gray-500 uppercase mb-1">Total Data</div>
                    <div className="text-3xl font-black">{sizeValue} {sizeUnit}</div>
                </div>
                <div className="border-2 border-black p-4 text-center">
                    <div className="text-xs font-mono text-gray-500 uppercase mb-1">Duration</div>
                    <div className="text-3xl font-black">{plan.duration} Days</div>
                </div>
                <div className="border-2 border-black p-4 text-center">
                    <div className="text-xs font-mono text-gray-500 uppercase mb-1">Speed</div>
                    <div className="text-2xl font-bold">{plan.speed}</div>
                </div>
                <div className="border-2 border-black p-4 text-center">
                    <div className="text-xs font-mono text-gray-500 uppercase mb-1">Activation</div>
                    <div className="text-xl font-bold">Auto</div>
                </div>
            </div>

            <div className="border-t-2 border-black pt-8">
                <h3 className="font-black uppercase text-xl mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5" /> Coverage Region
                </h3>
                
                {plan.location && plan.location.includes(',') ? (
                    <div>
                        <p className="mb-4 font-mono text-sm">
                            This plan covers {plan.location.split(',').length} countries.
                        </p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-2 border-black rounded-none hover:bg-black hover:text-white font-bold uppercase">
                                    View Country List
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="border-2 border-black rounded-none">
                                <DialogHeader>
                                    <DialogTitle className="uppercase font-black">Coverage List</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-2 mt-4 max-h-[60vh] overflow-y-auto">
                                    {plan.location.split(',').map((code: string) => (
                                        <div key={code} className="flex items-center gap-2 border border-gray-200 p-2">
                                            <FlagIcon logoUrl={`https://flagcdn.com/w320/${code.trim().toLowerCase().split('-')[0]}.png`} alt={code} className="h-4 w-6 object-cover border border-black" />
                                            <span className="font-mono text-xs uppercase">{getCountryName(code.trim())}</span>
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 bg-secondary p-4 border border-black w-fit">
                        <FlagIcon logoUrl={`https://flagcdn.com/w320/${plan.location.toLowerCase().split('-')[0]}.png`} alt={plan.location} className="h-6 w-9 object-cover border border-black" />
                        <span className="font-bold text-lg uppercase">{getCountryName(plan.location)}</span>
                    </div>
                )}
            </div>
            
             <div className="mt-8 pt-4 border-t-2 border-black flex items-center justify-between">
                <Link href="/device-check" className="flex items-center gap-2 text-sm font-bold hover:underline">
                    <Smartphone className="h-4 w-4" /> Check Device Compatibility
                </Link>
            </div>
        </div>
      </div>

      {/* Right: Receipt / Checkout */}
      <div className="lg:col-span-1 sticky top-24">
         <div className="bg-white border-2 border-black p-6 shadow-hard-lg">
             <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
                 <h2 className="font-mono font-bold uppercase tracking-widest text-gray-500">Order Summary</h2>
             </div>
             
             <div className="space-y-4 mb-6 font-mono text-sm">
                 <div className="flex justify-between">
                     <span>Item:</span>
                     <span className="font-bold">{plan.name}</span>
                 </div>
                 <div className="flex justify-between">
                     <span>Data:</span>
                     <span>{sizeValue} {sizeUnit}</span>
                 </div>
                 <div className="flex justify-between">
                     <span>Validity:</span>
                     <span>{plan.duration} Days</span>
                 </div>
             </div>

             <div className="border-t-2 border-black pt-4 mb-6">
                 {discountPercent > 0 && (
                     <div className="flex justify-between text-gray-500 text-sm mb-1 line-through">
                         <span>Original Price:</span>
                         <span>{formatCurrency(convert(basePriceUSD))}</span>
                     </div>
                 )}
                 <div className="flex justify-between items-end">
                     <span className="font-black uppercase text-xl">Total:</span>
                     <div className="text-right">
                         <span className="block text-4xl font-black tracking-tighter text-primary bg-black px-2">
                             {formatCurrency(convertedPrice)}
                         </span>
                         {discountPercent > 0 && (
                             <span className="text-xs font-bold text-red-600 uppercase mt-1 block">
                                 {discountPercent}% Savings Applied
                             </span>
                         )}
                     </div>
                 </div>
             </div>

             {userLoaded && user && (
                 <div className="bg-secondary p-4 border border-black mb-6">
                     <div className="flex justify-between items-center mb-2">
                         <span className="font-bold text-sm">V-Cash Balance:</span>
                         <span className="font-mono">${vcashBalance !== null ? (vcashBalance / 100).toFixed(2) : '...'}</span>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                            onClick={() => setPaymentMethod('vcash')}
                            disabled={!vcashBalance || vcashBalance < priceUSDCents}
                            className={`p-2 border-2 text-center text-xs font-bold uppercase ${paymentMethod === 'vcash' ? 'border-primary bg-black text-primary' : 'border-gray-300 text-gray-400'}`}
                        >
                            Pay w/ V-Cash
                        </button>
                        <button
                            onClick={() => setPaymentMethod('stripe')}
                            className={`p-2 border-2 text-center text-xs font-bold uppercase ${paymentMethod === 'stripe' ? 'border-black bg-black text-white' : 'border-gray-300'}`}
                        >
                            Pay w/ Card
                        </button>
                     </div>
                 </div>
             )}

             <Button 
                onClick={buyNow}
                disabled={processing}
                className="w-full h-14 bg-primary hover:bg-primary-dark text-black text-xl font-black uppercase tracking-tight border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
             >
                {processing ? 'Processing...' : 'Complete Order'}
             </Button>

             <div className="mt-4 text-center">
                 <span className="text-[10px] text-gray-500 uppercase font-mono">
                     Secure Checkout • Instant Delivery
                 </span>
             </div>
         </div>
      </div>

      {/* Device Warning */}
      {showDeviceWarning && deviceCompatibility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-accent p-6 max-w-md w-full shadow-hard-lg">
            <div className="flex items-center gap-4 mb-4 text-accent">
                <AlertTriangle className="h-8 w-8 fill-black" />
                <h2 className="text-2xl font-black uppercase text-black">Warning</h2>
            </div>
            <p className="font-bold mb-4">
                Your <span className="underline decoration-4 decoration-accent">{deviceCompatibility.brand} {deviceCompatibility.model}</span> might not work with eSIMs.
            </p>
            <div className="flex gap-4 mt-8">
                <Button onClick={() => setShowDeviceWarning(false)} variant="outline" className="flex-1 border-2 border-black rounded-none font-bold">Cancel</Button>
                <Button 
                    onClick={() => { setShowDeviceWarning(false); setProceedWithCheckout(true); buyNow(); }} 
                    className="flex-1 bg-black text-white hover:bg-gray-800 rounded-none font-bold"
                >
                    I Understand
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
