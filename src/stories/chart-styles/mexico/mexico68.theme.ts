import type { FontTokenOverride, ThemeOverrides } from '@graphysdk/react-renderer';

export const MEXICO_FONT_FAMILY = {
  headings: "'Righteous', 'Rubik', sans-serif",
  body: "'Rubik', 'Helvetica Neue', Arial, sans-serif",
} as const;

// ─── Palette ─────────────────────────────────────────────────────────────────
// The Mexico 68 op-art palette: a hot magenta lead with orange, purple, cyan, and
// green running behind it. Ink is the one near-black, reserved for baselines and
// the values printed above each arch.
export const MEXICO_COLORS = {
  page: '#F4F1EA', // gallery white behind the cards
  card: '#FFFFFF', // card and chart background
  ink: '#1A1A1A', // baselines, printed values, echo halos
  pink: '#EC008C', // the lead — Actual, North, Product A
  orange: '#F7931E', // the "next colour" — Forecast, South
  purple: '#662D91', // East
  cyan: '#27AAE1', // West
  green: '#39B54A', // Central
  axisGrey: '#9A968C', // the quiet ground the vibration needs
} as const;

// Emphasis order: magenta leads, the rest radiate behind it.
export const MEXICO_PALETTE = [
  MEXICO_COLORS.pink,
  MEXICO_COLORS.orange,
  MEXICO_COLORS.purple,
  MEXICO_COLORS.cyan,
  MEXICO_COLORS.green,
] as const;

// Engine text is Rubik 500 12px; the printed value above each arch sits a touch
// heavier and larger — the one number you read off the vibration.
const engineFont: FontTokenOverride = {
  family: MEXICO_FONT_FAMILY.body,
  size: { value: 12, unit: 'px' },
  lineHeight: 1.4,
  weight: 500,
};

export const theme: ThemeOverrides = {
  textPrimary: MEXICO_COLORS.ink,
  textSecondary: MEXICO_COLORS.axisGrey,
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  legendTextColor: MEXICO_COLORS.ink,
  fontFamilyDefault: MEXICO_FONT_FAMILY.body,
  fontFamilyHeading: MEXICO_FONT_FAMILY.headings,
  fontLegendLabel: engineFont,
  fontPieLabel: `500 11px/1.4 ${MEXICO_FONT_FAMILY.body}`,
};
