import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer, type ThemeOverrides } from '@graphysdk/react-renderer';
import type { Data, RichTextContent, SpecInput } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

import layout from './chart-layout.module.css';

const FT = {
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
  figtree: 'Figtree, "Helvetica Neue", Arial, sans-serif', // stand-in for FT Metric
  serif: '"Source Serif 4", Georgia, "Times New Roman", serif', // stand-in for FT Financier Display
} as const;

const FT_CLARET_RAMP = ['#990F3D', '#BE4B75', '#D486A3', '#E5B0C4', '#F2D4DE'];

const theme: ThemeOverrides = {
  textPrimary: FT.black,
  textSecondary: FT.slate,
  gridLineColor: FT.rule,
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  fontFamilyDefault: FT.figtree,
  fontFamilyHeading: FT.figtree,
};

// Shared frame: FT Pink paper and headline spacing. Legends are opt-in per chart.
const createFinancialTimesConfig = (options: { legendPosition?: 'none' | 'top' | 'right' } = {}) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    appearance: { background: { type: 'solid', color: FT.paper } },
    layout: {
      padding: 32,
      gaps: { header: options.legendPosition === 'top' ? 24 : 64, topLegend: 32 },
    },
    panel: {
      border: {
        top: { isVisible: true, lineStyle: 'solid' },
        bottom: { isVisible: true, lineStyle: 'solid', lineWidth: 1.5 },
        left: { isVisible: false },
        right: { isVisible: false },
      },
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false } },
      y: { position: 'left', grid: { isVisible: true, lineStyle: 'solid' } },
    },
  });

const createFinancialTimesTitle = (
  segments: Array<{
    text: string;
    color?: string;
  }>
): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: segments.map(({ text, color }) => ({
        type: 'text',
        text,
        marks: [{ type: 'textStyle', attrs: { color: color ?? FT.black, fontFamily: FT.figtree, fontSize: '18px' } }],
      })),
    },
  ],
});

const meta: Meta = {
  title: 'Chart Styles/Financial Times',
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── CPM by quarter (bar, actual vs forecast) ────────────────────────────────
// The last quarter is a forecast, painted in the paler claret tint via a
// discrete colour scale keyed on the `type` column. One observation per quarter,
// so `geom.bar` uses identity positioning — the default 'dodge' would reserve an
// empty slot per type at every tick.
const cpmData: Data = {
  columns: [{ key: 'quarter' }, { key: 'cpm' }, { key: 'type' }],
  rows: [
    { quarter: "Q2 '24", cpm: 4, type: 'actual' },
    { quarter: "Q3 '24", cpm: 6.1, type: 'actual' },
    { quarter: "Q4 '24", cpm: 5.9, type: 'actual' },
    { quarter: "Q1 '25", cpm: 3.9, type: 'actual' },
    { quarter: "Q2 '25", cpm: 6.5, type: 'forecast' },
  ],
};

const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({ position: 'identity', params: { borderRadius: 0 } }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 10 }),
  scale.color.discrete({ domain: ['actual', 'forecast'], range: [FT.claretBar, FT.forecastBar] }),
  createFinancialTimesConfig(),
  config({
    content: {
      title: createFinancialTimesTitle([{ text: 'CPM' }, { text: ' set to climb past €6', color: FT.claret }]),
      isTitleVisible: true,
      subtitle: 'Cost per mille by quarter, €. Paler bars are forecasts',
      isSubtitleVisible: true,
    },
  })
);

// ─── Listings by segment (stacked bar) ───────────────────────────────────────
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
  geom.bar({ position: 'stack', params: { borderRadius: 0, borderColor: '#000', borderWidth: 1 } }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'International'], range: [FT.steel, FT.steelLight] }),
  createFinancialTimesConfig({ legendPosition: 'top' }),
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
    geom.line({ params: { lineWidth: 2.5, showFill: false } }),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['Product A', 'Product B'], range: [FT.oxford, FT.claret] }),
    createFinancialTimesConfig()
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    content: {
      title: createFinancialTimesTitle([
        { text: 'Product A', color: FT.oxford },
        { text: ' pulls ahead of ' },
        { text: 'Product B', color: FT.claret },
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
  config({
    content: {
      title: createFinancialTimesTitle([{ text: 'On value, the products tell different stories' }]),
      isTitleVisible: true,
    },
  })
);

// ─── Revenue by region (donut) ───────────────────────────────────────────────
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
    params: { borderRadius: 0, borderColor: FT.paper, borderWidth: 2 },
    dataLabels: {
      showDataLabels: true,
      format: 'percentage',
      showCategoryLabels: true,
      position: 'outside',
      justify: 'end',
      align: 'center',
    },
  }),
  coord.polar({ theta: 'y', innerRadius: 0.3 }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['North', 'East', 'Central', 'South', 'West'], range: FT_CLARET_RAMP }),
  createFinancialTimesConfig(),
  config({ layout: { gaps: { header: 24 } } }),
  config({
    content: {
      title: createFinancialTimesTitle([{ text: 'North', color: FT.claret }, { text: ' takes a quarter of revenue' }]),
      isTitleVisible: true,
      subtitle: 'Share of revenue by region',
      isSubtitleVisible: true,
    },
  })
);

