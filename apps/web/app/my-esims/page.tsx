"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Signal, RefreshCw, Calendar, HardDrive, Download, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { safeFetch } from "@/lib/safe-fetch";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpiryCountdown } from "@/components/esim/expiry-countdown";
import { getTimeRemaining, getUrgencyLevel } from "@/lib/format-expiry";

interface PlanDetails {
  name?: string;
  packageCode?: string;
  locationCode?: string;
  volume?: number;
  duration?: number;
  durationUnit?: string;
}

interface EsimProfile {
  id: string;
  iccid: string;
  status?: string;
  esimStatus?: string;
  planName?: string;
  totalVolume?: string | null;
  orderUsage?: string | null;
  qrCodeUrl?: string | null;
  ac?: string | null;
  smdpStatus?: string | null;
  expiredTime?: string | null;
  esimTranNo?: string;
  planDetails?: PlanDetails;
  order?: {
    id: string;
    planId: string;
    status: string;
  };
}

function getStatusDisplay(esimStatus: string | undefined): { label: string; color: string } {
  if (!esimStatus) return { label: "Pending", color: "bg-gray-200 text-gray-600 border-gray-400" };
  
  const statusMap: Record<string, { label: string; color: string }> = {
    GOT_RESOURCE: { label: "Ready", color: "bg-green-400 text-black border-black" },
    IN_USE: { label: "Active", color: "bg-primary text-black border-black" },
    EXPIRED: { label: "Expired", color: "bg-red-500 text-white border-black" },
    SUSPENDED: { label: "Suspended", color: "bg-yellow-400 text-black border-black" },
  };
  
  return statusMap[esimStatus] || { label: esimStatus, color: "bg-gray-200 text-gray-600 border-gray-400" };
}

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
    
    const decimals = sizeIndex === 0 ? 0 : 2;
    return `${size.toFixed(decimals)} ${sizes[sizeIndex]}`;
  } catch (e) {
    console.error('[formatBytes] Error formatting bytes:', bytes, e);
    return "N/A";
  }
}

function formatPlanName(planDetails: PlanDetails | undefined, planId?: string): string {
  if (planDetails?.name) {
    return planDetails.name;
  }
  
  if (planDetails) {
    const location = planDetails.locationCode || '';
    const volume = planDetails.volume ? formatBytes(planDetails.volume) : '';
    const duration = planDetails.duration ? `${planDetails.duration} ${planDetails.durationUnit || 'Days'}` : '';
    
    const parts = [location, volume, duration].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : planId || 'Plan';
  }
  
  return planId || 'Unknown Plan';
}

