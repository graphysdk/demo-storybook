import { type FontTokenOverride, type ThemeOverrides } from '@graphysdk/react-renderer';

// Dieter Rams for data: a warm-grey desk, ink linework, and a single orange that
// is a reading — never a series. "Weniger, aber besser."
export const BRAUN_COLORS = {
  ink: '#1D1D1B', // bars, traces, dial etching, printed readings
  indicator: '#F07E13', // orange — one reading per chart, never a series
  trace2: '#8E8C86', // second line series
  structure: '#C9C6BE', // baseline rule and hairlines
  label: '#55534E', // dial and pie labels
  labelMuted: '#87857F', // tick labels, legend key text
  page: '#E3E1DB', // the desk
  panel: '#EFEDE8', // a chart plate
} as const;

// Donut ramp, darkest reads as the biggest slice.
export const BRAUN_RAMP = ['#A6A39B', '#B7B4AC', '#C8C5BD', '#D8D5CD'] as const;

// Rams runs one typeface for everything — headings and body alike.
export const BRAUN_FONT_FAMILY = {
  body: "'Archivo', 'Inter', sans-serif",
} as const;

// Ticks, axis labels and legend keys share one 12px cut in the muted grey.
const tickFont: FontTokenOverride = {
  family: BRAUN_FONT_FAMILY.body,
  size: { value: 12, unit: 'px' },
  lineHeight: 1.4,
  weight: 500,
};

export const theme: ThemeOverrides = {
  textPrimary: BRAUN_COLORS.ink,
  textSecondary: BRAUN_COLORS.labelMuted,
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  legendTextColor: BRAUN_COLORS.labelMuted,
  fontFamilyDefault: BRAUN_FONT_FAMILY.body,
  fontFamilyHeading: BRAUN_FONT_FAMILY.body,
  fontLegendLabel: tickFont,
  fontSeriesLabel: `500 12px/1.4 ${BRAUN_FONT_FAMILY.body}`,
  fontPieLabel: `500 11.5px/1.4 ${BRAUN_FONT_FAMILY.body}`,
};
