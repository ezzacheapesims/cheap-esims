"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, Wifi, Globe, AlertTriangle, X, ExternalLink, Wallet, CreditCard, ChevronRight, Smartphone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "./FlagIcon";
import { useCurrency } from "./providers/CurrencyProvider";
import { getStoredReferralCode } from "@/lib/referral";
import { getDiscount, fetchDiscounts } from "@/lib/admin-discounts";
import { calculateGB, calculateFinalPrice, formatDataSize, isDailyUnlimitedPlan } from "@/lib/plan-utils";
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
import { getPlanFlagLabels } from "@/lib/plan-flags";
import { PlanFlags } from "./PlanFlags";

export function PlanDetails({ plan }: { plan: any }) {
  const { selectedCurrency, convert, formatCurrency } = useCurrency();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const { value: sizeValue, unit: sizeUnit } = formatDataSize(plan.volume);
  const isUnlimitedPlan = isDailyUnlimitedPlan(plan); // 2GB + FUP1Mbps plans
  const [selectedDays, setSelectedDays] = useState<number>(plan.duration || 1);
  const [showDeviceWarning, setShowDeviceWarning] = useState(false);
  const [deviceCompatibility, setDeviceCompatibility] = useState<any>(null);
  const [proceedWithCheckout, setProceedWithCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'spare-change'>('stripe');
  const [spareChangeBalance, setSpareChangeBalance] = useState<number | null>(null);
  const [loadingSpareChange, setLoadingSpareChange] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const planGB = useMemo(() => calculateGB(plan.volume || 0), [plan.volume]);
  
  // Memoize discount calculation - getDiscount is safe to call during render as it only reads from cache
  const discountPercent = useMemo(() => {
    return getDiscount(plan.packageCode, planGB);
  }, [plan.packageCode, planGB]);
  
  // For Unlimited/Day Pass plans: plan.price is daily price, total = daily × duration
  // For regular plans: plan.price is total price
  const basePriceUSD = plan.price || 0;
  const dailyPriceUSD = isUnlimitedPlan ? basePriceUSD : (basePriceUSD / (plan.duration || 1));
  const totalPriceUSD = isUnlimitedPlan ? (dailyPriceUSD * (plan.duration || 1)) : basePriceUSD;
  
  // Apply discount to daily price for Unlimited plans, then calculate total
  // For regular plans, apply discount to total price
  const discountedDailyPriceUSD = useMemo(() => {
    if (isUnlimitedPlan) {
      return calculateFinalPrice(dailyPriceUSD, discountPercent);
    }
    return dailyPriceUSD; // Not used for regular plans
  }, [isUnlimitedPlan, dailyPriceUSD, discountPercent]);
  
  const finalPriceUSD = useMemo(() => {
    if (isUnlimitedPlan) {
      // For Unlimited: apply discount to daily price, then multiply by selected days
      // Total cost = Days Selected × Daily Plan Price (after discount)
      return discountedDailyPriceUSD * selectedDays;
    } else {
      // For regular: apply discount to total price
      return calculateFinalPrice(totalPriceUSD, discountPercent);
    }
  }, [isUnlimitedPlan, discountedDailyPriceUSD, selectedDays, totalPriceUSD, discountPercent]);
  
  // Calculate converted price directly - convert function from hook should be stable
  const convertedPrice = convert(finalPriceUSD);
  const priceUSDCents = useMemo(() => Math.round(finalPriceUSD * 100), [finalPriceUSD]);

  // Extract flags and get cleaned name
  const flagInfo = useMemo(() => getPlanFlagLabels(plan), [plan]);
  const displayName = useMemo(() => {
    let name = flagInfo.cleanedName || plan.name;
    // Replace "2GB" with "Unlimited" for unlimited plans (2GB + FUP1Mbps)
    if (isUnlimitedPlan) {
      name = name
        .replace(/\b2\s*gb\b/gi, 'Unlimited')
        .replace(/\b2gb\b/gi, 'Unlimited')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return name;
  }, [flagInfo.cleanedName, plan.name, isUnlimitedPlan]);

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
      setSpareChangeBalance(null);
      return;
    }
    const fetchSpareChangeBalance = async () => {
      setLoadingSpareChange(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
          setLoadingSpareChange(false);
          return;
        }
        const data = await safeFetch<{ balanceCents: number }>(`${apiUrl}/spare-change`, {
          headers: { 'x-user-email': userEmail },
          showToast: false,
        });
        setSpareChangeBalance(data.balanceCents);
      } catch (error) {
        console.error("Failed to fetch Spare Change balance:", error);
        setSpareChangeBalance(null);
      } finally {
        setLoadingSpareChange(false);
      }
    };
    fetchSpareChangeBalance();
  }, [userLoaded, user]);

  async function buyNow() {
    if (paymentMethod === 'spare-change' && (!userLoaded || !user)) {
      toast({ title: "Sign in required", description: "Please sign in to use Spare Change.", variant: "destructive" });
      return;
    }

    const savedDevice = localStorage.getItem('deviceModel');
    if (savedDevice && deviceCompatibility && !deviceCompatibility.supported && !proceedWithCheckout) {
      setShowDeviceWarning(true);
      return;
    }

    if (paymentMethod === 'spare-change') {
      if (spareChangeBalance === null || spareChangeBalance < priceUSDCents) {
        toast({ title: "Insufficient Spare Change", description: `Balance too low.`, variant: "destructive" });
        return;
      }
    }

    setProcessing(true);
    try {
      const referralCode = getStoredReferralCode();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      
      // Always add user email header if logged in (for both Stripe and V-Cash)
      if (user?.primaryEmailAddress?.emailAddress) {
        headers['x-user-email'] = user.primaryEmailAddress.emailAddress;
      }

      const requestBody: any = {
        planCode: plan.packageCode,
        currency: selectedCurrency,
        displayCurrency: selectedCurrency,
        amount: finalPriceUSD,
        planName: displayName, // Use cleaned name without flags
        referralCode: referralCode || undefined,
        paymentMethod: paymentMethod,
        // Include email in request body for pending order creation
        email: user?.primaryEmailAddress?.emailAddress || undefined,
        // For Unlimited/Day Pass plans, include selected duration
        ...(isUnlimitedPlan && { duration: selectedDays }),
      };

      const data = await safeFetch<{ url?: string; success?: boolean; orderId?: string; message?: string }>(
        `${apiUrl}/orders`,
        { method: "POST", headers, body: JSON.stringify(requestBody), errorMessage: "Checkout failed." }
      );

      if (paymentMethod === 'spare-change' && data.success) {
        toast({ title: "Success", description: "Order placed via Spare Change." });
        // Redirect to my-esims or order confirmation
        router.push('/my-esims');
      } else if (data.orderId) {
        // Stripe checkout - redirect to review page first
        router.push(`/checkout/${data.orderId}`);
      } else if (data.url) {
        // Fallback: Legacy flow - redirect directly to Stripe
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto items-start py-8 px-4">
      {/* Left: Spec Sheet */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white border border-gray-200 p-8 shadow-lg rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-black text-white px-4 py-2 font-bold uppercase text-xs rounded-bl-xl">
                Spec Sheet
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-black">
                {displayName}
            </h1>
            
            {/* Plan Flags (IP type, FUP, etc.) */}
            <div className="mb-6">
              <PlanFlags plan={plan} />
            </div>
            
            <div className="flex flex-wrap gap-3 mb-8">
                <span className="bg-gray-100 text-gray-700 px-4 py-1.5 font-bold text-sm rounded-full">
                    Data Only
                </span>
                <span className="bg-gray-100 text-gray-700 px-4 py-1.5 font-bold text-sm rounded-full">
                    eSIM
                </span>
                {plan.supportTopUpType === 2 && (
                    <span className="bg-green-100 text-green-700 px-4 py-1.5 font-bold text-sm rounded-full border border-green-200">
                        Top-Up Available
                    </span>
                )}
                {plan.supportTopUpType === 1 && (
                    <span className="bg-gray-100 text-gray-500 px-4 py-1.5 font-bold text-sm rounded-full">
                        Non-Reloadable
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="border border-gray-200 p-4 text-center rounded-xl bg-gray-50">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Total Data</div>
                    <div className="text-3xl font-bold text-black">{isUnlimitedPlan ? "Unlimited" : `${sizeValue} ${sizeUnit}`}</div>
                </div>
                <div className="border border-gray-200 p-4 text-center rounded-xl bg-gray-50">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Duration</div>
                    {isUnlimitedPlan ? (
                        <div className="flex flex-col items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={selectedDays}
                                onChange={(e) => {
                                    const days = Math.max(1, Math.min(365, parseInt(e.target.value) || 1));
                                    setSelectedDays(days);
                                }}
                                className="text-3xl font-bold text-black text-center w-24 border-2 border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-primary"
                            />
                            <div className="flex gap-1 flex-wrap justify-center mt-1">
                                {[7, 14, 30].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => setSelectedDays(days)}
                                        className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                                            selectedDays === days
                                                ? 'bg-primary text-black'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        {days}d
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-3xl font-bold text-black">{plan.duration} Days</div>
                    )}
                </div>
                <div className="border border-gray-200 p-4 text-center rounded-xl bg-gray-50">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Speed</div>
                    <div className="text-2xl font-bold text-black">{plan.speed}</div>
                </div>
                <div className="border border-gray-200 p-4 text-center rounded-xl bg-gray-50">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Activation</div>
                    <div className="text-xl font-bold text-black">Auto</div>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
                <h3 className="font-bold uppercase text-lg mb-4 flex items-center gap-2 text-gray-900">
                    <Globe className="h-5 w-5" /> Coverage Region
                </h3>
                
                {plan.location && plan.location.includes(',') ? (
                    <div>
                        <p className="mb-4 text-sm text-gray-600 leading-relaxed">
                            This plan provides high-speed data coverage in {plan.location.split(',').length} countries. Perfect for regional travel.
                        </p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border border-gray-300 rounded-full hover:bg-black hover:text-white font-bold uppercase px-6">
                                    View Country List
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="border border-gray-200 rounded-xl max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="uppercase font-bold">Coverage List</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {plan.location.split(',').map((code: string) => (
                                        <div key={code} className="flex items-center gap-3 border border-gray-100 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-8 h-5 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                                                 <FlagIcon logoUrl={`https://flagcdn.com/w320/${code.trim().toLowerCase().split('-')[0]}.png`} alt={code} className="h-full w-full object-cover" />
                                            </div>
                                            <span className="font-bold text-xs uppercase text-gray-700">{getCountryName(code.trim())}</span>
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 bg-gray-50 p-4 border border-gray-200 w-fit rounded-xl">
                        <div className="w-12 h-8 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                            <FlagIcon logoUrl={`https://flagcdn.com/w320/${plan.location.toLowerCase().split('-')[0]}.png`} alt={plan.location} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-bold text-lg uppercase text-black">{getCountryName(plan.location)}</span>
                    </div>
                )}
            </div>
            
             <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <Link href="/device-check" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-dark hover:underline">
                    <Smartphone className="h-4 w-4" /> Check Device Compatibility
                </Link>
            </div>
        </div>
      </div>

      {/* Right: Receipt / Checkout */}
      <div className="lg:col-span-1 sticky top-24">
         <div className="bg-white border border-gray-200 p-6 shadow-xl rounded-2xl">
             <div className="text-center border-b border-dashed border-gray-200 pb-4 mb-4">
                 <h2 className="font-bold uppercase tracking-widest text-gray-400 text-xs">Order Summary</h2>
             </div>
             
             <div className="space-y-4 mb-6 text-sm">
                 <div className="flex justify-between">
                     <span className="text-gray-500">Item:</span>
                     <span className="font-bold text-gray-900">{displayName}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-gray-500">Data:</span>
                     <span className="font-bold text-gray-900">{isUnlimitedPlan ? "Unlimited" : `${sizeValue} ${sizeUnit}`}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-gray-500">Validity:</span>
                     <span className="font-bold text-gray-900">{isUnlimitedPlan ? selectedDays : plan.duration} Days</span>
                 </div>
             </div>

             <div className="border-t border-gray-200 pt-4 mb-6">
                 {isUnlimitedPlan && (
                     <div className="flex justify-between text-gray-500 text-xs mb-2">
                         <span>Daily Price:</span>
                         <span>{formatCurrency(convert(discountedDailyPriceUSD))}/day</span>
                     </div>
                 )}
                 {discountPercent > 0 && (
                     <div className="flex justify-between text-gray-400 text-sm mb-1 line-through">
                         <span>Original Price:</span>
                         <span>{formatCurrency(convert(isUnlimitedPlan ? (dailyPriceUSD * selectedDays) : basePriceUSD))}</span>
                     </div>
                 )}
                 <div className="flex justify-between items-end">
                     <span className="font-bold uppercase text-lg text-gray-900">Total:</span>
                     <div className="text-right">
                         <span className="block text-4xl font-bold tracking-tight text-black">
                             {formatCurrency(convertedPrice)}
                         </span>
                         {discountPercent > 0 && (
                             <span className="inline-block bg-green-100 text-green-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1">
                                 {discountPercent}% Savings Applied
                             </span>
                         )}
                     </div>
                 </div>
             </div>

             {userLoaded && user && (
                 <div className="bg-gray-50 p-4 border border-gray-200 mb-6 rounded-xl">
                     <div className="flex justify-between items-center mb-2">
                         <span className="font-bold text-xs text-gray-600 uppercase">Spare Change:</span>
                         <span className="font-bold text-gray-900">${spareChangeBalance !== null ? (spareChangeBalance / 100).toFixed(2) : '...'}</span>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                            onClick={() => setPaymentMethod('spare-change')}
                            disabled={!spareChangeBalance || spareChangeBalance < priceUSDCents}
                            className={`p-2 border text-center text-xs font-bold uppercase rounded-lg transition-all ${paymentMethod === 'spare-change' ? 'border-primary bg-primary/10 text-primary-dark ring-1 ring-primary' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                        >
                            Pay w/ Balance
                        </button>
                        <button
                            onClick={() => setPaymentMethod('stripe')}
                            className={`p-2 border text-center text-xs font-bold uppercase rounded-lg transition-all ${paymentMethod === 'stripe' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        >
                            Pay w/ Card
                        </button>
                     </div>
                 </div>
             )}

             <Button 
                onClick={buyNow}
                disabled={processing}
                className="w-full h-14 bg-primary hover:bg-primary-dark text-black text-lg font-bold uppercase tracking-tight rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
             >
                {processing ? 'Processing...' : 'Complete Order'}
             </Button>

             <div className="mt-4 text-center">
                 <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-center gap-2">
                     <Shield className="h-3 w-3" /> Secure Checkout • Instant Delivery
                 </span>
             </div>
         </div>
      </div>

      {/* Device Warning */}
      {showDeviceWarning && deviceCompatibility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 p-8 max-w-md w-full shadow-2xl rounded-2xl text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Compatibility Warning</h2>
            <p className="font-medium text-gray-600 mb-6 leading-relaxed">
                Your <span className="font-bold text-black">{deviceCompatibility.brand} {deviceCompatibility.model}</span> might not support eSIM technology. Proceeding may result in a non-functional plan.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => setShowDeviceWarning(false)} variant="outline" className="flex-1 border-gray-300 rounded-full font-bold">Cancel</Button>
                <Button 
                    onClick={() => { setShowDeviceWarning(false); setProceedWithCheckout(true); buyNow(); }} 
                    className="flex-1 bg-black text-white hover:bg-gray-800 rounded-full font-bold"
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
