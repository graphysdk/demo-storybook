import { type FontTokenOverride, type ThemeOverrides } from '@graphysdk/react-renderer';

export const INTL_COLORS = {
  surface: '#F4F4F4', // canvas behind the cards
  paper: '#FFFFFF', // card and chart background
  heading: '#000000', // headlines and the fig-plate top rule
  body: '#1A1A1A', // body text
  accent: '#D72B1C', // red, reserved for the key data point and headline key phrase
  ink: '#111111', // primary series colour and hairline baselines
  grey: '#8F8F8F', // axis, legend, and caption text; third series colour
  greyLight: '#C9C9C9', // fourth series colour
  greyDark: '#4A4A4A', // fifth series colour
  greyFaint: '#E3E3E3', // de-emphasised remainder fills
  gridLine: '#E9E9E9', // horizontal major grid
} as const;

export const INTL_FONT_FAMILY = {
  heading: "'Golos Text', 'Inter', sans-serif", // headlines
  body: "'Inter', 'Helvetica Neue', Arial, sans-serif", // everything else
} as const;

// Series palette in emphasis order: red only ever paints the key data point.
export const INTL_PALETTE = [
  INTL_COLORS.accent,
  INTL_COLORS.ink,
  INTL_COLORS.grey,
  INTL_COLORS.greyLight,
  INTL_COLORS.greyDark,
] as const;

// Axis, legend, and label text all share the same small Inter cut.
const smallCapsFont: FontTokenOverride = {
  family: INTL_FONT_FAMILY.body,
  size: { value: 10.5, unit: 'px' },
  lineHeight: 1.5,
  weight: 500,
};

export const theme: ThemeOverrides = {
  textPrimary: INTL_COLORS.body,
  textSecondary: INTL_COLORS.grey,
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  legendTextColor: INTL_COLORS.grey,
  fontFamilyDefault: INTL_FONT_FAMILY.body,
  fontFamilyHeading: INTL_FONT_FAMILY.heading,
  fontLegendLabel: smallCapsFont,
  fontPieLabel: `600 10.5px/1.4 ${INTL_FONT_FAMILY.body}`,
};
