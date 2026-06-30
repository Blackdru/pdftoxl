/**
 * SettingsScreen - Privacy Policy, How to Use, Contact, Subscription Management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from '@react-native-vector-icons/feather';
import { Colors, wp, hp, ms, fontSize, spacing, radius } from '../theme';
import { useSubscription } from '../context';

interface SettingsScreenProps {
  navigation: any;
}

const PRIVACY_POLICY_URL = 'https://robotpdf.com/apps/pdftoexcel';
const CONTACT_URL = 'https://robotpdf.com/contact';

const FREE_PDF_LIMIT = 5;
const FREE_EXPORT_LIMIT = 1;

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const {
    isPro,
    showPaywall,
    showCustomerCenter,
    restore,
    subscriptionDetails,
    usage,
  } = useSubscription();
  const [isRestoring, setIsRestoring] = useState(false);

  const openURL = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const handleUpgrade = async () => {
    try {
      const result = await showPaywall();
      if (result.isPro) {
        Alert.alert(
          'Welcome Pro User!',
          'Thank you for upgrading. Enjoy unlimited conversions, exports, and an ad-free experience!',
        );
      } else if (result.result === 'ERROR') {
        Alert.alert(
          'Configuration Error',
          'There was an issue loading the subscription options. Please check:\n\n' +
          '1. Your internet connection\n' +
          '2. App configuration in RevenueCat dashboard\n' +
          '3. Google Play Console subscription setup\n\n' +
          'Error details have been logged. Contact support if this persists.',
        );
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      Alert.alert(
        'Error',
        'Unable to show subscription options. Please check your internet connection and try again.',
      );
    }
  };

  const handleManageSubscription = async () => {
    try {
      await showCustomerCenter();
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open subscription management. Please try again.',
      );
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    const result = await restore();
    setIsRestoring(false);

    if (result.success) {
      if (result.isPro) {
        Alert.alert('Restored!', 'Your Pro subscription has been restored.');
      } else {
        Alert.alert(
          'No Subscription Found',
          'No active subscription was found for this account.',
        );
      }
    } else {
      Alert.alert(
        'Restore Failed',
        result.error || 'Unable to restore purchases. Please try again.',
      );
    }
  };

  const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const pdfLeft = Math.max(0, FREE_PDF_LIMIT - (usage?.pdfConversionsThisMonth ?? 0));
  const exportLeft = Math.max(0, FREE_EXPORT_LIMIT - (usage?.bankExportsThisMonth ?? 0));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={ms(24)} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Subscription Section ─────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subscription</Text>
        </View>

        {isPro ? (
          /* Pro Card */
          <View style={styles.proCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proGradient}
            >
              <View style={styles.proIconContainer}>
                <Feather
                  name="award"
                  size={ms(24)}
                  color={Colors.textInverse}
                />
              </View>
              <View style={styles.proInfo}>
                <Text style={styles.proTitle}>Pro Member</Text>
                <Text style={styles.proSubtitle}>
                  {subscriptionDetails?.willRenew
                    ? `Renews ${formatExpirationDate(subscriptionDetails?.expirationDate)}`
                    : `Expires ${formatExpirationDate(subscriptionDetails?.expirationDate)}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.manageBtn}
                onPress={handleManageSubscription}
              >
                <Text style={styles.manageBtnText}>Manage</Text>
              </TouchableOpacity>
            </LinearGradient>
            {/* Pro Benefits */}
            <View style={styles.proBenefits}>
              <ProBenefit icon="x-circle" text="No Ads" />
              <ProBenefit icon="file-text" text="Unlimited PDF Conversions" />
              <ProBenefit icon="download" text="Unlimited Report Exports" />
              <ProBenefit icon="trending-up" text="Full Bank Analysis" />
            </View>
          </View>
        ) : (
          /* Upgrade Card */
          <>
            {/* Usage tracker for free users */}
            <View style={styles.usageCard}>
              <Text style={styles.usageTitle}>This Month's Usage</Text>
              <View style={styles.usageRow}>
                <UsageItem
                  icon="file-text"
                  label="PDF Conversions"
                  used={usage?.pdfConversionsThisMonth ?? 0}
                  limit={FREE_PDF_LIMIT}
                  remaining={pdfLeft}
                />
                <View style={styles.usageDivider} />
                <UsageItem
                  icon="download"
                  label="Report Exports"
                  used={usage?.bankExportsThisMonth ?? 0}
                  limit={FREE_EXPORT_LIMIT}
                  remaining={exportLeft}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.upgradeCard}
              onPress={handleUpgrade}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.primaryMuted, Colors.secondaryMuted]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeContent}>
                  <View style={styles.upgradeIconContainer}>
                    <LinearGradient
                      colors={[Colors.primary, Colors.primaryGradientEnd]}
                      style={styles.upgradeIcon}
                    >
                      <Feather
                        name="zap"
                        size={ms(20)}
                        color={Colors.textInverse}
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.upgradeInfo}>
                    <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={ms(20)}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.upgradeFeatures}>
                  <UpgradeFeature icon="x-circle" text="No Ads" />
                  <UpgradeFeature icon="download" text="Unlimited Exports" />
                  <UpgradeFeature icon="file-text" text="Unlimited Conversions" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Feather
                    name="refresh-cw"
                    size={ms(16)}
                    color={Colors.primary}
                  />
                  <Text style={styles.restoreBtnText}>Restore Purchases</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── General Section ──────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>General</Text>
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon="shield"
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() => openURL(PRIVACY_POLICY_URL)}
          />
          <SettingsItem
            icon="help-circle"
            title="How to Use"
            subtitle="Learn how to convert PDF to Excel"
            onPress={() => navigation.navigate('HowToUse')}
          />
          <SettingsItem
            icon="mail"
            title="Contact Us"
            subtitle="Get in touch with our team"
            onPress={() => openURL(CONTACT_URL)}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>PDFtoXL and Bank Statement Analyzer by RobotPDF</Text>
          <Text style={styles.versionText}>Version 2.1</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const UpgradeFeature = ({
  icon,
  text,
}: {
  icon: FeatherIconName;
  text: string;
}) => (
  <View style={styles.upgradeFeature}>
    <Feather name={icon} size={ms(13)} color={Colors.success} />
    <Text style={styles.upgradeFeatureText}>{text}</Text>
  </View>
);

const ProBenefit = ({
  icon,
  text,
}: {
  icon: FeatherIconName;
  text: string;
}) => (
  <View style={styles.proBenefitItem}>
    <View style={styles.proBenefitIcon}>
      <Feather name={icon} size={ms(14)} color={Colors.primary} />
    </View>
    <Text style={styles.proBenefitText}>{text}</Text>
  </View>
);

const UsageItem = ({
  icon,
  label,
  used,
  limit,
  remaining,
}: {
  icon: FeatherIconName;
  label: string;
  used: number;
  limit: number;
  remaining: number;
}) => {
  const pct = Math.min((used / limit) * 100, 100);
  const barColor =
    remaining === 0 ? Colors.error : remaining <= 1 ? Colors.warning ?? Colors.accent : Colors.primary;
  return (
    <View style={styles.usageItem}>
      <View style={styles.usageItemHeader}>
        <Feather name={icon} size={ms(14)} color={Colors.textSecondary} />
        <Text style={styles.usageItemLabel}>{label}</Text>
      </View>
      <Text style={[styles.usageCount, { color: barColor }]}>
        {used} / {limit}
      </Text>
      <View style={styles.usageBarBg}>
        <View
          style={[
            styles.usageBarFill,
            { width: `${pct}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={[styles.usageRemaining, { color: barColor }]}>
        {remaining === 0 ? 'Limit reached' : `${remaining} remaining`}
      </Text>
    </View>
  );
};

