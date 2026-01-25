/**
 * Color Palette Definitions
 * Used for landing page styling - both in preview and widget
 */

export interface ColorPalette {
  id: string;
  name: string;
  nameAr: string;
  // Primary colors (buttons, CTAs, highlights)
  primary: string;
  primaryHover: string;
  primaryLight: string;
  // Accent colors (badges, icons, secondary elements)
  accent: string;
  accentLight: string;
  // Background gradients
  heroBgFrom: string;
  heroBgTo: string;
  ctaBgFrom: string;
  ctaBgTo: string;
  // Text on primary
  textOnPrimary: string;
  // Stats/numbers color
  statsColor: string;
}

export const COLOR_PALETTES: Record<string, ColorPalette> = {
  orange: {
    id: "orange",
    name: "Warm Orange",
    nameAr: "برتقالي دافئ",
    primary: "#f97316",
    primaryHover: "#ea580c",
    primaryLight: "#fed7aa",
    accent: "#c2410c",
    accentLight: "#ffedd5",
    heroBgFrom: "#fff7ed",
    heroBgTo: "#ffffff",
    ctaBgFrom: "#f97316",
    ctaBgTo: "#ea580c",
    textOnPrimary: "#ffffff",
    statsColor: "#ea580c",
  },
  blue: {
    id: "blue",
    name: "Ocean Blue",
    nameAr: "أزرق محيطي",
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primaryLight: "#bfdbfe",
    accent: "#1d4ed8",
    accentLight: "#dbeafe",
    heroBgFrom: "#eff6ff",
    heroBgTo: "#ffffff",
    ctaBgFrom: "#3b82f6",
    ctaBgTo: "#2563eb",
    textOnPrimary: "#ffffff",
    statsColor: "#2563eb",
  },
  green: {
    id: "green",
    name: "Fresh Green",
    nameAr: "أخضر منعش",
    primary: "#22c55e",
    primaryHover: "#16a34a",
    primaryLight: "#bbf7d0",
    accent: "#15803d",
    accentLight: "#dcfce7",
    heroBgFrom: "#f0fdf4",
    heroBgTo: "#ffffff",
    ctaBgFrom: "#22c55e",
    ctaBgTo: "#16a34a",
    textOnPrimary: "#ffffff",
    statsColor: "#16a34a",
  },
  purple: {
    id: "purple",
    name: "Royal Purple",
    nameAr: "بنفسجي ملكي",
    primary: "#a855f7",
    primaryHover: "#9333ea",
    primaryLight: "#e9d5ff",
    accent: "#7c3aed",
    accentLight: "#f3e8ff",
    heroBgFrom: "#faf5ff",
    heroBgTo: "#ffffff",
    ctaBgFrom: "#a855f7",
    ctaBgTo: "#9333ea",
    textOnPrimary: "#ffffff",
    statsColor: "#9333ea",
  },
  red: {
    id: "red",
    name: "Bold Red",
    nameAr: "أحمر جريء",
    primary: "#ef4444",
    primaryHover: "#dc2626",
    primaryLight: "#fecaca",
    accent: "#b91c1c",
    accentLight: "#fee2e2",
    heroBgFrom: "#fef2f2",
    heroBgTo: "#ffffff",
    ctaBgFrom: "#ef4444",
    ctaBgTo: "#dc2626",
    textOnPrimary: "#ffffff",
    statsColor: "#dc2626",
  },
  teal: {
    id: "teal",
    name: "Modern Teal",
    nameAr: "أزرق مخضر",
    primary: "#14b8a6",
    primaryHover: "#0d9488",
    primaryLight: "#99f6e4",
    accent: "#0f766e",
    accentLight: "#ccfbf1",
    heroBgFrom: "#f0fdfa",
    heroBgTo: "#ffffff",
    ctaBgFrom: "#14b8a6",
    ctaBgTo: "#0d9488",
    textOnPrimary: "#ffffff",
    statsColor: "#0d9488",
  },
  pink: {
    id: "pink",
    name: "Soft Pink",
    nameAr: "وردي ناعم",
    primary: "#ec4899",
    primaryHover: "#db2777",
    primaryLight: "#fbcfe8",
    accent: "#be185d",
    accentLight: "#fce7f3",
    heroBgFrom: "#fdf2f8",
    heroBgTo: "#ffffff",
    ctaBgFrom: "#ec4899",
    ctaBgTo: "#db2777",
    textOnPrimary: "#ffffff",
    statsColor: "#db2777",
  },
  gold: {
    id: "gold",
    name: "Luxury Gold",
    nameAr: "ذهبي فاخر",
    primary: "#eab308",
    primaryHover: "#ca8a04",
    primaryLight: "#fef08a",
    accent: "#a16207",
    accentLight: "#fef9c3",
    heroBgFrom: "#fefce8",
    heroBgTo: "#ffffff",
    ctaBgFrom: "#eab308",
    ctaBgTo: "#ca8a04",
    textOnPrimary: "#1f2937",
    statsColor: "#ca8a04",
  },
};

export const PALETTE_IDS = Object.keys(COLOR_PALETTES) as Array<keyof typeof COLOR_PALETTES>;

export function getPalette(id: string): ColorPalette {
  return COLOR_PALETTES[id] || COLOR_PALETTES.orange;
}
