'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  planId: string;
  amountCents: number;
  displayCurrency: string;
  displayAmountCents: number;
  status: string;
  User?: {
    email: string;
    name: string | null;
  };
}

export default function CheckoutPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const { orderId } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await safeFetch<Order>(`${apiUrl}/orders/${orderId}`, { showToast: false });
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, apiUrl]);

  const handleProceedToPayment = async () => {
    setRedirecting(true);
    try {
      const data = await safeFetch<{ url: string }>(`${apiUrl}/orders/${orderId}/checkout`, {
        method: 'POST',
        showToast: false,
      });
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error("Failed to create checkout session:", error);
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase mb-4">Order Not Found</h1>
          <Link href="/">
            <Button className="bg-primary text-black border-2 border-black rounded-none font-bold uppercase">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayAmount = order.displayAmountCents / 100;
  const currency = order.displayCurrency || 'USD';

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 hover:bg-transparent text-gray-500 hover:text-black transition-all font-mono uppercase text-sm font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>

        <div className="bg-white border-2 border-black p-8 shadow-hard">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-6">Order Review</h1>
          
          <div className="space-y-6 mb-8">
            <div className="border-b-2 border-black pb-4">
              <h2 className="text-lg font-black uppercase mb-4">Order Details</h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-bold text-black">{order.planId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-bold text-black">{order.id}</span>
                </div>
                {order.User && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-bold text-black">{order.User.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b-2 border-black pb-4">
              <h2 className="text-lg font-black uppercase mb-4">Payment Summary</h2>
              <div className="flex justify-between items-end">
                <span className="text-xl font-black uppercase">Total:</span>
                <span className="text-4xl font-black text-primary">
                  {formatCurrency(displayAmount, currency)}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleProceedToPayment}
            disabled={redirecting || order.status !== 'pending'}
            className="w-full h-14 bg-primary hover:bg-black hover:text-white text-black text-xl font-black uppercase tracking-tight border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            {redirecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirecting to Payment...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </Button>

          <p className="mt-4 text-center text-xs text-gray-500 font-mono uppercase">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
