/**
 * SubscriptionContext - Global subscription state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CustomerInfo } from 'react-native-purchases';
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
}

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  showPaywall: () => Promise<{ result: PAYWALL_RESULT; isPro: boolean }>;
  showPaywallIfNeeded: () => Promise<{ result: PAYWALL_RESULT; isPro: boolean }>;
  showCustomerCenter: () => Promise<void>;
  restore: () => Promise<{ success: boolean; isPro: boolean; error?: string }>;
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
  });

  // Initialize RevenueCat on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Starting RevenueCat initialization...');
        await initializeRevenueCat();
        console.log('RevenueCat initialized, refreshing subscription state...');
        await refreshSubscriptionState();
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
  }, []);

  // Listen for customer info updates - set up once without dependencies to avoid stale closures
  useEffect(() => {
    const unsubscribe = addCustomerInfoUpdateListener((info) => {
      try {
        // Safely check Pro status with null checks - check directly here to avoid stale closure
        const isProNow = info?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
        
        console.log('Customer info updated:', {
          isProNow,
          entitlementId: ENTITLEMENT_ID,
          availableEntitlements: Object.keys(info?.entitlements?.active || {}),
        });
        
        // Update state and get previous value in the same operation
        setState(prev => {
          const wasProBefore = prev.isPro;
          
          // Handle ad loading/clearing based on Pro status change
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
  }, []); // Empty dependency array - set up listener once and never recreate

  const refreshSubscriptionState = async () => {
    try {
      // Use Promise.allSettled to handle individual failures gracefully
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
      // Set safe defaults on error
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
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const showPaywall = useCallback(async () => {
    const result = await presentPaywall();
    if (result.isPro) {
      // Immediately update state with the Pro status to prevent race conditions
      setState(prev => ({ ...prev, isPro: true }));
      // Clear ads immediately after successful subscription
      clearAllAds();
      // Then refresh full state in background
      refreshSubscriptionState();
    }
    return result;
  }, []);

  const showPaywallIfNeeded = useCallback(async () => {
    const result = await presentPaywallIfNeeded();
    if (result.isPro) {
      // Immediately update state with the Pro status to prevent race conditions
      setState(prev => ({ ...prev, isPro: true }));
      // Clear ads immediately after successful subscription
      clearAllAds();
      // Then refresh full state in background
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

  const value: SubscriptionContextType = {
    ...state,
    refreshSubscription,
    showPaywall,
    showPaywallIfNeeded,
    showCustomerCenter,
    restore,
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
