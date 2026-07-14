import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { type FontTokenOverride, GraphRenderer, type ThemeOverrides } from '@graphysdk/react-renderer';
import type { Data, RichTextContent, SpecInput } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

import layout from './chart-layout.module.css';

// Dieter Rams for data: a warm-grey desk, ink linework, and a single orange that
// is a reading — never a series. "Weniger, aber besser."
const BRAUN = {
  ink: '#1D1D1B', // bars, traces, dial etching, printed readings
  indicator: '#F07E13', // orange — one reading per chart, never a series
  trace2: '#8E8C86', // second line series
  structure: '#C9C6BE', // baseline rule and hairlines
  label: '#55534E', // dial and pie labels
  labelMuted: '#87857F', // tick labels, legend key text
  page: '#E3E1DB', // the desk
  panel: '#EFEDE8', // a chart plate
  // Donut ramp, darkest reads as the biggest slice.
  ramp: ['#A6A39B', '#B7B4AC', '#C8C5BD', '#D8D5CD'],
  archivo: "'Archivo', 'Inter', sans-serif",
} as const;

// A pill is 55% of the band and fully rounded; the trace is a 2px ink stroke.
const BAR_WIDTH = 0.55;
const LINE_WIDTH = 2;

// Ticks, axis titles, and legend keys share one 12px cut in the muted grey.
const tickFont: FontTokenOverride = {
  family: BRAUN.archivo,
  size: { value: 12, unit: 'px' },
  lineHeight: 1.4,
  weight: 500,
};

// Printed readings sit heavier and slightly larger — the one number you read off a dial.
const readingFont: FontTokenOverride = {
  family: BRAUN.archivo,
  size: { value: 13, unit: 'px' },
  lineHeight: 1.2,
  weight: 600,
};

const theme: ThemeOverrides = {
  textPrimary: BRAUN.ink,
  textSecondary: BRAUN.labelMuted,
  gridLineColor: BRAUN.structure,
  gridLineWidth: '1px',
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  legendTextColor: BRAUN.labelMuted,
  dataLabelTextColor: BRAUN.ink,
  dataLabelOutsideBackground: BRAUN.panel,
  fontFamilyDefault: BRAUN.archivo,
  fontFamilyHeading: BRAUN.archivo,
  fontTickLabel: tickFont,
  fontAxisLabel: tickFont,
  fontLegendLabel: tickFont,
  fontDataLabel: readingFont,
  fontSeriesLabel: `500 12px/1.4 ${BRAUN.archivo}`,
  fontPieLabel: `500 11.5px/1.4 ${BRAUN.archivo}`,
};

// Shared plate grammar: a warm panel with a single structure-grey baseline the
// geoms rest on. No y axis, no grid — the reading carries itself.
const createBraunConfig = (options: { legendPosition?: 'none' | 'top' | 'bottom' } = {}) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    appearance: { background: { type: 'solid', color: BRAUN.panel } },
    layout: {
      padding: 32,
      gaps: { header: options.legendPosition === 'top' ? 20 : 36 },
    },
    panel: {
      border: {
        top: { isVisible: false },
        bottom: { isVisible: true, lineStyle: 'solid', lineWidth: 1.2, color: BRAUN.structure },
        left: { isVisible: false },
        right: { isVisible: false },
      },
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false }, ticks: { isVisible: false } },
      y: { position: 'left', isVisible: false, grid: { isVisible: false } },
    },
  });

// Polar plates carry no cartesian baseline, so the bottom rule is suppressed.
const braunPolarConfig = config({
  panel: { border: { bottom: { isVisible: false } } },
});

// Chart title: Archivo 500 16px in ink. Rams-plain — it names the reading, no
// accent phrase, since orange belongs to the data.
const createBraunTitle = (text: string): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [
        {
          type: 'text',
          text,
          marks: [{ type: 'textStyle', attrs: { color: BRAUN.ink, fontFamily: BRAUN.archivo, fontSize: '16px' } }],
        },
      ],
    },
  ],
});

