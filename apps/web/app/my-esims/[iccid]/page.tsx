"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/PriceTag";
import { Wifi, Globe, HardDrive, Calendar, Clock, RefreshCw, ArrowLeft, FileText, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { safeFetch } from '@/lib/safe-fetch';
import { safeFetchBlob } from '@/lib/safe-fetch-blob';
import { QRDisplay } from "@/components/esim/qr-display";
import { InstallStepsDialog } from "@/components/esim/install-steps-dialog";
import { ExpiryCountdown } from "@/components/esim/expiry-countdown";
import { toast } from "@/components/ui/use-toast";

// Helper function to format user-friendly status
function getStatusDisplay(esimStatus: string | undefined): { label: string; color: string } {
  if (!esimStatus) return { label: "Pending", color: "bg-gray-100 text-gray-700 border-gray-200" };
  
  const statusMap: Record<string, { label: string; color: string }> = {
    GOT_RESOURCE: { label: "Ready", color: "bg-green-100 text-green-700 border-green-200" },
    IN_USE: { label: "Active", color: "bg-blue-100 text-blue-700 border-blue-200" },
    EXPIRED: { label: "Expired", color: "bg-red-100 text-red-700 border-red-200" },
    SUSPENDED: { label: "Suspended", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  };
  
  return statusMap[esimStatus] || { label: esimStatus, color: "bg-gray-100 text-gray-700 border-gray-200" };
}

// Helper function to format bytes to readable format
function formatBytes(bytes: string | number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "N/A";
  try {
    const num = typeof bytes === 'string' 
      ? (bytes === "0" || bytes === "" ? 0 : Number(bytes))
      : bytes;
    if (isNaN(num) || num < 0) return "N/A";
    if (num === 0) return "0 B";
    
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    let sizeIndex = 0;
    let size = num;
    while (size >= k && sizeIndex < sizes.length - 1) {
      size /= k;
      sizeIndex++;
    }
    return `${size.toFixed(2)} ${sizes[sizeIndex]}`;
  } catch (e) {
    return "N/A";
  }
}

export default function EsimDetailPage() {
  const { iccid } = useParams();
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  
  // State to store plan details for top-ups
  const [planDetailsMap, setPlanDetailsMap] = useState<Record<string, any>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Fetch Profile
      const data = await safeFetch<any>(`${apiUrl}/esim/${iccid}`, { showToast: false });
      setProfile(data);
      
      // Fetch usage history if profile has an ID
      if (data.id) {
        try {
          const usageData = await safeFetch<any[]>(`${apiUrl}/esim/usage/history/${data.id}?limit=100`, { showToast: false });
          setUsageHistory(usageData || []);
        } catch (e) {
          console.error('Failed to fetch usage history:', e);
        }
      }

      // Fetch History (top-ups)
      const topupData = await safeFetch<any[]>(`${apiUrl}/esim/topups?iccid=${iccid}`, { showToast: false });
      setHistory(topupData || []);
      
      // Fetch plan details for each top-up
      const planCodes = Array.from(new Set((topupData || []).map((item: any) => item.planCode).filter(Boolean))) as string[];
      const planDetails: Record<string, any> = {};
      
      await Promise.all(
        planCodes.map(async (planCode: string) => {
          try {
            const plan = await safeFetch<any>(`${apiUrl}/plans/${planCode}`, { showToast: false });
            planDetails[planCode] = plan;
          } catch (e) {
            console.error(`Failed to fetch plan ${planCode}:`, e);
          }
        })
      );
      
      setPlanDetailsMap(planDetails);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (iccid) fetchData();
  }, [iccid]);

  useEffect(() => {
    if (!profile || !polling) return;

    const orderStatus = profile.order?.status;
    const hasQR = profile.qrCodeUrl || profile.ac;

    if (orderStatus === "provisioning" || orderStatus === "PROVISIONING" || (!hasQR && (orderStatus === "paid" || orderStatus === "PAID"))) {
      const interval = setInterval(async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        try {
          const data = await safeFetch<any>(`${apiUrl}/esim/${iccid}`, { showToast: false });
          const newHasQR = data.qrCodeUrl || data.ac;
          
          if (newHasQR && !hasQR) {
            toast({
              title: "QR Code Ready!",
              description: "Your eSIM QR code is now available for installation.",
            });
            setProfile(data);
            setPolling(false);
          } else {
            setProfile(data);
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 3000);

      return () => clearInterval(interval);
    } else {
      setPolling(false);
    }
  }, [profile, polling, iccid]);

  useEffect(() => {
    if (profile) {
      const orderStatus = profile.order?.status;
      const hasQR = profile.qrCodeUrl || profile.ac;
      
      if ((orderStatus === "provisioning" || orderStatus === "PROVISIONING" || (!hasQR && (orderStatus === "paid" || orderStatus === "PAID"))) && !polling) {
        setPolling(true);
      }
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-500 font-bold">Loading details...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-red-500 font-bold text-xl mb-2">Error</div>
        <p className="text-gray-500 font-bold">Profile not found</p>
      </div>
    );
  }

  const sizeGB = profile.totalVolume ? formatBytes(profile.totalVolume) : "0 GB";
  
  // Format expiry date properly
  const formatExpiryDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return "N/A";
    }
  };
  
  const expiryDate = formatExpiryDate(profile.expiredTime);
  const statusDisplay = getStatusDisplay(profile.esimStatus);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
      {/* Back Button */}
      <Link href="/my-esims" className="inline-flex items-center text-gray-500 hover:text-black transition-colors px-2 py-1 font-bold text-sm mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to My eSIMs
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">eSIM Details</h1>
        <Button variant="outline" size="icon" onClick={fetchData} className="bg-white border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all text-gray-700">
           <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <Wifi className="h-64 w-64 text-black" />
          </div>
          
          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                  <Badge className={`${getStatusDisplay(profile.esimStatus).color} border rounded-full font-bold px-3 py-1`}>
                      {getStatusDisplay(profile.esimStatus).label}
                  </Badge>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-sm font-bold rounded-full">
                      eSIM
                  </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {profile.planDetails?.name || profile.iccid}
              </h1>
              <div className="flex flex-wrap gap-4">
                 <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                    <Globe className="h-4 w-4 text-gray-700" />
                    <span className="text-gray-900 font-bold text-sm">{profile.planDetails?.location || "Global"} Region</span>
                 </div>
                 <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                    <Wifi className="h-4 w-4 text-gray-700" />
                    <span className="text-gray-900 font-bold text-sm">4G/LTE Speed</span>
                 </div>
              </div>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
            <HardDrive className="h-6 w-6 text-gray-900 mb-3" />
            <span className="text-gray-500 text-xs font-bold mb-1 uppercase">Data Balance</span>
            <span className="text-xl md:text-2xl font-bold text-gray-900">{sizeGB}</span>
         </div>
         <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
            <Calendar className="h-6 w-6 text-gray-900 mb-3" />
            <span className="text-gray-500 text-xs font-bold mb-1 uppercase">Expires</span>
            <ExpiryCountdown 
              expiry={profile.expiredTime} 
              iccid={profile.iccid}
              onExpired={fetchData}
              userEmail={user?.primaryEmailAddress?.emailAddress || undefined}
              className="text-xl md:text-2xl font-bold text-gray-900 !text-gray-900"
            />
         </div>
         <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
            <span className="text-gray-500 text-xs font-bold mb-1 uppercase">Status</span>
            <span className="text-xl md:text-2xl font-bold text-gray-900">{statusDisplay.label}</span>
         </div>
         <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
            <span className="text-gray-500 text-xs font-bold mb-1 uppercase">ICCID</span>
            <span className="text-xs md:text-sm font-mono font-bold text-gray-900 truncate max-w-full px-2 bg-gray-50 py-1 rounded-md border border-gray-200">{profile.iccid}</span>
         </div>
      </div>

      {/* QR Code Display Section */}
      {(profile.qrCodeUrl || profile.ac || polling) && (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <QrCode className="h-6 w-6" />
                Install eSIM
              </h3>
              <p className="text-gray-600 font-medium text-sm">
                {polling && !profile.qrCodeUrl && !profile.ac
                  ? "Your eSIM is being prepared. This may take a few moments..."
                  : "Scan the QR code with your device to install the eSIM profile"}
              </p>
            </div>
            {(profile.qrCodeUrl || profile.ac) && (
              <InstallStepsDialog
                activationCode={profile.ac}
                smdpAddress={profile.ac?.split("$")[1] || null}
              />
            )}
          </div>
          
          {polling && !profile.qrCodeUrl && !profile.ac ? (
            <div className="bg-gray-50 border border-gray-200 border-dashed p-12 rounded-xl">
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                <RefreshCw className="h-12 w-12 animate-spin text-gray-400" />
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Preparing Your eSIM</h4>
                  <p className="text-gray-600 font-medium text-sm">
                    We're preparing your eSIM QR code. This usually takes less than a minute.
                    <br />
                    The page will update automatically when ready.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <QRDisplay
              qrCodeUrl={profile.qrCodeUrl}
              activationCode={profile.ac}
              iccid={profile.iccid}
              esimStatus={profile.esimStatus}
              smdpStatus={profile.smdpStatus}
              planName={profile.planDetails?.name}
              showDeviceCheck={true}
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-4">
        {profile.order?.id && (
          <Button 
            variant="secondary"
            className="h-14 px-8 text-lg font-bold bg-white text-gray-900 border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all w-full sm:w-auto"
            onClick={async () => {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
              const userEmail = user?.primaryEmailAddress?.emailAddress || '';
              const receiptUrl = `${apiUrl}/orders/${profile.order.id}/receipt`;
              
              try {
                const blob = await safeFetchBlob(receiptUrl, {
                  headers: {
                    'x-user-email': userEmail,
                  },
                });
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-${profile.order.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (err) {
                console.error('Failed to download receipt:', err);
              }
            }}
          >
            <FileText className="h-5 w-5 mr-2" />
            Download Receipt
          </Button>
        )}
        {/* Only show top-up button if plan supports top-ups (supportTopUpType === 2) */}
        {profile?.planDetails?.supportTopUpType === 2 ? (
          <Link href={`/my-esims/${iccid}/topup`} className="w-full sm:w-auto">
            <Button 
               className="h-14 px-8 text-lg font-bold bg-primary text-primary-foreground border-0 rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all w-full"
            >
               Top Up Now
            </Button>
          </Link>
        ) : profile?.planDetails?.supportTopUpType === 1 ? (
          <div className="w-full sm:w-auto">
            <Button 
               disabled
               className="h-14 px-8 text-lg font-bold bg-gray-100 text-gray-400 border-0 rounded-full shadow-none w-full cursor-not-allowed"
            >
               Top-Up Not Available
            </Button>
            <p className="text-xs text-gray-500 mt-2 font-medium text-center">
              This plan does not support top-ups
            </p>
          </div>
        ) : null}
      </div>

      {/* Data Usage History Graph */}
      {usageHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">Data Usage History</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageHistory.map((record) => ({
                date: new Date(record.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                usedGB: (Number(record.usedBytes) / (1024 * 1024 * 1024)).toFixed(2),
                timestamp: record.recordedAt,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: '500' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: '500' }}
                  label={{ value: 'GB Used', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontWeight: '500' } }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#1f2937',
                    fontWeight: '500',
                  }}
                  itemStyle={{ color: '#1f2937' }}
                  formatter={(value: any) => [`${value} GB`, 'Data Used']}
                />
                <Line 
                  type="monotone" 
                  dataKey="usedGB" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  dot={{ fill: '#fff', r: 4, stroke: 'var(--primary)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'var(--primary)', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top-Up History */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
         <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">Top-Up History</h3>
         {history.length > 0 ? (
             <div className="space-y-4">
                 {history.map((item: any) => {
                   const planDetails = planDetailsMap[item.planCode];
                   const planName = planDetails?.name || item.planCode;
                   
                   return (
                     <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all gap-4">
                         <div className="flex items-center gap-4">
                             <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                 <Clock className="h-6 w-6 text-primary" />
                             </div>
                             <div>
                               <p className="font-bold text-gray-900 text-lg leading-tight">{planName}</p>
                               <p className="text-xs font-medium text-gray-500">
                                 {(() => {
                                   if (!item.createdAt) return 'N/A';
                                   try {
                                     const date = new Date(item.createdAt);
                                     if (isNaN(date.getTime())) return 'N/A';
                                     return date.toLocaleDateString('en-US', { 
                                       year: 'numeric', 
                                       month: 'short', 
                                       day: 'numeric' 
                                     });
                                   } catch (e) {
                                     return 'N/A';
                                   }
                                 })()}
                               </p>
                             </div>
                         </div>
                         <div className="text-right flex items-center justify-between sm:block w-full sm:w-auto mt-2 sm:mt-0">
                             <PriceTag price={item.amountCents / 100} currencyCode={item.currency} className="text-xl font-bold text-gray-900 block" />
                             <Badge variant="outline" className={`
                               ${item.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : 
                                 item.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                                 'bg-red-100 text-red-700 border-red-200'}
                               border rounded-full font-bold px-2 py-0.5 mt-1
                             `}>
                               {item.status}
                             </Badge>
                         </div>
                     </div>
                   );
                 })}
             </div>
         ) : (
             <div className="flex items-center justify-center p-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-500 font-medium">
                No top-up history found.
             </div>
         )}
      </div>
    </div>
  );
}

