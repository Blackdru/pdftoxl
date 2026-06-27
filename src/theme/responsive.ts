/**
 * Responsive utilities for consistent scaling across devices
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;

export const wp = (widthPercent: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * widthPercent) / 100);
};

export const hp = (heightPercent: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * heightPercent) / 100);
};

export const fp = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const ms = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size + (size * scale - size) * factor);
};

export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 375,
  isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLarge: SCREEN_WIDTH >= 414,
};

export const spacing = {
  xs: ms(4),
  sm: ms(8),
  md: ms(16),
  lg: ms(24),
  xl: ms(32),
  xxl: ms(48),
};

export const radius = {
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(20),
  xxl: ms(28),
  full: 9999,
};

export const fontSize = {
  xs: fp(11),
  sm: fp(13),
  md: fp(15),
  lg: fp(17),
  xl: fp(20),
  xxl: fp(26),
  xxxl: fp(32),
};

export default { wp, hp, fp, ms, screen, spacing, radius, fontSize };
