'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { EmailPreview } from "@/components/checkout/EmailPreview";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CreditCard, Loader2, Tag, X } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  planId: string;
  amountCents: number;
  displayAmountCents?: number;
  displayCurrency?: string;
  currency: string;
  status: string;
  User?: {
    email: string;
    name: string | null;
  };
}

export default function CheckoutPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoaded: userLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<{ percent: number; originalAmount: number; originalDisplayAmount: number } | null>(null);
  const [email, setEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const orderData = await safeFetch<Order>(`${apiUrl}/orders/${params.orderId}`, {
          showToast: false,
        });
        setOrder(orderData);
        
        // Set email from logged-in user if available
        if (userLoaded && user?.primaryEmailAddress?.emailAddress) {
          setEmail(user.primaryEmailAddress.emailAddress);
        }

        // Check if promo code was previously applied (stored in localStorage)
        const storedPromo = localStorage.getItem(`promo_${params.orderId}`);
        if (storedPromo) {
          try {
            const promoData = JSON.parse(storedPromo);
            // Verify the stored promo matches the current order state
            // If order amount matches expected discounted amount, restore promo state
            const expectedDiscounted = Math.round(promoData.originalAmount * (1 - promoData.discountPercent / 100));
            if (Math.abs(orderData.amountCents - expectedDiscounted) < 10) { // Allow small rounding differences
              setAppliedPromo(promoData.promoCode);
              setPromoDiscount({
                percent: promoData.discountPercent,
                originalAmount: promoData.originalAmount,
                originalDisplayAmount: promoData.originalDisplayAmount,
              });
            } else {
              // Promo doesn't match, clear it
              localStorage.removeItem(`promo_${params.orderId}`);
            }
          } catch (e) {
            // Invalid stored data, clear it
            localStorage.removeItem(`promo_${params.orderId}`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast({
          title: "Error",
          description: "Failed to load order details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId, toast, userLoaded, user]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a promo code.",
        variant: "destructive",
      });
      return;
    }

    // Check if a promo is already applied (in UI state or localStorage)
    if (appliedPromo) {
      toast({
        title: "Promo code already applied",
        description: `You already have ${appliedPromo} applied. Remove it first to apply a different code.`,
        variant: "destructive",
      });
      return;
    }

    // Check localStorage for existing promo
    const storedPromo = localStorage.getItem(`promo_${params.orderId}`);
    if (storedPromo) {
      try {
        const promoData = JSON.parse(storedPromo);
        if (promoData.promoCode) {
          toast({
            title: "Promo code already applied",
            description: `You already have ${promoData.promoCode} applied. Remove it first to apply a different code.`,
            variant: "destructive",
          });
          return;
        }
      } catch (e) {
        // Invalid stored data, continue
      }
    }

    setApplyingPromo(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const result = await safeFetch<{
        valid: boolean;
        promoCode: string;
        discountPercent: number;
        originalAmount: number;
        originalDisplayAmount?: number;
        discountedAmount: number;
        displayAmount: number;
        displayCurrency: string;
      }>(
        `${apiUrl}/orders/${params.orderId}/validate-promo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promoCode: promoCode.trim() }),
          errorMessage: "Failed to validate promo code.",
        }
      );

      if (result.valid) {
        // Store original amounts before updating
        const originalOrderAmount = order?.amountCents || 0;
        const originalDisplayAmount = order?.displayAmountCents || order?.amountCents || 0;
        
        setAppliedPromo(result.promoCode);
        setPromoDiscount({
          percent: result.discountPercent,
          originalAmount: result.originalAmount,
          originalDisplayAmount: result.originalDisplayAmount || originalDisplayAmount,
        });
        
        // Store promo info in localStorage to persist across page reloads
        localStorage.setItem(`promo_${params.orderId}`, JSON.stringify({
          promoCode: result.promoCode,
          discountPercent: result.discountPercent,
          originalAmount: result.originalAmount,
          originalDisplayAmount: result.originalDisplayAmount || originalDisplayAmount,
        }));
        
        // Update order with new amounts
        setOrder(prev => prev ? {
          ...prev,
          amountCents: result.discountedAmount,
          displayAmountCents: result.displayAmount,
          displayCurrency: result.displayCurrency,
        } : null);
        
        setPromoCode("");
        toast({
          title: "Promo code applied!",
          description: `${result.discountPercent}% discount applied to your order.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Invalid promo code",
        description: error.message || "This promo code is not valid or has expired.",
        variant: "destructive",
      });
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    if (!appliedPromo || !promoDiscount) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Call endpoint to remove promo and restore original amount
      await safeFetch(
        `${apiUrl}/orders/${params.orderId}/remove-promo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalAmount: promoDiscount.originalAmount,
            originalDisplayAmount: promoDiscount.originalDisplayAmount,
          }),
          errorMessage: "Failed to remove promo code.",
        }
      );

      // Remove from localStorage
      localStorage.removeItem(`promo_${params.orderId}`);

      // Restore original amounts in UI
      setOrder(prev => prev && promoDiscount ? {
        ...prev,
        amountCents: promoDiscount.originalAmount,
        displayAmountCents: promoDiscount.originalDisplayAmount,
      } : prev);

      setAppliedPromo(null);
      setPromoDiscount(null);
      
      toast({
        title: "Promo code removed",
        description: "The promo code has been removed and original price restored.",
      });
    } catch (error) {
      console.error('Failed to remove promo code:', error);
      // Still remove from UI even if backend call fails
      // Remove from localStorage
      localStorage.removeItem(`promo_${params.orderId}`);
      
      // Restore original amounts from stored values
      if (promoDiscount && order) {
        setOrder({
          ...order,
          amountCents: promoDiscount.originalAmount,
          displayAmountCents: promoDiscount.originalDisplayAmount,
        });
      }
      setAppliedPromo(null);
      setPromoDiscount(null);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingEmail(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await safeFetch(
        `${apiUrl}/orders/${params.orderId}/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
          showToast: false,
        }
      );

      toast({
        title: "Email updated",
        description: "Your email has been updated successfully.",
      });
    } catch (error: any) {
      // Handle 404 gracefully - endpoint not implemented yet, but email will be used during checkout
      if (error.status === 404 || error.message?.includes('404')) {
        toast({
          title: "Email saved",
          description: "Your email will be used for checkout. The email update endpoint is not available yet.",
        });
      } else {
        toast({
          title: "Failed to update email",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleProceedToPayment = async () => {
    // Validate email for guests
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const checkoutEmail = userEmail || email.trim();
    
    if (!checkoutEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address to receive your eSIM.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(checkoutEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const data = await safeFetch<{ url: string }>(`${apiUrl}/orders/${params.orderId}/checkout`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checkoutEmail }),
        showToast: false,
      });
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error("Failed to create checkout session:", error);
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <Button 
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const displayAmount = order.displayAmountCents || order.amountCents;
  const displayCurrency = order.displayCurrency || order.currency || 'USD';

  const formatPrice = (cents: number, currency: string) => {
    return formatCurrency(cents / 100, currency);
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <Breadcrumbs />
        
        {/* Progress Indicator */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <CheckoutProgress currentStep={currentStep} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details & Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-gray-900">Order Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium text-gray-900">{order.planId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium text-gray-900">{order.id}</span>
                    </div>
                  </div>
                </div>

                {/* Email Section */}
                {!user && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Email Address</h3>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                      />
                      <Button
                        onClick={handleUpdateEmail}
                        disabled={updatingEmail || !email.trim()}
                        className="rounded-full bg-primary hover:bg-primary/90 text-white"
                      >
                        {updatingEmail ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Your eSIM will be sent to this email address
                    </p>
                  </div>
                )}

                {user && user.primaryEmailAddress?.emailAddress && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Email Address</h3>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm text-gray-900">{user.primaryEmailAddress.emailAddress}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Your eSIM will be sent to this email
                    </p>
                  </div>
                )}
                
                {/* Promo Code Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Promo Code</h3>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">{appliedPromo}</span>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Remove promo code"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyPromo();
                          }
                        }}
                        className="flex-1 rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                      />
                      <Button
                        onClick={handleApplyPromo}
                        disabled={applyingPromo || !promoCode.trim()}
                        className="rounded-full bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        {applyingPromo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        {promoDiscount 
                          ? formatPrice(promoDiscount.originalDisplayAmount || promoDiscount.originalAmount, displayCurrency)
                          : formatPrice(displayAmount, displayCurrency)
                        }
                      </span>
                    </div>
                    {appliedPromo && promoDiscount && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({appliedPromo})</span>
                        <span>-{formatPrice(
                          (promoDiscount.originalDisplayAmount || promoDiscount.originalAmount) - displayAmount, 
                          displayCurrency
                        )}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">Included</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(displayAmount, displayCurrency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proceed to Payment Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={processing || order.status !== 'pending' || (!user && !email.trim())}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                  {order.status !== 'pending' && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      This order has already been processed.
                    </p>
                  )}
                  {!user && !email.trim() && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      Please enter your email address to proceed.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary & Email Preview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary Card */}
            <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plan</span>
                    <span className="text-gray-900">{order.planId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      {promoDiscount 
                        ? formatPrice(promoDiscount.originalDisplayAmount || promoDiscount.originalAmount, displayCurrency)
                        : formatPrice(displayAmount, displayCurrency)
                      }
                    </span>
                  </div>
                  {appliedPromo && promoDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({appliedPromo})</span>
                      <span>-{formatPrice(
                        (promoDiscount.originalDisplayAmount || promoDiscount.originalAmount) - displayAmount, 
                        displayCurrency
                      )}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">Included</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(displayAmount, displayCurrency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Preview Toggle */}
            <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  className="w-full border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900 rounded-full"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {showEmailPreview ? 'Hide' : 'Preview'} Confirmation Email
                </Button>
              </CardContent>
            </Card>

            {/* Email Preview Card */}
            {showEmailPreview && order && (
              <EmailPreview 
                orderId={params.orderId}
                amount={displayAmount / 100}
                currency={displayCurrency}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
