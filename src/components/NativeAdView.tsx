/**
 * NativeAdView - Medium Rectangle Ad styled as native-like
 * Uses MEDIUM_RECTANGLE (300x250) banner for a larger ad experience
 * Only shows ads if user is not a Pro subscriber
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { Colors } from '../theme';
import { isPro } from '../services/subscription';

interface NativeAdViewProps {
  adUnitId: string;
}

const NativeAdView: React.FC<NativeAdViewProps> = ({ adUnitId }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
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
      <View style={styles.labelRow}>
        <Text style={styles.adLabel}>Sponsored</Text>
      </View>
      <View style={[styles.adWrapper, !isLoaded && styles.adLoading]}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          onAdLoaded={() => setIsLoaded(true)}
          onAdFailedToLoad={(error) => {
            console.log('Ad failed to load:', error);
            setHasError(true);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  labelRow: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  adLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: Colors.gray200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  adWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 250,
    minWidth: 300,
  },
  adLoading: {
    backgroundColor: Colors.gray100,
  },
});

export default NativeAdView;