export default function MyEsimsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [esims, setEsims] = useState<EsimProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEsim, setSelectedEsim] = useState<EsimProfile | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchEsims = async () => {
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
          setLoading(false);
          return;
        }

        const data = await safeFetch<EsimProfile[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/user/esims?email=${encodeURIComponent(userEmail)}`,
          { showToast: false }
        );
        setEsims(data || []);
      } catch (e) {
        console.error('[MY-ESIMS] Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEsims();
  }, [user, isLoaded]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black">My eSIMs</h1>
        <Button 
          variant="outline" 
          size="icon" 
          className="border-2 border-black rounded-none shadow-hard-sm hover:shadow-none hover:bg-black hover:text-white transition-all"
          onClick={async () => {
            setLoading(true);
            const userEmail = user?.primaryEmailAddress?.emailAddress;
            if (userEmail) {
              try {
                const data = await safeFetch<EsimProfile[]>(
                  `${process.env.NEXT_PUBLIC_API_URL}/user/esims?email=${encodeURIComponent(userEmail)}`,
                  { showToast: false }
                );
                setEsims(data || []);
              } catch (e) {
                console.error('[MY-ESIMS] Refresh error:', e);
              }
            }
            setLoading(false);
          }}
        >
           <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {[...Array(3)].map((_, i) => (
             <Skeleton key={i} className="h-96 w-full rounded-none bg-gray-200" />
           ))}
        </div>
      ) : esims.length === 0 ? (
        <EmptyState
          title="NO ESIMS FOUND"
          description="Get your first travel data plan today and stay connected anywhere in the world."
          icon={Signal}
          action={{
            label: "BROWSE PLANS",
            onClick: () => window.location.href = "/countries"
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {esims.map((esim) => {
             const status = getStatusDisplay(esim.esimStatus);
             const timeRemaining = getTimeRemaining(esim.expiredTime);
             const urgency = getUrgencyLevel(timeRemaining);
             const isExpired = timeRemaining === null || timeRemaining.totalMs <= 0;
             
             return (
               <Link key={esim.id} href={`/my-esims/${esim.iccid}`} className="block h-full">
                 <div className="h-full bg-white border-2 border-black shadow-hard hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex flex-col justify-between">
                    <div className="bg-secondary border-b-2 border-black p-4 flex items-center justify-between">
                       <Badge className={`rounded-none border-2 px-2 py-0.5 font-bold uppercase ${status.color}`}>
                          {status.label}
                       </Badge>
                       {esim.expiredTime && (
                           isExpired ? (
                                <span className="text-xs font-mono font-bold text-red-600 uppercase flex items-center gap-1 bg-red-100 px-2 py-0.5 border border-red-600">
                                  <AlertCircle className="h-3 w-3" /> Expired
                                </span>
                           ) : (
                                <span className="text-xs font-mono font-bold text-gray-600 uppercase flex items-center gap-1 bg-white px-2 py-0.5 border border-black">
                                  <Calendar className="h-3 w-3" />
                                  <ExpiryCountdown expiry={esim.expiredTime} iccid={esim.iccid} className="text-xs" />
                                </span>
                           )
                       )}
                    </div>

                    <div className="p-6 space-y-4 flex-grow">
                        <div>
                          <p className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">Plan</p>
                          <h3 className="font-black text-2xl uppercase leading-none mb-1">
                            {formatPlanName(esim.planDetails, esim.order?.planId)}
                          </h3>
                          {esim.planDetails?.locationCode && (
                            <p className="text-sm font-bold bg-black text-white inline-block px-1 uppercase">
                              {esim.planDetails.locationCode}
                            </p>
                          )}
                        </div>

                        <div className="space-y-4 pt-4 border-t-2 border-dashed border-gray-300">
                           <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-mono text-gray-500 uppercase">ICCID</p>
                                <p className="font-mono text-xs font-bold truncate max-w-[150px]">{esim.iccid}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-mono text-gray-500 uppercase">Data</p>
                                <p className="font-black text-lg">{formatBytes(esim.totalVolume)}</p>
                              </div>
                           </div>

                           {/* Usage Bar */}
                           {esim.orderUsage !== null && esim.orderUsage !== undefined && esim.totalVolume && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono font-bold uppercase">
                                   <span>Used: {formatBytes(esim.orderUsage)}</span>
                                   <span>Remaining: {formatBytes(Number(esim.totalVolume) - Number(esim.orderUsage))}</span>
                                </div>
                                <div className="h-3 w-full border-2 border-black bg-white p-0.5">
                                   <div 
                                      className="h-full bg-primary"
                                      style={{ width: `${Math.min(100, (Number(esim.orderUsage) / Number(esim.totalVolume)) * 100)}%` }}
                                   />
                                </div>
                              </div>
                           )}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t-2 border-black grid grid-cols-2 gap-3">
                        {esim.qrCodeUrl ? (
                           <Button 
                             className="w-full bg-black text-white hover:bg-white hover:text-black border-2 border-black rounded-none font-bold uppercase text-xs"
                             onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               setSelectedEsim(esim);
                             }}
                           >
                              <QrCode className="mr-2 h-3 w-3" /> QR Code
                           </Button>
                        ) : <div />}
                        
                        <Button 
                           className="w-full bg-primary text-black hover:bg-black hover:text-white border-2 border-black rounded-none font-bold uppercase text-xs"
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             router.push(`/my-esims/${esim.iccid}/topup`);
                           }}
                        >
                           Top Up
                        </Button>
                    </div>
                 </div>
               </Link>
             );
           })}
        </div>
      )}
      
      {/* QR Code Modal */}
      {selectedEsim && selectedEsim.qrCodeUrl && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEsim(null)}
        >
          <div 
            className="bg-white border-4 border-black p-6 max-w-md w-full shadow-hard relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black uppercase">Install eSIM</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEsim(null)}
                className="hover:bg-red-500 hover:text-white rounded-none h-8 w-8 border border-black"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm font-mono text-gray-600 border-l-4 border-black pl-3 py-1 bg-gray-50">
                Scan this QR code with your device settings to install the eSIM profile.
              </p>
              
              <div className="bg-white p-4 border-2 border-black flex items-center justify-center">
                <Image
                  src={selectedEsim.qrCodeUrl}
                  alt="eSIM QR Code"
                  width={300}
                  height={300}
                  className="w-full h-auto"
                />
              </div>
              
              {selectedEsim.ac && (
                <div className="space-y-2">
                   <p className="text-xs font-bold uppercase">Manual Activation Code:</p>
                   <div className="p-3 bg-gray-100 border-2 border-black flex items-center justify-between">
                      <code className="font-mono text-xs break-all">{selectedEsim.ac}</code>
                      <Button
                         size="sm"
                         variant="ghost"
                         onClick={async () => {
                           if (selectedEsim.ac) {
                             await navigator.clipboard.writeText(selectedEsim.ac);
                             setCopied(true);
                             setTimeout(() => setCopied(false), 2000);
                           }
                         }}
                         className="h-6 px-2 hover:bg-black hover:text-white"
                      >
                         {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                   </div>
                </div>
              )}
              
              <Button
                className="w-full bg-black text-white hover:bg-primary hover:text-black border-2 border-black rounded-none font-bold uppercase py-6"
                onClick={() => setSelectedEsim(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
