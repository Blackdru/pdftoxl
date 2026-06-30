/**
 * BannerAdView - AdMob Banner Ad component
 * Only shows for free users. Supports ANCHORED_ADAPTIVE_BANNER and standard BANNER sizes.
 * Policy-compliant: clearly separated from content, no overlap.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSubscription } from '../context';
import { AD_UNIT_IDS } from '../services/ads';

interface BannerAdViewProps {
  adUnitId?: string;
  size?: BannerAdSize;
  style?: object;
}

const BannerAdView: React.FC<BannerAdViewProps> = ({
  adUnitId = AD_UNIT_IDS.BANNER,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  style,
}) => {
  const [hasError, setHasError] = useState(false);
  const { isPro } = useSubscription();

  // Don't show ads for Pro users or if ad failed to load
  if (isPro || hasError) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        onAdFailedToLoad={() => setHasError(true)}
        onAdLoaded={() => setHasError(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default BannerAdView;
