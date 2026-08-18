import type { Meta, StoryObj } from '@storybook/react';

import { GraphProvider, GraphRenderer } from '@graphysdk/react-renderer';
import { config, coord, createSpec, geom, mapping, pipe, scale, style, styles } from '@graphysdk/viz-engine';

import { ChartStylesDashboard } from '../ChartStylesDashboard';

import { mexicoPlugins } from './mexico68.plugins';
import { MEXICO_COLORS, MEXICO_FONT_FAMILY, MEXICO_PALETTE, theme } from './mexico68.theme';
import { createMexicoTitle, MexicoFontsDecorator } from './mexico68.utils';
import { MexicoChartCard } from './Mexico68Card';
import { MexicoHeader } from './Mexico68Header';

const BAR_BAND_FRACTION = 0.5; // the arch takes 80% of the band

// Shared frame: white card, no grid, a single 2px ink baseline the arches rest on.
// The y axis stays visible in the quiet grey; it is zero-based everywhere.
const createMexicoConfig = (options: { legendPosition?: 'none' | 'top' | 'bottom' } = {}) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    layout: {
      padding: 32,
      gaps: { header: options.legendPosition === 'top' ? 24 : 40 },
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false }, ticks: { isVisible: false } },
      y: { position: 'left', grid: { isVisible: false } },
    },
  });

// The card paint: white ground with a single 2px ink baseline as the only border edge.
const mexicoChromeStyles = styles({
  defaults: [
    style.axisLabel({ fontSize: 12, fontWeight: 500, lineHeight: 1.4, textColor: MEXICO_COLORS.ink }),
    style.tickLabel({ fontSize: 12, fontWeight: 500, lineHeight: 1.4, textColor: MEXICO_COLORS.axisGrey }),
    // The printed value above each arch sits a touch heavier and larger, in ink.
    style.dataLabel({ fontSize: 13, fontWeight: 600, textColor: MEXICO_COLORS.ink }),
    style.graph({ background: MEXICO_COLORS.card }),
    style.tickLine({ color: 'transparent' }),
    style.panelBorder({ strokeWidth: 0 }),
    style.panelBorder.bottom({ lineType: 'solid', strokeWidth: 2, color: MEXICO_COLORS.ink }),
  ],
});

// Polar cards carry no cartesian baseline or y axis — the ring is its own ground.
const mexicoPolarConfig = config({ axes: { y: { isVisible: false } } });
const mexicoPolarStyles = styles({ defaults: [style.panelBorder.bottom({ strokeWidth: 0 })] });

