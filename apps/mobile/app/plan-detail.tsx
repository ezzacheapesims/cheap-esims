import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, TextInput, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { useUser } from '@clerk/clerk-expo';
import { theme } from '../src/theme';
import { PriceComparison } from '../src/components/PriceComparison';
import { SharePlanButton } from '../src/components/ShareButton';
import { useCurrency } from '../src/context/CurrencyContext';
import { AnimatedButton } from '../src/components/AnimatedButton';
import { FadeInView } from '../src/components/FadeInView';
import { useToast } from '../src/context/ToastContext';
import { fetchDiscounts, getDiscount, calculateDiscountedPrice } from '../src/utils/discountUtils';
import { getStoredReferralCode } from '../src/utils/referral';
import {
  Plan,
  calculateGB,
  formatDataSize,
  formatValidity,
  isDailyUnlimitedPlan,
  getDisplayName,
  getDisplayDataSize,
} from '../src/utils/planUtils';

type OrderResponse = {
  orderId: string;
  [key: string]: any;
};

// Get network operator for a country
const getNetworkOperator = (locationCode?: string) => {
  if (!locationCode) return "Best Available Network";
  
  const code = locationCode.split('-')[0].toUpperCase();
  const operators: Record<string, string> = {
    'US': 'AT&T / T-Mobile',
    'GB': 'O2 / Three / Vodafone',
    'FR': 'Orange / Bouygues / SFR',
    'DE': 'Telekom / Vodafone / O2',
    'ES': 'Movistar / Orange / Vodafone',
    'IT': 'TIM / Vodafone / Wind Tre',
    'JP': 'Softbank / KDDI / Docomo',
    'KR': 'SK Telecom / KT / LG U+',
    'CN': 'China Unicom / China Mobile',
    'HK': 'CSL / SmartTone / 3HK',
    'TW': 'Chunghwa / Taiwan Mobile',
    'SG': 'Singtel / Starhub / M1',
    'MY': 'Celcom / Digi / Maxis',
    'TH': 'AIS / DTAC / TrueMove',
    'ID': 'Telkomsel / XL Axiata',
    'VN': 'Viettel / Vinaphone',
    'PH': 'Globe / Smart',
    'AU': 'Telstra / Optus / Vodafone',
    'NZ': 'Spark / One NZ',
    'CA': 'Rogers / Bell / Telus',
    'TR': 'Turkcell / Vodafone / Turk Telekom',
    'AE': 'Etisalat / Du',
    'SA': 'STC / Mobily',
    'PL': 'Plus / Orange / Play / T-Mobile',
  };
  return operators[code] || "Best Available Network";
};

// Get country name from code
const getCountryName = (code?: string): string => {
  if (!code) return 'Unknown';
  
  const countryNames: Record<string, string> = {
    'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
    'ES': 'Spain', 'IT': 'Italy', 'JP': 'Japan', 'KR': 'South Korea', 'CN': 'China',
    'HK': 'Hong Kong', 'TW': 'Taiwan', 'SG': 'Singapore', 'MY': 'Malaysia',
    'TH': 'Thailand', 'ID': 'Indonesia', 'VN': 'Vietnam', 'PH': 'Philippines',
    'AU': 'Australia', 'NZ': 'New Zealand', 'CA': 'Canada', 'TR': 'Turkey',
    'AE': 'UAE', 'SA': 'Saudi Arabia', 'PL': 'Poland', 'NL': 'Netherlands',
    'BE': 'Belgium', 'AT': 'Austria', 'CH': 'Switzerland', 'PT': 'Portugal',
    'GR': 'Greece', 'CZ': 'Czech Republic', 'SE': 'Sweden', 'NO': 'Norway',
    'DK': 'Denmark', 'FI': 'Finland', 'IE': 'Ireland', 'IN': 'India',
    'BR': 'Brazil', 'MX': 'Mexico', 'AR': 'Argentina', 'CL': 'Chile',
  };
  
  const upperCode = code.split('-')[0].toUpperCase();
  return countryNames[upperCode] || code.toUpperCase();
};

