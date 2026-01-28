import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Share, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { apiFetch } from '../src/api/client';
import BottomNav from '../src/components/BottomNav';
import { theme } from '../src/theme';
import { useCurrency } from '../src/context/CurrencyContext';

interface VCashBalance {
  balanceCents: number;
  currency: string;
}

interface VCashTransaction {
  id: string;
  type: 'credit' | 'debit';
  amountCents: number;
  reason: string;
  metadata?: any;
  createdAt: string;
}

export default function VCash() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { formatPrice: formatCurrencyPrice, convertFromCurrency } = useCurrency();
  const isLoaded = userLoaded && authLoaded;
  
  const [balance, setBalance] = useState<VCashBalance | null>(null);
  const [transactions, setTransactions] = useState<VCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [loadingReferral, setLoadingReferral] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
      fetchReferralCode();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoaded, isSignedIn]);

  const fetchData = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    
    try {
      const userEmail = user.primaryEmailAddress.emailAddress;
      const [balanceData, transactionsData] = await Promise.all([
        apiFetch<VCashBalance>('/spare-change', { headers: { 'x-user-email': userEmail } }),
        apiFetch<{ transactions: VCashTransaction[] }>('/spare-change/transactions?page=1&pageSize=5', { headers: { 'x-user-email': userEmail } }),
      ]);
      setBalance(balanceData);
      setTransactions(transactionsData.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReferralCode = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    
    try {
      setLoadingReferral(true);
      const userEmail = user.primaryEmailAddress.emailAddress;
      const data = await apiFetch<{ referralCode: string; referralLink: string }>('/affiliate/referral-code', {
        headers: { 'x-user-email': userEmail },
      });
      setReferralCode(data.referralCode);
      setReferralLink(data.referralLink);
    } catch (err) {
      console.error('Failed to fetch referral code:', err);
    } finally {
      setLoadingReferral(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleBuyPlan = () => {
    router.push('/');
  };

  if (!isLoaded) return null;

  // Not signed in state - show informational page
  if (isLoaded && !isSignedIn) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.infoContent}>
          <View style={styles.infoTopSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="wallet" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.infoTitle}>Spare Change Rewards</Text>
            <Text style={styles.infoDescription}>
              Store credit for your eSIM purchases. Earn through refunds, referrals, and special promotions.
            </Text>
          </View>

          <View style={styles.benefitsSection}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Instant checkout discounts</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>10% lifetime commission</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Automatic refund credits</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Full earning history</Text>
            </View>
          </View>

          <View style={styles.infoBottomSection}>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.85}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push('/(auth)/sign-up')}
              activeOpacity={0.8}
            >
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomNav activeTab="v-cash" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Spare Change</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Balance Section */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceAmount}>
            {balance ? formatPrice(balance.balanceCents, balance.currency || 'USD') : formatCurrencyPrice(0)}
          </Text>
          <Text style={styles.balanceSubtitle}>
            You can use your credits at checkout to get a discount.
          </Text>
          
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyPlan}>
            <Text style={styles.buyButtonText}>Buy data plan</Text>
          </TouchableOpacity>
        </View>

        {/* Affiliate Program Card */}
        {isSignedIn && (
          <View style={styles.referralCard}>
            <Text style={styles.referralTitle}>Cheap eSIMs Affiliate Program</Text>
            <Text style={styles.referralText}>
              Earn 10% lifetime commission on all purchases made by users you refer. Share your unique referral code and start earning today!
            </Text>
            
            {loadingReferral ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 16 }} />
            ) : referralCode ? (
              <>
                <View style={styles.referralCodeContainer}>
                  <Text style={styles.referralCodeLabel}>Your referral code</Text>
                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>{referralCode}</Text> 
                    <TouchableOpacity onPress={() => {
                      if (referralLink) {
                        Clipboard.setStringAsync(referralLink);
                      }
                    }}>
                      <Ionicons name="copy-outline" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={() => {
                    if (referralLink) {
                      Share.share({
                        message: `Use my referral code ${referralCode} to get eSIM data for your travels! ${referralLink}`,
                      });
                    }
                  }}
                >
                  <Text style={styles.shareButtonText}>Share code</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => router.push('/affiliate')}
              >
                <Text style={styles.shareButtonText}>View Affiliate Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* History */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Credits history</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No history yet.</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((tx) => {
                // Get currency from balance or default to USD
                const txCurrency = balance?.currency || 'USD';
                const formattedAmount = formatPrice(tx.amountCents, txCurrency);
                return (
                  <View key={tx.id} style={styles.transactionItem}>
                    <Text style={styles.txReason}>{tx.reason}</Text>
                    <Text style={[
                      styles.txAmount, 
                      tx.type === 'credit' ? styles.textSuccess : styles.textError
                    ]}>
                      {tx.type === 'credit' ? '+' : '-'}{formattedAmount}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
      <BottomNav activeTab="v-cash" />
    </View>
  );

  // Helper function to format price with currency conversion
  function formatPrice(cents: number, currency?: string) {
    const amount = cents / 100;
    // If currency is provided and different from selected currency, convert it
    if (currency && currency.toUpperCase() !== 'USD') {
      // Convert from the provided currency to the selected currency
      const convertedAmount = convertFromCurrency(amount, currency);
      return formatCurrencyPrice(convertedAmount);
    }
    // Otherwise, format the amount directly (assuming it's already in the selected currency)
    return formatCurrencyPrice(amount);
  }
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
  header: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 10,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -1,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 100,
    paddingTop: 10,
  },
  // Balance Section
  balanceContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    letterSpacing: -1,
  },
  balanceSubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  buyButton: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start',
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  // Referral Card
  referralCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  referralTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  referralText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  referralCodeContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  referralCodeLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  shareButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  // History Section
  historyContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  transactionsList: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  txReason: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 16,
  },
  textSuccess: {
    color: theme.colors.success,
  },
  textError: {
    color: theme.colors.error,
  },
  emptyHistory: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  emptyHistoryText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  // Info Content (Not signed in)
  infoContent: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 40,
    paddingBottom: 100,
    justifyContent: 'space-between',
  },
  infoTopSection: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  infoTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.5,
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
    fontWeight: '500',
  },
  benefitsSection: {
    gap: 12,
    paddingVertical: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
    fontWeight: '600',
  },
  infoBottomSection: {
    gap: 12,
  },
  signInButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  signInButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  signUpButton: {
    width: '100%',
    backgroundColor: theme.colors.card,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  signUpButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
});
