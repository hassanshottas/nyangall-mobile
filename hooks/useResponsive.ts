import { useWindowDimensions, Platform } from 'react-native';

export function useResponsive() {
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  // Nombre de colonnes pour les grilles
  const numCols = isMobile ? 2 : isTablet ? 3 : 4;

  // Largeur max du contenu
  const MAX_WIDTH = 1100;

  // Padding top des headers (status bar native vs web)
  const headerPT = isWeb ? 20 : 56;

  return { width, isMobile, isTablet, isDesktop, numCols, MAX_WIDTH, headerPT, isWeb };
}
