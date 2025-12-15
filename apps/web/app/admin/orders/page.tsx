"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AdminTable } from "@/components/admin/AdminTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsdDollars } from "@/lib/utils";
import { getOrderStatusDisplay, getPlanNames } from "@/lib/admin-helpers";

interface Order {
  id: string;
  planId: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentRef?: string;
  esimOrderNo?: string;
  createdAt: string;
  User?: {
    email: string;
    name?: string;
  };
  user?: {
    email: string;
    name?: string;
  };
}

export default function AdminOrdersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [planNames, setPlanNames] = useState<Map<string, string>>(new Map());
  const [recreatePaymentRef, setRecreatePaymentRef] = useState("");
  const [recreating, setRecreating] = useState(false);
  const [recreateResult, setRecreateResult] = useState<{ success: boolean; message: string } | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/orders`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setOrders(data);
          
          // Fetch plan names for all unique plan IDs
          const uniquePlanIds = Array.from(new Set(data.map((o: Order) => o.planId))) as string[];
          const names = await getPlanNames(uniquePlanIds, apiUrl);
          setPlanNames(names);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, apiUrl]);

  const handleRecreateOrder = async () => {
    if (!recreatePaymentRef.trim()) {
      setRecreateResult({ success: false, message: "Please enter a payment reference" });
      return;
    }

    setRecreating(true);
    setRecreateResult(null);

    try {
      const res = await fetch(`${apiUrl}/admin/orders/recreate-from-payment/${recreatePaymentRef.trim()}`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.success) {
        setRecreateResult({ success: true, message: `Order recreated! Order ID: ${data.orderId || "N/A"}` });
        setRecreatePaymentRef("");
        // Refresh orders list
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setRecreateResult({ success: false, message: data.error || "Failed to recreate order" });
      }
    } catch (error: any) {
      setRecreateResult({ success: false, message: error.message || "Failed to recreate order" });
    } finally {
      setRecreating(false);
    }
  };

  const columns = useMemo(() => [
    {
      header: "Order ID",
      accessor: (row: Order) => row.id,
      className: "break-all min-w-[120px] font-mono text-xs font-bold text-gray-700",
    },
    {
      header: "User Email",
      accessor: (row: Order) => {
        const user = row.User || row.user;
        return user?.email || "-";
      },
      className: "text-black",
    },
    {
      header: "Plan",
      accessor: (row: Order) => {
        const planName = planNames.get(row.planId);
        return planName || row.planId;
      },
      render: (row: Order) => {
        const planName = planNames.get(row.planId);
        return (
          <div>
            <div className="text-black font-bold uppercase">{planName || row.planId}</div>
            {planName && (
              <div className="text-xs text-gray-500 font-mono">{row.planId}</div>
            )}
          </div>
        );
      },
    },
    {
      header: "Amount",
      accessor: (row: Order) =>
        formatUsdDollars(row.amountCents / 100),
      className: "font-mono font-bold text-black",
    },
    {
      header: "Status",
      accessor: (row: Order) => {
        const statusDisplay = getOrderStatusDisplay(row.status);
        return statusDisplay.label;
      },
      render: (row: Order) => {
        const statusDisplay = getOrderStatusDisplay(row.status);
        return <Badge className={`${statusDisplay.className} rounded-none uppercase font-bold border border-black shadow-sm`}>{statusDisplay.label}</Badge>;
      },
    },
    {
      header: "Provider Order",
      accessor: (row: Order) => row.esimOrderNo || "-",
      className: (row: Order) => row.esimOrderNo ? "break-all min-w-[100px] font-mono text-xs text-gray-700" : "break-all min-w-[100px] text-gray-400",
    },
    {
      header: "Payment Ref",
      accessor: (row: Order) => row.paymentRef || "-",
      className: (row: Order) => row.paymentRef ? "break-all min-w-[100px] font-mono text-xs text-gray-700" : "break-all min-w-[100px] text-gray-400",
    },
    {
      header: "Created",
      accessor: (row: Order) =>
        new Date(row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      className: "text-gray-600 font-mono text-xs",
    },
  ], [planNames]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Orders</h1>
          <p className="text-gray-600 font-mono font-bold uppercase text-sm">
            Manage and monitor all orders
          </p>
        </div>
      </div>

      {/* Recreate Order from Payment Reference */}
      <Card className="bg-white border-2 border-black rounded-none shadow-hard p-4">
        <div className="space-y-3">
          <h2 className="text-lg font-black uppercase text-black">Recreate Order from Payment</h2>
          <p className="text-sm text-gray-600 font-mono">
            Use this if an order failed to create due to database issues. Enter the Stripe payment intent ID (pi_...) or checkout session ID (cs_...).
          </p>
          <div className="flex gap-3 items-start">
            <input
              type="text"
              value={recreatePaymentRef}
              onChange={(e) => setRecreatePaymentRef(e.target.value)}
              placeholder="pi_3SedGWD9WFcdUeJB1QMbi6F6 or cs_live_..."
              className="flex-1 px-4 py-2 bg-white border-2 border-black text-sm font-mono focus:outline-none focus:ring-0 focus:shadow-hard-sm"
            />
            <button
              onClick={handleRecreateOrder}
              disabled={recreating || !recreatePaymentRef.trim()}
              className="px-6 py-2 bg-primary text-black border-2 border-black font-black uppercase text-sm hover:shadow-hard-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {recreating ? "Creating..." : "Recreate"}
            </button>
          </div>
          {recreateResult && (
            <div className={`px-4 py-2 border-2 border-black font-mono text-sm ${
              recreateResult.success 
                ? "bg-green-100 text-black" 
                : "bg-red-100 text-black"
            }`}>
              {recreateResult.message}
            </div>
          )}
        </div>
      </Card>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardContent className="p-0">
          <AdminTable
            data={orders}
            columns={columns}
            onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
            emptyMessage="No orders found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
