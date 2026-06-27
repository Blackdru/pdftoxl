/**
 * BannerAdView - Simple banner ad component
 * Only shows ads if user is not a Pro subscriber
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { isPro } from '../services/subscription';

interface BannerAdViewProps {
  adUnitId?: string;
}

const BannerAdView: React.FC<BannerAdViewProps> = ({
  adUnitId = TestIds.BANNER,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    checkProStatus();
  }, []);

  const checkProStatus = async () => {
    const proStatus = await isPro();
    setIsProUser(proStatus);
  };

  // Don't show ads for Pro users
  if (isProUser || hasError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setHasError(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
});

export default BannerAdView;
