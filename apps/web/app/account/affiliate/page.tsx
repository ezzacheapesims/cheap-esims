"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, CheckCircle2, Users, DollarSign, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { safeFetch } from "@/lib/safe-fetch";

interface AffiliateDashboard {
  affiliate: {
    id: string;
    referralCode: string;
    referralLink: string;
    totalCommission: number;
    isFrozen: boolean;
    createdAt: string;
  };
  stats: {
    totalCommission: number;
    totalReferrals: number;
    totalPurchases: number;
    totalCommissions: number;
  };
  balances: {
    pendingBalance: number;
    availableBalance: number;
    lifetimeTotal: number;
  };
  payoutMethod: any;
  payoutHistory: any[];
  remainingCommission: number;
  referrals: Array<any>;
  commissions: Array<any>;
  recentPurchases: Array<any>;
}

export default function AffiliateDashboardPage() {
  const { user, isLoaded } = useUser();
  const { convert, formatCurrency: formatCurrencyContext, loading: currencyLoading } = useCurrency();
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submittingCashOut, setSubmittingCashOut] = useState(false);
  const [convertingToSpareChange, setConvertingToSpareChange] = useState(false);
  const [spareChangeAmount, setSpareChangeAmount] = useState("");
  const [cashOutForm, setCashOutForm] = useState({
    paymentMethod: "",
    affiliateCode: "",
    amount: "",
  });

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<any>(`${apiUrl}/affiliate/dashboard`, {
          headers: {
            "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        });
        
        if (cancelled) return;
        
        const safeData = {
          ...data,
          affiliate: data?.affiliate || null,
          referrals: Array.isArray(data?.referrals) ? data.referrals : [],
          commissions: Array.isArray(data?.commissions) ? data.commissions : [],
          recentPurchases: Array.isArray(data?.recentPurchases) ? data.recentPurchases : [],
          remainingCommission: typeof data?.remainingCommission === 'number' ? data.remainingCommission : 0,
          balances: data?.balances || { pendingBalance: 0, availableBalance: 0, lifetimeTotal: 0 },
          stats: data?.stats || { totalCommission: 0, totalReferrals: 0, totalPurchases: 0, totalCommissions: 0 },
          payoutMethod: data?.payoutMethod || null,
          payoutHistory: Array.isArray(data?.payoutHistory) ? data.payoutHistory : [],
        };
        
        if (!cancelled) {
          setDashboard(safeData);
        }
      } catch (error) {
        console.error("Failed to fetch affiliate dashboard:", error);
        if (!cancelled) {
          setDashboard(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();
    
    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoaded]);

  const copyReferralLink = async () => {
    if (!dashboard?.affiliate?.referralLink) return;

    try {
      await navigator.clipboard.writeText(dashboard.affiliate.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatCurrency = useCallback((
    centsUSD: number,
    displayCurrency?: string | null,
    displayAmountCents?: number | null
  ) => {
    try {
      if (displayCurrency && displayAmountCents) {
        const currencyCode = displayCurrency.toUpperCase();
        const amount = displayAmountCents / 100;
        
        try {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode.toLowerCase(),
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(amount);
        } catch (error) {
          return `${currencyCode} ${amount.toFixed(2)}`;
        }
      }
      
      if (!centsUSD || isNaN(centsUSD) || centsUSD === 0) {
        return formatCurrencyContext ? formatCurrencyContext(0) : '$0.00';
      }
      const amountUSD = centsUSD / 100;
      const convertedAmount = convert ? convert(amountUSD) : amountUSD;
      return formatCurrencyContext ? formatCurrencyContext(convertedAmount) : `$${convertedAmount.toFixed(2)}`;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '$0.00';
    }
  }, [convert, formatCurrencyContext]);

  if (!isLoaded || loading || currencyLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-8">
        <Skeleton className="h-10 w-48 bg-gray-200 rounded-none" />
        <Skeleton className="h-64 w-full bg-gray-200 rounded-none" />
        <Skeleton className="h-96 w-full bg-gray-200 rounded-none" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-20 text-center">
        <h1 className="text-3xl font-black uppercase text-black mb-4">Please sign in</h1>
        <p className="text-gray-500 font-mono">You must be signed in to access the affiliate dashboard.</p>
      </div>
    );
  }

  if (!dashboard || !dashboard.affiliate) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-20 text-center">
        <h1 className="text-3xl font-black uppercase text-black mb-4">
          {loading ? 'Loading dashboard...' : 'Failed to load dashboard'}
        </h1>
        <p className="text-gray-500 font-mono">
          {loading ? 'Please wait...' : 'Please try refreshing the page.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-12">
      {/* Back Button */}
      <Link
        href="/account"
        className="inline-flex items-center text-gray-500 hover:text-black transition-colors mb-4 font-mono font-bold uppercase text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Account
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-2">Affiliate Dashboard</h1>
        <p className="text-gray-500 font-mono uppercase text-sm font-bold">Earn 10% lifetime commissions on all referrals</p>
      </div>

      {/* Top Section: Referral Link & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Referral Link Card */}
        <div className="bg-white border-2 border-black p-8 shadow-hard flex flex-col justify-between">
          <h3 className="text-xl font-black uppercase mb-6">Your Referral Link</h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/3 p-4 bg-gray-50 border-2 border-black">
                <p className="text-xs font-mono font-bold uppercase text-gray-500 mb-1">Referral Code</p>
                <p className="text-xl font-black text-black font-mono break-all">{dashboard?.affiliate?.referralCode || 'N/A'}</p>
              </div>
              <div className="w-full sm:w-2/3 p-4 bg-gray-50 border-2 border-black">
                <p className="text-xs font-mono font-bold uppercase text-gray-500 mb-1">Referral Link</p>
                <p className="text-sm text-black font-mono break-all truncate">{dashboard?.affiliate?.referralLink || 'N/A'}</p>
              </div>
            </div>
            <Button
              onClick={copyReferralLink}
              className="w-full bg-primary hover:bg-black hover:text-white text-black border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" /> Copy Referral Link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-black p-6 shadow-hard flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10">
                <DollarSign className="h-24 w-24" />
             </div>
             <p className="text-sm font-mono font-bold uppercase text-gray-500 mb-1">Total Commission</p>
             <p className="text-4xl font-black tracking-tighter text-black">
                {formatCurrency(dashboard?.stats?.totalCommission || 0)}
             </p>
             <p className="text-xs font-mono uppercase text-gray-400 mt-2">All-time earnings</p>
          </div>

          <div className="bg-black border-2 border-black p-6 shadow-hard flex flex-col justify-center text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-20">
                <Users className="h-24 w-24 text-white" />
             </div>
             <p className="text-sm font-mono font-bold uppercase text-gray-400 mb-1">Total Referrals</p>
             <p className="text-4xl font-black tracking-tighter text-white">
                {dashboard?.stats?.totalReferrals || 0}
             </p>
             <p className="text-xs font-mono uppercase text-gray-500 mt-2">Users referred</p>
          </div>
        </div>
      </div>

      {/* Actions Section: Convert & Cash Out */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Convert to Spare Change Section */}
        {dashboard?.remainingCommission !== undefined && dashboard.remainingCommission > 0 ? (
          <div className="bg-white border-2 border-black p-8 shadow-hard">
            <h3 className="text-xl font-black uppercase mb-6">Convert to Spare Change</h3>
            <div className="space-y-6">
              <p className="font-mono text-sm text-gray-600">
                Convert your affiliate earnings into Spare Change store credit instantly.
              </p>
              <div className="p-4 bg-secondary border-2 border-black">
                <p className="text-xs font-mono font-bold uppercase text-gray-500">Available to convert:</p>
                <p className="text-3xl font-black text-black tracking-tighter">
                  {formatCurrency(dashboard?.remainingCommission || 0)}
                </p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user || convertingToSpareChange || dashboard?.affiliate?.isFrozen) return;

                  const amountNum = Math.round(parseFloat(spareChangeAmount) * 100); 
                  if (!spareChangeAmount.trim() || isNaN(amountNum) || amountNum <= 0) {
                    toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
                    return;
                  }

                  if (amountNum > (dashboard?.remainingCommission || 0)) {
                    toast({ title: "Error", description: `Amount exceeds available commission.`, variant: "destructive" });
                    return;
                  }

                  setConvertingToSpareChange(true);
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                    const result = await safeFetch<any>(`${apiUrl}/affiliate/spare-change/convert`, {
                      method: "POST",
                      headers: { "x-user-email": user.primaryEmailAddress?.emailAddress || "", "Content-Type": "application/json" },
                      body: JSON.stringify({ amountCents: amountNum }),
                    });

                    toast({ title: "Success", description: `Converted ${formatCurrency(result.convertedAmountCents)} successfully.` });
                    setSpareChangeAmount("");
                    window.location.reload();
                  } catch (error: any) {
                    toast({ title: "Error", description: error.message || "Failed to convert", variant: "destructive" });
                  } finally {
                    setConvertingToSpareChange(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="spareChangeAmount" className="font-bold uppercase text-xs">Amount (USD)</Label>
                  <Input
                    id="spareChangeAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={`Max: ${formatCurrency(dashboard?.remainingCommission || 0)}`}
                    value={spareChangeAmount}
                    onChange={(e) => setSpareChangeAmount(e.target.value)}
                    className="border-2 border-black rounded-none font-mono"
                    disabled={convertingToSpareChange || dashboard?.affiliate?.isFrozen}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-white hover:text-black text-white border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all"
                  disabled={convertingToSpareChange || dashboard.affiliate?.isFrozen}
                >
                  {convertingToSpareChange ? "Converting..." : "Convert to Spare Change"}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-black p-8 shadow-hard flex items-center justify-center text-center h-full border-dashed">
            <div className="space-y-2">
              <p className="text-gray-500 font-mono">
                You need commission earnings to convert to Spare Change.
              </p>
              <Link href="/account/spare-change">
                <Button variant="link" className="text-primary font-bold uppercase">
                  View Spare Change Balance →
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Cash-Out Request Form */}
        <div className="bg-white border-2 border-black p-8 shadow-hard">
          <h3 className="text-xl font-black uppercase mb-6">Request Cash Out</h3>
          <div className="space-y-6">
            {dashboard?.affiliate?.isFrozen && (
              <div className="bg-red-50 border-2 border-red-500 p-4 mb-6">
                 <p className="text-red-600 font-black uppercase mb-2">⚠️ Account Frozen</p>
                 <p className="text-xs font-mono text-red-500">Your account is temporarily frozen. Payouts are disabled.</p>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user || submittingCashOut) return;
                
                if (!cashOutForm.paymentMethod.trim() || !cashOutForm.affiliateCode.trim() || !cashOutForm.amount.trim()) {
                    toast({ title: "Error", description: "All fields are required", variant: "destructive" });
                    return;
                }
                
                setSubmittingCashOut(true);
                try {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                  await safeFetch(`${apiUrl}/affiliate/cash-out-request`, {
                    method: "POST",
                    headers: { "x-user-email": user.primaryEmailAddress?.emailAddress || "", "Content-Type": "application/json" },
                    body: JSON.stringify({
                      paymentMethod: cashOutForm.paymentMethod.trim(),
                      affiliateCode: cashOutForm.affiliateCode.trim().toUpperCase(),
                      amount: cashOutForm.amount,
                    }),
                  });

                  toast({ title: "Success", description: "Request submitted." });
                  setCashOutForm({ paymentMethod: "", affiliateCode: "", amount: "" });
                } catch (error: any) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                } finally {
                  setSubmittingCashOut(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="font-bold uppercase text-xs">Payment Method</Label>
                <Input
                  id="paymentMethod"
                  placeholder="PayPal email or Bank IBAN..."
                  value={cashOutForm.paymentMethod}
                  onChange={(e) => setCashOutForm({ ...cashOutForm, paymentMethod: e.target.value })}
                  className="border-2 border-black rounded-none font-mono"
                  disabled={submittingCashOut || dashboard?.affiliate?.isFrozen}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliateCode" className="font-bold uppercase text-xs">Affiliate Code</Label>
                <Input
                  id="affiliateCode"
                  placeholder={dashboard?.affiliate?.referralCode || ''}
                  value={cashOutForm.affiliateCode}
                  onChange={(e) => setCashOutForm({ ...cashOutForm, affiliateCode: e.target.value.toUpperCase() })}
                  className="border-2 border-black rounded-none font-mono"
                  disabled={submittingCashOut || dashboard?.affiliate?.isFrozen}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="font-bold uppercase text-xs">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={cashOutForm.amount}
                  onChange={(e) => setCashOutForm({ ...cashOutForm, amount: e.target.value })}
                  className="border-2 border-black rounded-none font-mono"
                  disabled={submittingCashOut || dashboard?.affiliate?.isFrozen}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-white hover:text-black text-white border-2 border-black rounded-none font-bold uppercase shadow-hard-sm hover:shadow-none transition-all"
                disabled={submittingCashOut || dashboard?.affiliate?.isFrozen}
              >
                {submittingCashOut ? "Submitting..." : "Submit Cash-Out Request"}
              </Button>
            </form>
          </div>
        </div>
      </div>


      {/* Recent Purchases */}
      <div className="bg-white border-2 border-black shadow-hard overflow-hidden">
        <div className="border-b-2 border-black p-6 bg-secondary">
          <h3 className="text-xl font-black uppercase">Recent Activity</h3>
        </div>
        <div className="p-0 overflow-x-auto">
             {!dashboard?.recentPurchases?.length ? (
                <div className="p-8 text-center text-gray-500 font-mono">No recent activity</div>
             ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-black bg-gray-50">
                            <th className="text-left py-3 px-4 text-xs font-black uppercase">User</th>
                            <th className="text-left py-3 px-4 text-xs font-black uppercase">Type</th>
                            <th className="text-left py-3 px-4 text-xs font-black uppercase">Amount</th>
                            <th className="text-left py-3 px-4 text-xs font-black uppercase">Commission</th>
                            <th className="text-left py-3 px-4 text-xs font-black uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {dashboard.recentPurchases.map((purchase) => (
                            <tr key={purchase.id} className="hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm font-mono">{purchase.userEmail}</td>
                                <td className="py-3 px-4"><Badge variant="outline" className="rounded-none border-black text-[10px] uppercase">{purchase.type}</Badge></td>
                                <td className="py-3 px-4 font-bold text-sm">{formatCurrency(purchase.amountCents, purchase.displayCurrency, purchase.displayAmountCents)}</td>
                                <td className="py-3 px-4 font-black text-green-600 text-sm">
                                    {formatCurrency(Math.round(purchase.amountCents * 0.1))}
                                </td>
                                <td className="py-3 px-4">
                                    <Badge className="rounded-none bg-black text-white hover:bg-black text-[10px] uppercase">{purchase.status}</Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}
        </div>
      </div>

      {/* Footer - Affiliate Terms Link */}
      <div className="pt-8 border-t-2 border-black text-center">
        <p className="text-sm font-mono text-gray-500">
          By participating, you agree to the{" "}
          <Link href="/support/affiliate-terms" className="text-black font-bold underline hover:text-primary">
            Affiliate Terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
