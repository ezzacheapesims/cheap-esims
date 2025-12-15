"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Smartphone, CreditCard, Users } from "lucide-react";

interface Stats {
  orders: { total: number; pending: number };
  esims: { total: number; active: number };
  topups: { total: number; completed: number };
  users: { total: number };
}

export default function AdminDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, esimsRes, topupsRes, usersRes] = await Promise.all([
          fetch(`${apiUrl}/admin/orders`, {
            headers: {
              "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            },
          }),
          fetch(`${apiUrl}/admin/esims`, {
            headers: {
              "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            },
          }),
          fetch(`${apiUrl}/admin/topups`, {
            headers: {
              "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            },
          }),
          fetch(`${apiUrl}/admin/users`, {
            headers: {
              "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            },
          }),
        ]);

        const orders = ordersRes.ok ? await ordersRes.json() : [];
        const esims = esimsRes.ok ? await esimsRes.json() : [];
        const topups = topupsRes.ok ? await topupsRes.json() : [];
        const users = usersRes.ok ? await usersRes.json() : [];

        setStats({
          orders: {
            total: orders.length,
            pending: orders.filter((o: any) =>
              ["pending", "provisioning"].includes(o.status?.toLowerCase())
            ).length,
          },
          esims: {
            total: esims.length,
            active: esims.filter(
              (e: any) => e.esimStatus === "GOT_RESOURCE" || e.esimStatus === "IN_USE"
            ).length,
          },
          topups: {
            total: topups.length,
            completed: topups.filter(
              (t: any) => t.status === "completed"
            ).length,
          },
          users: {
            total: users.length,
          },
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, apiUrl]);

  if (loading || !stats) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-black uppercase tracking-tighter mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 font-mono font-bold uppercase text-sm">
          Welcome back, {user?.firstName || "Admin"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-secondary border-b-2 border-black">
            <CardTitle className="text-sm font-black text-black uppercase">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-black tracking-tighter">{stats.orders.total}</div>
            <p className="text-xs font-mono font-bold text-gray-500 mt-2 uppercase">
              {stats.orders.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-secondary border-b-2 border-black">
            <CardTitle className="text-sm font-black text-black uppercase">
              eSIM Profiles
            </CardTitle>
            <Smartphone className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-black tracking-tighter">{stats.esims.total}</div>
            <p className="text-xs font-mono font-bold text-gray-500 mt-2 uppercase">
              {stats.esims.active} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-secondary border-b-2 border-black">
            <CardTitle className="text-sm font-black text-black uppercase">
              Top-ups
            </CardTitle>
            <CreditCard className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-black tracking-tighter">{stats.topups.total}</div>
            <p className="text-xs font-mono font-bold text-gray-500 mt-2 uppercase">
              {stats.topups.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-secondary border-b-2 border-black">
            <CardTitle className="text-sm font-black text-black uppercase">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-black tracking-tighter">{stats.users.total}</div>
            <p className="text-xs font-mono font-bold text-gray-500 mt-2 uppercase">
              Registered Accounts
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