export default function PlanDetail() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useUser();
  const { convert, formatPrice, selectedCurrency } = useCurrency();
  const params = useLocalSearchParams<{
    planId: string;
    countryName?: string;
  }>();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Discount state
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [referralDiscount, setReferralDiscount] = useState<{ eligible: boolean; discountPercent: number } | null>(null);
  
  // For unlimited plans - day selection
  const [selectedDays, setSelectedDays] = useState<number>(1);

  useEffect(() => {
    if (params.planId) {
      fetchPlan();
    } else {
      setError('Plan ID is required');
      setLoading(false);
    }
  }, [params.planId]);

  async function fetchPlan() {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch plan and discounts in parallel
      const [planData] = await Promise.all([
        apiFetch<Plan>(`/plans/${params.planId}`),
        fetchDiscounts(), // Populate discount cache
      ]);
      
      setPlan(planData);
      
      // Set initial selected days from plan duration
      if (planData.duration) {
        setSelectedDays(planData.duration);
      }
      
      // Calculate discount for this plan
      const gb = calculateGB(planData.volume);
      const planDiscount = getDiscount(planData.packageCode || '', gb);
      setDiscountPercent(planDiscount);
      
      // Check referral discount eligibility
      // Note: We can't check eligibility without an order, but we can show the discount
      // if a referral code exists (it will be validated at checkout)
      try {
        const referralCode = await getStoredReferralCode();
        if (referralCode) {
          // Assume eligible if referral code exists (will be validated at checkout)
          setReferralDiscount({
            eligible: true,
            discountPercent: 10,
          });
        }
      } catch (err) {
        // Silently fail - referral discount check is optional
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load plan';
      setError(errorMessage);
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  }

  const isUnlimited = useMemo(() => {
    if (!plan) return false;
    return isDailyUnlimitedPlan(plan);
  }, [plan]);

  const displayName = useMemo(() => {
    if (!plan) return '';
    return getDisplayName(plan);
  }, [plan]);

  const displayDataSize = useMemo(() => {
    if (!plan) return '';
    return getDisplayDataSize(plan);
  }, [plan]);

  const locationCode = useMemo(() => {
    if (!plan?.location) return '';
    return plan.location.split(',')[0].trim().toUpperCase();
  }, [plan]);

  // Calculate price for unlimited plans (daily price × selected days)
  const dailyPrice = useMemo(() => {
    if (!plan) return 0;
    return plan.price; // For unlimited plans, plan.price is the daily price
  }, [plan]);

  // Calculate original price
  const originalPrice = useMemo(() => {
    if (!plan) return 0;
    if (isUnlimited) {
      return dailyPrice * selectedDays;
    }
    return plan.price;
  }, [plan, isUnlimited, dailyPrice, selectedDays]);

  // Calculate total price with discounts
  const totalPrice = useMemo(() => {
    if (!plan) return 0;
    
    let price = originalPrice;
    
    // Apply plan discount first
    if (discountPercent > 0) {
      price = calculateDiscountedPrice(price, discountPercent);
    }
    
    // Apply referral discount if eligible (only if no plan discount, or combine them)
    if (referralDiscount?.eligible && discountPercent === 0) {
      price = calculateDiscountedPrice(price, referralDiscount.discountPercent);
    }
    
    return price;
  }, [plan, originalPrice, discountPercent, referralDiscount]);

  const getFlagUrl = () => {
    if (!locationCode) return '';
    return `https://flagcdn.com/w160/${locationCode.toLowerCase()}.png`;
  };

  const handleDaysChange = (text: string) => {
    const num = parseInt(text) || 1;
    // Clamp between 1 and 365
    const clamped = Math.max(1, Math.min(365, num));
    setSelectedDays(clamped);
  };

  const adjustDays = (delta: number) => {
    setSelectedDays(prev => Math.max(1, Math.min(365, prev + delta)));
  };

  const handleCompleteOrder = async () => {
    if (!plan?.packageCode) {
      toast.error('Error', 'Plan code is missing');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const orderBody: {
        planCode: string;
        amount: number;
        currency: string;
        displayCurrency?: string;
        planName: string;
        paymentMethod: string;
        email?: string;
        duration?: number;
      } = {
        planCode: plan.packageCode,
        amount: totalPrice,
        currency: selectedCurrency,
        displayCurrency: selectedCurrency,
        planName: plan.name,
        paymentMethod: 'stripe',
      };

      if (userEmail) {
        orderBody.email = userEmail;
      }

      // For unlimited plans, pass the selected duration
      if (isUnlimited) {
        orderBody.duration = selectedDays;
      }

      const order = await apiFetch<OrderResponse>('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderBody),
      });

      if (order.orderId) {
        // Navigate to checkout page (order summary before Stripe)
        router.push({
          pathname: '/checkout',
          params: {
            orderId: order.orderId,
          },
        });
      } else {
        throw new Error('Order ID not returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      toast.error('Error', errorMessage);
      console.error('Error creating order:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading plan details...</Text>
        </View>
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.colors.warning} />
          <Text style={styles.errorTitle}>Plan Not Found</Text>
          <Text style={styles.errorText}>
            {error || "The plan you're looking for doesn't exist or has been removed."}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <FadeInView duration={180}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card with Flag */}
          <View style={styles.headerCard}>
          <View style={styles.flagContainer}>
            {!imageError && locationCode ? (
              <Image
                source={{ uri: getFlagUrl() }}
                style={styles.flagImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              ) : (
              <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
            )}
          </View>
          
          <Text style={styles.planTitle}>{displayName}</Text>
          
          {/* Feature badges */}
          <View style={styles.featureBadges}>
            <View style={styles.featureBadge}>
              <Text style={styles.featureBadgeIcon}>✓</Text>
              <Text style={styles.featureBadgeText}>Instant delivery</Text>
            </View>
            <View style={styles.featureBadge}>
              <Text style={styles.featureBadgeIcon}>✓</Text>
              <Text style={styles.featureBadgeText}>QR code install</Text>
            </View>
            <View style={styles.featureBadge}>
              <Text style={styles.featureBadgeIcon}>✓</Text>
              <Text style={styles.featureBadgeText}>Top-up available</Text>
            </View>
          </View>
          
          {/* Share Button */}
          <View style={styles.shareContainer}>
            <SharePlanButton
              countryName={params.countryName || locationCode || 'Travel'}
              planName={displayName}
              planPrice={formatPrice(convert(totalPrice))}
              style="icon"
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL DATA</Text>
            <Text style={styles.statValue}>{displayDataSize}</Text>
          </View>
          
          {/* Duration - Editable for unlimited plans */}
          <View style={[styles.statBox, isUnlimited && styles.statBoxEditable]}>
            <Text style={styles.statLabel}>DURATION</Text>
            {isUnlimited ? (
              <View style={styles.daysSelectorContainer}>
                <TouchableOpacity 
                  style={styles.daysButton} 
                  onPress={() => adjustDays(-1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <TextInput
                  style={styles.daysInput}
                  value={selectedDays.toString()}
                  onChangeText={handleDaysChange}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  maxLength={3}
                />
                <TouchableOpacity 
                  style={styles.daysButton} 
                  onPress={() => adjustDays(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.daysButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.statValue}>{formatValidity(plan.duration, plan.durationUnit)}</Text>
            )}
            {isUnlimited && (
              <Text style={styles.daysLabel}>Days</Text>
            )}
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SPEED</Text>
            <Text style={styles.statValue}>4G/LTE</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ACTIVATION</Text>
            <Text style={styles.statValue}>Automatic</Text>
          </View>
        </View>

        {/* Coverage Region */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🌍</Text>
            <Text style={styles.sectionTitle}>COVERAGE REGION</Text>
          </View>
          
          <View style={styles.coverageCard}>
            <View style={styles.coverageFlagContainer}>
              {!imageError && locationCode ? (
                <Image
                  source={{ uri: getFlagUrl() }}
                  style={styles.coverageFlag}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
              )}
            </View>
            <View style={styles.coverageInfo}>
              <Text style={styles.coverageCountry}>{getCountryName(locationCode)}</Text>
              <Text style={styles.coverageNetwork}>{getNetworkOperator(locationCode)}</Text>
            </View>
          </View>
        </View>

        {/* Price Comparison */}
        <View style={styles.section}>
          <PriceComparison />
        </View>

        {/* Order Summary Card */}
        <View style={styles.orderSummaryCard}>
          <Text style={styles.orderSummaryTitle}>ORDER SUMMARY</Text>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Item:</Text>
            <Text style={styles.orderValue} numberOfLines={2}>{displayName}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Data:</Text>
            <Text style={styles.orderValue}>{displayDataSize}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Validity:</Text>
            <Text style={styles.orderValue}>
              {isUnlimited ? `${selectedDays} Days` : formatValidity(plan.duration, plan.durationUnit)}
            </Text>
          </View>
          
          {isUnlimited && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Daily Rate:</Text>
              <Text style={styles.orderValue}>{formatPrice(convert(dailyPrice))}/day</Text>
            </View>
          )}
          
          {(discountPercent > 0 || referralDiscount?.eligible) && (
            <>
              <View style={styles.orderDivider} />
              
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Subtotal:</Text>
                <Text style={styles.orderValue}>{formatPrice(convert(originalPrice))}</Text>
              </View>
              
              {discountPercent > 0 && (
                <View style={styles.orderRow}>
                  <Text style={[styles.orderLabel, styles.discountLabel]}>Discount ({Math.round(discountPercent)}%):</Text>
                  <Text style={[styles.orderValue, styles.discountValue]}>
                    -{formatPrice(convert(originalPrice - calculateDiscountedPrice(originalPrice, discountPercent)))}
                  </Text>
                </View>
              )}
              
              {referralDiscount?.eligible && discountPercent === 0 && (
                <View style={styles.orderRow}>
                  <Text style={[styles.orderLabel, styles.referralDiscountLabel]}>Referral Discount ({referralDiscount.discountPercent}%):</Text>
                  <Text style={[styles.orderValue, styles.referralDiscountValue]}>
                    -{formatPrice(convert(originalPrice - calculateDiscountedPrice(originalPrice, referralDiscount.discountPercent)))}
                  </Text>
                </View>
              )}
            </>
          )}
          
          <View style={styles.orderDivider} />
          
          <View style={styles.orderTotalRow}>
            <Text style={styles.orderTotalLabel}>TOTAL:</Text>
            <Text style={styles.orderTotalValue}>{formatPrice(convert(totalPrice))}</Text>
          </View>
        </View>

        {/* Complete Order Button */}
        <AnimatedButton
          style={[styles.completeOrderButton, processing && styles.completeOrderButtonDisabled]}
          onPress={handleCompleteOrder}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <Text style={styles.completeOrderButtonText}>COMPLETE ORDER</Text>
          )}
        </AnimatedButton>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="lock-closed" size={18} color={theme.colors.success} />
          <Text style={styles.securityText}>Secure Checkout • Instant Delivery</Text>
        </View>

        {/* Spacer for bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retryButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  
  // Header Card
  headerCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  flagContainer: {
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundLight,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagImage: {
    width: '100%',
    height: '100%',
  },
  flagFallback: {
    fontSize: 32,
  },
  planTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  featureBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  featureBadgeIcon: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
  featureBadgeText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  shareContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 100,
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  statBoxEditable: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.backgroundLight,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  
  // Days Selector (for unlimited plans)
  daysSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  daysButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  daysButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.primary,
    lineHeight: 26,
  },
  daysInput: {
    width: 60,
    height: 44,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    padding: 0,
  },
  daysLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  
  // Coverage
  coverageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  coverageFlagContainer: {
    width: 56,
    height: 42,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundLight,
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  coverageFlag: {
    width: '100%',
    height: '100%',
  },
  coverageFlagFallback: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 36,
  },
  coverageInfo: {
    flex: 1,
  },
  coverageCountry: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  coverageNetwork: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  
  // Order Summary
  orderSummaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  orderSummaryTitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  orderValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  orderDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  orderTotalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  discountLabel: {
    color: theme.colors.primary,
  },
  discountValue: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  referralDiscountLabel: {
    color: '#4ade80',
  },
  referralDiscountValue: {
    color: '#4ade80',
    fontWeight: '700',
  },
  
  // Complete Order Button
  completeOrderButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    marginBottom: 20,
    ...theme.shadows.soft,
  },
  completeOrderButtonDisabled: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
  },
  completeOrderButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignSelf: 'center',
  },
  securityIcon: {
    fontSize: 14,
  },
  securityText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
