import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import { config, coord, createSpec, geom, mapping, pipe, scale, style, styles } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';
import { ChartStylesDashboard } from '../ChartStylesDashboard';

import {
  AUTUMN_RAMP,
  BRAND_ORANGE,
  LENNY_COLORS,
  LENNY_FONT_FAMILY,
  LINE_FOLLOWER,
  ROSE_REST,
  themeOverrides,
  TRACK_REMAINING,
} from './lennys-newsletter.theme';
import { createLennyTitle, NewsletterFontsDecorator } from './lennys-newsletter.utils';
import { LennyChartCard } from './LennysNewsletterCard';
import { LennyPageHeader } from './LennysNewsletterHeader';

/** Shared card chrome, applied through the spec: cream ground, radius 28 with a hairline ink outline. */
const cardAppearance = { textScale: 1.2 } as const;
const cardChromeStyles = styles({
  defaults: [
    style.graph({ background: LENNY_COLORS.card, borderColor: LENNY_COLORS.ink, borderWidth: 1, borderRadius: 28 }),
    style.tickLabel({ fontWeight: 600, textColor: LENNY_COLORS.inkSecondary }),
    // Value labels as plain bold ink — inside ones included, over the built-in inside white —
    // and no plate behind outside ones.
    style.dataLabel({ fontSize: 13, fontWeight: 700, textColor: LENNY_COLORS.ink }),
    style.dataLabel.observation.outside({ background: 'transparent' }),
  ],
});

// A cartesian plate: a single 2px ink baseline, a solid horizontal grid, no side rules.
const cartesianPanel = {
  axes: {
    x: { ticks: { isVisible: false } },
    y: { position: 'left' },
  },
} as const;
const cartesianPlateStyles = styles({
  defaults: [
    style.gridLine({ lineType: 'solid' }),
    style.tickLine({ color: LENNY_COLORS.gridLine }),
    style.panelBorder({ strokeWidth: 0 }),
    style.panelBorder.bottom({ lineType: 'solid', strokeWidth: 2, color: LENNY_COLORS.ink }),
  ],
});

// A polar plate: no baseline, no grid — the ring is its own ground.
const polarPanel = {
  axes: {
    x: { ticks: { isVisible: false } },
    y: { ticks: { isVisible: false }, grid: { isVisible: false } },
  },
} as const;
const polarPlateStyles = styles({ defaults: [style.panelBorder({ strokeWidth: 0 })] });

// ─── CPM by quarter (columns, actual vs forecast) ────────────────────────────
const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({ position: 'identity', dataLabels: { showDataLabels: true, position: 'outside', offset: 8 } }),
  // Wider gaps between bars for slim columns.
  scale.x({ padding: 0.45 }),
  scale.y.continuous({ domainMax: 10 }),
  scale.color.discrete({ domain: ['actual', 'forecast'], range: [LENNY_COLORS.actual, LENNY_COLORS.forecast] }),
  config({
    content: {
      title: createLennyTitle([
        { text: 'CPM is set to climb past ' },
        { text: '€6', color: BRAND_ORANGE },
        { text: '.' },
      ]),
      subtitle: 'Cost per mille by quarter, €. Paler bars are forecasts.',
    },
    legend: { position: 'bottom' },
    ...cartesianPanel,
    appearance: cardAppearance,
  }),
  cardChromeStyles,
  cartesianPlateStyles
);

// ─── Listings by segment (stacked decline) ───────────────────────────────────
// The dominant UK segment takes the orange; the smaller international segment
// recedes into the muted taupe. Card-coloured hairlines cut the stack into slabs.
const listingsSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'listings', color: 'segment' }),
  geom.bar({ position: 'stack' }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: LENNY_COLORS.card, borderWidth: 1 })] }),
  scale.x({ padding: 0.3 }),
  scale.y.continuous(),
  scale.color.discrete({ domain: ['UK', 'International'], range: [LENNY_COLORS.actual, ROSE_REST] }),
  config({
    content: {
      title: createLennyTitle([
        { text: 'The long decline of ' },
        { text: 'listed companies', color: BRAND_ORANGE },
        { text: '.' },
      ]),
      subtitle: 'Listings by segment.',
    },
    legend: { position: 'bottom' },
    ...cartesianPanel,
    appearance: cardAppearance,
  }),
  cardChromeStyles,
  cartesianPlateStyles
);

