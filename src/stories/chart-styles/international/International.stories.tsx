import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import { config, coord, createSpec, geom, mapping, pipe, scale, style, styles } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';
import { ChartStylesDashboard } from '../ChartStylesDashboard';

import { INTL_COLORS, INTL_FONT_FAMILY, INTL_PALETTE, theme } from './international.theme';
import { createInternationalTitle, InternationalFontsDecorator } from './international.utils';
import { InternationalChartCard } from './InternationalCard';
import { InternationalHeader } from './InternationalHeader';

const BAR_BAND_FRACTION = 0.66;
const LINE_WIDTH = 1.75;
const LINE_DOT_SIZE = 6.5;

// Shared frame: white paper, horizontal major grid only, and a single solid bottom
// border as the axis baseline.
const createInternationalConfig = (options: { legendPosition?: 'none' | 'top' | 'bottom' } = {}) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    layout: {
      padding: 32,
      gaps: { header: options.legendPosition === 'top' ? 24 : 40 },
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false }, ticks: { isVisible: false } },
      y: { position: 'left', grid: { isVisible: true } },
    },
  });

// White paper, a solid horizontal grid, and a single solid bottom border as the axis baseline.
const internationalChromeStyles = styles({
  defaults: [
    style.axisLabel({ fontSize: 10.5, fontWeight: 500, lineHeight: 1.5, textColor: INTL_COLORS.body }),
    style.tickLabel({ fontSize: 10.5, fontWeight: 500, lineHeight: 1.5, textColor: INTL_COLORS.grey }),
    style.dataLabel({ fontSize: 10.5, fontWeight: 500, textColor: INTL_COLORS.body }),

    style.graph({ background: INTL_COLORS.paper }),
    style.gridLine({ lineType: 'solid', strokeWidth: 1 }),
    style.tickLine({ color: INTL_COLORS.gridLine }),
    style.panelBorder({ strokeWidth: 0 }),
    style.panelBorder.bottom({ lineType: 'solid', strokeWidth: 1 }),
  ],
});

