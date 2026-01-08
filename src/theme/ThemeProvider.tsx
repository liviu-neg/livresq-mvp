import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { Theme } from './tokens';
import { plainTheme, neonTheme, themeToCSSVariables } from './tokens';

export type ThemeId = 'plain' | 'neon' | string;

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  customThemes: Record<string, Theme>;
  updateCustomThemes: (themes: Record<string, Theme>) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'livresq-custom-themes';

// Load custom themes from localStorage
function loadCustomThemes(): Record<string, Theme> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load custom themes:', error);
  }
  return {};
}

// Save custom themes to localStorage
function saveCustomThemes(themes: Record<string, Theme>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  } catch (error) {
    console.error('Failed to save custom themes:', error);
  }
}

const builtInThemes: Record<string, Theme> = {
  plain: plainTheme,
  neon: neonTheme,
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>('plain');
  const [customThemes, setCustomThemes] = useState<Record<string, Theme>>(() => {
    // Load themes from localStorage
    const loaded = loadCustomThemes();
    // Return all loaded themes without filtering - allow all themes to be saved and loaded
    return loaded;
  });

  // Save custom themes to localStorage whenever they change
  useEffect(() => {
    saveCustomThemes(customThemes);
  }, [customThemes]);

  const updateCustomThemes = (themes: Record<string, Theme>) => {
    setCustomThemes(themes);
  };

  // Get current theme (built-in or custom)
  // If a custom theme exists with ID 'plain' or 'neon', use that instead of built-in
  const getCurrentTheme = (): Theme => {
    if (themeId === 'plain' || themeId === 'neon') {
      // Check if custom theme exists for this ID, use it instead of built-in
      if (customThemes[themeId]) {
        return customThemes[themeId];
      }
      return builtInThemes[themeId];
    }
    return customThemes[themeId] || plainTheme;
  };

  const theme = getCurrentTheme();
  const cssVariables = themeToCSSVariables(theme);
  
  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, customThemes, updateCustomThemes }}>
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
    customThemes: context.customThemes,
    updateCustomThemes: context.updateCustomThemes,
  };
}

