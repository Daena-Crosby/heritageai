/**
 * Typography system following the "Heritage Chic" design system
 *
 * - Epilogue: Display & headlines (bold, authoritative, editorial)
 * - Manrope: Body text & labels (readable, functional)
 */

// Font family constants
export const fonts = {
  // Epilogue - for Display & Headlines
  epilogue: {
    regular: 'Epilogue_400Regular',
    medium: 'Epilogue_500Medium',
    semibold: 'Epilogue_600SemiBold',
    bold: 'Epilogue_700Bold',
    extrabold: 'Epilogue_800ExtraBold',
  },
  // Manrope - for Body & Labels
  manrope: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extrabold: 'Manrope_800ExtraBold',
  },
};

// Typography scale (Design System)
export const typography = {
  // Display - Epilogue (for hero sections, page titles)
  displayLarge: {
    fontFamily: fonts.epilogue.bold,
    fontSize: 57,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: fonts.epilogue.bold,
    fontSize: 45,
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: fonts.epilogue.bold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0,
  },
  // Headline - Epilogue (for section headers, card titles)
  headlineLarge: {
    fontFamily: fonts.epilogue.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: fonts.epilogue.semibold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: fonts.epilogue.semibold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
  // Title - Manrope (for component titles, prominent labels)
  titleLarge: {
    fontFamily: fonts.manrope.semibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: fonts.manrope.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: fonts.manrope.medium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  // Body - Manrope (for content, descriptions)
  bodyLarge: {
    fontFamily: fonts.manrope.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: fonts.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: fonts.manrope.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  // Label - Manrope (for buttons, badges, small UI text)
  labelLarge: {
    fontFamily: fonts.manrope.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: fonts.manrope.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: fonts.manrope.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};
