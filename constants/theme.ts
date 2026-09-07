// Couleurs et thème NyangAll — palettes claire et sombre

export const LightColors = {
  primary: '#E63946',      // rouge marocain
  primaryDark: '#C1121F',
  secondary: '#1D3557',    // bleu nuit
  accent: '#F4A261',       // orange chaud
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F5',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  success: '#2A9D8F',
  error: '#E63946',
  warning: '#F4A261',
};

export const DarkColors = {
  primary: '#F1495A',      // légèrement éclairci pour contraste sur fond sombre
  primaryDark: '#C1121F',
  secondary: '#5B7FB5',    // bleu nuit éclairci pour lisibilité
  accent: '#F4A261',
  background: '#0F1115',
  surface: '#1B1E24',
  surfaceAlt: '#242830',
  textPrimary: '#F1F3F5',
  textSecondary: '#9BA3AF',
  border: '#2E333C',
  success: '#3FBF9F',
  error: '#F1495A',
  warning: '#F4A261',
};

export type ThemeColors = typeof LightColors;

// Rétrocompatibilité : les écrans pas encore migrés vers useTheme() continuent
// de fonctionner avec la palette claire par défaut.
export const Colors = LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
};
