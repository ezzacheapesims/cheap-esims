import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, Dimensions, Switch, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { theme } from '../src/theme';
import { useCurrency, SUPPORTED_CURRENCIES } from '../src/context/CurrencyContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type MenuItem = {
  id: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showArrow?: boolean;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
};

export default function Profile() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, isSignedIn, isLoaded: authLoaded } = useAuth();
  const { selectedCurrency, setCurrency } = useCurrency();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(true);
  
  const isLoaded = userLoaded && authLoaded;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const getInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress[0].toUpperCase();
    }
    return 'U';
  };

  const getName = () => {
    if (user?.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }
    return user?.primaryEmailAddress?.emailAddress || 'Guest';
  };

  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);

  // Group 1: Account / Business (Using Affiliate for Business equivalent)
  const group1: MenuItem[] = isLoaded && isSignedIn ? [
    {
      id: 'my-esims',
      label: 'My eSIMs',
      onPress: () => router.push('/my-esims'),
      showArrow: true,
    },
    {
      id: 'affiliate',
      label: 'Cheap eSIMs Affiliate',
      onPress: () => router.push('/affiliate'),
      showArrow: true,
    },
  ] : [];

  // Group 2: Settings
  const group2: MenuItem[] = [
    {
      id: 'currency',
      label: `Currency (${selectedCurrency})`,
      onPress: () => setShowCurrencyModal(true),
      showArrow: true,
    },
    {
      id: 'marketing',
      label: 'Marketing communication',
      onPress: () => setMarketingEnabled(!marketingEnabled),
      hasToggle: true,
      toggleValue: marketingEnabled,
      onToggle: setMarketingEnabled,
    }
  ];

  // Group 3: Legal
  const group3: MenuItem[] = [
    {
      id: 'terms',
      label: 'Terms of service',
      onPress: () => router.push('/policies'),
      showArrow: true,
    },
    {
      id: 'privacy',
      label: 'Privacy policy',
      onPress: () => router.push('/privacy'),
      showArrow: true,
    },
    {
      id: 'help',
      label: 'Help center',
      onPress: () => router.push('/support'),
      showArrow: true,
    },
  ];

  // Group 4: Auth Actions
  const group4: MenuItem[] = isLoaded && isSignedIn ? [
    {
      id: 'logout',
      label: 'Log out',
      onPress: handleSignOut,
      showArrow: true,
    },
    {
      id: 'delete',
      label: 'Delete my account',
      onPress: () => {}, // TODO: Implement delete
      destructive: true,
    },
  ] : [
    {
      id: 'login',
      label: 'Log in / Sign up',
      onPress: handleSignIn,
      showArrow: true,
    },
  ];

  const renderGroup = (items: MenuItem[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.menuGroup}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              index === items.length - 1 && styles.lastMenuItem
            ]}
            onPress={item.onPress}
            activeOpacity={item.hasToggle ? 1 : 0.7}
          >
            <View style={styles.menuContent}>
              <Text style={[
                styles.menuLabel,
                item.destructive && styles.menuLabelDestructive
              ]}>
                {item.label}
              </Text>
              {item.label === 'Marketing communication' && (
                <Text style={styles.menuSubLabel}>
                  Enable this option to receive exclusive Cheap eSIMs offers and promotions.
                </Text>
              )}
            </View>
            
            {item.hasToggle && (
              <Switch
                value={item.toggleValue}
                onValueChange={item.onToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.white}
              />
            )}
            
            {item.showArrow && (
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        {isLoaded && isSignedIn && user && (
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitial()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{getName()}</Text>
              <Text style={styles.profileEmail}>{user.primaryEmailAddress?.emailAddress}</Text>
            </View>
          </View>
        )}

        {/* Guest State */}
        {isLoaded && !isSignedIn && (
          <TouchableOpacity 
            style={styles.profileCard}
            onPress={handleSignIn}
            activeOpacity={0.7}
          >
            <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary, opacity: 0.8 }]}>
              <Text style={styles.avatarText}>G</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Guest User</Text>
              <Text style={styles.profileEmail}>Sign in to sync your data</Text>
            </View>
          </TouchableOpacity>
        )}

        {renderGroup(group1)}
        {renderGroup(group2)}
        {renderGroup(group3)}
        {renderGroup(group4)}

        <View style={styles.footer}>
          <Text style={styles.appVersion}>App version: 1.0.0</Text>
        </View>
      </ScrollView>
      
      <BottomNav activeTab="profile" />

      {/* Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={() => setShowCurrencyModal(false)} 
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.currencyItem}
                  onPress={() => {
                    setCurrency(item.code);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={[
                    styles.currencyCode, 
                    selectedCurrency === item.code && styles.currencyCodeSelected
                  ]}>
                    {item.code} - {item.name}
                  </Text>
                  {selectedCurrency === item.code && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  // Header
  header: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
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
    paddingBottom: 120,
    paddingTop: 10,
  },
  // Profile Card (Grouped style)
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  // Menu Groups
  menuGroup: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuContent: {
    flex: 1,
    paddingRight: 16,
  },
  menuLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  menuLabelDestructive: {
    color: theme.colors.error,
  },
  menuSubLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.textMuted,
    fontWeight: '300',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  appVersion: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 40,
    ...theme.shadows.hardLg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: theme.colors.textMuted,
    fontWeight: 'bold',
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  currencyCode: {
    fontSize: 17,
    color: theme.colors.text,
    fontWeight: '500',
  },
  currencyCodeSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
