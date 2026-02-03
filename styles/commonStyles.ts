
import { StyleSheet } from 'react-native';

// PTO Brand Colors
export const colors = {
  // PTO Green (both modes)
  ptoGreen: '#40A060',
  
  // Light Mode
  light: {
    background: '#FFFFFF',
    foreground: '#171A1D',
    secondaryBackground: '#F3F4F6',
    secondaryText: '#262A30',
    mutedText: '#6B7280',
    border: '#DEE1E6',
    card: '#FFFFFF',
    cardBackground: '#FFFFFF',
    destructive: '#EF4444',
    tabBarBackground: '#F3F4F6',
    tabBarActive: '#40A060',
    tabBarInactive: '#6B7280',
  },
  
  // Dark Mode
  dark: {
    background: '#2A2828',
    foreground: '#F8F8F8',
    secondaryText: '#E4E2DD',
    cardBodyText: '#CFCBC1',
    card: '#343232',
    cardBackground: '#343232',
    mutedBackground: '#3E3C3C',
    mutedText: '#6B7280',
    border: '#444242',
    destructive: '#814545',
    tabBarBackground: '#3E3C3C',
    tabBarActive: '#40A060',
    tabBarInactive: '#6B7280',
  },
};

export const typography = {
  fontFamily: 'Helvetica Neue',
  fontFamilyDisplay: 'Swissposters', // For hero sections only
  regular: 'Helvetica Neue',
  medium: 'Helvetica Neue',
  bold: 'Helvetica Neue',
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
  sizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    body: 16,
    caption: 12,
    tabLabel: 12,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  buttonHeight: 40,
  inputHeight: 40,
  borderRadius: 12,
  cardPadding: 24,
  tabBarHeight: 60,
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    height: spacing.buttonHeight,
    borderRadius: spacing.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: colors.ptoGreen,
  },
  buttonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: '#FFFFFF',
  },
  input: {
    height: spacing.inputHeight,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: typography.sizes.body,
  },
  card: {
    borderRadius: spacing.borderRadius,
    padding: spacing.cardPadding,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
  },
  heading1: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
  },
  heading2: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
  },
  heading3: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
  },
  heading4: {
    fontSize: typography.sizes.h4,
    fontWeight: typography.weights.medium,
  },
  caption: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
  },
});
