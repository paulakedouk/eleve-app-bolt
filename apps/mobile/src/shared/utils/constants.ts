export const COLORS = {
  // Primary brand colors - Eleve brand palette
  primary: '#8B5CF6',        // Eleve Purple - main brand color
  primaryDark: '#7C3AED',    // Deeper purple for interactions
  primaryLight: '#C4B5FD',   // Light purple for backgrounds
  
  // Eleve brand colors - from design system
  eleveBlue: '#a5bff2',      // Eleve Blue - for trick video analysis
  elevePink: '#EC4899',      // Eleve Pink - for parent updates  
  eleveYellow: '#F59E0B',    // Eleve Yellow - for progress tracking
  eleveGreen: '#10B981',     // Eleve Green - for XP & badges
  elevePurple: '#8B5CF6',    // Eleve Purple - for mobile design
  eleveOrange: '#F97316',    // Eleve Orange - for security features
  
  // Secondary colors - fun and playful
  secondary: '#F59E0B',      // Warm Orange - energetic accent
  secondaryDark: '#D97706',  // Darker orange
  secondaryLight: '#FCD34D', // Light orange
  
  // Accent colors - modern and fun
  accent: '#10B981',         // Fresh Green - success and energy
  accentPink: '#EC4899',     // Hot Pink - fun highlights
  accentBlue: '#3B82F6',     // Electric Blue - tech vibes
  
  // Neo-brutalism colors
  black: '#000000',          // Pure black for neo-brutalist borders
  white: '#FFFFFF',          // Pure white for high contrast
  
  // Neutral colors - clean and modern
  background: '#F7F7F7',     // Light gray background
  surface: '#FFFFFF',        // Pure white for cards and surfaces
  surfaceElevated: '#FFFFFF', // Elevated surfaces
  
  // Text colors - readable and hierarchical
  textPrimary: '#000000',    // Dark slate - main text
  textSecondary: '#64748B',  // Medium gray for secondary text
  textTertiary: '#94A3B8',   // Light gray for tertiary text
  textInverse: '#FFFFFF',    // White text for dark backgrounds
  
  // Semantic colors - clear and encouraging
  success: '#10B981',        // Fresh green for success
  warning: '#F59E0B',        // Warm orange for warnings
  error: '#EF4444',          // Clean red for errors
  
  // Fun badge colors - rewarding and exciting
  badgeYellow: '#FCD34D',    // Sunny yellow for achievements
  badgePink: '#EC4899',      // Hot pink for special badges
  badgePurple: '#8B5CF6',    // Primary purple for premium badges
  badgeGreen: '#10B981',     // Fresh green for progress badges
  
  // Border and divider colors
  border: '#E2E8F0',         // Light gray borders
  borderLight: '#F1F5F9',    // Very light borders
  
  // Interactive colors
  overlay: 'rgba(30, 41, 59, 0.6)',
  overlayLight: 'rgba(30, 41, 59, 0.3)',
  overlayWhite: 'rgba(255, 255, 255, 0.2)',
  
  // Skill assessment colors - fun progression system
  skillTrying: '#F59E0B',    // Warm orange for trying
  skillLanded: '#8B5CF6',    // Primary purple for landed
  skillMastered: '#10B981',  // Fresh green for mastered
  
  // Gradient combinations for modern UI
  gradients: {
    primary: ['#8B5CF6', '#7C3AED'],
    secondary: ['#F59E0B', '#D97706'],
    success: ['#10B981', '#059669'],
    fun: ['#EC4899', '#8B5CF6'],
    sunset: ['#F59E0B', '#EC4899'],
  }
};

export const TYPOGRAPHY = {
  // Font weights - playful yet professional
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Font sizes - optimized for youth engagement
  sizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
    overline: 10,
  },
  
  // Line heights - improved readability
  lineHeights: {
    h1: 38,
    h2: 30,
    h3: 26,
    h4: 24,
    body: 24,
    bodySmall: 20,
    caption: 16,
  },

  // Font families - custom fonts for branding
  families: {
    archivo: 'Archivo-Medium',
    archivoBold: 'ArchivoBlack-Regular',
    poppins: 'Poppins-Medium',
    poppinsBold: 'Poppins-ExtraBold',
  },

  // Specific typography styles for components
  header: {
    fontFamily: 'ArchivoBlack-Regular',
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
  
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontWeight: '600' as const,
    letterSpacing: 1,
  },
  
  buttonTitle: {
    fontFamily: 'Archivo-Medium',
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  
  insightNumber: {
    fontFamily: 'Poppins-ExtraBold',
    fontWeight: '800' as const,
    letterSpacing: 0,
  },

  body: {
    fontFamily: 'Archivo-Medium',
    fontWeight: '400' as const,
  },
};

export const SPACING = {
  // Base spacing unit (8px grid system)
  unit: 8,
  
  // Common spacing values
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Component-specific spacing
  screenPadding: 20,
  cardPadding: 20,
  buttonPadding: 16,
  iconPadding: 8,
};

export const SHADOWS = {
  // Neo-brutalism shadows - offset shadows for depth
  brutalist: {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 8,
  },
  
  brutalistHover: {
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 12,
  },
  
  // Subtle, modern shadows - youth-friendly (keeping for backward compatibility)
  light: {
    shadowColor: '#E5E7EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  medium: {
    shadowColor: '#E5E7EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  heavy: {
    shadowColor: '#E5E7EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const BORDER_RADIUS = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  round: 50, // For circular elements
};

export const SIZES = {
  // Legacy support - gradually migrate to new system
  headerHeight: 60,
  buttonHeight: 50,
  borderRadius: 8,
  padding: 20,
  margin: 10,
  
  // New sizing system - youth-friendly
  button: {
    height: 48,
    heightLarge: 56,
    heightSmall: 40,
  },
  
  icon: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 40,
  },
  
  avatar: {
    small: 32,
    medium: 40,
    large: 56,
  },
};

export const VIDEO_CONFIG = {
  maxDuration: 60, // 1 minute
  quality: 'high' as const,
  aspectRatio: 16 / 9,
}; 