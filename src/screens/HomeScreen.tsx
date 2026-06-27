/**
 * HomeScreen - Landing page for PDF to Excel app
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from '@react-native-vector-icons/feather';
import { Colors, wp, hp, ms, fontSize, spacing, radius } from '../theme';

import { useSubscription } from '../context';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isPro, showPaywall } = useSubscription();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoIconWrapper}>
              <LinearGradient
                colors={[Colors.primary, Colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoIcon}
              >
                <Feather
                  name="file-text"
                  size={ms(20)}
                  color={Colors.textInverse}
                />
              </LinearGradient>
            </View>
            <Text style={styles.logoText}>PDF to Excel</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Feather
              name="settings"
              size={ms(20)}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionLabel}>TOOLS</Text>
        </Animated.View>

        {/* Card 1 — PDF to Excel */}
        <Animated.View
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => navigation.navigate('Upload')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primaryMuted, Colors.secondaryMuted]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toolCardGradient}
            >
              <View style={styles.toolCardLeft}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.toolCardIcon}
                >
                  <Feather
                    name="file-text"
                    size={ms(22)}
                    color={Colors.textInverse}
                  />
                </LinearGradient>
                <View style={styles.toolCardText}>
                  <Text style={styles.toolCardTitle}>PDF to Excel</Text>
                  <Text style={styles.toolCardDesc}>
                    Convert PDF tables into editable spreadsheets
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toolCardBadge,
                  { backgroundColor: Colors.primary + '18' },
                ]}
              >
                <Feather
                  name="arrow-right"
                  size={ms(16)}
                  color={Colors.primary}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Card 2 — Bank Statement Analyzer */}
        <Animated.View
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => navigation.navigate('BankAnalyzer')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#ECFDF5', '#EFF6FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toolCardGradient}
            >
              <View style={styles.toolCardLeft}>
                <LinearGradient
                  colors={[Colors.accent, Colors.accentLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.toolCardIcon}
                >
                  <Feather
                    name="trending-up"
                    size={ms(22)}
                    color={Colors.textInverse}
                  />
                </LinearGradient>
                <View style={styles.toolCardText}>
                  <Text style={styles.toolCardTitle}>
                    Bank Statement Analyzer
                  </Text>
                  <Text style={styles.toolCardDesc}>
                    Track expenses, detect subscriptions & insights
                  </Text>
                  <View style={styles.formatBadges}>
                    {['PDF', 'Excel', 'CSV'].map(fmt => (
                      <View key={fmt} style={styles.formatBadge}>
                        <Text style={styles.formatBadgeText}>{fmt}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.toolCardBadge,
                  { backgroundColor: Colors.accent + '18' },
                ]}
              >
                <Feather
                  name="arrow-right"
                  size={ms(16)}
                  color={Colors.accent}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.poweredBy}>
          <Text style={styles.poweredByText}>Powered by </Text>
          <Text style={styles.poweredByBrand}>RobotPDF</Text>
        </View>

        {/* Upgrade to Pro button for non-Pro users */}
        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={showPaywall}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeGradient}
            >
              <Feather name="zap" size={ms(14)} color={Colors.textInverse} />
              <Text style={styles.upgradeText}>Remove Ads</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: wp(5) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  settingsButton: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIconWrapper: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoIcon: {
    width: ms(42),
    height: ms(42),
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: spacing.md,
  },
  proBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  proBadgeText: {
    fontSize: ms(10),
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: hp(1),
  },
  toolCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  toolCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toolCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.md,
  },
  toolCardIcon: {
    width: ms(48),
    height: ms(48),
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  toolCardText: { flex: 1 },
  toolCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  toolCardDesc: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: ms(20),
  },
  toolCardBadge: {
    width: ms(34),
    height: ms(34),
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  formatBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  formatBadge: {
    backgroundColor: Colors.primary + '18',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  formatBadgeText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: Colors.primary,
  },
  poweredBy: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: hp(1),
    marginTop: 'auto',
  },
  poweredByText: { fontSize: fontSize.xs, color: Colors.textTertiary },
  poweredByBrand: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  upgradeButton: { alignSelf: 'center', marginBottom: hp(2) },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  upgradeText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});

export default HomeScreen;
