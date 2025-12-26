import React, { createContext, useContext, ReactNode, useState } from 'react';
import type { Theme } from './tokens';
import { plainTheme, neonTheme, themeToCSSVariables } from './tokens';

export type ThemeId = 'plain' | 'neon';

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const themes: Record<ThemeId, Theme> = {
  plain: plainTheme,
  neon: neonTheme,
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>('plain');
  const theme = themes[themeId];
  const cssVariables = themeToCSSVariables(theme);
  
  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      <div style={cssVariables as React.CSSProperties}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context.theme;
}

export function useThemeSwitcher() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeSwitcher must be used within a ThemeProvider');
  }
  return {
    themeId: context.themeId,
    setThemeId: context.setThemeId,
  };
}