// ─── CPM by quarter (bar, actual vs forecast) ────────────────────────────────
// Actual quarters take the ink; the red is spent on the single forecast bar.
const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({ position: 'identity', params: { width: BAR_BAND_FRACTION } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 8 }),
  scale.color.discrete({ domain: ['actual', 'forecast'], range: [INTL_COLORS.ink, INTL_COLORS.accent] }),
  createInternationalConfig(),
  internationalChromeStyles,
  config({
    content: {
      title: createInternationalTitle([
        { text: 'CPM is set to climb past ' },
        { text: '€6', color: INTL_COLORS.accent },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Cost per mille by quarter, €. The red bar is the forecast.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Listings by segment (stacked bar) ───────────────────────────────────────
const listingsSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'listings', color: 'segment' }),
  geom.bar({ position: 'stack', params: { width: BAR_BAND_FRACTION } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'International'], range: [INTL_COLORS.ink, INTL_COLORS.accent] }),
  createInternationalConfig({ legendPosition: 'bottom' }),
  internationalChromeStyles,
  config({
    content: {
      title: createInternationalTitle([
        { text: 'The long decline of ' },
        { text: 'listed companies', color: INTL_COLORS.accent },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Listings by segment.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Product value race (lines, direct end labels vs boxed legend) ───────────
// The same two series render twice: once with direct labels at the line endpoints,
// once with a legend below the plot. A companion point layer carries the dots the
// style puts on every vertex — it shares the line mapping, so both series dot.
const createProductLineSpec = () =>
  pipe(
    createSpec(),
    mapping({ x: 'month', y: 'value', color: 'product' }),
    geom.line(),
    geom.point({ interactive: false }),
    styles({ defaults: [style.geom.line({ strokeWidth: LINE_WIDTH }), style.geom.point({ size: LINE_DOT_SIZE })] }),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['Product A', 'Product B'], range: [INTL_COLORS.accent, INTL_COLORS.ink] }),
    createInternationalConfig()
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    content: {
      title: createInternationalTitle([
        { text: 'Product A', color: INTL_COLORS.accent },
        { text: ' pulls ahead of product B.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Monthly value by product.',
      isSubtitleVisible: true,
    },
  })
);

const productLegendSpec = pipe(
  createProductLineSpec(),
  createInternationalConfig({ legendPosition: 'bottom' }),
  internationalChromeStyles,
  config({
    content: {
      title: createInternationalTitle([
        { text: 'On value, the products tell ' },
        { text: 'different stories', color: INTL_COLORS.accent },
        { text: '.' },
      ]),
      isTitleVisible: true,
    },
  })
);

// ─── Revenue by region (donut) ───────────────────────────────────────────────
// Ring at 0.55 inner radius with a 2px white separation between wedges; the red is
// spent on the leader wedge, the rest run down the ink-and-grey palette.
const revenueDonutSpec = pipe(
  createSpec({ x: '', y: 'revenue', color: 'region' }),
  geom.bar({
    position: 'fill',
    dataLabels: {
      showDataLabels: true,
      format: 'percentage',
      showCategoryLabels: true,
      position: 'outside',
      justify: 'end',
      align: 'center',
    },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: INTL_COLORS.paper, borderWidth: 2 })] }),
  coord.polar({ theta: 'y', innerRadius: 0.55 }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['North', 'East', 'Central', 'South', 'West'], range: [...INTL_PALETTE] }),
  createInternationalConfig(),
  internationalChromeStyles,
  config({
    content: {
      title: createInternationalTitle([
        { text: 'North', color: INTL_COLORS.accent },
        { text: ' takes a quarter of revenue.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Share of revenue by region, %.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Ad demand seasonality (rose / coxcomb) ──────────────────────────────────
// One wedge per month around a twelve-month clock; the radius carries the demand
// index. The golden-quarter months take the red, the rest stay ink — the same
// emphasis split the CPM chart uses for actual vs forecast.
const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({
    position: 'identity',
    params: { width: 1 },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: INTL_COLORS.paper, borderWidth: 1 })] }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['golden quarter', 'rest of year'], range: [INTL_COLORS.accent, INTL_COLORS.ink] }),
  createInternationalConfig(),
  internationalChromeStyles,
  config({
    content: {
      title: createInternationalTitle([
        { text: 'Ad demand peaks in the ' },
        { text: 'golden quarter', color: INTL_COLORS.accent },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Monthly ad demand index, 100 = 2024 average. Red wedges mark October to December.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Progress toward 2025 targets (racetrack) ────────────────────────────────
// One concentric track per region; the ink arc sweeps the share of target achieved
// and the faint-grey remainder completes each lap. The red stays in the headline —
// no single arc is the key data point. Rings rank outward, best region outermost.
const targetRacetrackSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'share', color: 'status' }),
  geom.bar({ position: 'stack', params: { width: 0.9 } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  coord.polar({ theta: 'y', innerRadius: 0.25 }),
  scale.x.discrete({ domain: ['West', 'South', 'Central', 'East', 'North'] }),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['achieved', 'remaining'], range: [INTL_COLORS.ink, INTL_COLORS.greyFaint] }),
  createInternationalConfig(),
  internationalChromeStyles,
  config({
    content: {
      title: createInternationalTitle([
        { text: 'North', color: INTL_COLORS.accent },
        { text: ' closes in on its 2025 target.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Share of 2025 revenue target achieved, %. The faint track is the distance left.',
      isSubtitleVisible: true,
    },
  })
);

const meta: Meta = {
  title: 'Chart Styles/International',
  decorators: [InternationalFontsDecorator],
  parameters: {
    backgrounds: { default: 'light' },
    docs: {
      description: {
        component:
          'A single dashboard of charts in the International house look: white plates on a grey canvas, an ink-and-grey palette with one red accent reserved for the key data point, Golos Text headlines over Inter small caps, and a numbered fig plate under a 2px top rule. Every chart is engine config only — no custom geoms or plugins.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  name: 'International',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <ChartStylesDashboard
      background={INTL_COLORS.surface}
      fontFamily={INTL_FONT_FAMILY.body}
      header={<InternationalHeader />}
      specs={{
        cpm: cpmSpec,
        listings: listingsSpec,
        productRace: productRaceSpec,
        donut: revenueDonutSpec,
        productLegend: productLegendSpec,
        rose: seasonalityRoseSpec,
        racetrack: targetRacetrackSpec,
      }}
      renderCard={(card) => (
        <InternationalChartCard {...card}>
          <VizStoryGraphProvider data={card.data} colorScheme="light" themeOverrides={theme} spec={card.spec}>
            <GraphRenderer sizing={{ mode: 'responsive' }} />
          </VizStoryGraphProvider>
        </InternationalChartCard>
      )}
    />
  ),
};
