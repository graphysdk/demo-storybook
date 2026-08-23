import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import { config, coord, createSpec, geom, mapping, pipe, scale, style, styles } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';
import { ChartStylesDashboard } from '../ChartStylesDashboard';

import { FT_CLARET_RAMP, FT_COLORS, FT_FONT_FAMILY, theme } from './financial-times.theme';
import { createFinancialTimesTitle, FinancialTimesFontsDecorator } from './financial-times.utils';
import { FinancialTimesChartCard } from './FinancialTimesCard';
import { FinancialTimesHeader } from './FinancialTimesHeader';

// Shared frame: FT Pink paper and headline spacing. Legends are opt-in per chart.
const createFinancialTimesConfig = (options: { legendPosition?: 'none' | 'top' | 'right' } = {}) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    layout: {
      padding: 32,
      gaps: { header: options.legendPosition === 'top' ? 24 : 64, topLegend: 32 },
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false } },
      y: { position: 'left', grid: { isVisible: true } },
    },
  });

// FT Pink paper, solid rules above and below the panel, and a solid grid.
const financialTimesChromeStyles = styles({
  defaults: [
    style.graph({ background: FT_COLORS.paper }),
    style.gridLine({ lineType: 'solid' }),
    style.tickLine({ color: FT_COLORS.rule }),
    style.panelBorder({ lineType: 'solid' }),
    style.panelBorder.bottom({ strokeWidth: 1.5 }),
    style.panelBorder.left({ strokeWidth: 0 }),
    style.panelBorder.right({ strokeWidth: 0 }),
  ],
});

// ─── CPM by quarter (bar, actual vs forecast) ────────────────────────────────
// The last quarter is a forecast, painted in the paler claret tint via a discrete
// colour scale keyed on the `type` column. One observation per quarter, so
// `geom.bar` uses identity positioning.
const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({ position: 'identity' }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 10 }),
  scale.color.discrete({ domain: ['actual', 'forecast'], range: [FT_COLORS.claretBar, FT_COLORS.forecastBar] }),
  createFinancialTimesConfig(),
  financialTimesChromeStyles,
  config({
    content: {
      title: createFinancialTimesTitle([{ text: 'CPM' }, { text: ' set to climb past €6', color: FT_COLORS.claret }]),
      isTitleVisible: true,
      subtitle: 'Cost per mille by quarter, €. Paler bars are forecasts',
      isSubtitleVisible: true,
    },
  })
);

// ─── Listings by segment (stacked bar) ───────────────────────────────────────
const listingsSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'listings', color: 'segment' }),
  geom.bar({ position: 'stack' }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: '#000', borderWidth: 1 })] }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'International'], range: [FT_COLORS.steel, FT_COLORS.steelLight] }),
  createFinancialTimesConfig({ legendPosition: 'top' }),
  financialTimesChromeStyles,
  config({
    legend: { position: 'top' },
    content: {
      title: createFinancialTimesTitle([{ text: 'Long-term decline in listed companies' }]),
      isTitleVisible: true,
      subtitle: 'Listings by segment',
      isSubtitleVisible: true,
    },
  })
);

// ─── Product value race (lines, direct end labels vs boxed legend) ───────────
// The same two series render twice: once with direct labels at the line
// endpoints, once with a boxed legend on top.
const createProductLineSpec = () =>
  pipe(
    createSpec(),
    mapping({ x: 'month', y: 'value', color: 'product' }),
    geom.line(),
    styles({ defaults: [style.geom.line({ strokeWidth: 2.5 })] }),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['Product A', 'Product B'], range: [FT_COLORS.oxford, FT_COLORS.claret] }),
    createFinancialTimesConfig(),
    financialTimesChromeStyles
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    content: {
      title: createFinancialTimesTitle([
        { text: 'Product A', color: FT_COLORS.oxford },
        { text: ' pulls ahead of ' },
        { text: 'Product B', color: FT_COLORS.claret },
      ]),
      isTitleVisible: true,
      subtitle: 'Monthly value by product',
      isSubtitleVisible: true,
    },
  })
);