// ─── Product value race (lines, direct end labels vs legend) ─────────────────
// The lead series takes the full-strength orange, the follower the muted brown.
// The same spec renders twice: once with direct end labels, once keyed below.
const createProductLineSpec = () =>
  pipe(
    createSpec(),
    mapping({ x: 'month', y: 'value', color: 'product' }),
    geom.line(),
    styles({ defaults: [style.geom.line({ strokeWidth: 6 })] }),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['Product A', 'Product B'], range: [BRAND_ORANGE, LINE_FOLLOWER] }),
    config({ ...cartesianPanel, appearance: cardAppearance }),
    cardChromeStyles,
    cartesianPlateStyles
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    content: {
      title: createLennyTitle([{ text: 'Product A', color: BRAND_ORANGE }, { text: ' pulls ahead of product B.' }]),
      subtitle: 'Monthly value by product.',
    },
  })
);

const productLegendSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'bottom' },
    content: {
      title: createLennyTitle([
        { text: 'On value, the products tell ' },
        { text: 'different stories', color: BRAND_ORANGE },
        { text: '.' },
      ]),
    },
  })
);

// ─── Revenue by region (donut, autumn ramp) ──────────────────────────────────
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
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: LENNY_COLORS.card, borderWidth: 2 })] }),
  coord.polar({ theta: 'y', innerRadius: 0.55 }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['North', 'East', 'Central', 'South', 'West'], range: AUTUMN_RAMP }),
  config({
    content: {
      title: createLennyTitle([{ text: 'North', color: BRAND_ORANGE }, { text: ' takes a quarter of revenue.' }]),
      subtitle: 'Share of revenue by region, %.',
    },
    legend: { position: 'none' },
    ...polarPanel,
    appearance: cardAppearance,
  }),
  cardChromeStyles,
  polarPlateStyles
);

// ─── Ad demand seasonality (rose / coxcomb) ──────────────────────────────────
// One wedge per month around a twelve-month clock; the radius carries the demand
// index. The golden-quarter months take the full-strength orange, the rest of the
// year recedes into the muted taupe.
const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({
    position: 'identity',
    params: { width: 1 },
  }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none', borderColor: LENNY_COLORS.card, borderWidth: 1 })] }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['golden quarter', 'rest of year'], range: [BRAND_ORANGE, ROSE_REST] }),
  config({
    content: {
      title: createLennyTitle([
        { text: 'Ad demand peaks in the ' },
        { text: 'golden quarter', color: BRAND_ORANGE },
        { text: '.' },
      ]),
      subtitle: 'Monthly ad demand index, 100 = 2024 average. Orange wedges mark October to December.',
    },
    legend: { position: 'none' },
    ...polarPanel,
    appearance: cardAppearance,
  }),
  cardChromeStyles,
  polarPlateStyles
);

// ─── Progress toward 2025 targets (racetrack) ────────────────────────────────
// One concentric track per region; the orange arc sweeps the share of target
// achieved and the faint cream remainder completes each lap. Rings rank outward,
// best region outermost.
const targetRacetrackSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'share', color: 'status' }),
  geom.bar({ position: 'stack', params: { width: 0.9 } }),
  styles({ defaults: [style.geom.bar({ borderRadius: 'none' })] }),
  coord.polar({ theta: 'y', innerRadius: 0.25 }),
  scale.x.discrete({ domain: ['West', 'South', 'Central', 'East', 'North'] }),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['achieved', 'remaining'], range: [BRAND_ORANGE, TRACK_REMAINING] }),
  config({
    content: {
      title: createLennyTitle([{ text: 'North', color: BRAND_ORANGE }, { text: ' closes in on its 2025 target.' }]),
      subtitle: 'Share of 2025 revenue target achieved, %. The faint track is the distance left.',
    },
    legend: { position: 'none' },
    ...polarPanel,
    appearance: cardAppearance,
  }),
  cardChromeStyles,
  polarPlateStyles
);

const meta: Meta = {
  title: "Chart Styles/Lenny's Newsletter",
  decorators: [NewsletterFontsDecorator],
  parameters: {
    docs: {
      description: {
        component:
          'A single dashboard in the newsletter house look: cream cards with a hairline ink outline on a warm page, one full-strength orange leading a soft autumn ramp, Plus Jakarta Sans throughout, and a custom header slot carrying the title type ramp the theme can’t express. Every chart is engine config only — the card chrome and headline both come from the spec.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  name: "Lenny's Newsletter",
  parameters: { layout: 'fullscreen' },
  render: () => (
    <ChartStylesDashboard
      background={LENNY_COLORS.page}
      fontFamily={LENNY_FONT_FAMILY.body}
      header={<LennyPageHeader />}
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
        <LennyChartCard {...card}>
          <VizStoryGraphProvider data={card.data} spec={card.spec} themeOverrides={themeOverrides}>
            <GraphRenderer sizing={{ mode: 'responsive' }} />
          </VizStoryGraphProvider>
        </LennyChartCard>
      )}
    />
  ),
};
