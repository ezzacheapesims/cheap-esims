"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { safeFetch } from "@/lib/safe-fetch";

interface VCashBalance {
  balanceCents: number;
  currency: string;
}

interface VCashTransaction {
  id: string;
  type: "credit" | "debit";
  amountCents: number;
  reason: string;
  metadata?: any;
  createdAt: string;
}

export default function VCashPage() {
  const { user, isLoaded } = useUser();
  const { formatCurrency: formatCurrencyContext, convert } = useCurrency();
  const [balance, setBalance] = useState<VCashBalance | null>(null);
  const [transactions, setTransactions] = useState<VCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        
        const [balanceData, transactionsData] = await Promise.all([
          safeFetch<VCashBalance>(`${apiUrl}/vcash`, {
            headers: {
              "x-user-email": user.primaryEmailAddress?.emailAddress || "",
            },
            showToast: false,
          }),
          safeFetch<{ transactions: VCashTransaction[]; total: number; totalPages: number }>(
            `${apiUrl}/vcash/transactions?page=${page}&pageSize=50`,
            {
              headers: {
                "x-user-email": user.primaryEmailAddress?.emailAddress || "",
              },
              showToast: false,
            }
          ),
        ]);

        setBalance(balanceData);
        setTransactions(transactionsData.transactions);
        setTotalPages(transactionsData.totalPages);
      } catch (error) {
        console.error("Failed to fetch V-Cash data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isLoaded, page]);

  const formatCurrency = (cents: number) => {
    const amountUSD = cents / 100;
    const convertedAmount = convert(amountUSD);
    return formatCurrencyContext(convertedAmount);
  };

  const getReasonLabel = (reason: string, metadata?: any) => {
    if (reason.startsWith('ORDER_PAYMENT_')) {
      const orderId = reason.replace('ORDER_PAYMENT_', '');
      const planName = metadata?.planName || metadata?.plan?.name;
      if (planName) return `Payment for ${planName}`;
      return `Order Payment (${orderId.substring(0, 8)}...)`;
    }

    if (reason === 'admin_manual_credit' || reason === 'manual_adjustment') {
      const adminReason = metadata?.reason;
      if (adminReason && adminReason !== 'admin_manual_credit') return `Admin Credit: ${adminReason}`;
      return 'Admin Manual Credit';
    }

    if (reason === 'AFFILIATE_COMMISSION_TO_VCASH' || reason === 'affiliate_conversion') {
      return 'Affiliate Commission Conversion';
    }

    if (reason.startsWith('ORDER_REFUND') || reason === 'refund' || reason === 'ORDER_REFUND_VCASH') {
      const orderId = metadata?.orderId;
      const planName = metadata?.planName;
      if (planName) return `Refund: ${planName}`;
      if (orderId) return `Refund for Order (${orderId.substring(0, 8)}...)`;
      return 'Order Refund';
    }

    if (reason === 'ORDER_REFUND_VCASH') {
      const orderId = metadata?.orderId;
      if (orderId) return `Refund to V-Cash (Order ${orderId.substring(0, 8)}...)`;
      return 'Refund to V-Cash';
    }

    const labels: Record<string, string> = {
      refund: 'Refund',
      purchase: 'Purchase',
    };

    return labels[reason] || reason.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isLoaded || loading) {
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
        <p className="text-gray-500 font-mono">You must be signed in to access your V-Cash.</p>
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
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-2">V-Cash History</h1>
        <p className="text-gray-500 font-mono uppercase text-sm font-bold">
          Store credit for future purchases & refunds
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-white border-2 border-black p-8 shadow-hard flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-sm font-mono font-bold text-gray-500 uppercase mb-1">Available Balance</p>
          <p className="text-5xl font-black tracking-tighter text-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] text-stroke-1">
            {balance ? formatCurrency(balance.balanceCents) : "$0.00"}
          </p>
        </div>
        <div className="bg-secondary p-4 border-2 border-black">
            <DollarSign className="h-12 w-12 text-black" />
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white border-2 border-black shadow-hard overflow-hidden">
        <div className="border-b-2 border-black p-6 bg-secondary">
          <h3 className="text-xl font-black uppercase">Transaction History</h3>
        </div>
        
        {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-mono border-dashed">No transactions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-white">
                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-black w-32">Date</th>
                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-black w-24">Type</th>
                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-black w-32">Amount</th>
                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-black">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-gray-600 font-mono text-xs whitespace-nowrap border-r border-gray-100">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="py-4 px-6 border-r border-gray-100">
                        <Badge
                          className={`rounded-none font-bold uppercase text-[10px] px-2 py-0.5 border border-black shadow-sm ${
                            transaction.type === "credit"
                              ? "bg-green-400 text-black hover:bg-green-500"
                              : "bg-red-400 text-white hover:bg-red-500"
                          }`}
                        >
                          {transaction.type === "credit" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {transaction.type === "credit" ? "Credit" : "Debit"}
                        </Badge>
                      </td>
                      <td className={`py-4 px-6 font-black text-sm font-mono border-r border-gray-100 ${
                        transaction.type === "credit" 
                          ? "text-green-600" 
                          : "text-red-600"
                      }`}>
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amountCents))}
                      </td>
                      <td className="py-4 px-6 text-black text-sm">
                        <div className="flex flex-col">
                          <span className="font-bold">{getReasonLabel(transaction.reason, transaction.metadata)}</span>
                          {transaction.metadata?.orderId && !transaction.metadata?.planName && (
                            <span className="text-xs text-gray-400 font-mono mt-1 uppercase">
                              ID: {transaction.metadata.orderId.substring(0, 8)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t-2 border-black bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-2 border-black rounded-none font-bold uppercase hover:bg-black hover:text-white"
              >
                Previous
              </Button>
              <span className="text-sm font-mono font-bold text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-2 border-black rounded-none font-bold uppercase hover:bg-black hover:text-white"
              >
                Next
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
