/**
 * Button Component - Responsive gradient design
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from '@react-native-vector-icons/feather';
import { Colors, ms, fontSize, radius } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'default' | 'small';
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  title, onPress, disabled = false, loading = false, icon, iconPosition = 'left',
  variant = 'primary', size = 'default', style,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isSmall = size === 'small';
  const iconSize = isSmall ? ms(16) : ms(18);
  const iconColor = isPrimary ? Colors.textInverse : Colors.primary;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <Feather name={icon} size={iconSize} color={iconColor} style={styles.iconLeft} />}
          <Text style={[styles.text, !isPrimary && styles.textOutline, isSmall && styles.textSmall]}>{title}</Text>
          {icon && iconPosition === 'right' && <Feather name={icon} size={iconSize} color={iconColor} style={styles.iconRight} />}
        </>
      )}
    </View>
  );

  if (isPrimary) {
    const gradientColors = disabled ? [Colors.gray300, Colors.gray400] : [Colors.primary, Colors.primaryGradientEnd];
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85} style={[disabled && styles.disabled, style]}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.container, isSmall && styles.containerSmall]}>
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}
      style={[styles.container, isSmall && styles.containerSmall, isOutline ? styles.outline : styles.ghost, disabled && styles.disabled, style]}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { height: ms(54), borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  containerSmall: { height: ms(44), borderRadius: radius.md },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.primary, shadowOpacity: 0, elevation: 0 },
  ghost: { backgroundColor: Colors.primaryMuted, shadowOpacity: 0, elevation: 0 },
  disabled: { opacity: 0.6 },
  content: { flexDirection: 'row', alignItems: 'center' },
  text: { fontSize: fontSize.md, fontWeight: '700', color: Colors.textInverse, letterSpacing: 0.3 },
  textOutline: { color: Colors.primary },
  textSmall: { fontSize: fontSize.sm },
  iconLeft: { marginRight: ms(8) },
  iconRight: { marginLeft: ms(8) },
});

export default Button;
