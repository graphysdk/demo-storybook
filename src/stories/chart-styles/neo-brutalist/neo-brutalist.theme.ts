import { type FontTokenOverride, type ThemeOverrides } from '@graphysdk/react-renderer';

export const NB_COLORS = {
  background: '#0B0B0B', // page
  surface: '#171717', // sheets, radius 0
  body: '#F0F0F0', // primary text and the white series
  secondary: '#8A8A8A', // secondary text and the grey series
  acid: '#C8FF00', // the accent — data only
  acidDim: '#9AB800', // overflow series slot
  greyMid: '#4A4A4A', // muted series
  greyDeep: '#2E2E2E', // ghost series / remainder tracks
  chrome: '#333333', // grid rows + dashed frame; the engine has a single grid-line color token
  metaRule: '#3A3A3A', // dashed rule under the corner strip
} as const;

export const NB_FONT_FAMILY = {
  heading: '"Space Grotesk", Inter, sans-serif', // headings and engine text
  body: 'Inter, "Helvetica Neue", Arial, sans-serif', // the shared base
} as const;

export const NB_DONUT_RAMP = [
  NB_COLORS.acid,
  NB_COLORS.body,
  NB_COLORS.secondary,
  NB_COLORS.greyMid,
  NB_COLORS.greyDeep,
];

// Engine text is Space Grotesk 500.
const engineText: FontTokenOverride = {
  family: NB_FONT_FAMILY.heading,
  size: { value: 10, unit: 'px' },
  lineHeight: 1.4,
  weight: 500,
};

export const theme: ThemeOverrides = {
  textPrimary: NB_COLORS.body,
  textSecondary: NB_COLORS.secondary,
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  legendTextColor: NB_COLORS.body,
  fontFamilyDefault: NB_FONT_FAMILY.body,
  fontFamilyHeading: NB_FONT_FAMILY.heading,
  fontLegendLabel: engineText,
  fontPieLabel: `500 10px/14px ${NB_FONT_FAMILY.heading}`,
  fontSeriesLabel: `500 11px/14px ${NB_FONT_FAMILY.heading}`,
};
