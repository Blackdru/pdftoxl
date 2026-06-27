/**
 * NetworkAlert Component
 * Shows a banner when internet connection is lost and auto-dismisses when reconnected
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Modal } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Feather from '@react-native-vector-icons/feather';
import { Colors } from '../theme';

const { width } = Dimensions.get('window');

const NetworkAlert: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const disconnectTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check initial connection state
    NetInfo.fetch().then(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
      if (!connected) {
        setShowModal(true);
      }
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      const wasConnected = isConnected;
      setIsConnected(connected);

      // Clear any pending timer
      if (disconnectTimer.current) {
        clearTimeout(disconnectTimer.current);
        disconnectTimer.current = null;
      }

      if (!connected) {
        // Show modal immediately when disconnected
        setShowModal(true);
        setShowBanner(false);
      } else if (!wasConnected && connected) {
        // Connection restored - hide modal and show success banner
        setShowModal(false);
        setShowBanner(true);
        Animated.spring(slideAnim, { 
          toValue: 0, 
          useNativeDriver: true, 
          tension: 50, 
          friction: 8 
        }).start();

        // Auto-hide banner after 2 seconds
        disconnectTimer.current = setTimeout(() => {
          Animated.timing(slideAnim, { 
            toValue: -100, 
            duration: 300, 
            useNativeDriver: true 
          }).start(() => setShowBanner(false));
        }, 2000);
      }
    });

    return () => {
      unsubscribe();
      if (disconnectTimer.current) {
        clearTimeout(disconnectTimer.current);
      }
    };
  }, [isConnected, slideAnim]);

  return (
    <>
      {/* Full screen modal when offline */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Feather name="wifi-off" size={32} color={Colors.error} />
            </View>
            <Text style={styles.modalTitle}>No Internet Connection</Text>
            <Text style={styles.modalMessage}>
              Please check your network settings. This alert will close automatically when connection is restored.
            </Text>
            <View style={styles.modalLoader}>
              <Feather name="loader" size={20} color={Colors.textTertiary} />
              <Text style={styles.modalLoaderText}>Waiting for connection...</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success banner when back online */}
      {showBanner && (
        <Animated.View 
          style={[
            styles.banner, 
            { 
              transform: [{ translateY: slideAnim }], 
              backgroundColor: Colors.success 
            }
          ]}
        >
          <View style={styles.bannerContent}>
            <Feather name="wifi" size={16} color={Colors.textInverse} />
            <Text style={styles.bannerText}>Back Online</Text>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalLoaderText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    width,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkAlert;