// ─── CPM by quarter (arch bars, actual vs forecast) ──────────────────────────
// One arch per quarter with its value printed above. The actual quarters take the
// magenta; the forecast radiates in the next palette colour — orange.
const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({
    position: 'identity',
    params: { width: BAR_BAND_FRACTION },
    dataLabels: { showDataLabels: true, position: 'outside', justify: 'end', align: 'center' },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 8 }),
  scale.color.discrete({ domain: ['actual', 'forecast'], range: [MEXICO_COLORS.pink, MEXICO_COLORS.orange] }),
  createMexicoConfig({ legendPosition: 'top' }),
  mexicoChromeStyles,
  config({
    content: {
      title: createMexicoTitle([
        { text: 'CPM, € — actual vs ' },
        { text: 'forecast', color: MEXICO_COLORS.orange },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Cost per mille by quarter, €. The orange arch is the forecast.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Listings by segment (stacked arches) ────────────────────────────────────
const listingsSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'listings', color: 'segment' }),
  geom.bar({ position: 'stack', params: { width: BAR_BAND_FRACTION } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'International'], range: [MEXICO_COLORS.pink, MEXICO_COLORS.cyan] }),
  createMexicoConfig({ legendPosition: 'bottom' }),
  mexicoChromeStyles,
  config({
    content: {
      title: createMexicoTitle([
        { text: 'The long decline of ' },
        { text: 'listed companies', color: MEXICO_COLORS.pink },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Listings by segment.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Product value race (lines) ──────────────────────────────────────────────
// Two traces of parallel echoes, each radiating a ringed target at its terminus.
// Rendered twice: once with direct end labels, once keyed below.
const createProductLineSpec = () =>
  pipe(
    createSpec(),
    mapping({ x: 'month', y: 'value', color: 'product' }),
    geom.line(),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['Product A', 'Product B'], range: [MEXICO_COLORS.pink, MEXICO_COLORS.purple] }),
    createMexicoConfig()
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    content: {
      title: createMexicoTitle([
        { text: 'Product A', color: MEXICO_COLORS.pink },
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
  createMexicoConfig({ legendPosition: 'bottom' }),
  mexicoChromeStyles,
  config({
    content: {
      title: createMexicoTitle([
        { text: 'On value, the products tell ' },
        { text: 'different stories', color: MEXICO_COLORS.pink },
        { text: '.' },
      ]),
      isTitleVisible: true,
    },
  })
);

// ─── Revenue by region (donut) ───────────────────────────────────────────────
// Each region is one closed outline in its colour, with ink echoes fanning outward
// from the ring.
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
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  coord.polar({ theta: 'y', innerRadius: 0.55 }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['North', 'East', 'Central', 'South', 'West'], range: [...MEXICO_PALETTE] }),
  createMexicoConfig(),
  mexicoChromeStyles,
  mexicoPolarConfig,
  mexicoPolarStyles,
  config({
    content: {
      title: createMexicoTitle([
        { text: 'North', color: MEXICO_COLORS.pink },
        { text: ' takes a quarter of revenue.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Share of revenue by region, %.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Ad demand seasonality (rose / coxcomb) ──────────────────────────────────
// One wedge per month; the golden quarter takes the magenta, the rest run purple.
const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({ position: 'identity', params: { width: 1 } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({
    domain: ['golden quarter', 'rest of year'],
    range: [MEXICO_COLORS.pink, MEXICO_COLORS.purple],
  }),
  createMexicoConfig(),
  mexicoChromeStyles,
  mexicoPolarConfig,
  mexicoPolarStyles,
  config({
    content: {
      title: createMexicoTitle([
        { text: 'Ad demand peaks in the ' },
        { text: 'golden quarter', color: MEXICO_COLORS.pink },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Monthly ad demand index, 100 = 2024 average.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Progress toward 2025 targets (racetrack) ────────────────────────────────
// One concentric track per region; the magenta arc sweeps the share achieved and a
// quiet grey outline completes each lap. Rings rank outward, best region outermost.
const targetRacetrackSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'share', color: 'status' }),
  geom.bar({ position: 'stack', params: { width: 0.9 } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  coord.polar({ theta: 'y', innerRadius: 0.25 }),
  scale.x.discrete({ domain: ['West', 'South', 'Central', 'East', 'North'] }),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['achieved', 'remaining'], range: [MEXICO_COLORS.pink, MEXICO_COLORS.axisGrey] }),
  createMexicoConfig(),
  mexicoChromeStyles,
  mexicoPolarConfig,
  mexicoPolarStyles,
  config({
    content: {
      title: createMexicoTitle([
        { text: 'North', color: MEXICO_COLORS.pink },
        { text: ' closes in on its 2025 target.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Share of 2025 revenue target achieved, %.',
      isSubtitleVisible: true,
    },
  })
);

const meta: Meta = {
  title: 'Chart Styles/Mexico 68',
  parameters: {
    backgrounds: { default: 'light' },
    docs: {
      description: {
        component:
          'A single dashboard in the Mexico 68 house look: white cards on a gallery-white gallery, the op-art magenta-orange-purple-cyan-green palette, Righteous caps over Rubik engine text. The whole grammar is the echo — every mark is drawn as concentric outlines with no solid core. Bars radiate as arches, lines as parallel echoes with a ringed-target terminus, and donut slices as single outlines with ink echoes fanning outward. Rendered by custom geom renderers (mexicoBar / mexicoSlice / mexicoLine).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

meta.decorators = [MexicoFontsDecorator];

export const Dashboard: Story = {
  name: 'Mexico 68',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <ChartStylesDashboard
      background={MEXICO_COLORS.page}
      fontFamily={MEXICO_FONT_FAMILY.body}
      header={<MexicoHeader />}
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
        <MexicoChartCard {...card}>
          <GraphProvider
            input={card.spec}
            data={card.data}
            colorScheme="light"
            themeOverrides={theme}
            plugins={[...mexicoPlugins]}
          >
            <GraphRenderer sizing={{ mode: 'responsive' }} />
          </GraphProvider>
        </MexicoChartCard>
      )}
    />
  ),
};
