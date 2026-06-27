/**
 * ResultScreen - Result display for converted Excel file
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Share,
  Animated,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from '@react-native-vector-icons/feather';
import { Colors, wp, hp, ms, fontSize, spacing, radius } from '../theme';
import { Button } from '../components';
import { saveConvertedFile, ApiError } from '../services/api';
import { parseExcelFile } from '../services/statementParser';
import { analyzeTransactions } from '../services/analysisEngine';

interface ResultScreenProps {
  navigation: any;
  route: {
    params: {
      fileBase64: string;
      fileName: string;
      fileSize: number;
      format: string;
      originalFileName: string;
    };
  };
}

const ResultScreen: React.FC<ResultScreenProps> = ({ navigation, route }) => {
  const { fileBase64, fileName, fileSize, format, originalFileName } =
    route.params;

  const [isDownloading, setIsDownloading] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(checkAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkAnim, fadeAnim, scaleAnim, slideAnim]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = async () => {
    if (!fileBase64) {
      Alert.alert('Error', 'No file data available');
      return;
    }

    setIsDownloading(true);
    try {
      const path = await saveConvertedFile(fileBase64, fileName);
      setSavedPath(path);
      Alert.alert(
        'Download Complete',
        `Excel file saved to Downloads:\n${fileName}`,
        [{ text: 'OK' }],
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof ApiError ? error.message : 'Failed to save file',
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Save the file first if not already saved
      let path = savedPath;
      if (!path) {
        path = await saveConvertedFile(fileBase64, fileName);
        setSavedPath(path);
      }
      const transactions = await parseExcelFile(path);
      if (transactions.length === 0) {
        Alert.alert(
          'No Transactions Found',
          'Could not extract transactions from this Excel file. The statement format may not be supported.',
        );
        return;
      }
      const result = analyzeTransactions(transactions);
      navigation.navigate('Dashboard', { result, fileName });
    } catch (error: any) {
      Alert.alert('Analysis Failed', error?.message || 'Something went wrong.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = async () => {
    if (!savedPath && !fileBase64) {
      Alert.alert('Error', 'No file available to share');
      return;
    }

    try {
      let pathToShare = savedPath;
      if (!pathToShare) {
        pathToShare = await saveConvertedFile(fileBase64, fileName);
        setSavedPath(pathToShare);
      }

      if (Platform.OS === 'android') {
        const ReactNativeBlobUtil = require('react-native-blob-util').default;
        const mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        // Try sharing via intent chooser first for better compatibility
        try {
          await ReactNativeBlobUtil.android.actionViewIntent(
            pathToShare,
            mimeType,
          );
        } catch (viewError) {
          console.log('actionViewIntent failed, trying Share:', viewError);
          // Fallback: use Share with file URI
          await Share.share({
            title: fileName,
            message: `Excel file: ${fileName}`,
            url: `file://${pathToShare}`,
          });
        }
      } else {
        // iOS can use Share API with url
        await Share.share({
          title: 'Converted Excel',
          message: `Excel: ${fileName}`,
          url: `file://${pathToShare}`,
        });
      }
    } catch (error) {
      console.log('Share error:', error);
      Alert.alert(
        'Share',
        'File saved to Downloads. You can share it from your file manager.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={styles.backBtn}
          >
            <Feather name="home" size={ms(20)} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Result</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Animated.View
          style={[
            styles.successCard,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={[Colors.success + '12', Colors.success + '05']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.successGradient}
          >
            <Animated.View
              style={[
                styles.successIconContainer,
                { transform: [{ scale: checkAnim }] },
              ]}
            >
              <LinearGradient
                colors={[Colors.success, Colors.successDark]}
                style={styles.successIcon}
              >
                <Feather
                  name="check"
                  size={ms(28)}
                  color={Colors.textInverse}
                />
              </LinearGradient>
            </Animated.View>
            <View style={styles.successTextContainer}>
              <Text style={styles.successTitle}>Conversion Complete!</Text>
              <Text style={styles.successSubtitle}>
                PDF converted to Excel successfully
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            styles.detailsCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.detailsTitle}>File Details</Text>
          <DetailRow
            icon="file-text"
            label="Source File"
            value={originalFileName}
            color={Colors.info}
          />
          <DetailRow
            icon="grid"
            label="Output Format"
            value={format.toUpperCase()}
            color={Colors.primary}
          />
          <DetailRow
            icon="hard-drive"
            label="File Size"
            value={formatFileSize(fileSize)}
            color={Colors.warning}
          />
          <DetailRow
            icon="file"
            label="Output File"
            value={fileName}
            color={Colors.success}
            isLast
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.actions,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {fileBase64 ? (
            <>
              <Button
                title={savedPath ? 'Downloaded ✓' : 'Save Excel to Downloads'}
                onPress={handleDownload}
                icon="download"
                loading={isDownloading}
                disabled={!!savedPath}
              />
              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleShare}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[Colors.primaryMuted, Colors.secondaryMuted]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.secondaryBtnGradient}
                  >
                    <Feather
                      name="share-2"
                      size={ms(18)}
                      color={Colors.primary}
                    />
                    <Text style={styles.secondaryBtnText}>Open / Share</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  { marginTop: spacing.sm, alignSelf: 'stretch' },
                ]}
                onPress={handleAnalyze}
                activeOpacity={0.7}
                disabled={isAnalyzing}
              >
                <LinearGradient
                  colors={[Colors.accentMuted, '#EFF6FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.secondaryBtnGradient,
                    { justifyContent: 'center' },
                  ]}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <Feather
                      name="trending-up"
                      size={ms(18)}
                      color={Colors.accent}
                    />
                  )}
                  <Text
                    style={[styles.secondaryBtnText, { color: Colors.accent }]}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Statement'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.noDataCard}>
              <Feather name="alert-circle" size={ms(22)} color={Colors.error} />
              <Text style={styles.noDataText}>
                No file data received. Please try again.
              </Text>
            </View>
          )}
          <Button
            title="Convert Another PDF"
            onPress={() => navigation.navigate('Upload')}
            variant="outline"
            icon="plus"
            style={styles.convertAnotherBtn}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({
  icon,
  label,
  value,
  color,
  isLast = false,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  isLast?: boolean;
}) => (
  <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
    <View style={[styles.detailIcon, { backgroundColor: color + '12' }]}>
      <Feather name={icon} size={ms(16)} color={color} />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: wp(5), paddingBottom: hp(3) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
  },
  backBtn: {
    width: ms(40),
    height: ms(40),
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
  headerSpacer: { width: ms(40) },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  successCard: {
    marginTop: hp(1),
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  successGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.success + '25',
    borderRadius: radius.lg,
    flexDirection: 'row',
  },
  successIconContainer: { marginRight: spacing.md },
  successIcon: {
    width: ms(48),
    height: ms(48),
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  successTextContainer: { flex: 1 },
  successTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: Colors.success,
    textAlign: 'left',
  },
  successSubtitle: {
    fontSize: fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'left',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: hp(2),
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  detailsTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailIcon: {
    width: ms(38),
    height: ms(38),
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: { flex: 1, marginLeft: spacing.md },
  detailLabel: {
    fontSize: fontSize.xs,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  actions: { marginTop: hp(2.5) },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  secondaryBtn: { borderRadius: radius.md, overflow: 'hidden' },
  secondaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  secondaryBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  noDataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  noDataText: { flex: 1, fontSize: fontSize.sm, color: Colors.textSecondary },
  convertAnotherBtn: { marginTop: spacing.md },
});

export default ResultScreen;
