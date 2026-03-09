export const palette = {
  primary: '#1C74E9',
  onPrimary: '#FFFFFF',
  primaryContainer: 'rgba(28, 116, 233, 0.05)',
  onPrimaryContainer: '#1C74E9',
  primaryContainerBorder: 'rgba(28, 116, 233, 0.10)',

  background: '#F6F7F8',
  onBackground: '#1E293B',

  surface: '#FFFFFF',
  onSurface: '#1E293B',
  surfaceDim: '#E2E8F0',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F8FAFC',
  surfaceContainer: '#F1F5F9',
  surfaceContainerHigh: '#E2E8F0',
  surfaceContainerHighest: '#CBD5E1',
  surfaceVariant: '#F1F5F9',
  onSurfaceVariant: '#64748B',
  onSurfaceMuted: '#94A3B8',

  outline: '#CBD5E1',
  outlineVariant: 'rgba(226, 232, 240, 0.6)',

  success: '#059669',
  onSuccess: '#FFFFFF',
  successContainer: 'rgba(5, 150, 105, 0.10)',
  onSuccessContainer: '#059669',

  warning: '#D97706',
  onWarning: '#FFFFFF',
  warningContainer: 'rgba(217, 119, 6, 0.10)',
  onWarningContainer: '#D97706',

  error: '#DC2626',
  onError: '#FFFFFF',
  errorContainer: 'rgba(220, 38, 38, 0.10)',
  onErrorContainer: '#DC2626',

  scrim: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',

  accent: {
    blue: '#1C74E9',
    red: '#DC2626',
    yellow: '#D97706',
    orange: '#EA580C',
    purple: '#7C3AED',
    green: '#059669',
  },

  gradient: {
    primary: ['#1C74E9', '#1558B0'],
    secondary: ['#1C74E9', '#1558B0'],
    hero: ['#1C74E9', '#1558B0', '#0F3D7A'],
    warm: ['#D97706', '#B45309'],
    sunset: ['#DC2626', '#EA580C', '#D97706'],
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const shape = {
  extraSmall: 8,
  small: 12,
  medium: 16,
  large: 16,
  extraLarge: 28,
};

export const typography = {
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: -0.25 },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const, fontFamily: 'Lexend-Regular', letterSpacing: 0 },
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const, fontFamily: 'Lexend-Regular', letterSpacing: 0 },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: -0.5 },
  headlineMedium: { fontSize: 24, lineHeight: 32, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: 0 },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: 0 },
  titleLarge: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const, fontFamily: 'Lexend-SemiBold', letterSpacing: 0 },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const, fontFamily: 'Lexend-Medium', letterSpacing: 0.15 },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, fontFamily: 'Lexend-SemiBold', letterSpacing: 0.1 },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, fontFamily: 'Lexend-Medium', letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, fontFamily: 'Lexend-Medium', letterSpacing: 0.5 },
  labelSmall: { fontSize: 10, lineHeight: 16, fontWeight: '500' as const, fontFamily: 'Lexend-Medium', letterSpacing: 0.5 },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, fontFamily: 'Lexend-Regular', letterSpacing: 0.5 },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, fontFamily: 'Lexend-Regular', letterSpacing: 0.25 },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: 0.4 },
};

export const elevation = {
  level0: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  level2: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  level3: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  level4: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  level5: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const stateLayer = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  dragged: 0.16,
};
