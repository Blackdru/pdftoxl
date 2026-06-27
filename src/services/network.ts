/**
 * Network Service - Internet connectivity detection
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export const checkNetworkConnection = async (): Promise<NetworkStatus> => {
  try {
    const state: NetInfoState = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
    };
  } catch (error) {
    console.warn('Network check failed:', error);
    return { isConnected: false, isInternetReachable: false };
  }
};

export const requireInternet = async (): Promise<void> => {
  const { isConnected, isInternetReachable } = await checkNetworkConnection();
  if (!isConnected) {
    throw new Error('No internet connection. Please check your network settings and try again.');
  }
  if (isInternetReachable === false) {
    throw new Error('Unable to reach the internet. Please check your connection and try again.');
  }
};

export const subscribeToNetworkChanges = (
  callback: (status: NetworkStatus) => void
): (() => void) => {
  return NetInfo.addEventListener((state: NetInfoState) => {
    callback({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
    });
  });
};

export default { checkNetworkConnection, requireInternet, subscribeToNetworkChanges };
