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

// Migrate old themes to include new properties (backgroundImageType)
function migrateTheme(theme: any): Theme {
  // Create a copy to avoid mutating the original
  const migrated = { ...theme };
  
  // Ensure all background properties have backgroundImageType
  if (migrated.pageBackground) {
    migrated.pageBackground = {
      ...migrated.pageBackground,
      backgroundImageType: migrated.pageBackground.backgroundImageType || 'fill',
    };
  }
  if (migrated.rowBackground) {
    migrated.rowBackground = {
      ...migrated.rowBackground,
      backgroundImageType: migrated.rowBackground.backgroundImageType || 'fill',
    };
  }
  if (migrated.cellBackground) {
    migrated.cellBackground = {
      ...migrated.cellBackground,
      backgroundImageType: migrated.cellBackground.backgroundImageType || 'fill',
    };
  }
  if (migrated.resourceBackground) {
    migrated.resourceBackground = {
      ...migrated.resourceBackground,
      backgroundImageType: migrated.resourceBackground.backgroundImageType || 'fill',
    };
  }
  
  // Ensure theme has a name (fallback to ID if missing)
  if (!migrated.name && migrated.id) {
    migrated.name = migrated.id;
  } else if (!migrated.name) {
    migrated.name = 'Custom Theme';
  }
  
  return migrated as Theme;
}

// Load custom themes from localStorage
function loadCustomThemes(): Record<string, Theme> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate all themes to ensure they have the new properties
      const migrated: Record<string, Theme> = {};
      for (const [id, theme] of Object.entries(parsed)) {
        if (theme && typeof theme === 'object') {
          try {
            migrated[id] = migrateTheme(theme);
          } catch (themeError) {
            console.warn(`Failed to migrate theme "${id}":`, themeError);
            // Still try to include it, even if migration partially fails
            migrated[id] = theme as Theme;
          }
        }
      }
      console.log(`Loaded ${Object.keys(migrated).length} custom themes from localStorage:`, Object.keys(migrated));
      return migrated;
    }
  } catch (error) {
    console.error('Failed to load custom themes:', error);
    // If parsing fails, try to recover by clearing corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.warn('Cleared corrupted theme data from localStorage');
    } catch (clearError) {
      console.error('Failed to clear corrupted theme data:', clearError);
    }
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
    // Ensure we have valid themes - filter out any invalid entries
    const validated: Record<string, Theme> = {};
    for (const [id, theme] of Object.entries(loaded)) {
      if (theme && typeof theme === 'object' && theme.name) {
        validated[id] = theme;
      }
    }
    console.log(`Initialized with ${Object.keys(validated).length} valid custom themes`);
    return validated;
  });

  // Save custom themes to localStorage whenever they change
  // Always save, even if empty (to persist migrations)
  useEffect(() => {
    saveCustomThemes(customThemes);
  }, [customThemes]);

  const updateCustomThemes = (themes: Record<string, Theme>) => {
    // Validate and migrate themes before updating
    const validated: Record<string, Theme> = {};
    for (const [id, theme] of Object.entries(themes)) {
      if (theme && typeof theme === 'object') {
        try {
          validated[id] = migrateTheme(theme);
        } catch (error) {
          console.warn(`Failed to validate theme "${id}":`, error);
          // Still include it if migration fails
          validated[id] = theme as Theme;
        }
      }
    }
    setCustomThemes(validated);
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

