"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { formatUsdDollars } from "@/lib/utils";
import { getOrderStatusDisplay, getTopUpStatusDisplay, getPlanNames } from "@/lib/admin-helpers";

interface UserDetail {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  orders: Array<{
    id: string;
    planId: string;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  profiles: Array<{
    id: string;
    iccid: string;
    esimStatus?: string;
  }>;
  topups: Array<{
    id: string;
    planCode: string;
    amountCents: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminUserDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [planNames, setPlanNames] = useState<Map<string, string>>(new Map());
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/users/${params.id}`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          // Ensure arrays are always present
          setUserDetail({
            ...data,
            orders: data.orders || [],
            profiles: data.profiles || [],
            topups: data.topups || [],
          });
          
          // Fetch plan names for orders and top-ups
          const orderPlanIds = (data.orders || []).map((o: { planId: string }) => o.planId);
          const topupPlanCodes = (data.topups || []).map((t: { planCode: string }) => t.planCode);
          const allPlanIds = Array.from(new Set([...orderPlanIds, ...topupPlanCodes])) as string[];
          
          if (allPlanIds.length > 0) {
            const names = await getPlanNames(allPlanIds, apiUrl);
            setPlanNames(names);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && params.id) {
      fetchUser();
    }
  }, [user, params.id, apiUrl]);

  if (loading || !userDetail) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/users")}
          className="text-gray-500 hover:text-black font-mono uppercase font-bold text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">User Details</h1>
          <p className="text-gray-600 font-mono font-bold uppercase text-sm">{userDetail.email}</p>
        </div>
      </div>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <CardTitle className="text-black font-black uppercase">User Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Email</p>
            <p className="text-black font-bold text-lg">{userDetail.email}</p>
          </div>
          {userDetail.name && (
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Name</p>
              <p className="text-black font-bold">{userDetail.name}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">User ID</p>
            <p className="text-black font-mono text-sm bg-gray-100 p-2 border border-black inline-block">{userDetail.id}</p>
          </div>
          <div>
            <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Created</p>
            <p className="text-black font-bold">
              {new Date(userDetail.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Statistics</p>
            <div className="flex gap-4 mt-2">
              <div className="p-3 border-2 border-black bg-gray-50 min-w-[100px] text-center">
                <p className="text-black font-black text-2xl">{userDetail.orders?.length || 0}</p>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase">Orders</p>
              </div>
              <div className="p-3 border-2 border-black bg-gray-50 min-w-[100px] text-center">
                <p className="text-black font-black text-2xl">{userDetail.profiles?.length || 0}</p>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase">eSIMs</p>
              </div>
              <div className="p-3 border-2 border-black bg-gray-50 min-w-[100px] text-center">
                <p className="text-black font-black text-2xl">{userDetail.topups?.length || 0}</p>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase">Top-ups</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {userDetail.orders && userDetail.orders.length > 0 && (
        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase">Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {userDetail.orders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-white border-2 border-black rounded-none flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <Button
                      variant="link"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className="p-0 h-auto text-primary hover:text-black font-bold uppercase underline"
                    >
                      {order.id.substring(0, 8)}...
                    </Button>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {planNames.get(order.planId) || order.planId} • {formatUsdDollars(order.amountCents / 100)}
                    </p>
                    {planNames.get(order.planId) && (
                      <p className="text-xs text-gray-400 font-mono">{order.planId}</p>
                    )}
                  </div>
                  {(() => {
                    const statusDisplay = getOrderStatusDisplay(order.status);
                    return <Badge className={`${statusDisplay.className} rounded-none border-black font-bold uppercase shadow-sm`}>{statusDisplay.label}</Badge>;
                  })()}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {userDetail.profiles && userDetail.profiles.length > 0 && (
        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase">eSIM Profiles</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {userDetail.profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-3 bg-white border-2 border-black rounded-none flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-black font-mono font-bold text-sm">{profile.iccid}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/esims/${profile.id}`)}
                    className="text-xs font-bold uppercase hover:bg-black hover:text-white border-2 border-transparent hover:border-black rounded-none"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {userDetail.topups && userDetail.topups.length > 0 && (
        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase">Top-ups</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {userDetail.topups.map((topup) => (
                <div
                  key={topup.id}
                  className="p-3 bg-white border-2 border-black rounded-none flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-black font-bold uppercase">
                      {planNames.get(topup.planCode) || topup.planCode}
                    </p>
                    {planNames.get(topup.planCode) && (
                      <p className="text-xs text-gray-500 font-mono">{topup.planCode}</p>
                    )}
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {formatUsdDollars(topup.amountCents / 100)} • {new Date(topup.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {(() => {
                    const statusDisplay = getTopUpStatusDisplay(topup.status);
                    return <Badge className={`${statusDisplay.className} rounded-none border-black font-bold uppercase shadow-sm`}>{statusDisplay.label}</Badge>;
                  })()}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
