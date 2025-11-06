// Settings types and interfaces for the note-taking app

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

export interface BlockStyling {
  fontSize?: number; // in pixels
  fontFamily?: string;
  textColor?: string; // hex color
  backgroundColor?: string; // hex color
  borderColor?: string; // hex color
  borderWidth?: number; // in pixels
  borderRadius?: number; // in pixels
  padding?: number; // in pixels
}

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