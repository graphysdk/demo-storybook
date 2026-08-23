import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import { config, coord, createSpec, geom, mapping, pipe, scale, style, styles } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';
import { ChartStylesDashboard } from '../ChartStylesDashboard';

import { NB_COLORS, NB_DONUT_RAMP, NB_FONT_FAMILY, theme } from './neo-brutalist.theme';
import {
  createNeoBrutalistSubtitle,
  createNeoBrutalistTitle,
  nbSwatchSlots,
  NeoBrutalistFontsDecorator,
} from './neo-brutalist.utils';
import { NeoBrutalistChartCard } from './NeoBrutalistCard';
import { NeoBrutalistHeader } from './NeoBrutalistHeader';

// Shared container grammar: acid-free chrome on a #171717 sheet, framed by a
// square 1px dashed border. Cartesian bar charts trade the dashed bottom edge
// for a solid acid baseline the bars sit on.
const createNeoBrutalistConfig = (options: { legendPosition?: 'none' | 'top' | 'right' } = {}) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    layout: {
      padding: 32,
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false }, ticks: { isVisible: false } },
      y: { position: 'left', grid: { isVisible: true } },
    },
  });

// The sheet paint: square corners, chrome-grey dashed frame, solid grid.
const createNeoBrutalistStyles = (options: { hasAcidBaseline?: boolean } = {}) =>
  styles({
    defaults: [
      style.axisLabel({
        fontFamily: NB_FONT_FAMILY.heading,
        fontSize: 10,
        fontWeight: 500,
        lineHeight: 1.4,
        textColor: NB_COLORS.body,
      }),
      style.tickLabel({
        fontFamily: NB_FONT_FAMILY.heading,
        fontSize: 10,
        fontWeight: 500,
        lineHeight: 1.4,
        textColor: NB_COLORS.secondary,
      }),
      style.dataLabel({
        fontFamily: NB_FONT_FAMILY.heading,
        fontSize: 10,
        fontWeight: 500,
        textColor: NB_COLORS.body,
      }),
      style.graph({ background: NB_COLORS.surface, borderRadius: 0 }),
      style.gridLine({ lineType: 'solid', strokeWidth: 1 }),
      style.tickLine({ color: NB_COLORS.chrome }),
      style.panelBorder({ lineType: 'dashed', strokeWidth: 1, color: NB_COLORS.chrome, borderRadius: 0 }),
      ...(options.hasAcidBaseline === true
        ? [style.panelBorder.bottom({ lineType: 'solid', strokeWidth: 2, color: NB_COLORS.acid })]
        : []),
    ],
  });

// ─── CPM by quarter (bar, actual vs forecast) ────────────────────────────────
// The forecast bar is hollow: its fill maps to 'transparent' while every bar
// carries an acid border — invisible on the solid acid bars, a crisp outline on
// the empty one.
const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({
    position: 'identity',
    params: { width: 0.6 },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: NB_COLORS.acid, borderWidth: 1.5 })] }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 8 }),
  scale.color.discrete({ domain: ['actual', 'forecast'], range: [NB_COLORS.acid, 'transparent'] }),
  createNeoBrutalistConfig({ legendPosition: 'top' }),
  createNeoBrutalistStyles({ hasAcidBaseline: true }),
  config({
    content: {
      title: createNeoBrutalistTitle([{ text: 'CPM rips ' }, { text: 'past €6.', color: NB_COLORS.acid }]),
      isTitleVisible: true,
    },
  })
);

// ─── Listings by segment (stacked bar) ───────────────────────────────────────
const listingsSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'listings', color: 'segment' }),
  geom.bar({ position: 'stack' }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: NB_COLORS.surface, borderWidth: 1 })] }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'International'], range: [NB_COLORS.acid, NB_COLORS.greyMid] }),
  createNeoBrutalistConfig({ legendPosition: 'top' }),
  createNeoBrutalistStyles({ hasAcidBaseline: true }),
  config({
    content: {
      title: createNeoBrutalistTitle([
        { text: 'Long-term ' },
        { text: 'decline', color: NB_COLORS.acid },
        { text: ' in listings.' },
      ]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Listed companies by segment' }]),
      isSubtitleVisible: true,
    },
  })
);

