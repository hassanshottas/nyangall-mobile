import React, { createContext, useContext } from 'react';
import { LightColors, ThemeColors } from '@/constants/theme';

// Le mode sombre a été retiré de l'interface (choix utilisateur) : l'app reste
// toujours en thème clair. Le contexte est conservé pour éviter de modifier
// tous les écrans qui consomment useTheme().
type ThemeContextType = {
  mode: 'light';
  colors: ThemeColors;
  isDark: false;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value: ThemeContextType = { mode: 'light', colors: LightColors, isDark: false };
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans ThemeProvider');
  return ctx;
}