const SettingsItem = ({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: FeatherIconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsIconContainer}>
      <Feather name={icon} size={ms(20)} color={Colors.primary} />
    </View>
    <View style={styles.settingsContent}>
      <Text style={styles.settingsTitle}>{title}</Text>
      <Text style={styles.settingsSubtitle}>{subtitle}</Text>
    </View>
    <Feather name="chevron-right" size={ms(20)} color={Colors.textTertiary} />
  </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: spacing.sm },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: { width: ms(40) },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },

  sectionHeader: { marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Pro card
  proCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  proGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  proIconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  proInfo: { flex: 1 },
  proTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  proSubtitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  manageBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  manageBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  proBenefits: {
    backgroundColor: Colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  proBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  proBenefitIcon: {
    width: ms(28),
    height: ms(28),
    borderRadius: radius.sm,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proBenefitText: {
    fontSize: fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  // Usage tracker (free users)
  usageCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  usageTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: spacing.md,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  usageDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    alignSelf: 'stretch',
    marginHorizontal: spacing.md,
  },
  usageItem: { flex: 1 },
  usageItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  usageItemLabel: {
    fontSize: fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  usageCount: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  usageBarBg: {
    height: ms(5),
    backgroundColor: Colors.borderLight,
    borderRadius: ms(3),
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  usageBarFill: { height: '100%', borderRadius: ms(3) },
  usageRemaining: {
    fontSize: ms(10),
    fontWeight: '600',
  },

  // Upgrade card
  upgradeCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeGradient: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    borderRadius: radius.xl,
  },
  upgradeContent: { flexDirection: 'row', alignItems: 'center' },
  upgradeIconContainer: { marginRight: spacing.md },
  upgradeIcon: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeInfo: { flex: 1 },
  upgradeTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  upgradeSubtitle: {
    fontSize: fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  upgradeFeatures: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  upgradeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  upgradeFeatureText: {
    fontSize: fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  restoreBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },

  // General section
  section: {
    backgroundColor: Colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingsIconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.md,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingsContent: { flex: 1 },
  settingsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingsSubtitle: { fontSize: fontSize.sm, color: Colors.textSecondary },

  footer: { alignItems: 'center', paddingVertical: hp(4) },
  footerText: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  versionText: { fontSize: fontSize.xs, color: Colors.textTertiary },
});

export default SettingsScreen;
