import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl, ActivityIndicator, TextInput, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import BottomNav from '../src/components/BottomNav';
import { useCurrency } from '../src/context/CurrencyContext';
import { getLowestPriceFromPlans } from '../src/utils/planUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Country = {
  code: string;
  name: string;
  type: number;
  locationLogo?: string;
  lowestPrice?: number;
  currency?: string;
};

type Plan = {
  packageCode?: string;
  id?: string;
  name: string;
  price: number;
  currency?: string;
  volume?: number; // in MB from API
  duration?: number;
  durationUnit?: string;
  fup1Mbps?: boolean;
};

// Popular countries to show on homepage
const POPULAR_CODES = ['US', 'GB', 'FR', 'JP', 'ES', 'IT', 'TR', 'TH'];

// Filter Tabs
const FILTER_TABS = [
  { id: 'country', label: 'Country' },
  { id: 'regional', label: 'Regional' },
  { id: 'global', label: 'Global' },
];

// Region definitions
type Region = {
  code: string;
  name: string;
  icon: string;
};

const REGIONS: Region[] = [
  { code: 'asia', name: 'Asia', icon: '🌏' },
  { code: 'europe', name: 'Europe', icon: '🇪🇺' },
  { code: 'north-america', name: 'North America', icon: '🌎' },
  { code: 'south-america', name: 'South America', icon: '🌎' },
  { code: 'africa', name: 'Africa', icon: '🌍' },
  { code: 'oceania', name: 'Oceania', icon: '🌏' },
];

// Country to region mapping
const COUNTRY_TO_REGION: Record<string, string> = {
  // Asia
  AF: 'asia', AM: 'asia', AZ: 'asia', BH: 'asia', BD: 'asia', BT: 'asia',
  BN: 'asia', KH: 'asia', CN: 'asia', GE: 'asia', HK: 'asia', IN: 'asia',
  ID: 'asia', IR: 'asia', IQ: 'asia', IL: 'asia', JP: 'asia', JO: 'asia',
  KZ: 'asia', KW: 'asia', KG: 'asia', LA: 'asia', LB: 'asia', MY: 'asia',
  MV: 'asia', MN: 'asia', MM: 'asia', NP: 'asia', KP: 'asia', OM: 'asia',
  PK: 'asia', PH: 'asia', QA: 'asia', SA: 'asia', SG: 'asia', KR: 'asia',
  LK: 'asia', SY: 'asia', TW: 'asia', TJ: 'asia', TH: 'asia', TL: 'asia',
  TR: 'asia', TM: 'asia', AE: 'asia', UZ: 'asia', VN: 'asia', YE: 'asia',
  
  // Europe
  AL: 'europe', AD: 'europe', AT: 'europe', BY: 'europe', BE: 'europe',
  BA: 'europe', BG: 'europe', HR: 'europe', CY: 'europe', CZ: 'europe',
  DK: 'europe', EE: 'europe', FI: 'europe', FR: 'europe', DE: 'europe',
  GR: 'europe', HU: 'europe', IS: 'europe', IE: 'europe', IT: 'europe',
  LV: 'europe', LI: 'europe', LT: 'europe', LU: 'europe', MT: 'europe',
  MD: 'europe', MC: 'europe', ME: 'europe', NL: 'europe', MK: 'europe',
  NO: 'europe', PL: 'europe', PT: 'europe', RO: 'europe', RU: 'europe',
  SM: 'europe', RS: 'europe', SK: 'europe', SI: 'europe', ES: 'europe',
  SE: 'europe', CH: 'europe', UA: 'europe', GB: 'europe', VA: 'europe',
  
  // North America
  CA: 'north-america', MX: 'north-america', US: 'north-america',
  BZ: 'north-america', CR: 'north-america', SV: 'north-america',
  GT: 'north-america', HN: 'north-america', NI: 'north-america',
  PA: 'north-america',
  
  // South America
  AR: 'south-america', BO: 'south-america', BR: 'south-america',
  CL: 'south-america', CO: 'south-america', EC: 'south-america',
  GY: 'south-america', PY: 'south-america', PE: 'south-america',
  SR: 'south-america', UY: 'south-america', VE: 'south-america',
  
  // Africa
  DZ: 'africa', AO: 'africa', BJ: 'africa', BW: 'africa', BF: 'africa',
  BI: 'africa', CV: 'africa', CM: 'africa', CF: 'africa', TD: 'africa',
  KM: 'africa', CG: 'africa', CD: 'africa', CI: 'africa', DJ: 'africa',
  EG: 'africa', GQ: 'africa', ER: 'africa', SZ: 'africa', ET: 'africa',
  GA: 'africa', GM: 'africa', GH: 'africa', GN: 'africa', GW: 'africa',
  KE: 'africa', LS: 'africa', LR: 'africa', LY: 'africa', MG: 'africa',
  MW: 'africa', ML: 'africa', MR: 'africa', MU: 'africa', MA: 'africa',
  MZ: 'africa', NA: 'africa', NE: 'africa', NG: 'africa', RW: 'africa',
  ST: 'africa', SN: 'africa', SC: 'africa', SL: 'africa', SO: 'africa',
  ZA: 'africa', SS: 'africa', SD: 'africa', TZ: 'africa', TG: 'africa',
  TN: 'africa', UG: 'africa', ZM: 'africa', ZW: 'africa',
  
  // Oceania
  AU: 'oceania', NZ: 'oceania', FJ: 'oceania', PG: 'oceania',
  NC: 'oceania', PF: 'oceania', WS: 'oceania', SB: 'oceania',
  VU: 'oceania',
};

