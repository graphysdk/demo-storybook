import type { ThemeOverrides } from '@graphysdk/react-renderer';

export const LENNY_COLORS = {
  actual: '#F8A24B',
  forecast: '#FCD9B8',
  card: '#FFF3EA',
  page: '#FBECE2',
  ink: '#322E2C',
  inkSecondary: '#97836E',
  gridLine: '#D6B29A',
} as const;

export const LENNY_FONT_FAMILY = {
  body: "'Plus Jakarta Sans', sans-serif",
} as const;

/** Autumn ramp for ranked charts: orange leads, gold second, browns fading to cream. */
export const AUTUMN_RAMP = ['#F5820D', '#F4B93F', '#AE9070', '#CBB499', '#E7DAC8'];

/** Full-strength brand orange — lines take full-strength hues only, and the title key phrase. */
export const BRAND_ORANGE = '#F5820D';

/** Muted warm tones for the radial charts: the strong orange leads, these recede behind it. */
export const ROSE_REST = '#CBB499';
export const TRACK_REMAINING = '#E7DAC8';

/** The follower line's warm brown — a mid-ramp tone that recedes behind the orange lead. */
export const LINE_FOLLOWER = '#AE9070';

export const themeOverrides: ThemeOverrides = {
  fontFamilyDefault: LENNY_FONT_FAMILY.body,
  fontFamilyHeading: LENNY_FONT_FAMILY.body,
  textPrimary: LENNY_COLORS.ink,
  textSecondary: LENNY_COLORS.inkSecondary,
  // Legend as plain dot + label, no pill chrome.
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
};
