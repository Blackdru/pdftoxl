/**
 * HowToUseScreen - Instructions for using the PDF to Excel app
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';
import { Colors, wp, hp, ms, fontSize, spacing, radius } from '../theme';

interface HowToUseScreenProps {
  navigation: any;
}

const HowToUseScreen: React.FC<HowToUseScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={ms(24)} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How to Use</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Feather name="grid" size={ms(32)} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>PDF to Excel</Text>
          <Text style={styles.heroSubtitle}>Convert PDF tables into editable Excel spreadsheets</Text>
        </View>

        <View style={styles.stepsContainer}>
          <StepItem number="1" icon="file-plus" title="Select PDF" description="Tap 'Get Started' and choose a PDF file containing tables or tabular data you want to extract." />
          <StepItem number="2" icon="cpu" title="Auto Detection" description="Our AI analyzes your PDF and automatically detects tables, columns, and data structure." />
          <StepItem number="3" icon="grid" title="Convert to Excel" description="Tables are converted to Excel format (.xlsx) preserving structure and formatting." />
          <StepItem number="4" icon="download" title="Download & Use" description="Save the Excel file to your device. Open it in Excel, Google Sheets, or any spreadsheet app." />
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips for Best Results</Text>
          <TipItem text="Use PDFs with clear, well-structured tables" />
          <TipItem text="Scanned documents may have lower accuracy" />
          <TipItem text="Complex merged cells may need manual adjustment" />
          <TipItem text="Files are processed securely and privately" />
          <TipItem text="Maximum file size is 50MB" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StepItem = ({ number, icon, title, description }: { number: string; icon: string; title: string; description: string }) => (
  <View style={styles.stepItem}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Feather name={icon} size={ms(18)} color={Colors.primary} />
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

const TipItem = ({ text }: { text: string }) => (
  <View style={styles.tipItem}>
    <Feather name="check-circle" size={ms(16)} color={Colors.success} />
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp(4), paddingVertical: hp(1.5), borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '600', color: Colors.textPrimary },
  placeholder: { width: ms(40) },
  content: { flex: 1, paddingHorizontal: wp(5) },
  heroSection: { alignItems: 'center', paddingVertical: hp(4) },
  heroIcon: { width: ms(72), height: ms(72), borderRadius: radius.xl, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  heroTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  heroSubtitle: { fontSize: fontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: ms(22) },
  stepsContainer: { gap: spacing.lg, marginBottom: hp(4) },
  stepItem: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: radius.xl, padding: spacing.lg },
  stepNumber: { width: ms(32), height: ms(32), borderRadius: ms(16), backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  stepNumberText: { fontSize: fontSize.md, fontWeight: '700', color: Colors.textInverse },
  stepContent: { flex: 1 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  stepTitle: { fontSize: fontSize.md, fontWeight: '600', color: Colors.textPrimary },
  stepDescription: { fontSize: fontSize.sm, color: Colors.textSecondary, lineHeight: ms(20) },
  tipsSection: { backgroundColor: Colors.surface, borderRadius: radius.xl, padding: spacing.xl, marginBottom: hp(4) },
  tipsTitle: { fontSize: fontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: spacing.lg },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  tipText: { fontSize: fontSize.sm, color: Colors.textSecondary, flex: 1 },
});

export default HowToUseScreen;
