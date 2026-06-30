/**
 * RevenueCat Subscription Service
 * Manages subscriptions and entitlements for PDF to Excel Pro
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

// RevenueCat API Key
const REVENUECAT_API_KEY = 'goog_AaUMsrbRVSlauNmlzciPzKbgZZO';

// Entitlement identifier - MUST match exactly what's in RevenueCat dashboard
// Display Name: "pdf to excel Pro"
// RevenueCat ID: entlad6deee7e3
export const ENTITLEMENT_ID = 'pdfxl Pro';

// Product identifiers - must match RevenueCat product IDs
export const PRODUCT_IDS = {
  MONTHLY: 'monthly_pro:pro-100',  // monthly_pro:pro-100
  YEARLY: 'yearly_pro:yp-1000',    // yearly_pro:yp-1000
};

// Subscription state
let isInitialized = false;
let currentCustomerInfo: CustomerInfo | null = null;

/**
 * Initialize RevenueCat SDK
 */
export const initializeRevenueCat = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  try {
    // Set log level for debugging (use VERBOSE in dev, ERROR in production)
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);

    // Configure RevenueCat with proper error handling
    console.log('Initializing RevenueCat with API key...');
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: undefined, // Let RevenueCat generate anonymous ID
    });

    // Get initial customer info
    currentCustomerInfo = await Purchases.getCustomerInfo();

    isInitialized = true;
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

/**
 * Check if user has active Pro subscription
 */
export const isPro = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    currentCustomerInfo = customerInfo;

    // Check if user has the Pro entitlement with null safety
    if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
      console.log('Customer info or entitlements not available');
      return false;
    }

    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    const isActive = entitlement !== undefined && entitlement.isActive;

    console.log('Pro status check:', {
      hasEntitlement: entitlement !== undefined,
      isActive,
      entitlementId: ENTITLEMENT_ID,
      availableEntitlements: Object.keys(customerInfo.entitlements.active || {}),
    });

    return isActive;
  } catch (error) {
    console.error('Error checking Pro status:', error);
    return false;
  }
};

/**
 * Get current customer info
 */
export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    currentCustomerInfo = customerInfo;
    return customerInfo;
  } catch (error) {
    console.error('Error getting customer info:', error);
    throw error;
  }
};

/**
 * Get cached customer info (synchronous)
 */
export const getCachedCustomerInfo = (): CustomerInfo | null => {
  return currentCustomerInfo;
};

/**
 * Get available offerings
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error getting offerings:', error);
    throw error;
  }
};

/**
 * Purchase a package
 */
export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    currentCustomerInfo = customerInfo;

    // Safely check Pro status with null checks
    const isNowPro = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;

    return {
      success: isNowPro,
      customerInfo,
    };
  } catch (error: any) {
    // Handle user cancellation
    if (error.userCancelled) {
      return { success: false, error: 'Purchase cancelled' };
    }

    console.error('Purchase error:', error);
    return { success: false, error: error.message || 'Purchase failed' };
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<{
  success: boolean;
  isPro: boolean;
  error?: string;
}> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    currentCustomerInfo = customerInfo;

    // Safely check Pro status with null checks
    const isNowPro = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;

    return {
      success: true,
      isPro: isNowPro,
    };
  } catch (error: any) {
    console.error('Restore error:', error);
    return {
      success: false,
      isPro: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
};

/**
 * Present RevenueCat Paywall
 * Returns the result of the paywall presentation
 */
export const presentPaywall = async (): Promise<{
  result: PAYWALL_RESULT;
  isPro: boolean;
}> => {
  try {
    console.log('Presenting RevenueCat paywall...');
    const paywallResult = await RevenueCatUI.presentPaywall();

    // Check if user is now Pro after paywall interaction
    const isNowPro = await isPro();

    console.log('Paywall result:', paywallResult, 'isPro:', isNowPro);

    return {
      result: paywallResult,
      isPro: isNowPro,
    };
  } catch (error) {
    console.error('Error presenting paywall:', error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    return {
      result: PAYWALL_RESULT.ERROR,
      isPro: false,
    };
  }
};

/**
 * Present RevenueCat Paywall if needed (only if user is not Pro)
 */
export const presentPaywallIfNeeded = async (): Promise<{
  result: PAYWALL_RESULT;
  isPro: boolean;
}> => {
  try {
    const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
    });

    const isNowPro = await isPro();

    return {
      result: paywallResult,
      isPro: isNowPro,
    };
  } catch (error) {
    console.error('Error presenting paywall:', error);
    return {
      result: PAYWALL_RESULT.ERROR,
      isPro: false,
    };
  }
};


/**
 * Present Customer Center for subscription management
 */
export const presentCustomerCenter = async (): Promise<void> => {
  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch (error) {
    console.error('Error presenting customer center:', error);
    throw error;
  }
};

/**
 * Add listener for customer info updates
 */
export const addCustomerInfoUpdateListener = (
  listener: (customerInfo: CustomerInfo) => void
): (() => void) => {
  const subscription = Purchases.addCustomerInfoUpdateListener((info) => {
    try {
      // Validate info before updating and calling listener
      if (!info) {
        console.warn('Received null/undefined customer info in listener');
        return;
      }
      currentCustomerInfo = info;
      listener(info);
    } catch (error) {
      console.error('Error in customer info update listener callback:', error);
    }
  });

  return () => {
    try {
      subscription.remove();
    } catch (error) {
      console.error('Error removing customer info listener:', error);
    }
  };
};

/**
 * Get subscription status details
 */
export const getSubscriptionStatus = async (): Promise<{
  isPro: boolean;
  expirationDate?: string;
  productIdentifier?: string;
  willRenew: boolean;
}> => {
  try {
    const customerInfo = await getCustomerInfo();

    // Safely access entitlements with null checks
    if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
      return {
        isPro: false,
        willRenew: false,
      };
    }

    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (!entitlement) {
      return {
        isPro: false,
        willRenew: false,
      };
    }

    return {
      isPro: true,
      expirationDate: entitlement.expirationDate || undefined,
      productIdentifier: entitlement.productIdentifier,
      willRenew: entitlement.willRenew,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      isPro: false,
      willRenew: false,
    };
  }
};

/**
 * Identify user (for logged-in users)
 */
export const identifyUser = async (userId: string): Promise<CustomerInfo> => {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    currentCustomerInfo = customerInfo;
    return customerInfo;
  } catch (error) {
    console.error('Error identifying user:', error);
    throw error;
  }
};

/**
 * Log out user (reset to anonymous)
 */
export const logOutUser = async (): Promise<CustomerInfo> => {
  try {
    const customerInfo = await Purchases.logOut();
    currentCustomerInfo = customerInfo;
    return customerInfo;
  } catch (error) {
    console.error('Error logging out user:', error);
    throw error;
  }
};

export default {
  initializeRevenueCat,
  isPro,
  getCustomerInfo,
  getCachedCustomerInfo,
  getOfferings,
  purchasePackage,
  restorePurchases,
  presentPaywall,
  presentPaywallIfNeeded,
  presentCustomerCenter,
  addCustomerInfoUpdateListener,
  getSubscriptionStatus,
  identifyUser,
  logOutUser,
  ENTITLEMENT_ID,
  PRODUCT_IDS,
};
