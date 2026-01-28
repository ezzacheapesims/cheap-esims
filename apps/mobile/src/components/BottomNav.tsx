import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

// Bottom navigation tabs: Home, Spare Change, My eSIMs, Profile
type Tab = 'store' | 'v-cash' | 'my-esims' | 'profile';

interface BottomNavProps {
  activeTab: Tab | 'support'; // Keeping support for backward compatibility if needed
}

const TABS: Array<{ id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap; route: string }> = [
  { id: 'store', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/' },
  { id: 'v-cash', label: 'Spare Change', icon: 'wallet-outline', activeIcon: 'wallet', route: '/v-cash' },
  { id: 'my-esims', label: 'My eSIMs', icon: 'phone-portrait-outline', activeIcon: 'phone-portrait', route: '/my-esims' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/profile' },
];

export default function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
                <Ionicons
                  name={active ? tab.activeIcon : tab.icon}
                  size={24}
                  color={active ? theme.colors.primary : theme.colors.textMuted}
                />
              </View>
              {active && (
                <Text style={styles.tabLabelActive}>
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const BOTTOM_SAFE_AREA = Platform.OS === 'ios' ? 34 : 16;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: BOTTOM_SAFE_AREA + 10,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.hardLg, // Floating shadow
    paddingBottom: 0, // Reset safe area padding since we're floating
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    height: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
  },
  tabActive: {
    flex: 1.5, // Grow active tab
    backgroundColor: theme.colors.backgroundLight,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    marginRight: 8,
  },
  tabLabel: {
    display: 'none', // Hide labels for inactive tabs
  },
  tabLabelActive: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