function getCountriesForRegion(regionCode: string): string[] {
  return Object.entries(COUNTRY_TO_REGION)
    .filter(([_, region]) => region === regionCode)
    .map(([code]) => code);
}

export default function Home() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { convert, convertFromCurrency, formatPrice: formatCurrencyPrice } = useCurrency();
  const isLoaded = userLoaded && authLoaded;
  
  const [popularCountries, setPopularCountries] = useState<Country[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loadingPrices, setLoadingPrices] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('country');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionCountries, setRegionCountries] = useState<Country[]>([]);
  const [loadingRegionCountries, setLoadingRegionCountries] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const countriesData = await apiFetch<Country[]>('/countries');
      
      // Filter to only show countries (type === 1), exclude multi-region plans (type === 2)
      const countriesOnly = countriesData.filter((item: Country) => 
        item.type === 1 || !item.type
      );
      
      // Sort all countries alphabetically
      const sortedAllCountries = countriesOnly.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setAllCountries(sortedAllCountries);
      
      // Fetch popular countries with prices
      const popular = countriesData.filter(c => POPULAR_CODES.includes(c.code));
      const sortedPopular = popular.sort((a, b) => {
        return POPULAR_CODES.indexOf(a.code) - POPULAR_CODES.indexOf(b.code);
      });
      
      const countriesWithPrices = await Promise.all(
        sortedPopular.map(async (country) => {
          try {
            setLoadingPrices(prev => ({ ...prev, [country.code]: true }));
            const plans = await apiFetch<Plan[]>(`/countries/${country.code}/plans`);
            if (plans && plans.length > 0) {
              // Use the same filtering logic as web app - only get price from plans we actually sell
              const lowestPrice = getLowestPriceFromPlans(plans);
              const currency = plans[0]?.currency || 'USD';
              return { ...country, lowestPrice, currency };
            }
          } catch (err) {
            console.warn(`Failed to fetch plans for ${country.code}:`, err);
          } finally {
            setLoadingPrices(prev => ({ ...prev, [country.code]: false }));
          }
          return country;
        })
      );
      
      setPopularCountries(countriesWithPrices);
    } catch (err) {
      console.error('Failed to fetch countries', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getFlagUrl = (country: Country) => {
    if (country.locationLogo) return country.locationLogo;
    return `https://flagcdn.com/w160/${country.code.toLowerCase()}.png`;
  };

  const handleImageError = (code: string) => {
    setImageErrors(prev => ({ ...prev, [code]: true }));
  };

  const handleCountryPress = (country: Country) => {
    router.push({
      pathname: '/plans',
      params: {
        countryId: country.code,
        countryName: country.name,
        regionId: country.code,
        regionName: country.name,
      },
    });
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'View plans';
    // Convert from the source currency (from API) to user's selected currency
    const convertedPrice = currency ? convertFromCurrency(price, currency) : convert(price);
    return `From ${formatCurrencyPrice(convertedPrice)}`;
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    // Reset region selection when switching tabs
    if (tabId !== 'regional') {
      setSelectedRegion(null);
      setRegionCountries([]);
    }
    if (tabId === 'global') {
      // Navigate to global plans page - try GL-120 first (most common)
      router.push({
        pathname: '/plans',
        params: {
          countryId: 'GL-120', // Global plan code (120+ countries)
          countryName: 'Global',
        },
      });
    }
  };

  const handleRegionPress = async (region: Region) => {
    if (selectedRegion === region.code) {
      // If already selected, deselect
      setSelectedRegion(null);
      setRegionCountries([]);
      return;
    }

    setSelectedRegion(region.code);
    setLoadingRegionCountries(true);

    try {
      // Fetch all countries
      const countriesData = await apiFetch<Country[] | { locationList: Country[] }>('/countries');
      const countriesArray = Array.isArray(countriesData) 
        ? countriesData 
        : (countriesData.locationList || []);

      // Filter to only countries (type === 1)
      const countriesOnly = countriesArray.filter((item: Country) => 
        item.type === 1 || !item.type
      );

      // Get country codes for this region
      const regionCountryCodes = getCountriesForRegion(region.code);
      
      // Filter countries that belong to this region
      const filtered = countriesOnly.filter((country: Country) =>
        regionCountryCodes.includes(country.code.toUpperCase())
      );

      // Sort alphabetically
      const sorted = filtered.sort((a: Country, b: Country) =>
        a.name.localeCompare(b.name)
      );

      // Fetch prices for each country in the region
      const countriesWithPrices = await Promise.all(
        sorted.map(async (country) => {
          try {
            setLoadingPrices(prev => ({ ...prev, [country.code]: true }));
            const plans = await apiFetch<Plan[]>(`/countries/${country.code}/plans`);
            if (plans && plans.length > 0) {
              // Use the same filtering logic as web app - only get price from plans we actually sell
              const lowestPrice = getLowestPriceFromPlans(plans);
              const currency = plans[0]?.currency || 'USD';
              return { ...country, lowestPrice, currency };
            }
          } catch (err) {
            console.warn(`Failed to fetch plans for ${country.code}:`, err);
          } finally {
            setLoadingPrices(prev => ({ ...prev, [country.code]: false }));
          }
          return country;
        })
      );

      setRegionCountries(countriesWithPrices);
    } catch (err) {
      console.error('Error fetching region countries:', err);
    } finally {
      setLoadingRegionCountries(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      {/* Fixed Header Area */}
      <View style={styles.headerContainer}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>Where to next?</Text>
          <Text style={styles.heroSubtitle}>Find the perfect eSIM for your trip</Text>
        </View>
        
        <View style={styles.searchBar}>
          <Ionicons name="search" size={24} color={theme.colors.text} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search destinations..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Filter Tabs - Big Segmented Control */}
        <View style={styles.tabsContainer}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity 
              key={tab.id} 
              style={[
                styles.tab, 
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => handleTabPress(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Regional Tab Content - Grid Style */}
        {activeTab === 'regional' && !searchQuery && (
          <>
            <Text style={styles.sectionTitle}>Regions</Text>
            <View style={styles.regionsGrid}>
              {REGIONS.map((region) => (
                <TouchableOpacity
                  key={region.code}
                  style={[
                    styles.regionCard,
                    selectedRegion === region.code && styles.regionCardSelected
                  ]}
                  onPress={() => handleRegionPress(region)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.regionCardIcon}>{region.icon}</Text>
                  <Text style={styles.regionCardName}>{region.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Expanded Region Countries */}
            {selectedRegion && (
              <View style={styles.regionResultsContainer}>
                <Text style={styles.subSectionTitle}>
                  Countries in {REGIONS.find(r => r.code === selectedRegion)?.name}
                </Text>
                {loadingRegionCountries ? (
                  <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
                ) : regionCountries.length > 0 ? (
                  regionCountries.map((country) => (
                    <TouchableOpacity
                      key={country.code}
                      style={styles.resultItem}
                      onPress={() => handleCountryPress(country)}
                    >
                      <View style={styles.flagContainerSmall}>
                        {!imageErrors[country.code] ? (
                          <Image
                            source={{ uri: getFlagUrl(country) }}
                            style={styles.flag}
                            resizeMode="cover"
                            onError={() => handleImageError(country.code)}
                          />
                        ) : (
                          <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
                        )}
                      </View>
                      <Text style={styles.resultName}>{country.name}</Text>
                      <View style={styles.priceTag}>
                        {loadingPrices[country.code] ? (
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                          <Text style={styles.priceTagText}>{formatPrice(country.lowestPrice, country.currency)}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No countries found in this region</Text>
                )}
              </View>
            )}
          </>
        )}

        {/* Country Tab Content - Horizontal Scroll for Popular */}
        {activeTab === 'country' && !searchQuery && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular</Text>
              <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularScroll}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                popularCountries.map((country) => (
                  <TouchableOpacity 
                    key={country.code} 
                    style={styles.popularCard}
                    onPress={() => handleCountryPress(country)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.popularFlagContainer}>
                      {!imageErrors[country.code] ? (
                        <Image
                          source={{ uri: getFlagUrl(country) }}
                          style={styles.flag}
                          resizeMode="cover"
                          onError={() => handleImageError(country.code)}
                        />
                      ) : (
                        <Ionicons name="globe-outline" size={32} color={theme.colors.textMuted} />
                      )}
                    </View>
                    <Text style={styles.popularName} numberOfLines={1}>{country.name}</Text>
                    <View style={styles.popularPriceBadge}>
                      {loadingPrices[country.code] ? (
                        <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                      ) : (
                        <Text style={styles.popularPriceText}>{formatPrice(country.lowestPrice, country.currency)}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </>
        )}

        {/* All Destinations - Big List */}
        {activeTab === 'country' && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>
              {searchQuery ? 'Search Results' : 'All Destinations'}
            </Text>
            <View style={styles.listContainer}>
              {allCountries
                .filter(country => 
                  !searchQuery || 
                  country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  country.code.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.bigListItem}
                  onPress={() => handleCountryPress(country)}
                  activeOpacity={0.7}
                >
                  <View style={styles.flagContainer}>
                    {!imageErrors[country.code] ? (
                      <Image
                        source={{ uri: getFlagUrl(country) }}
                        style={styles.flag}
                        resizeMode="cover"
                        onError={() => handleImageError(country.code)}
                      />
                    ) : (
                      <Ionicons name="globe-outline" size={24} color={theme.colors.textMuted} />
                    )}
                  </View>
                  
                  <View style={styles.listItemContent}>
                    <Text style={styles.countryName}>{country.name}</Text>
                    {loadingPrices[country.code] ? (
                      <ActivityIndicator size="small" color={theme.colors.textMuted} />
                    ) : (
                      <Text style={styles.priceText}>{formatPrice(country.lowestPrice, country.currency)}</Text>
                    )}
                  </View>
                  
                  <View style={styles.arrowButton}>
                    <Ionicons name="arrow-forward" size={20} color={theme.colors.text} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
      <BottomNav activeTab="store" />
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
  headerContainer: {
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: 20,
  },
  heroHeader: {
    marginBottom: 20,
    marginTop: 10,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -1,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: theme.colors.text,
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.textOnPrimary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    paddingHorizontal: 20,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    marginTop: 24,
  },
  
  // Popular Cards (Horizontal)
  popularScroll: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  popularCard: {
    width: 160,
    height: 200,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginRight: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'space-between',
    ...theme.shadows.hard,
  },
  popularFlagContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 12,
  },
  popularPriceBadge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  popularPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },

  // Big List Items
  listContainer: {
    paddingHorizontal: 20,
  },
  bigListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  flagContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagContainerSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    width: '100%',
    height: '100%',
  },
  listItemContent: {
    flex: 1,
  },
  countryName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Regions Grid
  regionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
  },
  regionCard: {
    width: (SCREEN_WIDTH - 52) / 2, // 2 columns with gaps
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  regionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10', // 10% opacity
    borderWidth: 2,
  },
  regionCardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  regionCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  regionResultsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  priceTag: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    marginTop: 20,
    fontSize: 16,
  },
});
