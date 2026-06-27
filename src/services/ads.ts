/**
 * AdMob Service - Manages ad loading and display
 * Uses test ad unit IDs for development
 * 
 * AdMob Policy Compliance Notes:
 * - Rewarded interstitial shown after user-initiated action (processing)
 * - Native ad clearly labeled and non-intrusive
 * - Ads don't interfere with app navigation
 * - No accidental clicks encouraged
 */

import {
  RewardedInterstitialAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// Use test IDs in development, production IDs in release
const IS_DEV = __DEV__;

// Production Ad Unit IDs
const PRODUCTION_AD_UNIT_IDS = {
  BANNER: 'ca-app-pub-3990640624622013/6182688322',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3990640624622013/7991412251',
  NATIVE: 'ca-app-pub-3990640624622013/6182688322', // Using banner ID for medium rectangle
};

// Test Ad Unit IDs
const TEST_AD_UNIT_IDS = {
  BANNER: TestIds.BANNER,
  REWARDED_INTERSTITIAL: TestIds.REWARDED_INTERSTITIAL,
  NATIVE: TestIds.BANNER, // Using banner test ID for medium rectangle ad
};

export const AD_UNIT_IDS = IS_DEV ? TEST_AD_UNIT_IDS : PRODUCTION_AD_UNIT_IDS;

let rewardedInterstitialAd: RewardedInterstitialAd | null = null;
let isRewardedInterstitialLoaded = false;

/**
 * Initialize and preload the rewarded interstitial ad
 * @param isPro - Whether the user has Pro subscription (optional, for optimization)
 */
export const loadRewardedInterstitialAd = (isPro: boolean = false): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Don't load ads for Pro users
    if (isPro) {
      console.log('Skipping ad load for Pro user');
      // Clear any existing ad
      if (rewardedInterstitialAd) {
        rewardedInterstitialAd = null;
        isRewardedInterstitialLoaded = false;
      }
      resolve();
      return;
    }

    if (isRewardedInterstitialLoaded && rewardedInterstitialAd) {
      resolve();
      return;
    }

    rewardedInterstitialAd = RewardedInterstitialAd.createForAdRequest(
      AD_UNIT_IDS.REWARDED_INTERSTITIAL,
      {
        keywords: ['pdf', 'excel', 'converter', 'spreadsheet', 'document'],
      }
    );

    const unsubscribeLoaded = rewardedInterstitialAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        isRewardedInterstitialLoaded = true;
        unsubscribeLoaded();
        resolve();
      }
    );

    const unsubscribeError = rewardedInterstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('Rewarded interstitial ad failed to load:', error);
        isRewardedInterstitialLoaded = false;
        unsubscribeError();
        reject(error);
      }
    );

    rewardedInterstitialAd.load();
  });
};

/**
 * Show the rewarded interstitial ad
 * Returns a promise that resolves when the ad is closed (with or without reward)
 * @param isPro - Whether the user has Pro subscription
 */
export const showRewardedInterstitialAd = (isPro: boolean = false): Promise<{ rewarded: boolean }> => {
  return new Promise((resolve) => {
    // Don't show ads for Pro users
    if (isPro) {
      console.log('Skipping ad for Pro user');
      resolve({ rewarded: false });
      return;
    }

    if (!rewardedInterstitialAd || !isRewardedInterstitialLoaded) {
      // Ad not loaded, skip showing
      console.log('Rewarded interstitial not ready, skipping');
      resolve({ rewarded: false });
      return;
    }

    let wasRewarded = false;

    const unsubscribeEarned = rewardedInterstitialAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        wasRewarded = true;
      }
    );

    const unsubscribeClosed = rewardedInterstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubscribeEarned();
        unsubscribeClosed();
        isRewardedInterstitialLoaded = false;
        
        // Clear the ad reference to prevent showing stale ads
        rewardedInterstitialAd = null;
        
        // Preload next ad (only if not Pro)
        loadRewardedInterstitialAd(isPro).catch(() => {});
        
        resolve({ rewarded: wasRewarded });
      }
    );

    rewardedInterstitialAd.show().catch((error) => {
      console.log('Failed to show rewarded interstitial:', error);
      unsubscribeEarned();
      unsubscribeClosed();
      resolve({ rewarded: false });
    });
  });
};

/**
 * Check if rewarded interstitial is ready
 */
export const isRewardedInterstitialReady = (): boolean => {
  return isRewardedInterstitialLoaded;
};

/**
 * Clear all loaded ads (useful when user upgrades to Pro)
 */
export const clearAllAds = (): void => {
  console.log('Clearing all loaded ads');
  if (rewardedInterstitialAd) {
    rewardedInterstitialAd = null;
  }
  isRewardedInterstitialLoaded = false;
};

export default {
  AD_UNIT_IDS,
  loadRewardedInterstitialAd,
  showRewardedInterstitialAd,
  isRewardedInterstitialReady,
  clearAllAds,
};
