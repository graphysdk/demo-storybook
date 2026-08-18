import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import { config, coord, createSpec, geom, mapping, pipe, scale, style, styles } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';
import { ChartStylesDashboard } from '../ChartStylesDashboard';

import { BRAUN_COLORS, BRAUN_FONT_FAMILY, BRAUN_RAMP, theme } from './braun.theme';
import { BraunFontsDecorator, createBraunTitle } from './braun.utils';
import { BraunChartCard } from './BraunCard';
import { BraunHeader } from './BraunHeader';

// A pill is 55% of the band and fully rounded.
const BAR_WIDTH = 0.55;

// Shared plate grammar: a warm panel with a single structure-grey baseline the
// geoms rest on. No y axis, no grid — the reading carries itself.
const createBraunConfig = (options: { legendPosition?: 'none' | 'top' | 'bottom' } = {}) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    layout: {
      padding: 32,
      gaps: { header: options.legendPosition === 'top' ? 20 : 36 },
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false }, ticks: { isVisible: false } },
      y: { position: 'left', isVisible: false, grid: { isVisible: false } },
    },
  });

// The plate paint: warm panel background, and a single structure-grey baseline as the only border edge.
const braunChromeStyles = styles({
  defaults: [
    style.axisLabel({ fontSize: 12, fontWeight: 500, lineHeight: 1.4, textColor: BRAUN_COLORS.ink }),
    style.tickLabel({ fontSize: 12, fontWeight: 500, lineHeight: 1.4, textColor: BRAUN_COLORS.labelMuted }),
    // Printed readings sit heavier and slightly larger — the one number you read off a dial.
    style.dataLabel({ fontSize: 13, fontWeight: 600, textColor: BRAUN_COLORS.ink }),
    // Outside readings sit on the plate colour, so they print without a visible pill.
    style.dataLabel.observation.outside({ background: BRAUN_COLORS.panel }),

    style.graph({ background: BRAUN_COLORS.panel }),
    style.panelBorder({ strokeWidth: 0 }),
    style.panelBorder.bottom({ lineType: 'solid', strokeWidth: 1.2, color: BRAUN_COLORS.structure }),
  ],
});

// Polar plates carry no cartesian baseline, so the bottom rule is suppressed.
const braunPolarStyles = styles({ defaults: [style.panelBorder.bottom({ strokeWidth: 0 })] });

// ─── CPM by quarter (column, actual vs forecast) ─────────────────────────────
// Solid ink pills for the shipped quarters; the forecast is hollow — its fill
// maps to transparent while every pill carries an ink outline, invisible on the
// filled ones, a crisp 1.5px ring on the empty one. Readings print above each
// pill in the heavier cut.
const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({
    position: 'identity',
    params: { width: BAR_WIDTH },
    dataLabels: { showDataLabels: true, position: 'outside', justify: 'end', align: 'center' },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'full', borderColor: BRAUN_COLORS.ink, borderWidth: 1.5 })] }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 8 }),
  scale.color.discrete({ domain: ['actual', 'forecast'], range: [BRAUN_COLORS.ink, 'transparent'] }),
  createBraunConfig({ legendPosition: 'top' }),
  braunChromeStyles,
  config({
    axes: { x: { label: 'Quarter' } },
    content: {
      title: createBraunTitle('CPM, € — actual vs forecast'),
      isTitleVisible: true,
      subtitle: 'Cost per mille by quarter, €. The hollow pill is a forecast',
      isSubtitleVisible: true,
    },
  })
);

// ─── Listings by segment (stacked column) ────────────────────────────────────
// Each year is one ink-and-grey pill; panel-coloured borders cut a hairline gap
// between the two segments.
const listingsSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'listings', color: 'segment' }),
  geom.bar({
    position: 'stack',
    params: { width: BAR_WIDTH },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'full', borderColor: BRAUN_COLORS.panel, borderWidth: 1.5 })] }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'International'], range: [BRAUN_COLORS.ink, BRAUN_RAMP[1]] }),
  createBraunConfig({ legendPosition: 'top' }),
  braunChromeStyles,
  config({
    axes: { x: { label: 'Year' } },
    content: {
      title: createBraunTitle('Listed companies by segment'),
      isTitleVisible: true,
      subtitle: 'Listings by segment, UK and international',
      isSubtitleVisible: true,
    },
  })
);

// ─── Product value race (lines, direct end labels vs boxed key) ──────────────
// The lead series takes the ink stroke, the follower the second-trace grey. The
// same spec renders twice: once with direct labels at the endpoints, once with a
// key below. No vertex dots — the trace is clean.
const createProductLineSpec = () =>
  pipe(
    createSpec(),
    mapping({ x: 'month', y: 'value', color: 'product' }),
    geom.line(),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['Product A', 'Product B'], range: [BRAUN_COLORS.ink, BRAUN_COLORS.trace2] }),
    createBraunConfig(),
    braunChromeStyles
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    axes: { x: { label: 'Month' } },
    content: {
      title: createBraunTitle('Monthly value by product'),
      isTitleVisible: true,
      subtitle: 'Monthly value by product, direct end labels',
      isSubtitleVisible: true,
    },
  })
);

