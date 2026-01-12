import type { CuratedStyleDefinition, ThemeSpecificRowProps } from '../types';

/**
 * Curated Row Styles
 * These are predefined styles available to all themes
 * Properties are computed using theme colors for previews
 */
export const curatedStyles: CuratedStyleDefinition[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Subtle rounding and shadows',
    getProperties: (themeColors) => ({
      backgroundColor: themeColors.surface,
      backgroundColorOpacity: 1,
      borderRadius: { mode: 'uniform', uniform: 8 },
      shadow: {
        type: 'box',
        position: 'outside',
        color: '#000000',
        opacity: 0.1,
        x: 0,
        y: 2,
        blur: 8,
        spread: 0,
      },
    }),
  },
  {
    id: 'flat',
    name: 'Flat',
    description: 'Clean design with no borders',
    getProperties: (themeColors) => ({
      backgroundColor: themeColors.surface,
      backgroundColorOpacity: 1,
      borderRadius: { mode: 'uniform', uniform: 0 },
      border: {
        color: undefined,
        width: { mode: 'uniform', uniform: 0 },
        style: 'solid',
      },
      shadow: null,
    }),
  },
  {
    id: 'outline',
    name: 'Outline',
    description: 'Outlined boxes with hard edges',
    getProperties: (themeColors) => ({
      backgroundColor: themeColors.surface,
      backgroundColorOpacity: 1,
      borderRadius: { mode: 'uniform', uniform: 0 },
      border: {
        color: themeColors.accent,
        width: { mode: 'uniform', uniform: 1 },
        style: 'solid',
      },
      shadow: null,
    }),
  },
  {
    id: 'sharp',
    name: 'Sharp',
    description: 'Flat design with sharp edges',
    getProperties: (themeColors) => ({
      backgroundColor: themeColors.surface,
      backgroundColorOpacity: 1,
      borderRadius: { mode: 'uniform', uniform: 0 },
      border: {
        color: themeColors.border,
        width: { mode: 'uniform', uniform: 1 },
        style: 'solid',
      },
      shadow: {
        type: 'box',
        position: 'outside',
        color: '#000000',
        opacity: 0.05,
        x: 0,
        y: 1,
        blur: 4,
        spread: 0,
      },
    }),
  },
  {
    id: 'blocky',
    name: 'Blocky',
    description: 'Square cards with a 3D effect',
    getProperties: (themeColors) => ({
      backgroundColor: themeColors.surface,
      backgroundColorOpacity: 1,
      borderRadius: { mode: 'uniform', uniform: 0 },
      border: {
        color: themeColors.accent,
        width: {
          mode: 'individual',
          top: 0,
          right: 2,
          bottom: 2,
          left: 0,
        },
        style: 'solid',
      },
      shadow: null,
    }),
  },
  {
    id: 'glass',
    name: 'Glass',
    description: 'Soft and transparent',
    getProperties: (themeColors) => ({
      backgroundColor: themeColors.surface,
      backgroundColorOpacity: 0.8, // Slightly transparent for glass effect
      borderRadius: { mode: 'uniform', uniform: 8 },
      bgBlur: 10,
      shadow: {
        type: 'box',
        position: 'outside',
        color: '#000000',
        opacity: 0.05,
        x: 0,
        y: 2,
        blur: 8,
        spread: 0,
      },
    }),
  },
  {
    id: 'rounded',
    name: 'Rounded',
    description: 'Gentle, inviting corners',
    getProperties: (themeColors) => ({
      backgroundColor: themeColors.surface,
      backgroundColorOpacity: 1,
      borderRadius: { mode: 'uniform', uniform: 16 },
      border: {
        color: themeColors.border,
        width: { mode: 'uniform', uniform: 1 },
        style: 'solid',
      },
      shadow: {
        type: 'box',
        position: 'outside',
        color: '#000000',
        opacity: 0.08,
        x: 0,
        y: 2,
        blur: 6,
        spread: 0,
      },
    }),
  },
  {
    id: 'soft-cloud',
    name: 'Soft Cloud',
    description: 'Soft shadows with subtle contrast',
    getProperties: (themeColors) => ({
      backgroundColor: themeColors.surface,
      backgroundColorOpacity: 1,
      borderRadius: { mode: 'uniform', uniform: 20 },
      border: {
        color: undefined,
        width: { mode: 'uniform', uniform: 0 },
        style: 'solid',
      },
      shadow: {
        type: 'box',
        position: 'outside',
        color: '#000000',
        opacity: 0.06,
        x: 0,
        y: 4,
        blur: 12,
        spread: 0,
      },
    }),
  },
  {
    id: 'capsule',
    name: 'Capsule',
    description: 'Rounded corners with playful blocks',
    getProperties: (themeColors) => ({
      backgroundColor: themeColors.surface,
      backgroundColorOpacity: 1,
      borderRadius: { mode: 'uniform', uniform: 20 },
      border: {
        color: themeColors.accent,
        width: { mode: 'uniform', uniform: 2 },
        style: 'solid',
      },
      shadow: null,
    }),
  },
];

/**
 * Get a curated style by ID
 */
export function getCuratedStyle(id: string, themeColors: { accent: string; surface: string; border: string }): Partial<ThemeSpecificRowProps> | null {
  const style = curatedStyles.find(s => s.id === id);
  if (!style) return null;
  return style.getProperties(themeColors);
}

