"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Signal, RefreshCw, Calendar, HardDrive, Download, Copy, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, Star, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { safeFetch } from "@/lib/safe-fetch";
import { generateEsimInstallLink, isMobileDevice } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpiryCountdown } from "@/components/esim/expiry-countdown";
import { getTimeRemaining, getUrgencyLevel } from "@/lib/format-expiry";
import { getPlanFlagLabels } from "@/lib/plan-flags";
import { isDailyUnlimitedPlan } from "@/lib/plan-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

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
    // Clean flags from plan name for display
    const flagInfo = getPlanFlagLabels({ name: planDetails.name });
    let name = flagInfo.cleanedName || planDetails.name;
    
    // Check if it's an unlimited plan (2GB + FUP1Mbps)
    const isUnlimitedPlan = planDetails.volume && isDailyUnlimitedPlan({
      volume: planDetails.volume,
      name: planDetails.name,
      duration: planDetails.duration || 0,
      durationUnit: planDetails.durationUnit || 'day',
    } as any);
    
    // Replace "2GB" with "Unlimited" for unlimited plans
    if (isUnlimitedPlan) {
      name = name
        .replace(/\b2\s*gb\b/gi, 'Unlimited')
        .replace(/\b2gb\b/gi, 'Unlimited')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return name;
  }
  
  if (planDetails) {
    const location = planDetails.locationCode || '';
    // Check if it's an unlimited plan
    const isUnlimitedPlan = planDetails.volume && isDailyUnlimitedPlan({
      volume: planDetails.volume,
      name: planDetails.name || '',
      duration: planDetails.duration || 0,
      durationUnit: planDetails.durationUnit || 'day',
    } as any);
    
    const volume = isUnlimitedPlan ? 'Unlimited' : (planDetails.volume ? formatBytes(planDetails.volume) : '');
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
  const [selectedEsimForReview, setSelectedEsimForReview] = useState<EsimProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) return;

    const fetchEsims = async () => {
      try {
        // Get email from authenticated user, URL params, or localStorage (for guest access)
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('email');
        const storedEmail = localStorage.getItem('guest_checkout_email');
        
        let userEmail: string | undefined;
        
        if (user?.primaryEmailAddress?.emailAddress) {
          // Authenticated user - use their email
          userEmail = user.primaryEmailAddress.emailAddress;
        } else if (emailParam) {
          // Guest access via URL parameter
          userEmail = emailParam;
          // Store for future use
          localStorage.setItem('guest_checkout_email', emailParam);
        } else if (storedEmail) {
          // Guest access via stored email
          userEmail = storedEmail;
        }

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
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My eSIMs' }]} />
      
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black">My eSIMs</h1>
        <Button 
          variant="outline" 
          size="icon" 
          className="border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          onClick={async () => {
            setLoading(true);
            // Get email from authenticated user, URL params, or localStorage
            const urlParams = new URLSearchParams(window.location.search);
            const emailParam = urlParams.get('email');
            const storedEmail = localStorage.getItem('guest_checkout_email');
            
            const userEmail = user?.primaryEmailAddress?.emailAddress || emailParam || storedEmail;
            
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

      {/* Continue Shopping Link */}
      <Link href="/" className="block group">
        <div className="bg-black text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/10 group-hover:bg-white/20 p-3 rounded-xl transition-colors">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Continue Shopping</h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Browse more destinations</p>
            </div>
          </div>
          <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform relative z-10" />
        </div>
      </Link>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {[...Array(3)].map((_, i) => (
             <Skeleton key={i} className="h-96 w-full rounded-2xl bg-gray-100" />
           ))}
        </div>
      ) : esims.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Signal className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-black mb-2">No eSIMs Found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Get your first travel data plan today and stay connected anywhere in the world.</p>
          <Button 
            className="bg-black text-white hover:bg-gray-800 rounded-full font-bold px-8 shadow-lg hover:shadow-xl transition-all"
            onClick={() => window.location.href = "/countries"}
          >
            Browse Plans
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {esims.map((esim) => {
             const status = getStatusDisplay(esim.esimStatus);
             const timeRemaining = getTimeRemaining(esim.expiredTime);
             const urgency = getUrgencyLevel(timeRemaining);
             const isExpired = timeRemaining === null || timeRemaining.totalMs <= 0;
             
             return (
               <Link key={esim.id} href={`/my-esims/${esim.iccid}`} className="block h-full group">
                 <div className="h-full bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between overflow-hidden p-6">
                    {/* Header: Status & Expiry */}
                    <div className="flex items-center justify-between mb-6">
                       <Badge className={`rounded-full px-4 py-1 font-bold uppercase text-xs border-0 shadow-none ${
                         status.label === 'Ready' || status.label === 'Active' ? 'bg-green-400 text-black hover:bg-green-500' : 
                         status.label === 'Expired' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 
                         'bg-gray-100 text-gray-600 hover:bg-gray-200'
                       }`}>
                          {status.label}
                       </Badge>
                       
                       {esim.expiredTime && (
                           <span className="text-xs font-medium text-green-600 border border-green-200 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1.5">
                             <Calendar className="h-3 w-3" />
                             <ExpiryCountdown expiry={esim.expiredTime} iccid={esim.iccid} className="text-xs" />
                           </span>
                       )}
                    </div>

                    {/* Body: Plan Info */}
                    <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">PLAN</p>
                          <h3 className="font-bold text-2xl text-black leading-tight mb-3">
                            {formatPlanName(esim.planDetails, esim.order?.planId)}
                          </h3>
                          {esim.planDetails?.locationCode && (
                            <div className="bg-black text-white h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs">
                              {esim.planDetails.locationCode.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-dashed border-gray-200 my-4"></div>

                    {/* Details: ICCID & Data */}
                    <div className="flex items-end justify-between mb-6">
                        <div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ICCID</p>
                           <p className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded w-fit max-w-[140px] truncate">
                             {esim.iccid}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">DATA</p>
                           <p className="font-bold text-xl text-black">
                             {esim.planDetails && isDailyUnlimitedPlan({
                               volume: esim.planDetails.volume || 0,
                               name: esim.planDetails.name || '',
                               duration: esim.planDetails.duration || 0,
                               durationUnit: esim.planDetails.durationUnit || 'day',
                             } as any) ? 'Unlimited' : formatBytes(esim.totalVolume)}
                           </p>
                        </div>
                    </div>

                    {/* Footer: Actions */}
                    <div className="grid grid-cols-3 gap-2 mt-auto pt-2">
                        {esim.qrCodeUrl ? (
                           <Button 
                             variant="outline"
                             className="w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-black rounded-xl font-bold uppercase text-[10px] h-10 tracking-wide"
                             onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               setSelectedEsim(esim);
                             }}
                           >
                              <QrCode className="mr-1 h-3 w-3" /> QR
                           </Button>
                        ) : <div />}
                        
                        <Button 
                           variant="outline"
                           className="w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-black rounded-xl font-bold uppercase text-[10px] h-10 tracking-wide"
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             if (esim.order?.planId) {
                               setSelectedEsimForReview(esim);
                             }
                           }}
                        >
                           Review
                        </Button>
                        
                        <Button 
                           className="w-full bg-black text-white hover:bg-gray-800 border border-transparent rounded-xl font-bold uppercase text-[10px] h-10 tracking-wide shadow-md hover:shadow-lg transition-all"
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEsim(null)}
        >
          <div 
            className="bg-white border border-gray-200 p-6 max-w-md w-full shadow-2xl rounded-3xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold uppercase text-black">Install eSIM</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEsim(null)}
                className="hover:bg-gray-100 rounded-full h-8 w-8"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                Scan this QR code with your device settings to install the eSIM profile.
              </p>
              
              {/* Mobile Install Button */}
              {(() => {
                const isMobile = isMobileDevice();
                const installLink = generateEsimInstallLink(selectedEsim.ac);
                const canInstall = isMobile && installLink;
                
                return canInstall ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    <p className="text-sm text-gray-600 font-medium text-center">
                      If you're viewing this on the phone you want to install the eSIM on, tap below.
                    </p>
                    <a href={installLink} className="block w-full">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-6 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Install eSIM on this device
                      </Button>
                    </a>
                  </div>
                ) : null;
              })()}
              
              <div className="bg-white p-4 border border-gray-200 rounded-2xl flex items-center justify-center shadow-inner">
                <Image
                  src={selectedEsim.qrCodeUrl}
                  alt="eSIM QR Code"
                  width={300}
                  height={300}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              
              {selectedEsim.ac && (
                <div className="space-y-2">
                   <p className="text-xs font-bold text-gray-500 uppercase ml-1">Manual Activation Code:</p>
                   <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between group hover:border-gray-300 transition-colors">
                      <code className="font-mono text-xs break-all text-gray-700">{selectedEsim.ac}</code>
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
                         className="h-8 w-8 p-0 rounded-full hover:bg-white shadow-sm"
                      >
                         {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                      </Button>
                   </div>
                </div>
              )}
              
              <Button
                className="w-full bg-black text-white hover:bg-gray-800 rounded-full font-bold uppercase py-6 shadow-lg"
                onClick={() => setSelectedEsim(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedEsimForReview && selectedEsimForReview.order?.planId && (
        <Dialog open={!!selectedEsimForReview} onOpenChange={(open) => !open && setSelectedEsimForReview(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Write a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= reviewRating
                            ? "fill-primary text-primary"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Comment (optional)
                </label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="text-gray-900 min-h-[100px]"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewComment.length}/1000 characters - Star-only reviews are welcome!
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedEsimForReview(null);
                    setReviewComment("");
                    setReviewRating(5);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!user) {
                      toast({ title: "Sign in required", description: "Please sign in to leave a review.", variant: "destructive" });
                      return;
                    }

                    if (reviewComment.trim() && reviewComment.trim().length < 2) {
                      toast({ title: "Invalid comment", description: "Comment must be at least 2 characters if provided.", variant: "destructive" });
                      return;
                    }

                    setSubmittingReview(true);
                    try {
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                      const userEmail = user.primaryEmailAddress?.emailAddress;
                      
                      if (!userEmail) {
                        toast({ title: "Error", description: "User email not found. Please try signing in again.", variant: "destructive" });
                        setSubmittingReview(false);
                        return;
                      }
                      
                      const userName = user.fullName || userEmail.split('@')[0] || 'Anonymous';
                      
                      await safeFetch(`${apiUrl}/reviews`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-user-email': userEmail,
                        },
                        body: JSON.stringify({
                          planId: selectedEsimForReview.order?.planId, // Pass planId for verified purchase
                          userName,
                          rating: reviewRating,
                          comment: reviewComment.trim() || undefined,
                        }),
                      });

                      toast({ title: "Review submitted", description: "Thank you for your review!" });
                      setSelectedEsimForReview(null);
                      setReviewComment("");
                      setReviewRating(5);
                    } catch (error: any) {
                      console.error("Review submission error:", error);
                      const errorMessage = error?.message || error?.cause?.message || "Failed to submit review.";
                      toast({ 
                        title: "Error", 
                        description: errorMessage, 
                        variant: "destructive" 
                      });
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                  disabled={submittingReview}
                  className="flex-1 bg-primary text-white hover:bg-primary-dark"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
