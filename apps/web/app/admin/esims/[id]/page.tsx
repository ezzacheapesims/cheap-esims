"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Trash2, BarChart3 } from "lucide-react";
import { getEsimStatusDisplay, getPlanName, getTopUpStatusDisplay, getPlanNames } from "@/lib/admin-helpers";
import { formatUsdDollars } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface EsimProfile {
  id: string;
  iccid: string;
  esimTranNo: string;
  qrCodeUrl?: string;
  ac?: string;
  smdpStatus?: string;
  esimStatus?: string;
  totalVolume?: string | null;
  orderUsage?: string | null;
  expiredTime?: string | null;
  order: {
    id: string;
    planId: string;
    user: {
      email: string;
      name?: string;
    };
  };
  topups: Array<{
    id: string;
    planCode: string;
    amountCents: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminEsimDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const [esim, setEsim] = useState<EsimProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [planName, setPlanName] = useState<string>("");
  const [topUpPlanNames, setTopUpPlanNames] = useState<Map<string, string>>(new Map());
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [usageHistoryLoading, setUsageHistoryLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchEsim = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/esims/${params.id}`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          // Ensure arrays are always present
          setEsim({
            ...data,
            topups: data.topups || [],
          });
          
          // Fetch plan name
          if (data.order?.planId) {
            const name = await getPlanName(data.order.planId, apiUrl);
            setPlanName(name);
          }
          
          // Fetch top-up plan names
          if (data.topups && data.topups.length > 0) {
            const uniquePlanCodes = Array.from(new Set(data.topups.map((t: { planCode: string }) => t.planCode))) as string[];
            const names = await getPlanNames(uniquePlanCodes, apiUrl);
            setTopUpPlanNames(names);
          }
        }
        
        // Fetch usage history
        try {
          const resUsage = await fetch(`${apiUrl}/admin/esims/${params.id}/usage-history`, {
            headers: {
              "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            },
          });
          if (resUsage.ok) {
            const usageData = await resUsage.json();
            setUsageHistory(usageData);
          }
        } catch (e) {
          console.error("Failed to fetch usage history:", e);
        }
      } catch (error) {
        console.error("Failed to fetch esim:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && params.id) {
      fetchEsim();
    }
  }, [user, params.id, apiUrl]);

  const handleSync = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/esims/${params.id}/sync`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      if (res.ok) {
        alert("eSIM sync completed");
        // Reload esim data
        const res2 = await fetch(`${apiUrl}/admin/esims/${params.id}`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });
        if (res2.ok) {
          const data = await res2.json();
          // Ensure arrays are always present
          setEsim({
            ...data,
            topups: data.topups || [],
          });
        }
      }
    } catch (error) {
      console.error("Failed to sync esim:", error);
      alert("Failed to sync eSIM");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncUsage = async () => {
    setUsageHistoryLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/esims/${params.id}/sync-usage`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      if (res.ok) {
        alert("Usage synced successfully");
        // Reload usage history and esim data
        const [resHistory, resEsim] = await Promise.all([
          fetch(`${apiUrl}/admin/esims/${params.id}/usage-history`, {
            headers: {
              "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            },
          }),
          fetch(`${apiUrl}/admin/esims/${params.id}`, {
            headers: {
              "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
            },
          }),
        ]);
        
        if (resHistory.ok) {
          const usageData = await resHistory.json();
          setUsageHistory(usageData);
        }
        
        if (resEsim.ok) {
          const data = await resEsim.json();
          // Ensure arrays are always present
          setEsim({
            ...data,
            topups: data.topups || [],
          });
        }
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to sync usage" }));
        alert(error.error || "Failed to sync usage");
      }
    } catch (error) {
      console.error("Failed to sync usage:", error);
      alert("Failed to sync usage");
    } finally {
      setUsageHistoryLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/esims/${params.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      if (res.ok) {
        alert("eSIM profile deleted successfully");
        router.push("/admin/esims");
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to delete profile" }));
        alert(error.error || "Failed to delete eSIM profile");
      }
    } catch (error) {
      console.error("Failed to delete esim:", error);
      alert("Failed to delete eSIM profile");
    } finally {
      setActionLoading(false);
      setDeleteConfirm(false);
    }
  };

  const formatBytes = (bytes: string | null | undefined): string => {
    if (!bytes) return "N/A";
    try {
      const num = BigInt(bytes);
      const kb = BigInt(1024);
      const mb = kb * BigInt(1024);
      const gb = mb * BigInt(1024);
      
      if (num >= gb) return `${Number(num / gb)} GB`;
      if (num >= mb) return `${Number(num / mb)} MB`;
      if (num >= kb) return `${Number(num / kb)} KB`;
      return `${num} B`;
    } catch {
      return "N/A";
    }
  };

  if (loading || !esim) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 font-mono font-bold uppercase">Loading eSIM profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/esims")}
          className="text-gray-500 hover:text-black font-mono uppercase font-bold text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">eSIM Profile Details</h1>
          <p className="text-gray-600 font-mono font-bold uppercase text-sm">ICCID: {esim.iccid}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">ICCID</p>
              <p className="text-black font-mono text-sm font-bold bg-gray-100 p-2 border border-black inline-block">{esim.iccid}</p>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">esimTranNo</p>
              <p className="text-black font-mono text-sm font-bold">{esim.esimTranNo}</p>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Status</p>
              {(() => {
                const status = esim.esimStatus || esim.smdpStatus;
                const statusDisplay = getEsimStatusDisplay(status);
                return <Badge className={`mt-1 ${statusDisplay.className} rounded-none border-black shadow-sm font-bold uppercase`}>{statusDisplay.label}</Badge>;
              })()}
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Total Volume</p>
              <p className="text-black font-black text-xl">{formatBytes(esim.totalVolume)}</p>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Usage</p>
              <p className="text-black font-black text-xl">{formatBytes(esim.orderUsage)}</p>
            </div>
            {esim.expiredTime && (
              <div>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Expires</p>
                <p className="text-black font-bold">
                  {new Date(esim.expiredTime).toLocaleString()}
                </p>
              </div>
            )}
            {esim.ac && (
              <div>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Activation Code</p>
                <p className="text-black font-mono text-xs break-all bg-gray-100 p-2 border border-black">{esim.ac}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Order ID</p>
              <Button
                variant="link"
                onClick={() => router.push(`/admin/orders/${esim.order.id}`)}
                className="p-0 h-auto text-primary hover:text-black font-bold uppercase underline"
              >
                {esim.order.id}
              </Button>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Plan</p>
              <div className="text-black font-bold">
                {planName && planName !== esim.order.planId ? (
                  <>
                    <div className="uppercase">{planName}</div>
                    <div className="text-xs text-gray-500 font-mono mt-1">{esim.order.planId}</div>
                  </>
                ) : (
                  <span className="font-mono">{esim.order.planId}</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">User Email</p>
              <p className="text-black font-medium">{esim.order.user.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

              {esim.topups?.length > 0 && (
        <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
          <CardHeader className="bg-secondary border-b-2 border-black p-6">
            <CardTitle className="text-black font-black uppercase">Top-up History</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {esim.topups.map((topup) => (
                <div
                  key={topup.id}
                  className="p-3 bg-gray-50 rounded-none border-2 border-black flex items-center justify-between"
                >
                  <div>
                    <p className="text-black font-bold uppercase">
                      {topUpPlanNames.get(topup.planCode) || topup.planCode}
                    </p>
                    {topUpPlanNames.get(topup.planCode) && (
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

      {/* Usage History */}
      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-black font-black uppercase flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Data Usage History
            </CardTitle>
            <Button
              onClick={handleSyncUsage}
              disabled={usageHistoryLoading}
              variant="outline"
              size="sm"
              className="border-2 border-black rounded-none font-bold uppercase hover:bg-black hover:text-white"
            >
              {usageHistoryLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Usage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {usageHistory.length > 0 ? (
            <>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageHistory.map((record) => ({
                    date: new Date(record.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }),
                    usedGB: (Number(record.usedBytes) / (1024 * 1024 * 1024)).toFixed(2),
                    timestamp: record.recordedAt,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#000"
                      style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      stroke="#000"
                      style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
                      label={{ value: 'GB Used', angle: -90, position: 'insideLeft', style: { fill: '#000', fontWeight: 'bold' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #000',
                        borderRadius: '0px',
                        color: '#000',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        boxShadow: '4px 4px 0px 0px #000'
                      }}
                      formatter={(value: any) => [`${value} GB`, 'Data Used']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="usedGB" 
                      stroke="#98DE00" 
                      strokeWidth={4}
                      dot={{ fill: '#000', r: 4, stroke: '#000', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#98DE00', stroke: '#000', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Usage History Table */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {usageHistory.slice().reverse().map((record) => (
                  <div
                    key={record.id}
                    className="p-3 bg-gray-50 border-2 border-black flex items-center justify-between"
                  >
                    <div>
                      <p className="text-black font-black text-sm">
                        {formatBytes(record.usedBytes)}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {new Date(record.recordedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-mono font-bold uppercase">No usage history yet</p>
              <p className="text-xs mt-2 font-mono">Usage data will appear here after syncing</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
        <CardHeader className="bg-secondary border-b-2 border-black p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-black font-black uppercase">Actions</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleSync}
                disabled={actionLoading}
                variant="outline"
                className="border-2 border-black rounded-none font-bold uppercase hover:bg-black hover:text-white"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync
              </Button>
              <Button
                onClick={handleDelete}
                disabled={actionLoading}
                variant="outline"
                className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-none font-bold uppercase"
              >
                {actionLoading ? (
                  <Trash2 className="h-4 w-4 mr-2 animate-pulse" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {deleteConfirm ? "Confirm Delete" : "Delete"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {deleteConfirm && (
          <CardContent className="p-6">
            <div className="p-4 bg-red-50 border-2 border-red-500 rounded-none">
              <p className="text-sm text-red-600 font-bold uppercase mb-2">
                ⚠️ Warning: This will permanently delete this eSIM profile.
              </p>
              {esim.topups?.length > 0 && (
                <p className="text-xs text-red-500 font-mono mb-2">
                  This profile has {esim.topups.length} top-up(s) that will also be deleted.
                </p>
              )}
              <p className="text-xs text-red-500 font-mono">
                Click "Confirm Delete" again to proceed, or refresh the page to cancel.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