// ─── Ad demand seasonality (rose / coxcomb) ──────────────────────────────────
// One wedge per month around a twelve-month clock; the radius carries the demand
// index. Golden-quarter months take the solid claret, the rest the pale tint —
// the same emphasis split the CPM chart uses for actual vs forecast. One
// observation per month, so `geom.bar` uses identity positioning.
const adDemandData: Data = {
  columns: [{ key: 'month' }, { key: 'demand' }, { key: 'period' }],
  rows: [
    { month: 'Jan', demand: 62, period: 'rest of year' },
    { month: 'Feb', demand: 58, period: 'rest of year' },
    { month: 'Mar', demand: 70, period: 'rest of year' },
    { month: 'Apr', demand: 74, period: 'rest of year' },
    { month: 'May', demand: 78, period: 'rest of year' },
    { month: 'Jun', demand: 72, period: 'rest of year' },
    { month: 'Jul', demand: 68, period: 'rest of year' },
    { month: 'Aug', demand: 71, period: 'rest of year' },
    { month: 'Sep', demand: 84, period: 'rest of year' },
    { month: 'Oct', demand: 96, period: 'golden quarter' },
    { month: 'Nov', demand: 132, period: 'golden quarter' },
    { month: 'Dec', demand: 141, period: 'golden quarter' },
  ],
};

const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({ position: 'identity', params: { borderRadius: 0, borderColor: FT.paper, borderWidth: 1, width: 1 } }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['golden quarter', 'rest of year'], range: [FT.claretBar, FT.forecastBar] }),
  createFinancialTimesConfig(),
  config({ layout: { gaps: { header: 24 } } }),
  config({
    content: {
      title: createFinancialTimesTitle([
        { text: 'Ad demand peaks in the ' },
        { text: 'golden quarter', color: FT.claret },
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
const targetProgressData: Data = {
  columns: [{ key: 'region' }, { key: 'status' }, { key: 'share' }],
  rows: [
    { region: 'North', status: 'achieved', share: 84 },
    { region: 'North', status: 'remaining', share: 16 },
    { region: 'East', status: 'achieved', share: 71 },
    { region: 'East', status: 'remaining', share: 29 },
    { region: 'Central', status: 'achieved', share: 65 },
    { region: 'Central', status: 'remaining', share: 35 },
    { region: 'South', status: 'achieved', share: 52 },
    { region: 'South', status: 'remaining', share: 48 },
    { region: 'West', status: 'achieved', share: 38 },
    { region: 'West', status: 'remaining', share: 62 },
  ],
};

const targetRacetrackSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'share', color: 'status' }),
  geom.bar({ position: 'stack', params: { width: 0.9, borderRadius: 0 } }),
  coord.polar({ theta: 'y', innerRadius: 0.25 }),
  scale.x.discrete({ domain: ['West', 'South', 'Central', 'East', 'North'] }),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['achieved', 'remaining'], range: [FT.claretBar, FT.rule] }),
  createFinancialTimesConfig(),
  config({ layout: { gaps: { header: 24 } } }),
  config({
    content: {
      title: createFinancialTimesTitle([
        { text: 'North', color: FT.claret },
        { text: ' closes in on its 2025 target' },
      ]),
      isTitleVisible: true,
      subtitle: 'Share of 2025 revenue target achieved, %. The pale track is the distance left',
      isSubtitleVisible: true,
    },
  })
);

// ─── Dashboard chrome ────────────────────────────────────────────────────────
// Each card is FT paper with the signature black accent tab; the chart below it
// paints the same paper, so tab and plot read as one surface.
const FinancialTimesChartCard = ({ data, spec, height }: { data: Data; spec: SpecInput; height: number }) => (
  <div style={{ background: FT.paper, height, display: 'flex', flexDirection: 'column' }}>
    <div style={{ width: 44, height: 4, background: FT.black, margin: '28px 0 0 32px', flexShrink: 0 }} />
    <div style={{ flex: 1, minHeight: 0 }}>
      <VizStoryGraphProvider data={data} theme="light" themeOverrides={theme} spec={spec}>
        <GraphRenderer sizing={{ mode: 'responsive' }} />
      </VizStoryGraphProvider>
    </div>
  </div>
);

export const Dashboard: Story = {
  name: 'Financial Times',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', padding: '56px 40px 64px', fontFamily: FT.figtree }}>
      <header style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ width: 64, height: 5, background: FT.black, margin: '0 auto 28px' }} />
        <h1 style={{ fontFamily: FT.serif, fontWeight: 700, fontSize: 52, color: '#1A1817', margin: 0 }}>
          Financial Times
        </h1>
        <p style={{ color: FT.slate, fontSize: 17, margin: '16px 0 0' }}>
          a Graphy chart theme · the chart is the story · built from a five-reference corpus
        </p>
      </header>
      <div style={{ maxWidth: 1500, margin: '0 auto', display: 'grid', gap: 28 }}>
        {/* Each band wraps on its own: the paired bands use auto-fit + minmax to drop
            to one column below ~1050px, and the trio steps 3 → 2 + 1 → 1 at the
            chartLayout breakpoints. The responsive GraphRenderer re-measures on each wrap. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 28 }}>
          <FinancialTimesChartCard data={cpmData} spec={cpmSpec} height={520} />
          <FinancialTimesChartCard data={listingsData} spec={listingsSpec} height={520} />
        </div>
        <div className={layout.trioContainer}>
          <div className={layout.trio} style={{ gap: 28 }}>
            <FinancialTimesChartCard data={productValueData} spec={productRaceSpec} height={400} />
            <FinancialTimesChartCard data={revenueByRegionData} spec={revenueDonutSpec} height={400} />
            <FinancialTimesChartCard data={productValueData} spec={productLegendSpec} height={400} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 28 }}>
          <FinancialTimesChartCard data={adDemandData} spec={seasonalityRoseSpec} height={520} />
          <FinancialTimesChartCard data={targetProgressData} spec={targetRacetrackSpec} height={520} />
        </div>
      </div>
    </div>
  ),
};
