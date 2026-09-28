import { useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useResponsive() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === 'web';
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  // Nombre de colonnes pour les grilles
  const numCols = isMobile ? 2 : isTablet ? 3 : 4;

  // Largeur max du contenu
  const MAX_WIDTH = 1100;

  // Padding top des headers : s'appuie sur l'inset de la zone sécurisée réelle
  // (encoche, caméra perforée, barre de statut) plutôt qu'une valeur fixe —
  // indispensable avec l'affichage bord-à-bord activé par défaut sur Android
  // récent (SDK 35+), sinon le contenu est dessiné sous la barre de statut.
  const headerPT = isWeb ? 20 : insets.top + 12;

  return { width, isMobile, isTablet, isDesktop, numCols, MAX_WIDTH, headerPT, isWeb, insets };
}
