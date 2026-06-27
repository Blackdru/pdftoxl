/**
 * LoadingOverlay - Progress indicator for PDF to Excel
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from '@react-native-vector-icons/feather';
import { Colors, ms, wp, fontSize, radius, spacing } from '../theme';

export type ProcessingStage = 'uploading' | 'processing' | 'converting' | 'complete';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number;
  stage?: ProcessingStage;
}

const stageConfig: Record<ProcessingStage, { icon: string; label: string; colors: string[] }> = {
  uploading: { icon: 'upload-cloud', label: 'Uploading PDF...', colors: [Colors.primary, Colors.primaryLight] },
  processing: { icon: 'cpu', label: 'Analyzing tables...', colors: [Colors.accent, Colors.accentLight] },
  converting: { icon: 'grid', label: 'Creating Excel...', colors: [Colors.secondary, Colors.secondaryLight] },
  complete: { icon: 'check-circle', label: 'Complete!', colors: [Colors.success, Colors.successDark] },
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message, progress = 0, stage = 'uploading' }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })).start();
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])).start();
    } else {
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress]);

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const config = stageConfig[stage];

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: rotation }] }]}>
              <LinearGradient colors={config.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.spinnerGradient} />
            </Animated.View>
            <LinearGradient colors={[Colors.surface, Colors.gray50]} style={styles.iconCircle}>
              <Feather name={config.icon} size={ms(28)} color={config.colors[0]} />
            </LinearGradient>
          </View>
          <Text style={styles.message}>{message || config.label}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFillContainer, { width: progressWidth }]}>
                <LinearGradient colors={config.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progressFill} />
              </Animated.View>
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.stageIndicator}>
            {(['uploading', 'processing', 'converting', 'complete'] as ProcessingStage[]).map((s, i) => {
              const stageIndex = ['uploading', 'processing', 'converting', 'complete'].indexOf(stage);
              const isActive = s === stage;
              const isPast = stageIndex > i;
              return (
                <View key={s} style={styles.stageDotContainer}>
                  {isActive ? <LinearGradient colors={stageConfig[s].colors} style={styles.stageDotActive} /> : <View style={[styles.stageDot, { backgroundColor: isPast ? Colors.success : Colors.gray300 }]} />}
                </View>
              );
            })}
          </View>
          <Text style={styles.subMessage}>Please wait, this may take a moment</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: Colors.surface, borderRadius: radius.xxl, padding: spacing.xl, alignItems: 'center', width: wp(80), maxWidth: 320, shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 32, elevation: 20 },
  iconContainer: { width: ms(80), height: ms(80), justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  spinnerRing: { position: 'absolute', width: ms(80), height: ms(80), borderRadius: ms(40) },
  spinnerGradient: { flex: 1, borderRadius: ms(40), padding: 3 },
  iconCircle: { width: ms(64), height: ms(64), borderRadius: ms(32), justifyContent: 'center', alignItems: 'center', shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  message: { fontSize: fontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: spacing.lg, textAlign: 'center' },
  progressContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  progressTrack: { flex: 1, height: ms(10), backgroundColor: Colors.gray200, borderRadius: ms(5), overflow: 'hidden' },
  progressFillContainer: { height: '100%' },
  progressFill: { flex: 1, borderRadius: ms(5) },
  progressText: { fontSize: fontSize.sm, fontWeight: '800', color: Colors.textPrimary, width: ms(45), textAlign: 'right' },
  stageIndicator: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stageDotContainer: { width: ms(10), height: ms(10) },
  stageDot: { width: ms(10), height: ms(10), borderRadius: ms(5) },
  stageDotActive: { width: ms(10), height: ms(10), borderRadius: ms(5) },
  subMessage: { fontSize: fontSize.sm, color: Colors.textTertiary, textAlign: 'center' },
});

export default LoadingOverlay;
