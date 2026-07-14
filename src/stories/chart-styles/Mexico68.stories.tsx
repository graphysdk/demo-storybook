import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { type FontTokenOverride, GraphProvider, GraphRenderer, type ThemeOverrides } from '@graphysdk/react-renderer';
import type { Data, RichTextContent, SpecInput } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import layout from './chart-layout.module.css';
import { MEXICO, MEXICO_PALETTE, mexicoPlugins } from './mexico68';

const RIGHTEOUS = "'Righteous', 'Rubik', sans-serif"; // headings and caps
const RUBIK = "'Rubik', 'Helvetica Neue', Arial, sans-serif"; // everything else

const BAR_BAND_FRACTION = 0.5; // the arch takes 80% of the band
const LINE_WIDTH = 2;

// Engine text is Rubik 500 12px; the printed value above each arch sits a touch
// heavier and larger — the one number you read off the vibration.
const engineFont: FontTokenOverride = {
  family: RUBIK,
  size: { value: 12, unit: 'px' },
  lineHeight: 1.4,
  weight: 500,
};

const valueFont: FontTokenOverride = {
  family: RUBIK,
  size: { value: 13, unit: 'px' },
  lineHeight: 1.2,
  weight: 600,
};

const theme: ThemeOverrides = {
  textPrimary: MEXICO.ink,
  textSecondary: MEXICO.axisGrey,
  gridLineColor: 'transparent', // the vibration needs quiet ground — no gridlines
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  legendTextColor: MEXICO.ink,
  dataLabelTextColor: MEXICO.ink, // values printed above each arch, in ink
  fontFamilyDefault: RUBIK,
  fontFamilyHeading: RIGHTEOUS,
  fontTickLabel: engineFont,
  fontAxisLabel: engineFont,
  fontLegendLabel: engineFont,
  fontDataLabel: valueFont,
  fontPieLabel: `500 11px/1.4 ${RUBIK}`,
};

// Shared frame: white card, no grid, a single 2px ink baseline the arches rest on.
// The y axis stays visible in the quiet grey; it is zero-based everywhere.
const createMexicoConfig = (options: { legendPosition?: 'none' | 'top' | 'bottom' } = {}) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    appearance: { background: { type: 'solid', color: MEXICO.card } },
    layout: {
      padding: 32,
      gaps: { header: options.legendPosition === 'top' ? 24 : 40 },
    },
    panel: {
      border: {
        top: { isVisible: false },
        bottom: { isVisible: true, lineStyle: 'solid', lineWidth: 2, color: MEXICO.ink },
        left: { isVisible: false },
        right: { isVisible: false },
      },
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false }, ticks: { isVisible: false } },
      y: { position: 'left', grid: { isVisible: false } },
    },
  });

// Polar cards carry no cartesian baseline or y axis — the ring is its own ground.
const mexicoPolarConfig = config({
  panel: { border: { bottom: { isVisible: false } } },
  axes: { y: { isVisible: false } },
});

// Headline: Righteous, uppercase, key phrase in the lead magenta.
const createMexicoTitle = (segments: Array<{ text: string; color?: string }>): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: segments.map(({ text, color }) => ({
        type: 'text',
        text: text.toUpperCase(),
        marks: [{ type: 'textStyle', attrs: { color: color ?? MEXICO.ink, fontFamily: RIGHTEOUS, fontSize: '22px' } }],
      })),
    },
  ],
});

// Righteous carries the headlines and Rubik the engine text; both load via this
// stylesheet link, which React hoists into <head> so the fonts scope to these stories.
const MexicoFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Righteous&family=Rubik:wght@400;500;600;700&display=swap"
    />
    <Story />
  </>
);

