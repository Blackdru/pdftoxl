/**
 * UploadScreen - Single PDF picker for PDF to Excel conversion
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick, types } from '@react-native-documents/picker';
import LinearGradient from 'react-native-linear-gradient';
import Feather from '@react-native-vector-icons/feather';
import { Colors, wp, hp, ms, fontSize, spacing, radius } from '../theme';
import { Button, LoadingOverlay, NativeAdView } from '../components';
import type { ProcessingStage } from '../components/LoadingOverlay';
import { convertPDFToExcel, ApiError, SelectedFile } from '../services/api';
import { showRewardedInterstitialAd, AD_UNIT_IDS } from '../services/ads';
import { useSubscription } from '../context';

interface UploadScreenProps {
  navigation: any;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const UploadScreen: React.FC<UploadScreenProps> = ({ navigation }) => {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ProcessingStage>('uploading');
  const { isPro, canConvertPdf, recordPdfConversion, pdfConversionsRemaining, showPaywall } = useSubscription();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const pickPDF = async () => {
    try {
      const results = await pick({
        type: [types.pdf],
        allowMultiSelection: false,
      });

      if (results && results.length > 0) {
        const file = results[0];
        const newFile: SelectedFile = {
          uri: file.uri,
          name: file.name || 'document.pdf',
          type: file.type || 'application/pdf',
          size: file.size || undefined,
        };

        if (newFile.size && newFile.size > MAX_FILE_SIZE) {
          Alert.alert('Size Limit', 'File size exceeds 50MB limit.');
          return;
        }

        setSelectedFile(newFile);
      }
    } catch (error: any) {
      if (!error?.message?.includes('cancel')) {
        Alert.alert('Error', 'Failed to pick PDF file.');
      }
    }
  };

  const processFile = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a PDF file first.');
      return;
    }

    // Check monthly conversion limit for free users
    if (!isPro && !canConvertPdf()) {
      Alert.alert(
        'Monthly Limit Reached',
        `You've used all 5 free PDF conversions this month. Upgrade to Pro for unlimited conversions.`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => showPaywall() },
        ],
      );
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setStage('uploading');

    try {
      const result = await convertPDFToExcel(selectedFile, uploadProgress => {
        setProgress(Math.round(uploadProgress * 40));
      });

      setStage('processing');
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(60);

      setStage('converting');
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(90);

      setStage('complete');
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Record successful conversion (only for free users)
      if (!isPro) {
        await recordPdfConversion();
      }

      // Show rewarded interstitial ad before navigating to results (only for non-Pro users)
      if (!isPro) {
        await showRewardedInterstitialAd(isPro);
      }

      navigation.navigate('Result', {
        fileBase64: result.fileBase64,
        fileName: result.fileName,
        fileSize: result.fileSize,
        format: result.format,
        originalFileName: selectedFile.name,
      });
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof ApiError ? error.message : 'Something went wrong.',
      );
    } finally {
      setIsLoading(false);
      setProgress(0);
      setStage('uploading');
    }
  };

  const clearFile = () => setSelectedFile(null);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LoadingOverlay visible={isLoading} progress={progress} stage={stage} />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Feather
              name="arrow-left"
              size={ms(22)}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Select PDF</Text>
            {!isPro && (
              <Text style={styles.conversionCounter}>
                {pdfConversionsRemaining()} of 5 free left
              </Text>
            )}
          </View>
          {selectedFile ? (
            <TouchableOpacity onPress={clearFile} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.infoBanner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Feather name="info" size={ms(16)} color={Colors.info} />
          <Text style={styles.infoText}>
            Select a PDF with tables for best results. Max 50MB.
          </Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!selectedFile ? (
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={pickPDF}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primaryMuted, Colors.secondaryMuted]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pickerGradient}
              >
                <View style={styles.pickerIconContainer}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.pickerIcon}
                  >
                    <Feather
                      name="file-plus"
                      size={ms(26)}
                      color={Colors.textInverse}
                    />
                  </LinearGradient>
                </View>
                <Text style={styles.pickerText}>Tap to select PDF</Text>
                <Text style={styles.pickerHint}>
                  PDF files with tabular data
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <Animated.View style={[styles.fileCard, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fileIcon}
              >
                <Feather
                  name="file-text"
                  size={ms(24)}
                  color={Colors.textInverse}
                />
              </LinearGradient>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={2}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.fileSize}>
                  {formatSize(selectedFile.size)}
                </Text>
              </View>
              <TouchableOpacity onPress={clearFile} style={styles.removeBtn}>
                <Feather name="x" size={ms(18)} color={Colors.error} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Medium Rectangle Ad - Only shown for non-Pro users */}
          {!isPro && <NativeAdView adUnitId={AD_UNIT_IDS.BANNER} />}

          {selectedFile && (
            <View style={styles.outputPreview}>
              <Text style={styles.outputTitle}>Output Format</Text>
              <View style={styles.outputCard}>
                <View style={styles.outputIcon}>
                  <Feather name="grid" size={ms(20)} color={Colors.success} />
                </View>
                <View style={styles.outputInfo}>
                  <Text style={styles.outputFormat}>
                    Microsoft Excel (.xlsx)
                  </Text>
                  <Text style={styles.outputDesc}>
                    Editable spreadsheet with extracted tables
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {selectedFile && (
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Button
              title="Convert to Excel"
              onPress={processFile}
              icon="grid"
            />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
  },
  backBtn: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerSpacer: { width: ms(44) },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerTitleGroup: { alignItems: 'center', flex: 1 },
  conversionCounter: {
    fontSize: ms(10),
    color: Colors.textTertiary,
    fontWeight: '600',
    marginTop: 2,
  },
  clearBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  clearBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: Colors.error,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoLight,
    marginHorizontal: wp(5),
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  infoText: { flex: 1, fontSize: fontSize.xs, color: Colors.textSecondary },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  pickerBtn: { borderRadius: radius.xl, overflow: 'hidden' },
  pickerGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: Colors.primary + '25',
    borderStyle: 'dashed',
  },
  pickerIconContainer: { marginBottom: spacing.md },
  pickerIcon: {
    width: ms(70),
    height: ms(70),
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: spacing.xs,
  },
  pickerHint: { fontSize: fontSize.sm, color: Colors.textTertiary },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fileIcon: {
    width: ms(56),
    height: ms(56),
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: { flex: 1, marginLeft: spacing.md },
  fileName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fileSize: { fontSize: fontSize.sm, color: Colors.textTertiary, marginTop: 4 },
  removeBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: radius.sm,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outputPreview: { marginTop: spacing.xl },
  outputTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: spacing.sm,
  },
  outputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  outputIcon: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.sm,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outputInfo: { flex: 1, marginLeft: spacing.md },
  outputFormat: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  outputDesc: {
    fontSize: fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
    paddingTop: spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});

export default UploadScreen;
