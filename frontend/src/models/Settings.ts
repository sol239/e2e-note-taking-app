/**
 * Settings - Type definitions for global and block-level styling settings.
 * 
 * Provides configuration for heading margins, default fonts, and per-block styling.
 * Settings can be applied globally or overridden at the block level.
 */

/**
 * Global settings applied to all blocks unless overridden.
 */
export interface GlobalSettings {
  headingMargins: {
    h1: number; // margin bottom in pixels
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  cellMarginBottom: number; // margin bottom for all non-heading blocks
  defaultFontSize: number;
  defaultFontFamily: string;
}

/**
 * Block-level styling that can override global settings.
 */
export interface BlockStyling {
  /** Font size in pixels */
  fontSize?: number;
  /** Font family string */
  fontFamily?: string;
  /** Text color (hex) */
  textColor?: string;
  /** Background color (hex) */
  backgroundColor?: string;
  /** Border color (hex) */
  borderColor?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Padding in pixels */
  padding?: number;
}

/**
 * Block settings container.
 */
export interface BlockSettings {
  styling: BlockStyling;
}

// Default settings
export const defaultGlobalSettings: GlobalSettings = {
  headingMargins: {
    h1: 24,
    h2: 20,
    h3: 16,
    h4: 12,
    h5: 8,
    h6: 4,
  },
  cellMarginBottom: 12, // default margin bottom for all non-heading blocks
  defaultFontSize: 16,
  defaultFontFamily: 'Inter, system-ui, sans-serif',
};

export const defaultBlockStyling: BlockStyling = {
  fontSize: undefined, // use global default
  fontFamily: undefined, // use global default
  textColor: '#000000',
  backgroundColor: 'transparent',
  borderColor: 'transparent',
  borderWidth: 0,
  borderRadius: 0,
  padding: 0,
};