const meta: Meta = {
  title: 'Chart Styles/Mexico 68',
  decorators: [MexicoFontsDecorator],
  parameters: {
    backgrounds: { default: 'light' },
    docs: {
      description: {
        component:
          'A single dashboard in the Mexico 68 house look: white cards on a gallery-white gallery, the op-art magenta-orange-purple-cyan-green palette, Righteous caps over Rubik engine text. The whole grammar is the echo — every mark is drawn as concentric outlines with no solid core. Bars radiate as arches, lines as parallel echoes with a ringed-target terminus, scatter points as ringed targets, and donut slices as single outlines with ink echoes fanning outward. Rendered by three custom geom renderers plus a line renderer (mexicoBar / mexicoSlice / mexicoPoint / mexicoLine).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Every chart is painted by the same four render-only geom overrides.
const MexicoGraph = ({ data, spec }: { data: Data; spec: SpecInput }) => (
  <GraphProvider input={spec} data={data} theme="light" themeOverrides={theme} plugins={[...mexicoPlugins]}>
    <GraphRenderer sizing={{ mode: 'responsive' }} />
  </GraphProvider>
);

// ─── CPM by quarter (arch bars, actual vs forecast) ──────────────────────────
// One arch per quarter with its value printed above. The actual quarters take the
// magenta; the forecast radiates in the next palette colour — orange.
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
  geom.bar({
    position: 'identity',
    params: { width: BAR_BAND_FRACTION, borderRadius: 0 },
    dataLabels: { showDataLabels: true, position: 'outside', justify: 'end', align: 'center' },
  }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 8 }),
  scale.color.discrete({ domain: ['ACTUAL', 'FORECAST'], range: [MEXICO.pink, MEXICO.orange] }),
  createMexicoConfig({ legendPosition: 'top' }),
  config({
    content: {
      title: createMexicoTitle([
        { text: 'CPM, € — actual vs ' },
        { text: 'forecast', color: MEXICO.orange },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Cost per mille by quarter, €. The orange arch is the forecast.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Listings by segment (stacked arches) ────────────────────────────────────
const listingsData: Data = {
  columns: [{ key: 'year' }, { key: 'segment' }, { key: 'listings' }],
  rows: [
    { year: '2018', segment: 'UK', listings: 580 },
    { year: '2018', segment: 'INTERNATIONAL', listings: 570 },
    { year: '2019', segment: 'UK', listings: 540 },
    { year: '2019', segment: 'INTERNATIONAL', listings: 550 },
    { year: '2020', segment: 'UK', listings: 490 },
    { year: '2020', segment: 'INTERNATIONAL', listings: 540 },
    { year: '2021', segment: 'UK', listings: 460 },
    { year: '2021', segment: 'INTERNATIONAL', listings: 530 },
    { year: '2022', segment: 'UK', listings: 400 },
    { year: '2022', segment: 'INTERNATIONAL', listings: 510 },
    { year: '2023', segment: 'UK', listings: 370 },
    { year: '2023', segment: 'INTERNATIONAL', listings: 500 },
    { year: '2024', segment: 'UK', listings: 330 },
    { year: '2024', segment: 'INTERNATIONAL', listings: 480 },
  ],
};

const listingsSpec = pipe(
  createSpec(),
  mapping({ x: 'year', y: 'listings', color: 'segment' }),
  geom.bar({ position: 'stack', params: { width: BAR_BAND_FRACTION, borderRadius: 0 } }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'INTERNATIONAL'], range: [MEXICO.pink, MEXICO.cyan] }),
  createMexicoConfig({ legendPosition: 'bottom' }),
  config({
    content: {
      title: createMexicoTitle([
        { text: 'The long decline of ' },
        { text: 'listed companies', color: MEXICO.pink },
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
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['PRODUCT A', 'PRODUCT B'], range: [MEXICO.pink, MEXICO.purple] }),
    createMexicoConfig()
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    content: {
      title: createMexicoTitle([{ text: 'Product A', color: MEXICO.pink }, { text: ' pulls ahead of product B.' }]),
      isTitleVisible: true,
      subtitle: 'Monthly value by product.',
      isSubtitleVisible: true,
    },
  })
);

const productLegendSpec = pipe(
  createProductLineSpec(),
  createMexicoConfig({ legendPosition: 'bottom' }),
  config({
    content: {
      title: createMexicoTitle([
        { text: 'On value, the products tell ' },
        { text: 'different stories', color: MEXICO.pink },
        { text: '.' },
      ]),
      isTitleVisible: true,
    },
  })
);

// ─── Spend vs conversions (scatter, ringed targets) ──────────────────────────
// The clean home for the ringed target: each campaign is a dot inside two rings.
const spendConversionsData: Data = {
  columns: [{ key: 'spend' }, { key: 'conversions' }, { key: 'metric' }],
  rows: [
    { spend: 12, conversions: 32, metric: 'CAMPAIGN' },
    { spend: 20, conversions: 48, metric: 'CAMPAIGN' },
    { spend: 27, conversions: 44, metric: 'CAMPAIGN' },
    { spend: 34, conversions: 70, metric: 'CAMPAIGN' },
    { spend: 41, conversions: 66, metric: 'CAMPAIGN' },
    { spend: 47, conversions: 88, metric: 'CAMPAIGN' },
    { spend: 52, conversions: 61, metric: 'CAMPAIGN' },
    { spend: 58, conversions: 101, metric: 'CAMPAIGN' },
    { spend: 67, conversions: 92, metric: 'CAMPAIGN' },
    { spend: 74, conversions: 118, metric: 'CAMPAIGN' },
    { spend: 82, conversions: 112, metric: 'CAMPAIGN' },
    { spend: 90, conversions: 108, metric: 'CAMPAIGN' },
  ],
};

const spendConversionsSpec = pipe(
  createSpec(),
  mapping({ x: 'spend', y: 'conversions', color: 'metric' }),
  geom.point({ params: { size: 6 } }),
  scale.x.continuous({ domainMin: 0 }),
  scale.y.continuous({ domainMin: 0 }),
  scale.color.discrete({ domain: ['CAMPAIGN'], range: [MEXICO.pink] }),
  createMexicoConfig(),
  config({
    axes: { x: { label: 'Spend' }, y: { label: 'Conversions' } },
    content: {
      title: createMexicoTitle([{ text: 'Spend vs ' }, { text: 'conversions', color: MEXICO.pink }, { text: '.' }]),
      isTitleVisible: true,
      subtitle: 'Each campaign is a ringed target.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Revenue by region (donut) ───────────────────────────────────────────────
// Each region is one closed outline in its colour, with ink echoes fanning
// outward from the ring.
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
    params: { borderRadius: 0 },
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
  scale.color.discrete({ domain: ['NORTH', 'EAST', 'CENTRAL', 'SOUTH', 'WEST'], range: [...MEXICO_PALETTE] }),
  createMexicoConfig(),
  mexicoPolarConfig,
  config({
    content: {
      title: createMexicoTitle([{ text: 'North', color: MEXICO.pink }, { text: ' takes a quarter of revenue.' }]),
      isTitleVisible: true,
      subtitle: 'Share of revenue by region, %.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Ad demand seasonality (rose / coxcomb) ──────────────────────────────────
// One wedge per month; the golden quarter takes the magenta, the rest run purple.
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
  geom.bar({ position: 'identity', params: { borderRadius: 0, width: 1 } }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['GOLDEN QUARTER', 'REST OF YEAR'], range: [MEXICO.pink, MEXICO.purple] }),
  createMexicoConfig(),
  mexicoPolarConfig,
  config({
    content: {
      title: createMexicoTitle([
        { text: 'Ad demand peaks in the ' },
        { text: 'golden quarter', color: MEXICO.pink },
        { text: '.' },
      ]),
      isTitleVisible: true,
      subtitle: 'Monthly ad demand index, 100 = 2024 average.',
      isSubtitleVisible: true,
    },
  })
);

// ─── Dashboard chrome ────────────────────────────────────────────────────────
// Each card is a white plate, radius 20, opening with a numbered fig plate under a
// 2px ink rule. The chart paints the same white, so plate and plot read as one.
const FIG_COUNT = 9;

const formatFigPage = (figIndex: number) =>
  `${String(figIndex).padStart(2, '0')} / ${String(FIG_COUNT).padStart(2, '0')}`;

const MexicoChartCard = ({
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
  <div
    style={{
      background: MEXICO.card,
      borderRadius: 20,
      height,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        margin: '24px 32px 0',
        borderTop: `2px solid ${MEXICO.ink}`,
        paddingTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        flexShrink: 0,
        fontFamily: RUBIK,
        fontWeight: 600,
        fontSize: 9.5,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: MEXICO.axisGrey,
      }}
    >
      <span>{figLabel}</span>
      <span>{formatFigPage(figIndex)}</span>
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>
      <MexicoGraph data={data} spec={spec} />
    </div>
  </div>
);

export const Dashboard: Story = {
  name: 'Mexico 68',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ minHeight: '100vh', background: MEXICO.page, padding: '56px 40px 64px', fontFamily: RUBIK }}>
      <header style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
          {[MEXICO.pink, MEXICO.orange, MEXICO.purple, MEXICO.cyan, MEXICO.green].map((color) => (
            <span key={color} style={{ width: 28, height: 6, borderRadius: 3, background: color }} />
          ))}
        </div>
        <h1
          style={{
            fontFamily: RIGHTEOUS,
            fontWeight: 400,
            fontSize: 52,
            color: MEXICO.ink,
            margin: 0,
            letterSpacing: '0.04em',
          }}
        >
          MEXICO 68
        </h1>
        <p style={{ color: MEXICO.axisGrey, fontSize: 16, margin: '16px 0 0' }}>
          a Graphy chart theme · op-art palette · the whole grammar is the echo
        </p>
      </header>
      <div style={{ maxWidth: 1500, margin: '0 auto', display: 'grid', gap: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 28 }}>
          <MexicoChartCard
            data={cpmData}
            spec={cpmSpec}
            height={520}
            figLabel="Fig. 02 / Cost per mille / Q2 '24–Q2 '25"
            figIndex={2}
          />
          <MexicoChartCard
            data={listingsData}
            spec={listingsSpec}
            height={520}
            figLabel="Fig. 03 / Listed companies / 2018–2024"
            figIndex={3}
          />
        </div>
        <div className={layout.trioContainer}>
          <div className={layout.trio} style={{ gap: 28 }}>
            <MexicoChartCard
              data={productValueData}
              spec={productRaceSpec}
              height={500}
              figLabel="Fig. 04 / Product value race / Jan–Jun"
              figIndex={4}
            />
            <MexicoChartCard
              data={revenueByRegionData}
              spec={revenueDonutSpec}
              height={500}
              figLabel="Fig. 05 / Revenue by region / FY 2025"
              figIndex={5}
            />
            <MexicoChartCard
              data={productValueData}
              spec={productLegendSpec}
              height={500}
              figLabel="Fig. 06 / Product value / Jan–Jun"
              figIndex={6}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 28 }}>
          <MexicoChartCard
            data={spendConversionsData}
            spec={spendConversionsSpec}
            height={600}
            figLabel="Fig. 07 / Spend vs conversions / FY 2025"
            figIndex={7}
          />
          <MexicoChartCard
            data={adDemandData}
            spec={seasonalityRoseSpec}
            height={600}
            figLabel="Fig. 08 / Ad demand seasonality / 12 months"
            figIndex={8}
          />
        </div>
      </div>
    </div>
  ),
};