const productLegendSpec = pipe(
  createProductLineSpec(),
  createBraunConfig({ legendPosition: 'bottom' }),
  braunChromeStyles,
  config({
    axes: { x: { label: 'Month' } },
    content: {
      title: createBraunTitle('Monthly value by product — keyed'),
      isTitleVisible: true,
      subtitle: 'Monthly value by product, key below',
      isSubtitleVisible: true,
    },
  })
);

// ─── Revenue by region (filled donut) ────────────────────────────────────────
// Ring at 0.55 inner radius. The leader wedge takes the orange — the one reading
// on this plate — and the rest run down the warm-grey ramp, darker for larger.
// Panel-coloured borders open a 2px gap between wedges.
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
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: BRAUN_COLORS.panel, borderWidth: 2 })] }),
  coord.polar({ theta: 'y', innerRadius: 0.55 }),
  scale.x(),
  scale.y(),
  scale.color.discrete({
    domain: ['North', 'East', 'Central', 'South', 'West'],
    range: [BRAUN_COLORS.indicator, ...BRAUN_RAMP],
  }),
  createBraunConfig(),
  braunChromeStyles,
  braunPolarStyles,
  config({
    content: {
      title: createBraunTitle('Revenue mix by region'),
      isTitleVisible: true,
      subtitle: 'Share of revenue by region. The leader wedge takes the orange',
      isSubtitleVisible: true,
    },
  })
);

// ─── Ad demand seasonality (rose / coxcomb) ──────────────────────────────────
// One wedge per month around a twelve-month clock; radius carries the demand
// index. The golden-quarter months etch in ink, the rest of the year settles
// into a light warm grey.
const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({
    position: 'identity',
    params: { width: 1 },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: BRAUN_COLORS.panel, borderWidth: 1 })] }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({
    domain: ['golden quarter', 'rest of year'],
    range: [BRAUN_COLORS.ink, BRAUN_COLORS.structure],
  }),
  createBraunConfig(),
  braunChromeStyles,
  braunPolarStyles,
  config({
    content: {
      title: createBraunTitle('Ad demand index by month'),
      isTitleVisible: true,
      subtitle: 'Monthly ad demand index. Ink wedges mark October to December',
      isSubtitleVisible: true,
    },
  })
);

// ─── Progress toward 2025 targets (racetrack) ────────────────────────────────
// One concentric track per region; the ink arc sweeps the share achieved and the
// faint warm-grey remainder completes each lap. Rings rank outward, best region
// outermost.
const targetRacetrackSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'share', color: 'status' }),
  geom.bar({ position: 'stack', params: { width: 0.9 } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  coord.polar({ theta: 'y', innerRadius: 0.25 }),
  scale.x.discrete({ domain: ['West', 'South', 'Central', 'East', 'North'] }),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['achieved', 'remaining'], range: [BRAUN_COLORS.ink, BRAUN_RAMP[3]] }),
  createBraunConfig(),
  braunChromeStyles,
  braunPolarStyles,
  config({
    content: {
      title: createBraunTitle('Share of 2025 target achieved'),
      isTitleVisible: true,
      subtitle: 'Share of 2025 revenue target achieved, %. The faint track is the distance left',
      isSubtitleVisible: true,
    },
  })
);

const meta: Meta = {
  title: 'Chart Styles/Braun',
  decorators: [BraunFontsDecorator],
  parameters: {
    backgrounds: { default: 'light' },
    docs: {
      description: {
        component:
          'A single dashboard in the Braun house look, Dieter Rams applied to data: a warm-grey desk of rounded plates, ink linework, Archivo throughout, and one orange reserved as a reading — the leader wedge — never a series. Pills rest on a single structure-grey baseline; forecasts read as hollow outlines; donuts run a warm-grey ramp. Every chart is engine config only — no custom geoms or plugins.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  name: 'Braun',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <ChartStylesDashboard
      background={BRAUN_COLORS.page}
      fontFamily={BRAUN_FONT_FAMILY.body}
      gap={40}
      header={<BraunHeader />}
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
        <BraunChartCard {...card}>
          <VizStoryGraphProvider data={card.data} colorScheme="light" themeOverrides={theme} spec={card.spec}>
            <GraphRenderer sizing={{ mode: 'responsive' }} />
          </VizStoryGraphProvider>
        </BraunChartCard>
      )}
    />
  ),
};
