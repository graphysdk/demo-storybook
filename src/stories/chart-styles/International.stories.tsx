import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { type FontTokenOverride, GraphRenderer, type ThemeOverrides } from '@graphysdk/react-renderer';
import type { Data, RichTextContent, SpecInput } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

import layout from './chart-layout.module.css';

const INTL = {
  surface: '#F4F4F4', // canvas behind the cards
  paper: '#FFFFFF', // card and chart background
  heading: '#000000', // headlines and the fig-plate top rule
  body: '#1A1A1A', // body text
  accent: '#D72B1C', // red, reserved for the key data point and headline key phrase
  ink: '#111111', // primary series colour and hairline baselines
  grey: '#8F8F8F', // axis, legend, and caption text; third series colour
  greyLight: '#C9C9C9', // fourth series colour
  greyDark: '#4A4A4A', // fifth series colour
  greyFaint: '#E3E3E3', // de-emphasised remainder fills
  gridLine: '#E9E9E9', // horizontal major grid
  golos: "'Golos Text', 'Inter', sans-serif", // headings
  inter: "'Inter', 'Helvetica Neue', Arial, sans-serif", // everything else
} as const;

// Series palette in emphasis order: red only ever paints the key data point.
const INTL_PALETTE = [INTL.accent, INTL.ink, INTL.grey, INTL.greyLight, INTL.greyDark] as const;

const BAR_BAND_FRACTION = 0.66;
const LINE_WIDTH = 1.75;
const LINE_DOT_SIZE = 6.5;

// Axis, legend, and label text all share the same small Inter cut; uppercase comes
// from the data itself since the theme has no text-transform token.
const smallCapsFont: FontTokenOverride = {
  family: INTL.inter,
  size: { value: 10.5, unit: 'px' },
  lineHeight: 1.5,
  weight: 500,
};

const theme: ThemeOverrides = {
  textPrimary: INTL.body,
  textSecondary: INTL.grey,
  gridLineColor: INTL.gridLine,
  gridLineWidth: '1px',
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  legendTextColor: INTL.grey,
  fontFamilyDefault: INTL.inter,
  fontFamilyHeading: INTL.golos,
  fontTickLabel: smallCapsFont,
  fontAxisLabel: smallCapsFont,
  fontLegendLabel: smallCapsFont,
  fontDataLabel: smallCapsFont,
  fontPieLabel: `600 10.5px/1.4 ${INTL.inter}`,
};

// Shared frame: white paper, horizontal major grid only, and a single solid bottom
// border as the axis baseline.
const createInternationalConfig = (options: { legendPosition?: 'none' | 'top' | 'bottom' } = {}) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    appearance: { background: { type: 'solid', color: INTL.paper } },
    layout: {
      padding: 32,
      gaps: { header: options.legendPosition === 'top' ? 24 : 40 },
    },
    panel: {
      border: {
        top: { isVisible: false },
        bottom: { isVisible: true, lineStyle: 'solid', lineWidth: 1 },
        left: { isVisible: false },
        right: { isVisible: false },
      },
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false }, ticks: { isVisible: false } },
      y: { position: 'left', grid: { isVisible: true, lineStyle: 'solid', lineWidth: 1 } },
    },
  });

// Headline: Golos Text 700, sentence case with a full stop, key phrase in red.
const createInternationalTitle = (
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
        marks: [
          { type: 'textStyle', attrs: { color: color ?? INTL.heading, fontFamily: INTL.golos, fontSize: '20px' } },
        ],
      })),
    },
  ],
});

// Golos Text carries the headlines; Inter (the shared base) loads globally. React
// hoists this stylesheet link into <head> so the font is scoped to these stories.
const InternationalFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400..900&display=swap"
    />
    <Story />
  </>
);