// ─── CPM by quarter (column, actual vs forecast) ─────────────────────────────
// Solid ink pills for the shipped quarters; the forecast is hollow — its fill
// maps to transparent while every pill carries an ink outline, invisible on the
// filled ones, a crisp 1.5px ring on the empty one. Readings print above each
// pill in the heavier cut. One observation per quarter, so `geom.bar` uses
// identity positioning.
const cpmData: Data = {
  columns: [{ key: 'quarter' }, { key: 'cpm' }, { key: 'type' }],
  rows: [
    { quarter: "Q2 '24", cpm: 4, type: 'Actual' },
    { quarter: "Q3 '24", cpm: 6.1, type: 'Actual' },
    { quarter: "Q4 '24", cpm: 5.9, type: 'Actual' },
    { quarter: "Q1 '25", cpm: 3.9, type: 'Actual' },
    { quarter: "Q2 '25", cpm: 6.5, type: 'Forecast' },
  ],
};

const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({
    position: 'identity',
    params: { width: BAR_WIDTH, borderRadius: 'full', borderColor: BRAUN.ink, borderWidth: 1.5 },
    dataLabels: { showDataLabels: true, position: 'outside', justify: 'end', align: 'center' },
  }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 8 }),
  scale.color.discrete({ domain: ['Actual', 'Forecast'], range: [BRAUN.ink, 'transparent'] }),
  createBraunConfig({ legendPosition: 'top' }),
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
const listingsData: Data = {
  columns: [{ key: 'year' }, { key: 'segment' }, { key: 'listings' }],
  rows: [
    { year: '2018', segment: 'UK', listings: 1180 },
    { year: '2018', segment: 'International', listings: 370 },
    { year: '2019', segment: 'UK', listings: 1140 },
    { year: '2019', segment: 'International', listings: 350 },
    { year: '2020', segment: 'UK', listings: 1090 },
    { year: '2020', segment: 'International', listings: 340 },
    { year: '2021', segment: 'UK', listings: 1060 },
    { year: '2021', segment: 'International', listings: 330 },
    { year: '2022', segment: 'UK', listings: 1000 },
    { year: '2022', segment: 'International', listings: 310 },
    { year: '2023', segment: 'UK', listings: 970 },
    { year: '2023', segment: 'International', listings: 300 },
    { year: '2024', segment: 'UK', listings: 930 },
    { year: '2024', segment: 'International', listings: 280 },
  ],
};

const listingsSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'listings', color: 'segment' }),
  geom.bar({
    position: 'stack',
    params: { width: BAR_WIDTH, borderRadius: 'full', borderColor: BRAUN.panel, borderWidth: 1.5 },
  }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'International'], range: [BRAUN.ink, BRAUN.ramp[1]] }),
  createBraunConfig({ legendPosition: 'top' }),
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
const productValueData: Data = {
  columns: [{ key: 'month' }, { key: 'product' }, { key: 'value' }],
  rows: [
    { month: 'Jan', product: 'Product A', value: 120 },
    { month: 'Jan', product: 'Product B', value: 105 },
    { month: 'Feb', product: 'Product A', value: 180 },
    { month: 'Feb', product: 'Product B', value: 115 },
    { month: 'Mar', product: 'Product A', value: 150 },
    { month: 'Mar', product: 'Product B', value: 140 },
    { month: 'Apr', product: 'Product A', value: 220 },
    { month: 'Apr', product: 'Product B', value: 130 },
    { month: 'May', product: 'Product A', value: 260 },
    { month: 'May', product: 'Product B', value: 170 },
    { month: 'Jun', product: 'Product A', value: 300 },
    { month: 'Jun', product: 'Product B', value: 205 },
  ],
};