// ─── Product value race (lines, direct end labels vs boxed legend) ───────────
// The lead series takes the acid 2.5px stroke, the follower the white 1.5px one:
// the mapped strokeWidth aesthetic is the cascade's data tier, scaled per product.
const createProductLineSpec = () =>
  pipe(
    createSpec(),
    mapping({ x: 'month', y: 'value', color: 'product', strokeWidth: 'product' }),
    geom.line(),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['Product A', 'Product B'], range: [NB_COLORS.acid, NB_COLORS.body] }),
    scale.strokeWidth.discrete({ domain: ['Product A', 'Product B'], range: [2.5, 1.5] }),
    createNeoBrutalistConfig(),
    createNeoBrutalistStyles()
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    content: {
      title: createNeoBrutalistTitle([{ text: 'Product A', color: NB_COLORS.acid }, { text: ' pulls ahead.' }]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Monthly value by product · index, Jan = 100' }]),
      isSubtitleVisible: true,
    },
  })
);

const productLegendSpec = pipe(
  createProductLineSpec(),
  createNeoBrutalistConfig({ legendPosition: 'top' }),
  createNeoBrutalistStyles(),
  config({
    content: {
      title: createNeoBrutalistTitle([{ text: 'Same data, ' }, { text: 'different stories.', color: NB_COLORS.acid }]),
      isTitleVisible: true,
    },
  })
);

// ─── Revenue by region (donut) ───────────────────────────────────────────────
// Ring at 0.55R; surface-colored borders cut the 3px gaps between wedges.
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
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: NB_COLORS.surface, borderWidth: 3 })] }),
  coord.polar({ theta: 'y', innerRadius: 0.55 }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['North', 'East', 'Central', 'South', 'West'], range: NB_DONUT_RAMP }),
  createNeoBrutalistConfig(),
  createNeoBrutalistStyles(),
  config({
    content: {
      title: createNeoBrutalistTitle([{ text: 'North', color: NB_COLORS.acid }, { text: ' takes a quarter.' }]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Share of revenue by region · %' }]),
      isSubtitleVisible: true,
    },
  })
);

// ─── Ad demand seasonality (rose / coxcomb) ──────────────────────────────────
// Twelve wedges around a demand clock; the golden quarter takes the acid, the rest
// of the year sinks into the deep grey.
const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({
    position: 'identity',
    params: { width: 1 },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: NB_COLORS.surface, borderWidth: 1 })] }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['golden quarter', 'rest of year'], range: [NB_COLORS.acid, NB_COLORS.greyDeep] }),
  createNeoBrutalistConfig(),
  createNeoBrutalistStyles(),
  config({
    content: {
      title: createNeoBrutalistTitle([
        { text: 'Demand peaks in the ' },
        { text: 'golden quarter.', color: NB_COLORS.acid },
      ]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Ad demand index, 100 = 2024 avg · acid = Oct-Dec' }]),
      isSubtitleVisible: true,
    },
  })
);

// ─── Progress toward 2025 targets (racetrack) ────────────────────────────────
// One concentric track per region; the acid arc sweeps the share achieved and the
// deep-grey remainder completes each lap. Best performer outermost.
const targetRacetrackSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'share', color: 'status' }),
  geom.bar({ position: 'stack', params: { width: 0.9 } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  coord.polar({ theta: 'y', innerRadius: 0.25 }),
  scale.x.discrete({ domain: ['West', 'South', 'Central', 'East', 'North'] }),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['achieved', 'remaining'], range: [NB_COLORS.acid, NB_COLORS.greyDeep] }),
  createNeoBrutalistConfig(),
  createNeoBrutalistStyles(),
  config({ layout: { gaps: { header: 20 } } }),
  config({
    content: {
      title: createNeoBrutalistTitle([{ text: 'North', color: NB_COLORS.acid }, { text: ' closes the gap.' }]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Share of 2025 target achieved · % · acid = achieved' }]),
      isSubtitleVisible: true,
    },
  })
);

const meta: Meta = {
  title: 'Chart Styles/Neo Brutalist',
  decorators: [NeoBrutalistFontsDecorator],
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'A single dashboard of charts in the Neo Brutalist look: near-black sheets with a hand-drawn acid border, dashed panel frames, Space Grotesk engine text, and #C8FF00 reserved for data. Every chart is plain viz-engine config — the forecast bar is a transparent fill behind an acid border, and the key chips are rich-text glyphs in the subtitle. Only the corner strip and the jagged border come from the card wrapper.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  name: 'Neo Brutalist',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <ChartStylesDashboard
      background={NB_COLORS.background}
      fontFamily={NB_FONT_FAMILY.body}
      header={<NeoBrutalistHeader />}
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
        <NeoBrutalistChartCard {...card}>
          <VizStoryGraphProvider data={card.data} colorScheme="dark" themeOverrides={theme} spec={card.spec}>
            <GraphRenderer
              sizing={{ mode: 'responsive' }}
              slots={card.key === 'cpm' || card.key === 'listings' ? nbSwatchSlots : undefined}
            />
          </VizStoryGraphProvider>
        </NeoBrutalistChartCard>
      )}
    />
  ),
};
