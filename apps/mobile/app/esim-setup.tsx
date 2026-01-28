import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Linking, Platform, Share, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { getStatusLabel, getStatusColor } from '../src/utils/statusUtils';
import { formatDataSize, calculateRemainingData, calculateUsagePercentage, formatExpiryDate } from '../src/utils/dataUtils';
import { useToast } from '../src/context/ToastContext';

// Clipboard copy function (needs toast passed in)
const copyToClipboard = async (text: string, label: string, toast: any): Promise<boolean> => {
  try {
    const ReactNative = require('react-native');
    if (ReactNative.Clipboard && ReactNative.Clipboard.setString) {
      await ReactNative.Clipboard.setString(text);
      toast.success('Copied', `${label} copied to clipboard`);
      return true;
    }
  } catch (err) {
    // Clipboard not available
  }
  
  toast.info(label, `${label}: ${text}\n\nPlease copy this text manually.`);
  return false;
};

// Format date for display
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Auto-install eSIM using Universal Links (iOS 17.4+ and Android 10+)
const autoInstallEsim = async (activationCode: string, toast: any) => {
  // Copy activation code as fallback
  await copyToClipboard(activationCode, 'Activation Code', toast);
  
  try {
    let universalLinkUrl = '';
    
    if (Platform.OS === 'ios') {
      // iOS Universal Link (iOS 17.4+)
      universalLinkUrl = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(activationCode)}`;
      
      try {
        const canOpen = await Linking.canOpenURL(universalLinkUrl);
        if (canOpen) {
          await Linking.openURL(universalLinkUrl);
          return;
        }
      } catch (error) {
        console.log('iOS Universal Link not supported, showing fallback instructions');
      }
      
      // Fallback for older iOS versions
      toast.info(
        'Install eSIM',
        'Activation code copied!\n\n1. Open Settings → Cellular → Add Plan\n2. Paste the activation code or scan QR\n\nNote: One-tap install requires iOS 17.4+'
      );
      
    } else if (Platform.OS === 'android') {
      // Android Universal Link (Android 10+)
      universalLinkUrl = `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(activationCode)}`;
      
      try {
        const canOpen = await Linking.canOpenURL(universalLinkUrl);
        if (canOpen) {
          await Linking.openURL(universalLinkUrl);
          return;
        }
      } catch (error) {
        console.log('Android Universal Link not supported, showing fallback instructions');
      }
      
      // Fallback for older Android versions
      toast.info(
        'Install eSIM',
        'Activation code copied!\n\n1. Settings → Network & internet → SIMs\n2. Add mobile plan → Paste code or scan QR\n\nNote: Requires Android 10+'
      );
      
    } else {
      toast.info('Install eSIM', 'Activation code copied! Go to Settings → Cellular → Add Plan and paste the code.');
    }
  } catch (error) {
    console.error('Auto-install error:', error);
    toast.info('Installation Instructions', 'Activation code copied! Follow the steps below to install your eSIM.');
  }
};

type EsimProfile = {
  id: string;
  iccid?: string;
  qrCodeUrl?: string | null;
  ac?: string | null;
  esimStatus?: string | null;
  expiredTime?: string | null;
  totalVolume?: string | null;
  orderUsage?: string | null;
};

type OrderData = {
  id: string;
  planId?: string;
  status: string;
  userEmail?: string;
  createdAt?: string;
  EsimProfile?: EsimProfile[];
  planDetails?: {
    locationCode?: string;
    name?: string;
  };
};

export default function EsimSetup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const toast = useToast();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [cachedOrder, setCachedOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [troubleshootingExpanded, setTroubleshootingExpanded] = useState(false);

  useEffect(() => {
    if (params.orderId) {
      fetchOrder();
    } else {
      setError('Order ID is required');
      setLoading(false);
    }
  }, [params.orderId]);

  async function fetchOrder() {
    try {
      setLoading(true);
      setError(null);
      const orderData = await apiFetch<OrderData>(`/orders/${params.orderId}`);
      setOrder(orderData);
      setCachedOrder(orderData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      const isNetworkError = errorMessage.includes('Network request failed') || 
                             errorMessage.includes('network') ||
                             errorMessage.includes('fetch');
      
      setError(isNetworkError 
        ? 'Unable to connect. Please check your internet connection.'
        : errorMessage);
      console.error('Error fetching order:', err);
      
      if (cachedOrder) {
        setOrder(cachedOrder);
      }
    } finally {
      setLoading(false);
    }
  }

  const esimProfile = order?.EsimProfile?.[0];
  const hasQrCode = !!esimProfile?.qrCodeUrl;
  const hasActivationCode = !!esimProfile?.ac;
  const esimStatus = esimProfile?.esimStatus?.toUpperCase() || '';
  
  // Data usage calculations
  const totalData = formatDataSize(esimProfile?.totalVolume);
  const usedData = formatDataSize(esimProfile?.orderUsage);
  const remainingData = calculateRemainingData(esimProfile?.totalVolume, esimProfile?.orderUsage);
  const usagePercentage = calculateUsagePercentage(esimProfile?.totalVolume, esimProfile?.orderUsage);
  
  // Dates
  const activationDate = order?.createdAt ? formatDate(order.createdAt) : '—';
  const expiryDateFull = esimProfile?.expiredTime ? formatDate(esimProfile.expiredTime) : '—';
  const expiryText = formatExpiryDate(esimProfile?.expiredTime);
  
  // Activation code (AC) for copying
  const activationCode = esimProfile?.ac || null;

  const handleBuyAgain = () => {
    router.push('/countries');
  };

  const handleCopyOrderId = async () => {
    if (!order?.id) return;
    await copyToClipboard(order.id, 'Order ID', toast);
  };

  const handleCopyActivationCode = async () => {
    if (!activationCode) return;
    await copyToClipboard(activationCode, 'Activation Code', toast);
  };

  const handleResendEmail = async () => {
    if (!order?.id) return;

    try {
      setResendingEmail(true);
      const result = await apiFetch<{ success: boolean; message: string }>(
        `/orders/${order.id}/resend-receipt`,
        { method: 'POST' }
      );

      if (result.success) {
        toast.success('Email Sent', result.message || 'eSIM email has been resent to your email address.');
      } else {
        toast.error('Error', 'Failed to resend email. Please try again later.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend email';
      console.error('Error resending email:', err);
      toast.error('Error', errorMessage);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleContactSupport = () => {
    toast.info(
      'Contact Support',
      `For support, please email us with your Order ID: ${order?.id || 'N/A'}\n\nYou can also visit our support page for more help.`
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading setup instructions...</Text>
        </View>
      </View>
    );
  }

  if ((error || !order) && !cachedOrder && !loading) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color={theme.colors.warning} />
            <Text style={styles.errorTitle}>Unable to Load Order</Text>
            <Text style={styles.errorText}>{error || 'Order not found'}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchOrder}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const renderStatusContent = () => {
    if (esimStatus === 'GOT_RESOURCE' || esimStatus === 'DOWNLOAD') {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>eSIM Setup Instructions</Text>
            <Text style={styles.subtitle}>Follow these steps to install your eSIM</Text>
          </View>

          {(hasQrCode || hasActivationCode) && (
            <View style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <View style={styles.qrHeaderIcon}>
                  <Ionicons name="qr-code" size={28} color={theme.colors.white} />
                </View>
                <View style={styles.qrHeaderText}>
                  <Text style={styles.qrCardTitle}>Install your eSIM</Text>
                  <Text style={styles.qrCardSubtitle}>
                    {hasQrCode ? 'Scan or auto-install' : 'Use activation code'}
                  </Text>
                </View>
              </View>

              {hasQrCode && (
                <View style={styles.qrContainer}>
                  <View style={styles.qrCodeWrapper}>
                    <Image
                      source={{ uri: esimProfile.qrCodeUrl! }}
                      style={styles.qrCode}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              )}

              {activationCode && (
                <>
                  <View style={styles.installButtonsContainer}>
                    <TouchableOpacity
                      style={styles.autoInstallButton}
                      onPress={() => autoInstallEsim(activationCode, toast)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="download-outline" size={20} color={theme.colors.white} />
                      <Text style={styles.autoInstallButtonText}>Auto Install eSIM</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.copyCodeButton}
                      onPress={handleCopyActivationCode}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={18} color={theme.colors.primary} />
                      <Text style={styles.copyCodeButtonText}>Copy Code</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.qrTip}>
                    <Ionicons name="information-circle" size={18} color={theme.colors.primary} />
                    <Text style={styles.qrTipText}>
                      {hasQrCode 
                        ? 'Tap "Auto Install" for one-tap setup (iOS 17.4+ / Android 10+) or scan the QR code. Make sure Data Roaming is enabled after installation.'
                        : 'Tap "Auto Install" for one-tap setup (iOS 17.4+ / Android 10+) or copy the activation code to install manually. Make sure Data Roaming is enabled after installation.'
                      }
                    </Text>
                  </View>

                  {/* Activation Code in QR Card */}
                  <View style={styles.activationCodeInQR}>
                    <View style={styles.activationCodeHeader}>
                      <Text style={styles.activationCodeLabel}>ACTIVATION CODE</Text>
                      <TouchableOpacity
                        style={styles.copyActivationButtonInQR}
                        onPress={handleCopyActivationCode}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
                        <Text style={styles.copyActivationButtonTextInQR}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.activationCodeValue} numberOfLines={1} ellipsizeMode="middle">
                      {activationCode}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}
          {(hasQrCode || hasActivationCode) && <View style={styles.divider} />}
          {renderInstallInstructions()}
        </>
      );
    }

    if (esimStatus === 'INSTALLED' || esimStatus === 'INSTALLATION') {
      const statusColor = getStatusColor('INSTALLED');
      return (
        <>
          <View style={styles.header}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel('INSTALLED')}</Text>
            </View>
            <Text style={styles.title}>eSIM Installed</Text>
            <Text style={styles.subtitle}>Your eSIM is ready to activate</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Activation Tips</Text>
            <View style={styles.note}>
              <Text style={styles.noteBullet}>1.</Text>
              <Text style={styles.noteText}>Go to Settings → Cellular (or Mobile Data)</Text>
            </View>
            <View style={styles.note}>
              <Text style={styles.noteBullet}>2.</Text>
              <Text style={styles.noteText}>Select your new eSIM from the list</Text>
            </View>
            <View style={styles.note}>
              <Text style={styles.noteBullet}>3.</Text>
              <Text style={styles.noteText}>Enable "Turn On This Line" or toggle active</Text>
            </View>
            <View style={styles.note}>
              <Text style={styles.noteBullet}>4.</Text>
              <Text style={styles.noteText}>Your eSIM will activate upon connection</Text>
            </View>
          </View>
        </>
      );
    }

    if (esimStatus === 'ACTIVE' || esimStatus === 'IN_USE' || esimStatus === 'ENABLED') {
      const statusColor = getStatusColor('ACTIVE');
      return (
        <>
          <View style={styles.header}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel('ACTIVE')}</Text>
            </View>
            <Text style={styles.title}>eSIM Active</Text>
            <Text style={styles.subtitle}>Your eSIM is connected and working</Text>
          </View>

          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
            <Text style={styles.successMessage}>Your eSIM is currently active and providing connectivity.</Text>
          </View>

          {esimProfile?.expiredTime && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Expiry Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expires:</Text>
                <Text style={styles.infoValue}>{formatExpiryDate(esimProfile.expiredTime)}</Text>
              </View>
              <Text style={styles.expiryNote}>
                Your eSIM will automatically expire on this date.
              </Text>
            </View>
          )}
        </>
      );
    }

    if (esimStatus === 'EXPIRED' || esimStatus === 'UNUSED_EXPIRED' || esimStatus === 'USED_EXPIRED' || esimStatus === 'DISABLED') {
      const statusColor = getStatusColor('EXPIRED');
      return (
        <>
          <View style={styles.header}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel('EXPIRED')}</Text>
            </View>
            <Text style={styles.title}>eSIM Expired</Text>
            <Text style={styles.subtitle}>This eSIM is no longer active</Text>
          </View>

          <View style={styles.errorCard}>
            <Ionicons name="close-circle" size={48} color={theme.colors.error} />
            <Text style={styles.errorMessage}>
              This eSIM has expired and is no longer providing connectivity.
            </Text>
            {esimProfile?.expiredTime && (
              <Text style={styles.expiryDate}>
                Expired on {formatExpiryDate(esimProfile.expiredTime)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.buyAgainButton}
            onPress={handleBuyAgain}
            activeOpacity={0.7}
          >
            <Text style={styles.buyAgainButtonText}>Buy New eSIM</Text>
          </TouchableOpacity>
        </>
      );
    }

    const statusColor = getStatusColor(esimProfile?.esimStatus);
    return (
      <>
        <View style={styles.header}>
          {esimProfile?.esimStatus && (
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(esimProfile.esimStatus)}</Text>
            </View>
          )}
          <Text style={styles.title}>eSIM Setup</Text>
          <Text style={styles.subtitle}>Follow these steps to install your eSIM</Text>
        </View>
        {(hasQrCode || hasActivationCode) && (
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <View style={styles.qrHeaderIcon}>
                <Ionicons name="qr-code" size={28} color={theme.colors.white} />
              </View>
              <View style={styles.qrHeaderText}>
                <Text style={styles.qrCardTitle}>Install your eSIM</Text>
                <Text style={styles.qrCardSubtitle}>
                  {hasQrCode ? 'Scan or auto-install' : 'Use activation code'}
                </Text>
              </View>
            </View>

            {hasQrCode && (
              <View style={styles.qrContainer}>
                <View style={styles.qrCodeWrapper}>
                  <Image
                    source={{ uri: esimProfile.qrCodeUrl! }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}

            {activationCode && (
              <>
                <View style={styles.installButtonsContainer}>
                  <TouchableOpacity
                    style={styles.autoInstallButton}
                    onPress={() => autoInstallEsim(activationCode, toast)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="download-outline" size={20} color={theme.colors.white} />
                    <Text style={styles.autoInstallButtonText}>Auto Install eSIM</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.copyCodeButton}
                    onPress={handleCopyActivationCode}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.copyCodeButtonText}>Copy Code</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.qrTip}>
                  <Ionicons name="information-circle" size={18} color={theme.colors.primary} />
                  <Text style={styles.qrTipText}>
                    {hasQrCode 
                      ? 'Tap "Auto Install" for one-tap setup (iOS 17.4+ / Android 10+) or scan the QR code. Make sure Data Roaming is enabled after installation.'
                      : 'Tap "Auto Install" for one-tap setup (iOS 17.4+ / Android 10+) or copy the activation code to install manually. Make sure Data Roaming is enabled after installation.'
                    }
                  </Text>
                </View>

                {/* Activation Code in QR Card */}
                <View style={styles.activationCodeInQR}>
                  <View style={styles.activationCodeHeader}>
                    <Text style={styles.activationCodeLabel}>ACTIVATION CODE</Text>
                    <TouchableOpacity
                      style={styles.copyActivationButtonInQR}
                      onPress={handleCopyActivationCode}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.copyActivationButtonTextInQR}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.activationCodeValue} numberOfLines={1} ellipsizeMode="middle">
                    {activationCode}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
        {(hasQrCode || hasActivationCode) && <View style={styles.divider} />}
        {renderInstallInstructions()}
      </>
    );
  };

  const renderInstallInstructions = () => (
    <>
      <View style={styles.instructionsSection}>
        <Text style={styles.instructionsTitle}>INSTALLATION STEPS</Text>
        
        <View style={styles.platformSection}>
          <View style={styles.platformHeader}>
            <Ionicons name="logo-apple" size={22} color={theme.colors.text} />
            <Text style={styles.platformTitle}>iOS (iPhone)</Text>
          </View>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.stepText}>Open Settings app on your iPhone</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.stepText}>Tap on "Cellular" or "Mobile Data"</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.stepText}>Tap "Add Cellular Plan" or "Add eSIM"</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <Text style={styles.stepText}>
                {hasQrCode ? 'Scan the QR code above' : 'Use the QR code provided in your email'}
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>5</Text>
              </View>
              <Text style={styles.stepText}>Follow on-screen instructions</Text>
            </View>
          </View>
        </View>

        <View style={styles.platformSection}>
          <View style={styles.platformHeader}>
            <Ionicons name="logo-android" size={22} color={theme.colors.text} />
            <Text style={styles.platformTitle}>Android</Text>
          </View>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.stepText}>Open Settings on your Android device</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.stepText}>Tap "Network & internet" or "Connections"</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.stepText}>Tap "SIMs" or "SIM card manager"</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <Text style={styles.stepText}>Tap "Add mobile plan" or "Download a SIM instead"</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>5</Text>
              </View>
              <Text style={styles.stepText}>
                {hasQrCode ? 'Scan the QR code above' : 'Use QR code from email'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.notesSection}>
        <Text style={styles.notesTitle}>IMPORTANT NOTES</Text>
        <View style={styles.note}>
          <View style={styles.noteBulletContainer} />
          <Text style={styles.noteText}>Ensure stable internet connection</Text>
        </View>
        <View style={styles.note}>
          <View style={styles.noteBulletContainer} />
          <Text style={styles.noteText}>Device must be eSIM compatible</Text>
        </View>
        <View style={styles.note}>
          <View style={styles.noteBulletContainer} />
          <Text style={styles.noteText}>You can keep your primary SIM active</Text>
        </View>
      </View>
    </>
  );

  const showStaleDataWarning = error && cachedOrder && order === cachedOrder;

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      {showStaleDataWarning && (
        <View style={styles.staleDataBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="warning" size={16} color={theme.colors.warning} />
            <Text style={styles.staleDataText}>Showing saved data. Information may be outdated.</Text>
          </View>
          <TouchableOpacity
            style={styles.staleDataButton}
            onPress={fetchOrder}
            activeOpacity={0.7}
          >
            <Text style={styles.staleDataButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStatusContent()}
        
        {/* Data Usage Information */}
        {(esimProfile?.totalVolume || esimProfile?.expiredTime) && (
          <View style={styles.dataUsageSection}>
            <Text style={styles.dataUsageSectionTitle}>Data Usage</Text>
            
            {esimProfile?.totalVolume && (
              <>
                <View style={styles.dataUsageRow}>
                  <Text style={styles.dataUsageLabel}>Total Data:</Text>
                  <Text style={styles.dataUsageValue}>{totalData}</Text>
                </View>
                
                <View style={styles.dataUsageRow}>
                  <Text style={styles.dataUsageLabel}>Used:</Text>
                  <Text style={styles.dataUsageValue}>{usedData}</Text>
                </View>
                
                <View style={styles.dataUsageRow}>
                  <Text style={styles.dataUsageLabel}>Remaining:</Text>
                  <Text style={styles.dataUsageValue}>{remainingData}</Text>
                </View>
                
                {esimProfile.totalVolume && (
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          width: `${usagePercentage}%`, 
                          backgroundColor: usagePercentage > 80 ? theme.colors.warning : theme.colors.primary 
                        }
                      ]} 
                    />
                  </View>
                )}
              </>
            )}
            
            <View style={styles.dataUsageRow}>
              <Text style={styles.dataUsageLabel}>Activation Date:</Text>
              <Text style={styles.dataUsageValue}>{activationDate}</Text>
            </View>
            
            <View style={styles.dataUsageRow}>
              <Text style={styles.dataUsageLabel}>Expiry Date:</Text>
              <Text style={styles.dataUsageValue}>{expiryDateFull}</Text>
            </View>
          </View>
        )}
        
        {/* Troubleshooting Section */}
        <View style={styles.troubleshootingSection}>
          <TouchableOpacity
            style={styles.troubleshootingHeader}
            onPress={() => setTroubleshootingExpanded(!troubleshootingExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.troubleshootingTitle}>Troubleshooting</Text>
            <Ionicons 
              name={troubleshootingExpanded ? "chevron-down" : "chevron-forward"} 
              size={18} 
              color={theme.colors.textMuted} 
            />
          </TouchableOpacity>
          
          {troubleshootingExpanded && (
            <View style={styles.troubleshootingContent}>
              <View style={styles.troubleshootingItem}>
                <Text style={styles.troubleshootingItemTitle}>QR code won't scan?</Text>
                <Text style={styles.troubleshootingItemText}>
                  • Make sure your camera has permission to scan QR codes{'\n'}
                  • Try increasing screen brightness{'\n'}
                  • Use the QR code from your email if scanning fails{'\n'}
                  • Manually enter the activation code if available
                </Text>
              </View>
              
              <View style={styles.troubleshootingItem}>
                <Text style={styles.troubleshootingItemTitle}>eSIM won't activate?</Text>
                <Text style={styles.troubleshootingItemText}>
                  • Enable Data Roaming for this eSIM in Settings{'\n'}
                  • Make sure you're in the correct country/region{'\n'}
                  • Restart your device{'\n'}
                  • Check if your device supports eSIM
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.troubleshootingSupportButton}
                onPress={handleContactSupport}
                activeOpacity={0.7}
              >
                <Text style={styles.troubleshootingSupportButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.orderInfoSection}>
          <Text style={styles.orderInfoSectionTitle}>Order Information</Text>
          
          {order?.userEmail && (
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>PURCHASE EMAIL</Text>
              <Text style={styles.orderInfoValue}>{order.userEmail}</Text>
            </View>
          )}

          <View style={styles.orderInfoRow}>
            <View style={styles.orderInfoLeft}>
              <Text style={styles.orderInfoLabel}>ORDER ID</Text>
              <Text style={styles.orderInfoIdValue} numberOfLines={1} ellipsizeMode="middle">{order?.id || 'N/A'}</Text>
            </View>
            <TouchableOpacity
              style={styles.orderInfoCopyButton}
              onPress={handleCopyOrderId}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.topUpButtonContainer}>
              <TouchableOpacity
              style={styles.topUpButton}
              onPress={() => {
                const iccid = esimProfile?.iccid;
                if (iccid) {
                  router.push({
                    pathname: '/topup',
                    params: { iccid },
                  });
                } else {
                  toast.error('Error', 'eSIM ICCID not found. Please contact support if you need to top up this eSIM.');
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="flash" size={20} color={theme.colors.textOnPrimary} />
              <Text style={styles.topUpButtonText}>Top Up Data</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.orderActionsContainer}>
            <TouchableOpacity
              style={styles.orderActionButton}
              onPress={handleResendEmail}
              disabled={resendingEmail}
              activeOpacity={0.7}
            >
              {resendingEmail ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.text} />
                  <Text style={styles.orderActionButtonText}>Resend eSIM Email</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orderActionButton}
              onPress={handleContactSupport}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text} />
              <Text style={styles.orderActionButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  qrSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '100%',
    ...theme.shadows.soft,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  qrHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  qrHeaderText: {
    flex: 1,
  },
  qrCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  qrCardSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.textMuted,
    marginBottom: 16,
    marginTop: 24,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    width: 280,
    height: 280,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  qrCode: {
    width: '100%',
    height: '100%',
  },
  installButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  autoInstallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 999,
    gap: 8,
    ...theme.shadows.soft,
  },
  autoInstallButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  copyCodeButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  qrTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  qrTipText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 19,
    fontWeight: '500',
  },
  activationCodeInQR: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  activationCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activationCodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyActivationButtonInQR: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  copyActivationButtonTextInQR: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  activationCodeValue: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.colors.text,
    backgroundColor: theme.colors.backgroundLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 32,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  instructionsSection: {
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.textMuted,
    marginBottom: 24,
  },
  platformSection: {
    marginBottom: 32,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  platformTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumber: {
    color: theme.colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
    paddingTop: 2,
    fontWeight: '500',
  },
  notesSection: {
    marginBottom: 24,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteBullet: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    marginRight: 12,
    minWidth: 20,
  },
  noteBulletContainer: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginTop: 8,
    flexShrink: 0,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  successCard: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  successIcon: {
    fontSize: 48,
    color: theme.colors.success,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: theme.colors.success,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorIcon: {
    fontSize: 48,
    color: theme.colors.error,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
    fontWeight: '600',
  },
  expiryDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '700',
  },
  expiryNote: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
    fontWeight: '500',
  },
  buyAgainButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 48,
    ...theme.shadows.soft,
  },
  buyAgainButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  orderInfoSection: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  orderInfoSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  orderInfoLeft: {
    flex: 1,
    marginRight: 16,
  },
  orderInfoLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  orderInfoValue: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '600',
  },
  orderInfoIdValue: {
    fontSize: 13,
    color: theme.colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  orderInfoCopyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  topUpButtonContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    gap: 8,
    ...theme.shadows.soft,
  },
  orderActionsContainer: {
    marginTop: 0,
    gap: 12,
  },
  topUpButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  orderActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    gap: 10,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  orderActionButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  staleDataBanner: {
    backgroundColor: theme.colors.warningBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.warning,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  staleDataText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning,
    marginRight: 12,
    fontWeight: '600',
  },
  staleDataButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.colors.warning,
    borderRadius: 8,
  },
  staleDataButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  dataUsageSection: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  dataUsageSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
  },
  dataUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dataUsageLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  dataUsageValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  troubleshootingSection: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  troubleshootingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  troubleshootingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  troubleshootingChevron: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  troubleshootingContent: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  troubleshootingItem: {
    marginBottom: 16,
  },
  troubleshootingItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  troubleshootingItemText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  troubleshootingSupportButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  troubleshootingSupportButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
