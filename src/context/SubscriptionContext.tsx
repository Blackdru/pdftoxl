/**
 * SubscriptionContext - Global subscription state management
 * Tracks Pro status, monthly usage limits, and ad state
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeRevenueCat,
  isPro as checkIsPro,
  getCustomerInfo,
  addCustomerInfoUpdateListener,
  presentPaywall,
  presentPaywallIfNeeded,
  presentCustomerCenter,
  restorePurchases,
  getSubscriptionStatus,
  ENTITLEMENT_ID,
} from '../services/subscription';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { loadRewardedInterstitialAd, clearAllAds } from '../services/ads';

// ─── Usage Limits ──────────────────────────────────────────────────────────────
const FREE_PDF_CONVERSIONS_PER_MONTH = 5;
const FREE_BANK_EXPORTS_PER_MONTH = 1;

const STORAGE_KEYS = {
  PDF_COUNT: '@usage/pdf_count',
  PDF_MONTH: '@usage/pdf_month',
  EXPORT_COUNT: '@usage/export_count',
  EXPORT_MONTH: '@usage/export_month',
};

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function getMonthlyCount(countKey: string, monthKey: string): Promise<number> {
  try {
    const [count, month] = await Promise.all([
      AsyncStorage.getItem(countKey),
      AsyncStorage.getItem(monthKey),
    ]);
    const currentMonth = getCurrentMonthKey();
    if (month !== currentMonth) {
      // New month — reset
      await Promise.all([
        AsyncStorage.setItem(countKey, '0'),
        AsyncStorage.setItem(monthKey, currentMonth),
      ]);
      return 0;
    }
    return parseInt(count ?? '0', 10);
  } catch {
    return 0;
  }
}

async function incrementMonthlyCount(countKey: string, monthKey: string): Promise<number> {
  const current = await getMonthlyCount(countKey, monthKey);
  const next = current + 1;
  await AsyncStorage.setItem(countKey, String(next));
  return next;
}

// ─── Context Types ──────────────────────────────────────────────────────────────

interface UsageCounts {
  pdfConversionsThisMonth: number;
  bankExportsThisMonth: number;
}

interface SubscriptionState {
  isInitialized: boolean;
  isPro: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  subscriptionDetails: {
    expirationDate?: string;
    productIdentifier?: string;
    willRenew: boolean;
  } | null;
  usage: UsageCounts;
}

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  showPaywall: () => Promise<{ result: PAYWALL_RESULT; isPro: boolean }>;
  showPaywallIfNeeded: () => Promise<{ result: PAYWALL_RESULT; isPro: boolean }>;
  showCustomerCenter: () => Promise<void>;
  restore: () => Promise<{ success: boolean; isPro: boolean; error?: string }>;
  // Usage limits
  canConvertPdf: () => boolean;
  canExportBankReport: () => boolean;
  recordPdfConversion: () => Promise<void>;
  recordBankExport: () => Promise<void>;
  pdfConversionsRemaining: () => number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [state, setState] = useState<SubscriptionState>({
    isInitialized: false,
    isPro: false,
    isLoading: true,
    customerInfo: null,
    subscriptionDetails: null,
    usage: { pdfConversionsThisMonth: 0, bankExportsThisMonth: 0 },
  });

  // Load usage counts
  const loadUsageCounts = useCallback(async () => {
    try {
      const [pdfCount, exportCount] = await Promise.all([
        getMonthlyCount(STORAGE_KEYS.PDF_COUNT, STORAGE_KEYS.PDF_MONTH),
        getMonthlyCount(STORAGE_KEYS.EXPORT_COUNT, STORAGE_KEYS.EXPORT_MONTH),
      ]);
      setState(prev => ({
        ...prev,
        usage: { pdfConversionsThisMonth: pdfCount, bankExportsThisMonth: exportCount },
      }));
    } catch (e) {
      console.error('Failed to load usage counts:', e);
    }
  }, []);

  // Initialize RevenueCat on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Starting RevenueCat initialization...');
        await initializeRevenueCat();
        console.log('RevenueCat initialized, refreshing subscription state...');
        await refreshSubscriptionState();
        await loadUsageCounts();
        setState(prev => ({ ...prev, isInitialized: true, isLoading: false }));
        console.log('Subscription initialization complete');

        // Preload ads only for non-Pro users
        try {
          const proStatus = await checkIsPro();
          console.log('Pro status after init:', proStatus);
          if (!proStatus) {
            console.log('Loading ads for non-Pro user...');
            loadRewardedInterstitialAd(false).catch((adError) => {
              console.log('Failed to preload ad for non-Pro user:', adError);
            });
          } else {
            console.log('User is Pro, skipping ad load');
          }
        } catch (proCheckError) {
          console.error('Error checking Pro status during initialization:', proCheckError);
        }
      } catch (error) {
        console.error('Failed to initialize subscription:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }
        // Still mark as initialized to prevent blocking the app
        setState(prev => ({ ...prev, isInitialized: true, isLoading: false, isPro: false }));
      }
    };

    initialize();
  }, [loadUsageCounts]);

  // Listen for customer info updates
  useEffect(() => {
    const unsubscribe = addCustomerInfoUpdateListener((info) => {
      try {
        const isProNow = info?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;

        console.log('Customer info updated:', {
          isProNow,
          entitlementId: ENTITLEMENT_ID,
          availableEntitlements: Object.keys(info?.entitlements?.active || {}),
        });

        setState(prev => {
          const wasProBefore = prev.isPro;

          if (isProNow && !wasProBefore) {
            console.log('User upgraded to Pro - clearing all ads');
            try {
              clearAllAds();
            } catch (adError) {
              console.error('Error clearing ads:', adError);
            }
          } else if (!isProNow && wasProBefore) {
            console.log('User lost Pro status - preloading ads');
            loadRewardedInterstitialAd(false).catch((adError) => {
              console.error('Error preloading ads:', adError);
            });
          }

          return {
            ...prev,
            isPro: isProNow,
            customerInfo: info,
          };
        });
      } catch (error) {
        console.error('Error in customer info update listener:', error);
      }
    });

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from customer info updates:', error);
      }
    };
  }, []);

  const refreshSubscriptionState = async () => {
    try {
      const results = await Promise.allSettled([
        checkIsPro(),
        getCustomerInfo(),
        getSubscriptionStatus(),
      ]);

      const proStatus = results[0].status === 'fulfilled' ? results[0].value : false;
      const customerInfo = results[1].status === 'fulfilled' ? results[1].value : null;
      const subscriptionStatus = results[2].status === 'fulfilled'
        ? results[2].value
        : { isPro: false, willRenew: false };

      console.log('Subscription state refreshed:', {
        proStatus,
        hasCustomerInfo: !!customerInfo,
        subscriptionStatus,
      });

      setState(prev => ({
        ...prev,
        isPro: proStatus,
        customerInfo,
        subscriptionDetails: {
          expirationDate: subscriptionStatus.expirationDate,
          productIdentifier: subscriptionStatus.productIdentifier,
          willRenew: subscriptionStatus.willRenew,
        },
      }));
    } catch (error) {
      console.error('Error refreshing subscription state:', error);
      setState(prev => ({
        ...prev,
        isPro: false,
        customerInfo: null,
        subscriptionDetails: null,
      }));
    }
  };

  const refreshSubscription = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await refreshSubscriptionState();
    await loadUsageCounts();
    setState(prev => ({ ...prev, isLoading: false }));
  }, [loadUsageCounts]);

  const showPaywall = useCallback(async () => {
    const result = await presentPaywall();
    if (result.isPro) {
      setState(prev => ({ ...prev, isPro: true }));
      clearAllAds();
      refreshSubscriptionState();
    }
    return result;
  }, []);

  const showPaywallIfNeeded = useCallback(async () => {
    const result = await presentPaywallIfNeeded();
    if (result.isPro) {
      setState(prev => ({ ...prev, isPro: true }));
      clearAllAds();
      refreshSubscriptionState();
    }
    return result;
  }, []);

  const showCustomerCenter = useCallback(async () => {
    await presentCustomerCenter();
    await refreshSubscriptionState();
  }, []);

  const restore = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await restorePurchases();
    await refreshSubscriptionState();
    setState(prev => ({ ...prev, isLoading: false }));
    return result;
  }, []);

  // ─── Usage Limit Helpers ─────────────────────────────────────────────────────

  const canConvertPdf = useCallback((): boolean => {
    if (state.isPro) return true;
    return state.usage.pdfConversionsThisMonth < FREE_PDF_CONVERSIONS_PER_MONTH;
  }, [state.isPro, state.usage.pdfConversionsThisMonth]);

  const canExportBankReport = useCallback((): boolean => {
    if (state.isPro) return true;
    return state.usage.bankExportsThisMonth < FREE_BANK_EXPORTS_PER_MONTH;
  }, [state.isPro, state.usage.bankExportsThisMonth]);

  const recordPdfConversion = useCallback(async (): Promise<void> => {
    if (state.isPro) return;
    const newCount = await incrementMonthlyCount(STORAGE_KEYS.PDF_COUNT, STORAGE_KEYS.PDF_MONTH);
    setState(prev => ({
      ...prev,
      usage: { ...prev.usage, pdfConversionsThisMonth: newCount },
    }));
  }, [state.isPro]);

  const recordBankExport = useCallback(async (): Promise<void> => {
    if (state.isPro) return;
    const newCount = await incrementMonthlyCount(STORAGE_KEYS.EXPORT_COUNT, STORAGE_KEYS.EXPORT_MONTH);
    setState(prev => ({
      ...prev,
      usage: { ...prev.usage, bankExportsThisMonth: newCount },
    }));
  }, [state.isPro]);

  const pdfConversionsRemaining = useCallback((): number => {
    if (state.isPro) return Infinity;
    return Math.max(0, FREE_PDF_CONVERSIONS_PER_MONTH - state.usage.pdfConversionsThisMonth);
  }, [state.isPro, state.usage.pdfConversionsThisMonth]);

  const value: SubscriptionContextType = {
    ...state,
    refreshSubscription,
    showPaywall,
    showPaywallIfNeeded,
    showCustomerCenter,
    restore,
    canConvertPdf,
    canExportBankReport,
    recordPdfConversion,
    recordBankExport,
    pdfConversionsRemaining,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;