const meta: Meta = {
  title: 'Chart Styles/International',
  decorators: [InternationalFontsDecorator],
  parameters: {
    backgrounds: { default: 'light' },
    docs: {
      description: {
        component:
          'A single dashboard of charts in the International house look: white plates on a grey canvas, an ink-and-grey palette with one red accent reserved for the key data point, Golos Text headlines over Inter small caps, and a numbered fig plate under a 2px top rule. Every chart is engine config only — the combo overlay and dotted lines are built-in layers (bar + line + point), no custom geoms or plugins.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Global retail composition (combo: stacked shares + growth line) ─────────
// The reference figure. Shares fill-stack on the primary axis, which formats its
// tick labels as percentages; the growth line and its dots ride a secondary
// right-hand axis via `yScaleType: 'secondary'`. The line and
// point layers remap colour to the constant `series` column so the legend carries
// all three entries from one discrete scale. Growth repeats on both channel rows of
// each year, so the line and point layers aggregate down to one observation per year;
// without it each year holds two identical growth observations and the tooltip lists
// the growth series twice.
const retailCompositionData: Data = {
  columns: [{ key: 'year' }, { key: 'channel' }, { key: 'share' }, { key: 'growth' }, { key: 'series' }],
  rows: [
    { year: '2024', channel: 'PHYSICAL RETAIL', share: 81, growth: 3.1, series: 'TOTAL GROWTH YOY' },
    { year: '2024', channel: 'DIGITAL RETAIL', share: 19, growth: 3.1, series: 'TOTAL GROWTH YOY' },
    { year: '2025', channel: 'PHYSICAL RETAIL', share: 79, growth: 3.4, series: 'TOTAL GROWTH YOY' },
    { year: '2025', channel: 'DIGITAL RETAIL', share: 21, growth: 3.4, series: 'TOTAL GROWTH YOY' },
    { year: '2026', channel: 'PHYSICAL RETAIL', share: 76, growth: 3.8, series: 'TOTAL GROWTH YOY' },
    { year: '2026', channel: 'DIGITAL RETAIL', share: 24, growth: 3.8, series: 'TOTAL GROWTH YOY' },
    { year: '2027', channel: 'PHYSICAL RETAIL', share: 74, growth: 4, series: 'TOTAL GROWTH YOY' },
    { year: '2027', channel: 'DIGITAL RETAIL', share: 26, growth: 4, series: 'TOTAL GROWTH YOY' },
    { year: '2028', channel: 'PHYSICAL RETAIL', share: 72, growth: 4.2, series: 'TOTAL GROWTH YOY' },
    { year: '2028', channel: 'DIGITAL RETAIL', share: 28, growth: 4.2, series: 'TOTAL GROWTH YOY' },
  ],
};

const retailCompositionSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'share', color: 'channel' }),
  geom.bar({ position: 'fill', params: { width: BAR_BAND_FRACTION, borderRadius: 0 } }),
  geom.line({
    transforms: [
      transform.aggregate({
        groupby: ['year', 'series'],
        operations: [{ op: 'mean', variableName: 'growth', as: 'growth' }],
      }),
    ],
    aes: { y: 'growth', color: 'series' },
    yScaleType: 'secondary',
    params: { lineWidth: LINE_WIDTH, showFill: false },
  }),
  geom.point({
    transforms: [
      transform.aggregate({
        groupby: ['year', 'series'],
        operations: [{ op: 'mean', variableName: 'growth', as: 'growth' }],
      }),
    ],
    aes: { y: 'growth', color: 'series' },
    yScaleType: 'secondary',
    params: { size: LINE_DOT_SIZE },
    interactive: false,
  }),
  scale.x(),
  scale.y(),
  scale.ySecondary.continuous({ domainMin: 2.5, domainMax: 5 }),
  scale.color.discrete({
    domain: ['PHYSICAL RETAIL', 'DIGITAL RETAIL', 'TOTAL GROWTH YOY'],
    range: [INTL.ink, INTL.accent, INTL.accent],
  }),
  createInternationalConfig({ legendPosition: 'bottom' }),
  config({
    axes: { ySecondary: { position: 'right', grid: { isVisible: false } } },
    content: {
      title: createInternationalTitle([
        { text: 'Physical retail cedes ground as ' },
        { text: 'digital channels expand', color: INTL.accent },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Share of channel (left) and total growth YoY (right, in red).',
      isSubtitleVisible: true,
    },
  })
);

// ─── CPM by quarter (bar, actual vs forecast) ────────────────────────────────
// Actual quarters take the ink; the red is spent on the single forecast bar. One
// observation per quarter, so `geom.bar` uses identity positioning.
const cpmData: Data = {
  columns: [{ key: 'quarter' }, { key: 'cpm' }, { key: 'type' }],
  rows: [
    { quarter: "Q2 '24", cpm: 4, type: 'ACTUAL' },
    { quarter: "Q3 '24", cpm: 6.1, type: 'ACTUAL' },
    { quarter: "Q4 '24", cpm: 5.9, type: 'ACTUAL' },
    { quarter: "Q1 '25", cpm: 3.9, type: 'ACTUAL' },
    { quarter: "Q2 '25", cpm: 6.5, type: 'FORECAST' },
  ],
};

const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({ position: 'identity', params: { width: BAR_BAND_FRACTION, borderRadius: 0 } }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 8 }),
  scale.color.discrete({ domain: ['ACTUAL', 'FORECAST'], range: [INTL.ink, INTL.accent] }),
  createInternationalConfig(),
  config({
    content: {
      title: createInternationalTitle([
        { text: 'CPM is set to climb past ' },
        { text: '€6', color: INTL.accent },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Cost per mille by quarter, €. The red bar is the forecast.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Listings by segment (stacked bar) ───────────────────────────────────────
const listingsData: Data = {
  columns: [{ key: 'year' }, { key: 'segment' }, { key: 'listings' }],
  rows: [
    { year: '2018', segment: 'UK', listings: 1180 },
    { year: '2018', segment: 'INTERNATIONAL', listings: 370 },
    { year: '2019', segment: 'UK', listings: 1140 },
    { year: '2019', segment: 'INTERNATIONAL', listings: 350 },
    { year: '2020', segment: 'UK', listings: 1090 },
    { year: '2020', segment: 'INTERNATIONAL', listings: 340 },
    { year: '2021', segment: 'UK', listings: 1060 },
    { year: '2021', segment: 'INTERNATIONAL', listings: 330 },
    { year: '2022', segment: 'UK', listings: 1000 },
    { year: '2022', segment: 'INTERNATIONAL', listings: 310 },
    { year: '2023', segment: 'UK', listings: 970 },
    { year: '2023', segment: 'INTERNATIONAL', listings: 300 },
    { year: '2024', segment: 'UK', listings: 930 },
    { year: '2024', segment: 'INTERNATIONAL', listings: 280 },
  ],
};

const listingsSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'listings', color: 'segment' }),
  geom.bar({ position: 'stack', params: { width: BAR_BAND_FRACTION, borderRadius: 0 } }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'INTERNATIONAL'], range: [INTL.ink, INTL.accent] }),
  createInternationalConfig({ legendPosition: 'bottom' }),
  config({
    content: {
      title: createInternationalTitle([
        { text: 'The long decline of ' },
        { text: 'listed companies', color: INTL.accent },
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
const productValueData: Data = {
  columns: [{ key: 'month' }, { key: 'product' }, { key: 'value' }],
  rows: [
    { month: 'JAN', product: 'PRODUCT A', value: 120 },
    { month: 'JAN', product: 'PRODUCT B', value: 105 },
    { month: 'FEB', product: 'PRODUCT A', value: 180 },
    { month: 'FEB', product: 'PRODUCT B', value: 115 },
    { month: 'MAR', product: 'PRODUCT A', value: 150 },
    { month: 'MAR', product: 'PRODUCT B', value: 140 },
    { month: 'APR', product: 'PRODUCT A', value: 220 },
    { month: 'APR', product: 'PRODUCT B', value: 130 },
    { month: 'MAY', product: 'PRODUCT A', value: 260 },
    { month: 'MAY', product: 'PRODUCT B', value: 170 },
    { month: 'JUN', product: 'PRODUCT A', value: 300 },
    { month: 'JUN', product: 'PRODUCT B', value: 205 },
  ],
};

const createProductLineSpec = () =>
  pipe(
    createSpec(),
    mapping({ x: 'month', y: 'value', color: 'product' }),
    geom.line({ params: { lineWidth: LINE_WIDTH, showFill: false } }),
    geom.point({ params: { size: LINE_DOT_SIZE }, interactive: false }),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['PRODUCT A', 'PRODUCT B'], range: [INTL.accent, INTL.ink] }),
    createInternationalConfig()
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    content: {
      title: createInternationalTitle([
        { text: 'Product A', color: INTL.accent },
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
  config({
    content: {
      title: createInternationalTitle([
        { text: 'On value, the products tell ' },
        { text: 'different stories', color: INTL.accent },
        { text: '.' },
      ]),
      isTitleVisible: true,
    },
  })
);

// ─── Revenue by region (donut) ───────────────────────────────────────────────
// Ring at 0.55 inner radius with a 2px white separation between wedges; the red is
// spent on the leader wedge, the rest run down the ink-and-grey palette.
const revenueByRegionData: Data = {
  columns: [{ key: 'region' }, { key: 'revenue' }],
  rows: [
    { region: 'NORTH', revenue: 26 },
    { region: 'EAST', revenue: 21 },
    { region: 'CENTRAL', revenue: 20 },
    { region: 'SOUTH', revenue: 17 },
    { region: 'WEST', revenue: 16 },
  ],
};

const revenueDonutSpec = pipe(
  createSpec({ x: '', y: 'revenue', color: 'region' }),
  geom.bar({
    position: 'fill',
    params: { borderRadius: 0, borderColor: INTL.paper, borderWidth: 2 },
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
  scale.color.discrete({ domain: ['NORTH', 'EAST', 'CENTRAL', 'SOUTH', 'WEST'], range: [...INTL_PALETTE] }),
  createInternationalConfig(),
  config({
    content: {
      title: createInternationalTitle([
        { text: 'North', color: INTL.accent },
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
// emphasis split the CPM chart uses for actual vs forecast. One observation per
// month, so `geom.bar` uses identity positioning.
const adDemandData: Data = {
  columns: [{ key: 'month' }, { key: 'demand' }, { key: 'period' }],
  rows: [
    { month: 'JAN', demand: 62, period: 'REST OF YEAR' },
    { month: 'FEB', demand: 58, period: 'REST OF YEAR' },
    { month: 'MAR', demand: 70, period: 'REST OF YEAR' },
    { month: 'APR', demand: 74, period: 'REST OF YEAR' },
    { month: 'MAY', demand: 78, period: 'REST OF YEAR' },
    { month: 'JUN', demand: 72, period: 'REST OF YEAR' },
    { month: 'JUL', demand: 68, period: 'REST OF YEAR' },
    { month: 'AUG', demand: 71, period: 'REST OF YEAR' },
    { month: 'SEP', demand: 84, period: 'REST OF YEAR' },
    { month: 'OCT', demand: 96, period: 'GOLDEN QUARTER' },
    { month: 'NOV', demand: 132, period: 'GOLDEN QUARTER' },
    { month: 'DEC', demand: 141, period: 'GOLDEN QUARTER' },
  ],
};

const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({ position: 'identity', params: { borderRadius: 0, borderColor: INTL.paper, borderWidth: 1, width: 1 } }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['GOLDEN QUARTER', 'REST OF YEAR'], range: [INTL.accent, INTL.ink] }),
  createInternationalConfig(),
  config({
    content: {
      title: createInternationalTitle([
        { text: 'Ad demand peaks in the ' },
        { text: 'golden quarter', color: INTL.accent },
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
const targetProgressData: Data = {
  columns: [{ key: 'region' }, { key: 'status' }, { key: 'share' }],
  rows: [
    { region: 'NORTH', status: 'ACHIEVED', share: 84 },
    { region: 'NORTH', status: 'REMAINING', share: 16 },
    { region: 'EAST', status: 'ACHIEVED', share: 71 },
    { region: 'EAST', status: 'REMAINING', share: 29 },
    { region: 'CENTRAL', status: 'ACHIEVED', share: 65 },
    { region: 'CENTRAL', status: 'REMAINING', share: 35 },
    { region: 'SOUTH', status: 'ACHIEVED', share: 52 },
    { region: 'SOUTH', status: 'REMAINING', share: 48 },
    { region: 'WEST', status: 'ACHIEVED', share: 38 },
    { region: 'WEST', status: 'REMAINING', share: 62 },
  ],
};

const targetRacetrackSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'share', color: 'status' }),
  geom.bar({ position: 'stack', params: { width: 0.9, borderRadius: 0 } }),
  coord.polar({ theta: 'y', innerRadius: 0.25 }),
  scale.x.discrete({ domain: ['WEST', 'SOUTH', 'CENTRAL', 'EAST', 'NORTH'] }),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['ACHIEVED', 'REMAINING'], range: [INTL.ink, INTL.greyFaint] }),
  createInternationalConfig(),
  config({
    content: {
      title: createInternationalTitle([
        { text: 'North', color: INTL.accent },
        { text: ' closes in on its 2025 target.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Share of 2025 revenue target achieved, %. The faint track is the distance left.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Dashboard chrome ────────────────────────────────────────────────────────
// Each card is a white plate opening with the fig plate: a 2px ink top rule over a
// numbered caption row. The chart below paints the same white, so plate and plot
// read as one surface.
const FIG_COUNT = 8;

const formatFigPage = (figIndex: number) =>
  `${String(figIndex).padStart(2, '0')} / ${String(FIG_COUNT).padStart(2, '0')}`;

const InternationalChartCard = ({
  data,
  spec,
  height,
  figLabel,
  figIndex,
}: {
  data: Data;
  spec: SpecInput;
  height: number;
  figLabel: string;
  figIndex: number;
}) => (
  <div style={{ background: INTL.paper, height, display: 'flex', flexDirection: 'column' }}>
    <div
      style={{
        margin: '24px 32px 0',
        borderTop: `2px solid ${INTL.heading}`,
        paddingTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        flexShrink: 0,
        fontFamily: INTL.inter,
        fontWeight: 600,
        fontSize: 9.5,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: INTL.grey,
      }}
    >
      <span>{figLabel}</span>
      <span>{formatFigPage(figIndex)}</span>
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>
      <VizStoryGraphProvider data={data} theme="light" themeOverrides={theme} spec={spec}>
        <GraphRenderer sizing={{ mode: 'responsive' }} />
      </VizStoryGraphProvider>
    </div>
  </div>
);

export const Dashboard: Story = {
  name: 'International',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ minHeight: '100vh', background: INTL.surface, padding: '56px 40px 64px', fontFamily: INTL.inter }}>
      <header style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ width: 64, height: 5, background: INTL.accent, margin: '0 auto 28px' }} />
        <h1 style={{ fontFamily: INTL.golos, fontWeight: 700, fontSize: 52, color: INTL.heading, margin: 0 }}>
          International
        </h1>
        <p style={{ color: INTL.grey, fontSize: 17, margin: '16px 0 0' }}>
          a Graphy chart theme · ink, grey, and one red accent · engine config only
        </p>
      </header>
      <div style={{ maxWidth: 1500, margin: '0 auto', display: 'grid', gap: 28 }}>
        <InternationalChartCard
          data={retailCompositionData}
          spec={retailCompositionSpec}
          height={560}
          figLabel="Fig. 01 / Global retail composition / 2024–2028"
          figIndex={1}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 28 }}>
          <InternationalChartCard
            data={cpmData}
            spec={cpmSpec}
            height={520}
            figLabel="Fig. 02 / Cost per mille / Q2 '24–Q2 '25"
            figIndex={2}
          />
          <InternationalChartCard
            data={listingsData}
            spec={listingsSpec}
            height={520}
            figLabel="Fig. 03 / Listed companies / 2018–2024"
            figIndex={3}
          />
        </div>
        <div className={layout.trioContainer}>
          <div className={layout.trio} style={{ gap: 28 }}>
            <InternationalChartCard
              data={productValueData}
              spec={productRaceSpec}
              height={400}
              figLabel="Fig. 04 / Product value race / Jan–Jun"
              figIndex={4}
            />
            <InternationalChartCard
              data={revenueByRegionData}
              spec={revenueDonutSpec}
              height={400}
              figLabel="Fig. 05 / Revenue by region / FY 2025"
              figIndex={5}
            />
            <InternationalChartCard
              data={productValueData}
              spec={productLegendSpec}
              height={400}
              figLabel="Fig. 06 / Product value / Jan–Jun"
              figIndex={6}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 28 }}>
          <InternationalChartCard
            data={adDemandData}
            spec={seasonalityRoseSpec}
            height={520}
            figLabel="Fig. 07 / Ad demand seasonality / 12 months"
            figIndex={7}
          />
          <InternationalChartCard
            data={targetProgressData}
            spec={targetRacetrackSpec}
            height={520}
            figLabel="Fig. 08 / 2025 target progress / H1 2025"
            figIndex={8}
          />
        </div>
      </div>
    </div>
  ),
};