const productLegendSpec = pipe(
  createProductLineSpec(),
  createFinancialTimesConfig({ legendPosition: 'top' }),
  financialTimesChromeStyles,
  config({
    content: {
      title: createFinancialTimesTitle([{ text: 'On value, the products tell different stories' }]),
      isTitleVisible: true,
    },
  })
);

// ─── Revenue by region (donut) ───────────────────────────────────────────────
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
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: FT_COLORS.paper, borderWidth: 2 })] }),
  coord.polar({ theta: 'y', innerRadius: 0.3 }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['North', 'East', 'Central', 'South', 'West'], range: FT_CLARET_RAMP }),
  createFinancialTimesConfig(),
  financialTimesChromeStyles,
  config({ layout: { gaps: { header: 24 } } }),
  config({
    content: {
      title: createFinancialTimesTitle([
        { text: 'North', color: FT_COLORS.claret },
        { text: ' takes a quarter of revenue' },
      ]),
      isTitleVisible: true,
      subtitle: 'Share of revenue by region',
      isSubtitleVisible: true,
    },
  })
);

// ─── Ad demand seasonality (rose / coxcomb) ──────────────────────────────────
// One wedge per month around a twelve-month clock; the radius carries the demand
// index. Golden-quarter months take the solid claret, the rest the pale tint —
// the same emphasis split the CPM chart uses for actual vs forecast.
const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({
    position: 'identity',
    params: { width: 1 },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: FT_COLORS.paper, borderWidth: 1 })] }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({
    domain: ['golden quarter', 'rest of year'],
    range: [FT_COLORS.claretBar, FT_COLORS.forecastBar],
  }),
  createFinancialTimesConfig(),
  financialTimesChromeStyles,
  config({ layout: { gaps: { header: 24 } } }),
  config({
    content: {
      title: createFinancialTimesTitle([
        { text: 'Ad demand peaks in the ' },
        { text: 'golden quarter', color: FT_COLORS.claret },
      ]),
      isTitleVisible: true,
      subtitle: 'Monthly ad demand index, 100 = 2024 average. Claret wedges mark October to December',
      isSubtitleVisible: true,
    },
  })
);

// ─── Progress toward 2025 targets (racetrack) ────────────────────────────────
// One concentric track per region; the claret arc sweeps the share of target
// achieved and the warm-rule remainder completes each ring, so every track reads
// against a full lap. Rings rank outward, best-performing region outermost.
const targetRacetrackSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'share', color: 'status' }),
  geom.bar({ position: 'stack', params: { width: 0.9 } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  coord.polar({ theta: 'y', innerRadius: 0.25 }),
  scale.x.discrete({ domain: ['West', 'South', 'Central', 'East', 'North'] }),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['achieved', 'remaining'], range: [FT_COLORS.claretBar, FT_COLORS.rule] }),
  createFinancialTimesConfig(),
  financialTimesChromeStyles,
  config({ layout: { gaps: { header: 24 } } }),
  config({
    content: {
      title: createFinancialTimesTitle([
        { text: 'North', color: FT_COLORS.claret },
        { text: ' closes in on its 2025 target' },
      ]),
      isTitleVisible: true,
      subtitle: 'Share of 2025 revenue target achieved, %. The pale track is the distance left',
      isSubtitleVisible: true,
    },
  })
);

const meta: Meta = {
  title: 'Chart Styles/Financial Times',
  decorators: [FinancialTimesFontsDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  name: 'Financial Times',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <ChartStylesDashboard
      background="#FFFFFF"
      fontFamily={FT_FONT_FAMILY.body}
      header={<FinancialTimesHeader />}
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
        <FinancialTimesChartCard {...card}>
          <VizStoryGraphProvider data={card.data} colorScheme="light" themeOverrides={theme} spec={card.spec}>
            <GraphRenderer sizing={{ mode: 'responsive' }} />
          </VizStoryGraphProvider>
        </FinancialTimesChartCard>
      )}
    />
  ),
};
