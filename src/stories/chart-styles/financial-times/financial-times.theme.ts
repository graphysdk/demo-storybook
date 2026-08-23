import type { ThemeOverrides } from '@graphysdk/react-renderer';

export const FT_COLORS = {
  paper: '#FFF1E5', // FT Pink — the signature salmon paper
  claret: '#990F3D', // emphasised headline accent
  claretBar: '#A8324A', // the wine-red used for solid bars in the reference
  forecastBar: '#E2A6BB', // paler claret tint used for forecast/estimate bars
  oxford: '#0F5499', // FT Oxford blue — the counterpart series colour
  steel: '#5D7C95', // muted steel blue for primary stacked segments
  steelLight: '#C3DDF0', // pale blue for secondary stacked segments
  black: '#33302E', // primary text — headline lead-in, subtitle, axis titles
  slate: '#66605C', // secondary text — axis tick labels
  rule: '#E4D5C5', // warm rule shared by gridlines and panel borders on the salmon paper
} as const;

export const FT_FONT_FAMILY = {
  body: 'Figtree, "Helvetica Neue", Arial, sans-serif', // stand-in for FT Metric — body, UI, and chart headings
  display: '"Source Serif 4", Georgia, "Times New Roman", serif', // stand-in for FT Financier Display — the masthead
} as const;

export const FT_CLARET_RAMP = ['#990F3D', '#BE4B75', '#D486A3', '#E5B0C4', '#F2D4DE'];

export const theme: ThemeOverrides = {
  textPrimary: FT_COLORS.black,
  textSecondary: FT_COLORS.slate,
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  fontFamilyDefault: FT_FONT_FAMILY.body,
  fontFamilyHeading: FT_FONT_FAMILY.body,
};
