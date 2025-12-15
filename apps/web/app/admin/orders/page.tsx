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
