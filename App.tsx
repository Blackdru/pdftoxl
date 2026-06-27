/**
 * RobotPDF PDF to Excel App
 * Main entry point for the React Native application
 * 
 * Features:
 * - Convert PDF tables to Excel spreadsheets
 * - Download converted Excel file
 * - Beautiful, modern UI
 * - Pro subscription to remove ads
 * 
 * Powered by RobotPDF.com API
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox, View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import { AppNavigator } from './src/navigation';
import { Colors } from './src/theme';
import { NetworkAlert } from './src/components';
import { SubscriptionProvider } from './src/context';
import { loadRewardedInterstitialAd } from './src/services/ads';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App: React.FC = () => {
  // Initialize ads with proper consent handling
  // Note: Ads will only be loaded for non-Pro users (checked in SubscriptionProvider)
  useEffect(() => {
    const initAds = async () => {
      try {
        // Request consent info update (GDPR/CCPA compliance)
        const consentInfo = await AdsConsent.requestInfoUpdate();
        
        // Show consent form if required and available
        if (
          consentInfo.isConsentFormAvailable &&
          consentInfo.status === AdsConsentStatus.REQUIRED
        ) {
          await AdsConsent.showForm();
        }

        // Initialize the Mobile Ads SDK after consent
        await mobileAds().initialize();
        console.log('AdMob SDK initialized');
        
        // Note: Rewarded interstitial will be preloaded in SubscriptionProvider
        // after checking Pro status to avoid loading ads for Pro users
      } catch (error) {
        console.log('Ad initialization error:', error);
        // Still try to initialize ads even if consent fails
        try {
          await mobileAds().initialize();
        } catch (initError) {
          console.log('Fallback ad init error:', initError);
        }
      }
    };
    
    initAds();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <SubscriptionProvider>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={Colors.background}
            translucent={false}
          />
          <NetworkAlert />
          <AppNavigator />
        </SubscriptionProvider>
      </SafeAreaProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default App;
