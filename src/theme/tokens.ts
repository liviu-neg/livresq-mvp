/**
 * Theme Tokens System
 * 
 * Structure designed to grow into Gamma-style organization:
 * - Colors: roles (background/surface/text/border/accent) + semantic (success/warn/error)
 * - Typography: families + scales (heading/body/caption) + reusable text styles
 * - Section recipes: surface, border, radius, shadow, padding
 */

export interface ColorTokens {
  bg: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  focusRing: string;
  accent: string;
}

export interface TypographyTokens {
  fontSans: string;
  fontSerif: string;
  baseSize: number;
  scale: {
    xs: number; // 14
    sm: number; // 16
    base: number; // 20
    lg: number; // 24
    xl: number; // 32
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface SpacingTokens {
  xs: number; // 4
  sm: number; // 8
  md: number; // 12
  lg: number; // 16
  xl: number; // 24
  '2xl': number; // 32
}

export interface RadiusTokens {
  sm: number; // 8
  md: number; // 12
  lg: number; // 16
}

export interface ShadowTokens {
  subtle: string;
}

export interface Theme {
  name: string;
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadow: ShadowTokens;
}

/**
 * Plain Theme - Articulate-like, minimal, clean white
 */
export const plainTheme: Theme = {
  name: 'Plain',
  colors: {
    bg: '#ffffff',
    surface: '#fafafa',
    text: '#1a1a1a',
    mutedText: '#666666',
    border: '#e0e0e0',
    focusRing: '#3b82f6',
    accent: '#3b82f6',
  },
  typography: {
    fontSans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    fontSerif: 'Georgia, "Times New Roman", serif',
    baseSize: 20,
    scale: {
      xs: 14,
      sm: 16,
      base: 20,
      lg: 24,
      xl: 32,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  shadow: {
    subtle: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * Neon/Dark Theme - Dark purple/blue gradient vibe, glassy cards
 */
export const neonTheme: Theme = {
  name: 'Neon',
  colors: {
    bg: '#0f0f1e', // Dark purple-blue base
    surface: '#1a1a2e', // Slightly lighter for surfaces
    text: '#ffffff', // White text for headers and body
    mutedText: '#a0a0b8', // Muted light text
    border: '#2a2a4a', // Subtle border on dark
    focusRing: '#8b5cf6', // Purple accent
    accent: '#8b5cf6',
  },
  typography: {
    fontSans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    fontSerif: 'Georgia, "Times New Roman", serif',
    baseSize: 20,
    scale: {
      xs: 14,
      sm: 16,
      base: 20,
      lg: 24,
      xl: 32,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  shadow: {
    subtle: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
};

// Legacy alias for backward compatibility
export const cleanTheme = plainTheme;

/**
 * Convert theme tokens to CSS custom properties
 */
export function themeToCSSVariables(theme: Theme): Record<string, string> {
  // Section appearance variables based on theme
  const isPlain = theme.name === 'Plain';
  
  return {
    '--color-bg': theme.colors.bg,
    '--color-surface': theme.colors.surface,
    '--color-text': theme.colors.text,
    '--color-muted-text': theme.colors.mutedText,
    '--color-border': theme.colors.border,
    '--color-focus-ring': theme.colors.focusRing,
    '--color-accent': theme.colors.accent,
    '--lesson-canvas-bg': isPlain ? '#fff' : theme.colors.surface,
    
    // Section appearance variables
    '--section-plain-bg': isPlain ? theme.colors.bg : 'transparent',
    '--section-plain-border': 'none',
    '--section-plain-shadow': 'none',
    '--section-plain-radius': '0',
    
    '--section-card-bg': theme.colors.bg,
    '--section-card-border': isPlain 
      ? `1px solid ${theme.colors.border}` 
      : `1px solid ${theme.colors.border}`,
    '--section-card-shadow': isPlain 
      ? theme.shadow.subtle 
      : '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.1)',
    '--section-card-radius': `${theme.radius.md}px`,
    
    '--section-padding': `${theme.spacing.xl}px ${theme.spacing.lg}px`,
    
    '--font-sans': theme.typography.fontSans,
    '--font-serif': theme.typography.fontSerif,
    '--font-size-base': `${theme.typography.baseSize}px`,
    '--font-size-xs': `${theme.typography.scale.xs}px`,
    '--font-size-sm': `${theme.typography.scale.sm}px`,
    '--font-size-base-scale': `${theme.typography.scale.base}px`,
    '--font-size-lg': `${theme.typography.scale.lg}px`,
    '--font-size-xl': `${theme.typography.scale.xl}px`,
    '--line-height-tight': theme.typography.lineHeights.tight.toString(),
    '--line-height-normal': theme.typography.lineHeights.normal.toString(),
    '--line-height-relaxed': theme.typography.lineHeights.relaxed.toString(),
    
    '--spacing-xs': `${theme.spacing.xs}px`,
    '--spacing-sm': `${theme.spacing.sm}px`,
    '--spacing-md': `${theme.spacing.md}px`,
    '--spacing-lg': `${theme.spacing.lg}px`,
    '--spacing-xl': `${theme.spacing.xl}px`,
    '--spacing-2xl': `${theme.spacing['2xl']}px`,
    
    '--radius-sm': `${theme.radius.sm}px`,
    '--radius-md': `${theme.radius.md}px`,
    '--radius-lg': `${theme.radius.lg}px`,
    
    '--shadow-subtle': theme.shadow.subtle,
  };
}

