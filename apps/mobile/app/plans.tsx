import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, ScrollView, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { AnimatedListItem } from '../src/components/AnimatedListItem';
import { AnimatedButton } from '../src/components/AnimatedButton';
import {
  Plan,
  processPlansForDisplay,
  sortPlans,
  formatValidity,
  getDisplayName,
  getDisplayDataSize,
  calculateGB,
  SortOption,
} from '../src/utils/planUtils';
import { fetchDiscounts, getDiscount, areDiscountsLoaded, calculateDiscountedPrice } from '../src/utils/discountUtils';
import { useCurrency } from '../src/context/CurrencyContext';
import { addToRecentlyViewed } from '../src/utils/recentlyViewed';

const PLANS_PER_PAGE = 12;

// Sort options for the dropdown
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'price', label: 'Price (Low to High)' },
  { value: 'duration', label: 'Duration' },
  { value: 'dataSize', label: 'Data Size' },
  { value: 'name', label: 'Plan Name' },
];

export default function Plans() {
  const router = useRouter();
  const { convert, formatPrice } = useCurrency();
  const params = useLocalSearchParams<{
    countryId: string;
    countryName: string;
    regionId?: string;
    regionName?: string;
  }>();
  
  // Raw plans from API
  const [rawPlans, setRawPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'standard' | 'unlimited'>('standard');
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (params.countryId) {
      fetchData();
      // Track recently viewed
      addToRecentlyViewed({
        id: params.countryId,
        name: params.countryName || params.countryId,
        type: 'country',
        code: params.countryId,
      });
    }
  }, [params.countryId, params.regionId]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch discounts and plans in parallel
      const [plansData] = await Promise.all([
        apiFetch<Plan[]>(`/countries/${params.countryId}/plans`),
        fetchDiscounts(), // This populates the cache
      ]);
      
      let plans = Array.isArray(plansData) ? plansData : [];
      
      setRawPlans(plans);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plans';
      setError(errorMessage);
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  }
  
  // Helper function to get discount for a plan
  const getPlanDiscount = (packageCode: string, gb: number): number => {
    return getDiscount(packageCode, gb);
  };

  // Process plans through the full pipeline (with discount filtering)
  const { standard, unlimited, total } = useMemo(() => {
    if (rawPlans.length === 0) {
      return { standard: [], unlimited: [], total: 0 };
    }
    return processPlansForDisplay(rawPlans, params.countryId || '', getPlanDiscount);
  }, [rawPlans, params.countryId]);

  // Get plans for active tab
  const activePlans = activeTab === 'standard' ? standard : unlimited;
  
  // Sort plans (with discount-aware price sorting)
  const sortedPlans = useMemo(() => {
    return sortPlans(activePlans, sortBy, getPlanDiscount);
  }, [activePlans, sortBy]);
  
  // Pagination
  const totalPages = Math.ceil(sortedPlans.length / PLANS_PER_PAGE);
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * PLANS_PER_PAGE;
    return sortedPlans.slice(start, start + PLANS_PER_PAGE);
  }, [sortedPlans, currentPage]);
  
  // Reset page when tab or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortBy]);

  // Auto-switch to unlimited tab if no standard plans but has unlimited
  useEffect(() => {
    if (standard.length === 0 && unlimited.length > 0) {
      setActiveTab('unlimited');
    }
  }, [standard.length, unlimited.length]);

  const getFlagUrl = () => {
    return `https://flagcdn.com/w160/${params.countryId?.toLowerCase()}.png`;
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!plan.packageCode) {
      setError('Plan code is missing');
      return;
    }

    // Navigate to plan detail page for order summary
    router.push({
      pathname: '/plan-detail',
      params: {
        planId: plan.packageCode,
        countryName: params.countryName,
      },
    });
  };

  // Calculate lowest price for header
  const lowestPrice = useMemo(() => {
    if (sortedPlans.length === 0) return 0;
    return Math.min(...sortedPlans.map(p => p.price));
  }, [sortedPlans]);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Country Header Card */}
      <View style={styles.countryHeader}>
        <View style={styles.flagContainer}>
          {!imageError ? (
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
        <View style={styles.countryInfo}>
          <Text style={styles.countryName}>{params.countryName} eSIM</Text>
          {lowestPrice > 0 && (
            <View style={styles.priceFromBadge}>
              <Text style={styles.priceFromText}>From {formatPrice(convert(lowestPrice))}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'standard' && styles.tabActive]}
          onPress={() => setActiveTab('standard')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'standard' && styles.tabTextActive]}>
            Standard
          </Text>
          <View style={[styles.tabBadge, activeTab === 'standard' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'standard' && styles.tabBadgeTextActive]}>
              {standard.length}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unlimited' && styles.tabActive]}
          onPress={() => setActiveTab('unlimited')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'unlimited' && styles.tabTextActive]}>
            Unlimited
          </Text>
          <View style={[styles.tabBadge, activeTab === 'unlimited' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'unlimited' && styles.tabBadgeTextActive]}>
              {unlimited.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Sort & Count Row */}
      <View style={styles.filterRow}>
        <Text style={styles.planCountText}>
          {sortedPlans.length} plan{sortedPlans.length !== 1 ? 's' : ''}
          {totalPages > 1 && ` • Page ${currentPage}/${totalPages}`}
        </Text>
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortDropdown(!showSortDropdown)}
          activeOpacity={0.7}
        >
          <Text style={styles.sortButtonText}>
            {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}
          </Text>
          <Ionicons 
            name={showSortDropdown ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Sort Dropdown */}
      {showSortDropdown && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortDropdownItem,
                sortBy === option.value && styles.sortDropdownItemActive,
              ]}
              onPress={() => {
                setSortBy(option.value);
                setShowSortDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortDropdownItemText,
                sortBy === option.value && styles.sortDropdownItemTextActive,
              ]}>
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (totalPages <= 1) return null;
    
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          activeOpacity={0.7}
        >
          <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <View style={styles.paginationPages}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <TouchableOpacity
                key={pageNum}
                style={[
                  styles.paginationPage,
                  currentPage === pageNum && styles.paginationPageActive,
                ]}
                onPress={() => setCurrentPage(pageNum)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.paginationPageText,
                  currentPage === pageNum && styles.paginationPageTextActive,
                ]}>
                  {pageNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          activeOpacity={0.7}
        >
          <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </View>
    );
  }

  if (error && rawPlans.length === 0) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.colors.warning} />
          <Text style={styles.errorTitle}>Unable to Load Plans</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchData}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (total === 0) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Ionicons name="phone-portrait-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyTitle}>No Plans Available</Text>
          <Text style={styles.emptyText}>
            No eSIM plans are currently available for {params.countryName}. 
            Please check back later or browse other countries.
          </Text>
          <TouchableOpacity 
            style={styles.browseButton} 
            onPress={() => router.push('/countries')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Browse Countries</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state for specific tab
  if (paginatedPlans.length === 0) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <View style={styles.tabEmptyContainer}>
            <Text style={styles.tabEmptyText}>
              {activeTab === 'unlimited' 
                ? 'No unlimited plans available for this country.'
                : 'No standard plans available for this country.'}
            </Text>
            {activeTab === 'unlimited' && standard.length > 0 && (
              <TouchableOpacity 
                style={styles.switchTabButton}
                onPress={() => setActiveTab('standard')}
                activeOpacity={0.7}
              >
                <Text style={styles.switchTabButtonText}>View Standard Plans</Text>
              </TouchableOpacity>
            )}
            {activeTab === 'standard' && unlimited.length > 0 && (
              <TouchableOpacity 
                style={styles.switchTabButton}
                onPress={() => setActiveTab('unlimited')}
                activeOpacity={0.7}
              >
                <Text style={styles.switchTabButtonText}>View Unlimited Plans</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  const renderPlanItem = ({ item, index }: { item: Plan; index: number }) => {
    const isPopular = index === 0 && currentPage === 1; // First plan on first page
    const displayDataSize = getDisplayDataSize(item);
    const displayName = getDisplayName(item);
    
    // Calculate discount
    const gb = calculateGB(item.volume);
    const discountPercent = getPlanDiscount(item.packageCode || '', gb);
    const hasDiscount = discountPercent > 0;
    const originalPrice = item.price;
    const finalPrice = hasDiscount 
      ? calculateDiscountedPrice(originalPrice, discountPercent) 
      : originalPrice;
    
    return (
      <AnimatedListItem index={index}>
        <TouchableOpacity
          style={[styles.planCard, isPopular && styles.planCardPopular]}
          onPress={() => handleSelectPlan(item)}
          activeOpacity={0.7}
        >
          {/* Popular Badge */}
          {isPopular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>BEST CHOICE</Text>
            </View>
          )}

          {/* Left Side: Data & Duration */}
          <View style={styles.planLeft}>
            <Text style={styles.dataSizeText}>{displayDataSize}</Text>
            <View style={styles.durationRow}>
              <Text style={styles.durationText}>{formatValidity(item.duration, item.durationUnit)}</Text>
              {hasDiscount && (
                <View style={styles.discountTag}>
                  <Text style={styles.discountTagText}>-{Math.round(discountPercent)}%</Text>
                </View>
              )}
            </View>
          </View>

          {/* Right Side: Price */}
          <View style={styles.planRight}>
            <Text style={styles.planPrice}>{formatPrice(convert(finalPrice))}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{formatPrice(convert(originalPrice))}</Text>
            )}
          </View>
        </TouchableOpacity>
      </AnimatedListItem>
    );
  };

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <View style={styles.listWrapper}>
        <FlatList
          data={paginatedPlans}
          keyExtractor={(item) => item.packageCode || item.id || item.name}
          renderItem={renderPlanItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      </View>
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Header
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  listWrapper: {
    flex: 1,
  },
  headerSection: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  countryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  flagContainer: {
    width: 64,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flagImage: {
    width: '100%',
    height: '100%',
  },
  flagFallback: {
    fontSize: 32,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  priceFromBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priceFromText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabBadgeActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  tabBadgeTextActive: {
    color: theme.colors.textOnPrimary,
  },
  
  // Filter Row
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planCountText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortButtonText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  sortButtonIcon: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  
  // Sort Dropdown
  sortDropdown: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  sortDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sortDropdownItemActive: {
    backgroundColor: theme.colors.backgroundLight,
  },
  sortDropdownItemText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  sortDropdownItemTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  sortDropdownCheck: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // List
  listContent: {
    paddingTop: 10,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  
  // Plan Card
  planCard: {
    backgroundColor: theme.colors.card,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.soft,
  },
  planCardPopular: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.card,
  },
  // Left side: Data & Duration
  planLeft: {
    flex: 1,
  },
  // Right side: Price
  planRight: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  dataSizeText: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  originalPrice: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  durationText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  discountTag: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  discountTagText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '700',
  },
  
  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.backgroundLight,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  paginationButtonTextDisabled: {
    color: theme.colors.textMuted,
  },
  paginationPages: {
    flexDirection: 'row',
    gap: 4,
  },
  paginationPage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationPageActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  paginationPageText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  paginationPageTextActive: {
    color: theme.colors.textOnPrimary,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  
  // Tab Empty
  tabEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  tabEmptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  switchTabButton: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchTabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  
  // Error Banner
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.errorBackground,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.25)',
    padding: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: theme.colors.error,
    textAlign: 'center',
    fontWeight: '500',
  },
});
