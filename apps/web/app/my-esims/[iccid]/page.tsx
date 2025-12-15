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
  if (!esimStatus) return { label: "Pending", color: "bg-gray-100 text-gray-800 border-gray-600" };
  
  const statusMap: Record<string, { label: string; color: string }> = {
    GOT_RESOURCE: { label: "Ready", color: "bg-green-100 text-green-800 border-green-600" },
    IN_USE: { label: "Active", color: "bg-blue-100 text-blue-800 border-blue-600" },
    EXPIRED: { label: "Expired", color: "bg-red-100 text-red-800 border-red-600" },
    SUSPENDED: { label: "Suspended", color: "bg-yellow-100 text-yellow-800 border-yellow-600" },
  };
  
  return statusMap[esimStatus] || { label: esimStatus, color: "bg-gray-100 text-gray-800 border-gray-600" };
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
        <p className="text-black font-mono uppercase font-bold">Loading details...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-red-500 font-black uppercase text-xl mb-2">Error</div>
        <p className="text-black font-mono font-bold uppercase">Profile not found</p>
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
      <Link href="/my-esims" className="inline-flex items-center text-black hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-all px-2 py-1 font-mono uppercase font-bold text-sm mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to My eSIMs
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-black uppercase tracking-tighter">eSIM Details</h1>
        <Button variant="outline" size="icon" onClick={fetchData} className="bg-white border-2 border-black rounded-none shadow-hard hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-black">
           <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Header Card */}
      <div className="bg-white border-2 border-black rounded-none p-8 shadow-hard relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <Wifi className="h-64 w-64 text-black" />
          </div>
          
          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                  <Badge className={`${getStatusDisplay(profile.esimStatus).color} border-2 rounded-none font-bold uppercase px-3 py-1 shadow-hard-sm`}>
                      {getStatusDisplay(profile.esimStatus).label}
                  </Badge>
                  <span className="px-3 py-1 bg-purple-100 text-purple-900 border-2 border-purple-600 text-sm font-bold uppercase rounded-none shadow-hard-sm">
                      eSIM
                  </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-black uppercase mb-6 leading-tight">
                {profile.planDetails?.name || profile.iccid}
              </h1>
              <div className="flex flex-wrap gap-6">
                 <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 shadow-hard-sm">
                    <Globe className="h-4 w-4 text-black" />
                    <span className="text-black font-bold uppercase text-sm">{profile.planDetails?.location || "Global"} Region</span>
                 </div>
                 <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 shadow-hard-sm">
                    <Wifi className="h-4 w-4 text-black" />
                    <span className="text-black font-bold uppercase text-sm">4G/LTE Speed</span>
                 </div>
              </div>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white rounded-none p-5 border-2 border-black shadow-hard flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
            <HardDrive className="h-6 w-6 text-black mb-3" />
            <span className="text-gray-500 font-mono uppercase text-xs font-bold mb-1">Data Balance</span>
            <span className="text-xl md:text-2xl font-black text-black uppercase">{sizeGB}</span>
         </div>
         <div className="bg-white rounded-none p-5 border-2 border-black shadow-hard flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
            <Calendar className="h-6 w-6 text-black mb-3" />
            <span className="text-gray-500 font-mono uppercase text-xs font-bold mb-1">Expires</span>
            <ExpiryCountdown 
              expiry={profile.expiredTime} 
              iccid={profile.iccid}
              onExpired={fetchData}
              className="text-xl md:text-2xl font-black text-black uppercase !text-black"
            />
         </div>
         <div className="bg-white rounded-none p-5 border-2 border-black shadow-hard flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
            <span className="text-gray-500 font-mono uppercase text-xs font-bold mb-1">Status</span>
            <span className="text-xl md:text-2xl font-black text-black uppercase">{statusDisplay.label}</span>
         </div>
         <div className="bg-white rounded-none p-5 border-2 border-black shadow-hard flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
            <span className="text-gray-500 font-mono uppercase text-xs font-bold mb-1">ICCID</span>
            <span className="text-xs md:text-sm font-mono font-bold text-black truncate max-w-full px-2 bg-gray-100 py-1 border border-black">{profile.iccid}</span>
         </div>
      </div>

      {/* QR Code Display Section */}
      {(profile.qrCodeUrl || profile.ac || polling) && (
        <div className="bg-white rounded-none p-8 border-2 border-black shadow-hard">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-black text-black uppercase mb-2 flex items-center gap-2">
                <QrCode className="h-6 w-6" />
                Install eSIM
              </h3>
              <p className="text-gray-600 font-mono font-bold text-sm uppercase">
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
            <div className="bg-gray-50 border-2 border-black border-dashed p-12 rounded-none">
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                <RefreshCw className="h-12 w-12 animate-spin text-black" />
                <div>
                  <h4 className="text-xl font-black text-black uppercase mb-2">Preparing Your eSIM</h4>
                  <p className="text-gray-600 font-mono text-sm font-bold">
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
            className="h-14 px-8 text-lg font-black uppercase bg-white text-black border-2 border-black rounded-none shadow-hard hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all w-full sm:w-auto"
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
        <Link href={`/my-esims/${iccid}/topup`} className="w-full sm:w-auto">
          <Button 
             className="h-14 px-8 text-lg font-black uppercase bg-primary text-black border-2 border-black rounded-none shadow-hard hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all w-full"
          >
             Top Up Now
          </Button>
        </Link>
      </div>

      {/* Data Usage History Graph */}
      {usageHistory.length > 0 && (
        <div className="bg-white rounded-none p-8 border-2 border-black shadow-hard">
          <h3 className="text-xl font-black text-black uppercase mb-6 border-b-2 border-black pb-4">Data Usage History</h3>
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
                  stroke="#000"
                  style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#000"
                  style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
                  label={{ value: 'GB Used', angle: -90, position: 'insideLeft', style: { fill: '#000', fontWeight: 'bold', textTransform: 'uppercase' } }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #000',
                    borderRadius: '0px',
                    boxShadow: '4px 4px 0px 0px #000',
                    color: '#000',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                  itemStyle={{ color: '#000' }}
                  formatter={(value: any) => [`${value} GB`, 'DATA USED']}
                />
                <Line 
                  type="step" 
                  dataKey="usedGB" 
                  stroke="#000" 
                  strokeWidth={3}
                  dot={{ fill: '#000', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'var(--primary)', stroke: '#000', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top-Up History */}
      <div className="bg-white rounded-none p-8 border-2 border-black shadow-hard">
         <h3 className="text-xl font-black text-black uppercase mb-6 border-b-2 border-black pb-4">Top-Up History</h3>
         {history.length > 0 ? (
             <div className="space-y-4">
                 {history.map((item: any) => {
                   const planDetails = planDetailsMap[item.planCode];
                   const planName = planDetails?.name || item.planCode;
                   
                   return (
                     <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border-2 border-black shadow-hard-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all gap-4">
                         <div className="flex items-center gap-4">
                             <div className="h-12 w-12 bg-primary border-2 border-black flex items-center justify-center shrink-0">
                                 <Clock className="h-6 w-6 text-black" />
                             </div>
                             <div>
                               <p className="font-black text-black uppercase text-lg leading-tight">{planName}</p>
                               <p className="text-xs font-mono font-bold text-gray-500 uppercase">
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
                             <PriceTag price={item.amountCents / 100} currencyCode={item.currency} className="text-xl font-black text-black block" />
                             <Badge variant="outline" className={`
                               ${item.status === 'completed' ? 'bg-green-100 text-green-800 border-green-600' : 
                                 item.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-600' : 
                                 'bg-red-100 text-red-800 border-red-600'}
                               border-2 rounded-none font-bold uppercase px-2 py-0.5 mt-1
                             `}>
                               {item.status}
                             </Badge>
                         </div>
                     </div>
                   );
                 })}
             </div>
         ) : (
             <div className="flex items-center justify-center p-12 bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 font-mono uppercase font-bold">
                No top-up history found.
             </div>
         )}
      </div>
    </div>
  );
}