const createProductLineSpec = () =>
  pipe(
    createSpec(),
    mapping({ x: 'month', y: 'value', color: 'product' }),
    geom.line({ params: { lineWidth: LINE_WIDTH, showFill: false } }),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['Product A', 'Product B'], range: [BRAUN.ink, BRAUN.trace2] }),
    createBraunConfig()
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
const revenueByRegionData: Data = {
  columns: [{ key: 'region' }, { key: 'revenue' }],
  rows: [
    { region: 'North', revenue: 26 },
    { region: 'East', revenue: 21 },
    { region: 'Central', revenue: 20 },
    { region: 'South', revenue: 17 },
    { region: 'West', revenue: 16 },
  ],
};

const revenueDonutSpec = pipe(
  createSpec({ x: '', y: 'revenue', color: 'region' }),
  geom.bar({
    position: 'fill',
    params: { borderRadius: 0, borderColor: BRAUN.panel, borderWidth: 2 },
    dataLabels: {
      showDataLabels: true,
      format: 'percentage',
      showCategoryLabels: true,
      position: 'outside',
      justify: 'end',
      align: 'center',
    },
  }),
  coord.polar({ theta: 'y', innerRadius: 0.55 }),
  scale.x(),
  scale.y(),
  scale.color.discrete({
    domain: ['North', 'East', 'Central', 'South', 'West'],
    range: [BRAUN.indicator, ...BRAUN.ramp],
  }),
  createBraunConfig(),
  braunPolarConfig,
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
// into a light warm grey. One observation per month, so `geom.bar` uses identity
// positioning.
const adDemandData: Data = {
  columns: [{ key: 'month' }, { key: 'demand' }, { key: 'period' }],
  rows: [
    { month: 'Jan', demand: 62, period: 'Rest of year' },
    { month: 'Feb', demand: 58, period: 'Rest of year' },
    { month: 'Mar', demand: 70, period: 'Rest of year' },
    { month: 'Apr', demand: 74, period: 'Rest of year' },
    { month: 'May', demand: 78, period: 'Rest of year' },
    { month: 'Jun', demand: 72, period: 'Rest of year' },
    { month: 'Jul', demand: 68, period: 'Rest of year' },
    { month: 'Aug', demand: 71, period: 'Rest of year' },
    { month: 'Sep', demand: 84, period: 'Rest of year' },
    { month: 'Oct', demand: 96, period: 'Golden quarter' },
    { month: 'Nov', demand: 132, period: 'Golden quarter' },
    { month: 'Dec', demand: 141, period: 'Golden quarter' },
  ],
};

const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({ position: 'identity', params: { borderRadius: 0, borderColor: BRAUN.panel, borderWidth: 1, width: 1 } }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['Golden quarter', 'Rest of year'], range: [BRAUN.ink, BRAUN.structure] }),
  createBraunConfig(),
  braunPolarConfig,
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
const targetProgressData: Data = {
  columns: [{ key: 'region' }, { key: 'status' }, { key: 'share' }],
  rows: [
    { region: 'North', status: 'Achieved', share: 84 },
    { region: 'North', status: 'Remaining', share: 16 },
    { region: 'East', status: 'Achieved', share: 71 },
    { region: 'East', status: 'Remaining', share: 29 },
    { region: 'Central', status: 'Achieved', share: 65 },
    { region: 'Central', status: 'Remaining', share: 35 },
    { region: 'South', status: 'Achieved', share: 52 },
    { region: 'South', status: 'Remaining', share: 48 },
    { region: 'West', status: 'Achieved', share: 38 },
    { region: 'West', status: 'Remaining', share: 62 },
  ],
};

const targetRacetrackSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'share', color: 'status' }),
  geom.bar({ position: 'stack', params: { width: 0.9, borderRadius: 0 } }),
  coord.polar({ theta: 'y', innerRadius: 0.25 }),
  scale.x.discrete({ domain: ['West', 'South', 'Central', 'East', 'North'] }),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['Achieved', 'Remaining'], range: [BRAUN.ink, BRAUN.ramp[3]] }),
  createBraunConfig(),
  braunPolarConfig,
  config({
    content: {
      title: createBraunTitle('Share of 2025 target achieved'),
      isTitleVisible: true,
      subtitle: 'Share of 2025 revenue target achieved, %. The faint track is the distance left',
      isSubtitleVisible: true,
    },
  })
);

// ─── Dashboard chrome ────────────────────────────────────────────────────────
// Archivo everywhere. Space Grotesk-style engine text loads globally; this
// stylesheet link scopes Archivo to these stories.
const BraunFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap"
    />
    <Story />
  </>
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

// Each plate is a warm panel with a quiet caption above it on the desk.
const BraunChartCard = ({
  data,
  spec,
  height,
  caption,
}: {
  data: Data;
  spec: SpecInput;
  height: number;
  caption: string;
}) => (
  <figure style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
    <figcaption
      style={{
        margin: '0 4px 12px',
        fontFamily: BRAUN.archivo,
        fontWeight: 500,
        fontSize: 12.5,
        letterSpacing: '0.01em',
        color: BRAUN.labelMuted,
      }}
    >
      {caption}
    </figcaption>
    <div style={{ background: BRAUN.panel, borderRadius: 12, height, overflow: 'hidden' }}>
      <VizStoryGraphProvider data={data} theme="light" themeOverrides={theme} spec={spec}>
        <GraphRenderer sizing={{ mode: 'responsive' }} />
      </VizStoryGraphProvider>
    </div>
  </figure>
);

export const Dashboard: Story = {
  name: 'Braun',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ minHeight: '100vh', background: BRAUN.page, padding: '56px 40px 64px', fontFamily: BRAUN.archivo }}>
      <header style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ width: 40, height: 8, borderRadius: 4, background: BRAUN.indicator, margin: '0 auto 28px' }} />
        <h1 style={{ fontFamily: BRAUN.archivo, fontWeight: 700, fontSize: 48, color: BRAUN.ink, margin: 0 }}>Braun</h1>
        <p style={{ color: BRAUN.labelMuted, fontSize: 16, margin: '16px 0 0' }}>
          a Graphy chart theme · warm greys, ink, and one orange reading · engine config only
        </p>
      </header>
      <div style={{ maxWidth: 1500, margin: '0 auto', display: 'grid', gap: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 40 }}>
          <BraunChartCard
            data={cpmData}
            spec={cpmSpec}
            height={520}
            caption="Fig. 02 — Column · solid actual, hollow forecast, printed reading"
          />
          <BraunChartCard
            data={listingsData}
            spec={listingsSpec}
            height={520}
            caption="Fig. 03 — Stacked column · ink and warm grey"
          />
        </div>
        <div className={layout.trioContainer}>
          <div className={layout.trio} style={{ gap: 40 }}>
            <BraunChartCard
              data={productValueData}
              spec={productRaceSpec}
              height={400}
              caption="Fig. 04 — Line · ink and grey traces, end labels"
            />
            <BraunChartCard
              data={revenueByRegionData}
              spec={revenueDonutSpec}
              height={400}
              caption="Fig. 05 — Donut · orange leader, grey ramp"
            />
            <BraunChartCard
              data={productValueData}
              spec={productLegendSpec}
              height={400}
              caption="Fig. 06 — Line · keyed below"
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 40 }}>
          <BraunChartCard
            data={adDemandData}
            spec={seasonalityRoseSpec}
            height={520}
            caption="Fig. 07 — Rose · demand clock, golden quarter in ink"
          />
          <BraunChartCard
            data={targetProgressData}
            spec={targetRacetrackSpec}
            height={520}
            caption="Fig. 08 — Racetrack · share of 2025 target"
          />
        </div>
      </div>
    </div>
  ),
};
