import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import BottomNav from '../src/components/BottomNav';
import { getStatusLabel, getStatusColor } from '../src/utils/statusUtils';
import { calculateRemainingData, calculateUsagePercentage, formatExpiryDate, formatDataSize } from '../src/utils/dataUtils';
import { AnimatedButton } from '../src/components/AnimatedButton';

type PlanDetails = {
  name: string;
  packageCode: string;
  locationCode?: string;
  volume?: number;
  duration?: number;
  durationUnit?: string;
};

type EsimProfile = {
  id: string;
  orderId: string;
  esimTranNo?: string;
  iccid?: string;
  qrCodeUrl?: string | null;
  ac?: string | null;
  smdpStatus?: string;
  esimStatus?: string;
  totalVolume?: string | null;
  orderUsage?: string | null;
  expiredTime?: string | null;
  planDetails?: PlanDetails;
};

export default function MyEsims() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [esims, setEsims] = useState<EsimProfile[]>([]);
  const [cachedEsims, setCachedEsims] = useState<EsimProfile[]>([]);
  const cachedEsimsRef = useRef<EsimProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchEsims(false);
    } else {
      setLoading(false);
      setError('Please log in to view your eSIMs.');
    }
  }, [isLoaded, user?.primaryEmailAddress?.emailAddress]);

  async function fetchCountries() {
    try {
      const countries = await apiFetch<Array<{ code: string; name: string }>>('/countries');
      const countryMap: Record<string, string> = {};
      countries.forEach(country => {
        countryMap[country.code] = country.name;
      });
      setCountryNames(countryMap);
    } catch (err) {
      console.warn('Failed to fetch countries:', err);
    }
  }

  const fetchEsims = useCallback(async (isRefresh = false) => {
    const email = user?.primaryEmailAddress?.emailAddress;
    
    if (!email) {
      setLoading(false);
      setError('Please log in to view your eSIMs.');
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      const data = await apiFetch<EsimProfile[]>(`/user/esims?email=${encodeURIComponent(email)}`);
      const esimsData = Array.isArray(data) ? data : [];
      setEsims(esimsData);
      if (esimsData.length > 0) {
        setCachedEsims(esimsData);
        cachedEsimsRef.current = esimsData;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load eSIMs';
      setError(errorMessage);
      if (cachedEsimsRef.current.length > 0) {
        setEsims(cachedEsimsRef.current);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.primaryEmailAddress?.emailAddress]);

  const onRefresh = useCallback(() => {
    fetchEsims(true);
  }, [fetchEsims]);

  const getCountryName = (locationCode?: string): string => {
    if (!locationCode) return 'Unknown';
    return countryNames[locationCode] || locationCode.toUpperCase();
  };

  const handleEsimPress = (esim: EsimProfile) => {
    router.push({
      pathname: '/esim-setup',
      params: { orderId: esim.orderId },
    });
  };

  const renderEsimItem = ({ item }: { item: EsimProfile }) => {
    const countryName = item.planDetails?.locationCode 
      ? getCountryName(item.planDetails.locationCode)
      : 'Unknown';
    const planName = item.planDetails?.name || 'Unknown Plan';
    const statusLabel = getStatusLabel(item.esimStatus);
    const statusColor = getStatusColor(item.esimStatus);
    const remainingData = calculateRemainingData(item.totalVolume, item.orderUsage);
    const usagePercentage = calculateUsagePercentage(item.totalVolume, item.orderUsage);
    const expiryText = formatExpiryDate(item.expiredTime);

    return (
      <TouchableOpacity
        style={styles.esimItem}
        onPress={() => handleEsimPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.esimContent}>
          <View style={styles.esimHeader}>
            <View style={styles.esimHeaderLeft}>
              <Text style={styles.countryName}>{countryName}</Text>
              <Text style={styles.planName}>{planName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          
          {item.totalVolume && (
            <View style={styles.dataUsageContainer}>
              <View style={styles.dataUsageRow}>
                <View style={styles.dataUsageLeft}>
                  <Text style={styles.dataUsageLabel}>REMAINING DATA</Text>
                  <Text style={styles.dataUsageText}>{remainingData}</Text>
                </View>
                <View style={styles.dataUsageRight}>
                  <Text style={styles.dataUsageLabel}>TOTAL</Text>
                  <Text style={styles.dataUsageTotal}>{formatDataSize(item.totalVolume)}</Text>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${usagePercentage}%`, backgroundColor: usagePercentage > 80 ? theme.colors.warning : theme.colors.primary }
                  ]} 
                />
              </View>
            </View>
          )}
          
          <View style={styles.esimFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.validityText}>{expiryText}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Auth Error / Not Signed In
  const isAuthError = error && (error.includes('log in') || error.includes('Please log in'));
  if (isAuthError && cachedEsims.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationCircle}>
            <Ionicons name="lock-closed" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
          </View>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>Login or sign up to access your eSIMs</Text>
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomNav activeTab="my-esims" />
      </View>
    );
  }

  if (esims.length === 0 && !loading && !error) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.header}>
            <Text style={styles.title}>My eSIMs</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationCircle}>
             <Ionicons name="phone-portrait-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
          </View>
          <Text style={styles.emptyTitle}>No data plans... yet!</Text>
          <Text style={styles.emptyText}>Purchase a plan for it to appear here.</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/countries')}
          >
            <Text style={styles.browseButtonText}>Explore plans</Text>
          </TouchableOpacity>
        </View>
        <BottomNav activeTab="my-esims" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My eSIMs</Text>
          <TouchableOpacity onPress={onRefresh} disabled={refreshing} style={styles.refreshButton}>
            {refreshing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="refresh" size={22} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={esims}
        keyExtractor={(item) => item.id}
        renderItem={renderEsimItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
      <BottomNav activeTab="my-esims" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingBottom: theme.spacing.md,
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  refreshButton: {
    padding: 8,
    marginRight: -8,
  },
  listContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: 100,
  },
  // List Item (Redesigned)
  esimItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  esimContent: {
    flex: 1,
  },
  esimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  esimHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  countryName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  dataUsageContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dataUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dataUsageLeft: {
    flex: 1,
  },
  dataUsageRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dataUsageLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  dataUsageText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  dataUsageTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  esimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validityText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  illustrationIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    ...theme.shadows.soft,
  },
  browseButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  authButtonsContainer: {
    width: '100%',
    maxWidth: 200,
  },
  signInButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  signInButtonText: {
    color: theme.colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});
