/**
 * BankAnalyzerScreen - Pick and analyze bank statements (PDF / Excel / CSV)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick } from '@react-native-documents/picker';
import LinearGradient from 'react-native-linear-gradient';
import Feather from '@react-native-vector-icons/feather';
import { Colors, wp, hp, ms, fontSize, spacing, radius } from '../theme';
import { Button } from '../components';
import BannerAdView from '../components/BannerAdView';
import PdfExtractorWebView from '../components/PdfExtractorWebView';
import {
  parseExcelFile,
  parseCsvFile,
  parsePdfRows,
} from '../services/statementParser';
import { analyzeTransactions } from '../services/analysisEngine';
import { useSubscription } from '../context';

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface BankAnalyzerScreenProps {
  navigation: any;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const BankAnalyzerScreen: React.FC<BankAnalyzerScreenProps> = ({
  navigation,
}) => {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const { isPro } = useSubscription();

  // ─── File picking ────────────────────────────────────────────────────────────

  const pickFile = async () => {
    try {
      const results = await pick({
        type: [
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'text/comma-separated-values',
          'text/plain',
        ],
        allowMultiSelection: false,
      });

      if (results && results.length > 0) {
        const file = results[0];
        const newFile: SelectedFile = {
          uri: file.uri,
          name: file.name || 'statement',
          type: file.type || 'application/octet-stream',
          size: file.size ?? undefined,
        };

        if (newFile.size && newFile.size > MAX_FILE_SIZE) {
          Alert.alert('File Too Large', 'Maximum supported size is 20 MB.');
          return;
        }

        setSelectedFile(newFile);
      }
    } catch (error: any) {
      if (!error?.message?.includes('cancel')) {
        Alert.alert('Error', 'Failed to pick file. Please try again.');
      }
    }
  };

  // ─── Analysis ────────────────────────────────────────────────────────────────

  const analyzeFile = async () => {
    if (!selectedFile) {
      Alert.alert('No file selected', 'Please select a bank statement first.');
      return;
    }

    const type = selectedFile.type.toLowerCase();
    const name = selectedFile.name.toLowerCase();
    setIsLoading(true);

    const isPdf = type.includes('pdf') || name.endsWith('.pdf');
    const isExcel =
      type.includes('sheet') ||
      type.includes('excel') ||
      type.includes('ms-excel') ||
      name.endsWith('.xls') ||
      name.endsWith('.xlsx');

    try {
      if (isPdf) {
        setLoadingMessage('Loading PDF parser...');
        setPdfUri(selectedFile.uri);
        setShowWebView(true);
        // Processing continues in handlePdfTextExtracted
      } else if (isExcel) {
        setLoadingMessage('Parsing Excel file...');
        const transactions = await parseExcelFile(selectedFile.uri);
        if (transactions.length === 0) {
          Alert.alert(
            'No Transactions Found',
            'Could not extract any transactions from this file. Please ensure it is a valid bank statement.',
          );
          setIsLoading(false);
          return;
        }
        const result = analyzeTransactions(transactions);
        navigation.navigate('Dashboard', {
          result,
          fileName: selectedFile.name,
        });
        setIsLoading(false);
      } else {
        // CSV / plain text
        setLoadingMessage('Parsing CSV file...');
        const transactions = await parseCsvFile(selectedFile.uri);
        if (transactions.length === 0) {
          Alert.alert(
            'No Transactions Found',
            'Could not extract any transactions from this file. Please ensure it is a valid bank statement.',
          );
          setIsLoading(false);
          return;
        }
        const result = analyzeTransactions(transactions);
        navigation.navigate('Dashboard', {
          result,
          fileName: selectedFile.name,
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      Alert.alert('Analysis Failed', error?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  const handlePdfTextExtracted = async (rows: string[]) => {
    setShowWebView(false);
    setLoadingMessage('Extracting transactions...');
    try {
      const transactions = await parsePdfRows(rows);
      if (transactions.length === 0) {
        Alert.alert(
          'No Transactions Found',
          'Could not extract any transactions from this file. Please ensure it is a valid bank statement.',
        );
        setIsLoading(false);
        return;
      }
      const result = analyzeTransactions(transactions);
      navigation.navigate('Dashboard', {
        result,
        fileName: selectedFile?.name ?? 'statement',
      });
    } catch (error: any) {
      Alert.alert('Analysis Failed', error?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfError = (error: string) => {
    setShowWebView(false);
    setIsLoading(false);
    Alert.alert('PDF Parse Error', error);
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const clearFile = () => setSelectedFile(null);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeBadge = (type: string, name: string) => {
    const t = type.toLowerCase() + name.toLowerCase();
    if (t.includes('pdf')) return { label: 'PDF', color: Colors.error };
    if (t.includes('sheet') || t.includes('excel') || t.includes('xls'))
      return { label: 'XLS', color: Colors.success };
    return { label: 'CSV', color: Colors.secondary };
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Hidden PDF WebView */}
      {showWebView && (
        <PdfExtractorWebView
          pdfUri={pdfUri}
          onTextExtracted={handlePdfTextExtracted}
          onError={handlePdfError}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={ms(22)} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bank Analyzer</Text>
        </View>
        {/* PRO Badge */}
        {isPro ? (
          <View style={styles.proBadge}>
            <Feather name="award" size={ms(11)} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Feather name="shield" size={ms(16)} color={Colors.info} />
        <Text style={styles.infoText}>
          Supports PDF, Excel & CSV bank statements. No bank login required.
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Upload area */}
        {!selectedFile ? (
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={pickFile}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.accentMuted, Colors.secondaryMuted]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pickerGradient}
            >
              <View style={styles.pickerIconContainer}>
                <LinearGradient
                  colors={[Colors.accent, Colors.accentLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pickerIcon}
                >
                  <Feather
                    name="trending-up"
                    size={ms(26)}
                    color={Colors.textInverse}
                  />
                </LinearGradient>
              </View>
              <Text style={styles.pickerText}>Select Bank Statement</Text>
              <Text style={styles.pickerHint}>PDF • Excel • CSV</Text>

              {/* Format badges */}
              <View style={styles.badgeRow}>
                <View
                  style={[styles.badge, { backgroundColor: Colors.errorLight }]}
                >
                  <Text style={[styles.badgeLabel, { color: Colors.error }]}>
                    PDF
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: Colors.successLight },
                  ]}
                >
                  <Text
                    style={[styles.badgeLabel, { color: Colors.successDark }]}
                  >
                    XLS
                  </Text>
                </View>
                <View
                  style={[styles.badge, { backgroundColor: Colors.infoLight }]}
                >
                  <Text style={[styles.badgeLabel, { color: Colors.info }]}>
                    CSV
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          /* File card */
          <View style={styles.fileCard}>
            <LinearGradient
              colors={[Colors.accent, Colors.accentLight]}
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
              <View style={styles.fileMeta}>
                {selectedFile.size ? (
                  <Text style={styles.fileSize}>
                    {formatSize(selectedFile.size)}
                  </Text>
                ) : null}
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor:
                        getTypeBadge(selectedFile.type, selectedFile.name)
                          .color + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeLabel,
                      {
                        color: getTypeBadge(
                          selectedFile.type,
                          selectedFile.name,
                        ).color,
                      },
                    ]}
                  >
                    {getTypeBadge(selectedFile.type, selectedFile.name).label}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={clearFile} style={styles.removeBtn}>
              <Feather name="x" size={ms(18)} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy notice */}
        <View style={styles.privacyRow}>
          <Text style={styles.privacyText}>✓ No bank login</Text>
          <Text style={styles.privacyText}> ✓ No SMS access</Text>
          <Text style={styles.privacyText}> ✓ Processed locally</Text>
        </View>

        {/* Banner Ad — below privacy row, properly separated, only for free users */}
        <BannerAdView style={styles.adInScroll} />
      </ScrollView>

      {/* Analyze button */}
      {selectedFile && !isLoading && (
        <View style={styles.footer}>
          <Button
            title="Analyze Statement"
            onPress={analyzeFile}
            icon="bar-chart-2"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    minWidth: wp(60),
  },
  loadingText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
  },
  headerCenter: { flex: 1, alignItems: 'center' },
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
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSpacer: { width: ms(44) },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    minWidth: ms(44),
    justifyContent: 'center',
  },
  proBadgeText: {
    fontSize: ms(10),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Info banner
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

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Upload picker
  pickerBtn: { borderRadius: radius.xl, overflow: 'hidden' },
  pickerGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: Colors.accent + '30',
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
  pickerHint: {
    fontSize: fontSize.sm,
    color: Colors.textTertiary,
    marginBottom: spacing.lg,
  },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeLabel: { fontSize: fontSize.xs, fontWeight: '700' },

  // File card
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
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: spacing.sm,
  },
  fileSize: { fontSize: fontSize.xs, color: Colors.textTertiary },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeBadgeLabel: { fontSize: fontSize.xs, fontWeight: '700' },
  removeBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: radius.sm,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Privacy
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  privacyText: { fontSize: fontSize.xs, color: Colors.textTertiary },

  // Ad in scroll
  adInScroll: {
    marginTop: spacing.xl,
    borderRadius: radius.md,
    overflow: 'hidden',
  },

  // Footer
  footer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
    paddingTop: spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});

export default BankAnalyzerScreen;
