import type { Decorator, Meta, StoryObj } from '@storybook/react';

import {
  type FontTokenOverride,
  GraphRenderer,
  type GraphSlots,
  type SwatchSlotProps,
  type ThemeOverrides,
} from '@graphysdk/react-renderer';
import type { Data, RichTextContent, SpecInput } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

import layout from './chart-layout.module.css';

const NB = {
  background: '#0B0B0B', // page
  surface: '#171717', // sheets, radius 0
  body: '#F0F0F0', // primary text and the white series
  secondary: '#8A8A8A', // secondary text and the grey series
  acid: '#C8FF00', // the accent — data only
  acidDim: '#9AB800', // overflow series slot
  greyMid: '#4A4A4A', // muted series
  greyDeep: '#2E2E2E', // ghost series / remainder tracks
  chrome: '#333333', // grid rows + dashed frame; the engine has a single grid-line color token
  metaRule: '#3A3A3A', // dashed rule under the corner strip
  grotesk: '"Space Grotesk", Inter, sans-serif',
  inter: 'Inter, "Helvetica Neue", Arial, sans-serif',
} as const;

const NB_DONUT_RAMP = [NB.acid, NB.body, NB.secondary, NB.greyMid, NB.greyDeep];

// Engine text is Space Grotesk 500; data comes pre-uppercased since the theme
// contract has no text-transform or letter-spacing tokens.
const engineText: FontTokenOverride = {
  family: NB.grotesk,
  size: { value: 10, unit: 'px' },
  lineHeight: 1.4,
  weight: 500,
};

const theme: ThemeOverrides = {
  textPrimary: NB.body,
  textSecondary: NB.secondary,
  gridLineColor: NB.chrome,
  gridLineDash: '4 4',
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  legendTextColor: NB.body,
  dataLabelOutsideBackground: NB.surface,
  fontFamilyDefault: NB.inter,
  fontFamilyHeading: NB.grotesk,
  fontTickLabel: engineText,
  fontAxisLabel: engineText,
  fontLegendLabel: engineText,
  fontDataLabel: engineText,
  fontPieLabel: `500 10px/14px ${NB.grotesk}`,
  fontSeriesLabel: `500 11px/14px ${NB.grotesk}`,
};

// Shared container grammar: acid-free chrome on a #171717 sheet, framed by a
// square 1px dashed border. Cartesian bar charts trade the dashed bottom edge
// for a solid acid baseline the bars sit on.
const createNeoBrutalistConfig = (
  options: { legendPosition?: 'none' | 'top' | 'right'; hasAcidBaseline?: boolean } = {}
) =>
  config({
    legend: { position: options.legendPosition ?? 'none' },
    appearance: { background: { type: 'solid', color: NB.surface }, cornerRadius: 0 },
    layout: {
      padding: 32,
    },
    panel: {
      cornerRadius: 0,
      border: {
        top: { isVisible: true, lineStyle: 'dashed', lineWidth: 1 },
        left: { isVisible: true, lineStyle: 'dashed', lineWidth: 1 },
        right: { isVisible: true, lineStyle: 'dashed', lineWidth: 1 },
        bottom: options.hasAcidBaseline
          ? { isVisible: true, lineStyle: 'solid', lineWidth: 2, color: NB.acid }
          : { isVisible: true, lineStyle: 'dashed', lineWidth: 1 },
      },
    },
    axes: {
      x: { position: 'bottom', grid: { isVisible: false }, ticks: { isVisible: false } },
      y: { position: 'left', grid: { isVisible: true, lineStyle: 'solid', lineWidth: 1 } },
    },
  });

const createNeoBrutalistTitle = (segments: Array<{ text: string; color?: string }>): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: segments.map(({ text, color }) => ({
        type: 'text',
        text: text.toUpperCase(),
        marks: [{ type: 'textStyle', attrs: { color: color ?? NB.body, fontFamily: NB.grotesk, fontSize: '24px' } }],
      })),
    },
  ],
});

// Sub line rendered by the engine at spec-line size.
const createNeoBrutalistSubtitle = (segments: Array<{ text: string; color?: string }>): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: segments.map(({ text, color }) => ({
        type: 'text',
        text: text.toUpperCase(),
        marks: [
          { type: 'textStyle', attrs: { color: color ?? NB.secondary, fontFamily: NB.grotesk, fontSize: '10px' } },
        ],
      })),
    },
  ],
});

// Space Grotesk carries headings and engine text; Inter (the shared base) loads
// globally. React hoists this stylesheet link into <head> so the font is scoped to
// these stories.
const NeoBrutalistFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap"
    />
    <Story />
  </>
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

// ─── CPM by quarter (bar, shipped vs forecast) ───────────────────────────────
// The forecast bar is hollow: its fill maps to 'transparent' while every bar
// carries an acid border — invisible on the solid acid bars, a crisp outline on
// the empty one. Bar borders are always solid, so the reference's dashed
// outline lands as a solid one in this pass.
//
// Sharp-cornered rectangles mirroring the bars: acid-filled for SHIPPED, and a
// hollow acid outline for FORECAST — whose series color is that same
// 'transparent', so the default swatch would paint nothing.
const NeoBrutalistSwatch = (props: SwatchSlotProps) => {
  const width = props.width ?? 12;
  const height = props.height ?? 12;
  const isHollow = props.label === 'FORECAST';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        fill={isHollow ? 'none' : props.color}
        stroke={isHollow ? NB.acid : 'none'}
        strokeWidth={1.5}
      />
    </svg>
  );
};

const nbSwatchSlots: GraphSlots = { Swatch: NeoBrutalistSwatch };

const cpmData: Data = {
  columns: [{ key: 'quarter' }, { key: 'cpm' }, { key: 'type' }],
  rows: [
    { quarter: "Q2 '24", cpm: 4, type: 'SHIPPED' },
    { quarter: "Q3 '24", cpm: 6.1, type: 'SHIPPED' },
    { quarter: "Q4 '24", cpm: 5.9, type: 'SHIPPED' },
    { quarter: "Q1 '25", cpm: 3.9, type: 'SHIPPED' },
    { quarter: "Q2 '25", cpm: 6.5, type: 'FORECAST' },
  ],
};

const cpmSpec = pipe(
  createSpec(),
  mapping({ x: 'quarter', y: 'cpm', color: 'type' }),
  geom.bar({ position: 'identity', params: { width: 0.6, borderRadius: 0, borderColor: NB.acid, borderWidth: 1.5 } }),
  scale.x(),
  scale.y.continuous({ domainMin: 0, domainMax: 8 }),
  scale.color.discrete({ domain: ['SHIPPED', 'FORECAST'], range: [NB.acid, 'transparent'] }),
  createNeoBrutalistConfig({ legendPosition: 'top', hasAcidBaseline: true }),
  config({
    content: {
      title: createNeoBrutalistTitle([{ text: 'CPM rips ' }, { text: 'past €6.', color: NB.acid }]),
      isTitleVisible: true,
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
  geom.bar({ position: 'stack', params: { borderRadius: 0, borderColor: NB.surface, borderWidth: 1 } }),
  scale.x(),
  scale.y(),
  scale.color.discrete({ domain: ['UK', 'INTERNATIONAL'], range: [NB.acid, NB.greyMid] }),
  createNeoBrutalistConfig({ legendPosition: 'top', hasAcidBaseline: true }),
  config({
    content: {
      title: createNeoBrutalistTitle([
        { text: 'Long-term ' },
        { text: 'decline', color: NB.acid },
        { text: ' in listings.' },
      ]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Listed companies by segment' }]),
      isSubtitleVisible: true,
    },
  })
);

// ─── Product value race (lines, direct end labels vs boxed legend) ───────────
// The lead series takes the acid 2.5px stroke, the follower the white 1.5px
// one: lineWidth 'auto' reads the strokeWidth aesthetic, scaled per product.
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
    mapping({ x: 'month', y: 'value', color: 'product', strokeWidth: 'product' }),
    geom.line({ params: { lineWidth: 'auto', showFill: false } }),
    scale.x(),
    scale.y.continuous({ domainMin: 100 }),
    scale.color.discrete({ domain: ['PRODUCT A', 'PRODUCT B'], range: [NB.acid, NB.body] }),
    scale.strokeWidth.discrete({ domain: ['PRODUCT A', 'PRODUCT B'], range: [2.5, 1.5] }),
    createNeoBrutalistConfig()
  );

const productRaceSpec = pipe(
  createProductLineSpec(),
  config({
    legend: { position: 'right', display: 'direct' },
    content: {
      title: createNeoBrutalistTitle([{ text: 'Product A', color: NB.acid }, { text: ' pulls ahead.' }]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Monthly value by product · index, Jan = 100' }]),
      isSubtitleVisible: true,
    },
  })
);

const productLegendSpec = pipe(
  createProductLineSpec(),
  createNeoBrutalistConfig({ legendPosition: 'top' }),
  config({
    content: {
      title: createNeoBrutalistTitle([{ text: 'Same data, ' }, { text: 'different stories.', color: NB.acid }]),
      isTitleVisible: true,
    },
  })
);

// ─── Revenue by region (donut) ───────────────────────────────────────────────
// Ring at 0.55R; surface-colored borders cut the 3px gaps between wedges.
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
    params: { borderRadius: 0, borderColor: NB.surface, borderWidth: 3 },
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
  scale.color.discrete({ domain: ['NORTH', 'EAST', 'CENTRAL', 'SOUTH', 'WEST'], range: NB_DONUT_RAMP }),
  createNeoBrutalistConfig(),
  config({
    content: {
      title: createNeoBrutalistTitle([{ text: 'North', color: NB.acid }, { text: ' takes a quarter.' }]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Share of revenue by region · %' }]),
      isSubtitleVisible: true,
    },
  })
);

// ─── Ad demand seasonality (rose / coxcomb) ──────────────────────────────────
// Twelve wedges around a demand clock; the golden quarter takes the acid, the
// rest of the year sinks into the deep grey.
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
  geom.bar({ position: 'identity', params: { borderRadius: 0, borderColor: NB.surface, borderWidth: 1, width: 1 } }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['GOLDEN QUARTER', 'REST OF YEAR'], range: [NB.acid, NB.greyDeep] }),
  createNeoBrutalistConfig(),
  config({
    content: {
      title: createNeoBrutalistTitle([{ text: 'Demand peaks in the ' }, { text: 'golden quarter.', color: NB.acid }]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Ad demand index, 100 = 2024 avg · acid = Oct-Dec' }]),
      isSubtitleVisible: true,
    },
  })
);

// ─── Progress toward 2025 targets (racetrack) ────────────────────────────────
// One concentric track per region; the acid arc sweeps the share achieved and
// the deep-grey remainder completes each lap. Best performer outermost.
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
  scale.color.discrete({ domain: ['ACHIEVED', 'REMAINING'], range: [NB.acid, NB.greyDeep] }),
  createNeoBrutalistConfig(),
  config({ layout: { gaps: { header: 20 } } }),
  config({
    content: {
      title: createNeoBrutalistTitle([{ text: 'North', color: NB.acid }, { text: ' closes the gap.' }]),
      isTitleVisible: true,
      subtitle: createNeoBrutalistSubtitle([{ text: 'Share of 2025 target achieved · % · acid = achieved' }]),
      isSubtitleVisible: true,
    },
  })
);

// ─── Dashboard chrome ────────────────────────────────────────────────────────
// The jagged acid border is a 96px SVG tile — a perimeter jittered by two sine
// waves — repeated via border-image. Drawn, no filters.
const buildJaggedBorderTile = (): string => {
  const tileSize = 96;
  const inset = 6;
  const step = 3;
  const jitterFor = (t: number): number =>
    1.3 * Math.sin((t * Math.PI * 2) / 32) + 0.6 * Math.sin((t * Math.PI * 2) / 13.7 + 2.1);
  const points: string[] = [];
  for (let x = inset; x <= tileSize - inset; x += step) {
    points.push(`${x},${(inset + jitterFor(x)).toFixed(2)}`);
  }
  for (let y = inset + step; y <= tileSize - inset; y += step) {
    points.push(`${(tileSize - inset - jitterFor(y + tileSize)).toFixed(2)},${y}`);
  }
  for (let x = tileSize - inset - step; x >= inset; x -= step) {
    points.push(`${x},${(tileSize - inset - jitterFor(x + tileSize * 2)).toFixed(2)}`);
  }
  for (let y = tileSize - inset - step; y >= inset + step; y -= step) {
    points.push(`${(inset + jitterFor(y + tileSize * 3)).toFixed(2)},${y}`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}"><polygon points="${points.join(' ')}" fill="none" stroke="${NB.acid}" stroke-width="2"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const JAGGED_BORDER_TILE = buildJaggedBorderTile();

// Each sheet carries the jagged acid border and the corner strip; the chart
// below paints the same surface, so strip and plot read as one slab.
const NeoBrutalistChartCard = ({
  index,
  label,
  data,
  spec,
  height,
  slots,
}: {
  index: string;
  label: string;
  data: Data;
  spec: SpecInput;
  height: number;
  slots?: GraphSlots;
}) => (
  <div
    style={{
      background: NB.surface,
      height,
      display: 'flex',
      flexDirection: 'column',
      border: '8px solid transparent',
      borderImage: `${JAGGED_BORDER_TILE} 12 / 8px round`,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        margin: '20px 32px 0',
        paddingBottom: 10,
        borderBottom: `1px dashed ${NB.metaRule}`,
        fontFamily: NB.grotesk,
        fontWeight: 500,
        fontSize: 9.5,
        letterSpacing: '0.18em',
        color: NB.secondary,
        flexShrink: 0,
      }}
    >
      <span>
        {index} / {label}
      </span>
      <span>{'DATA > OPINIONS'}</span>
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>
      <VizStoryGraphProvider data={data} theme="dark" themeOverrides={theme} spec={spec}>
        <GraphRenderer sizing={{ mode: 'responsive' }} slots={slots} />
      </VizStoryGraphProvider>
    </div>
  </div>
);

export const Dashboard: Story = {
  name: 'Neo Brutalist',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ minHeight: '100vh', background: NB.background, padding: '56px 40px 64px', fontFamily: NB.inter }}>
      <header style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ width: 64, height: 5, background: NB.acid, margin: '0 auto 28px' }} />
        <h1
          style={{
            fontFamily: NB.grotesk,
            fontWeight: 700,
            fontSize: 48,
            letterSpacing: '0.02em',
            color: NB.body,
            margin: 0,
          }}
        >
          NEO <span style={{ color: NB.acid }}>BRUTALIST.</span>
        </h1>
        <p
          style={{
            color: NB.secondary,
            fontFamily: NB.grotesk,
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: '0.18em',
            margin: '16px 0 0',
          }}
        >
          A GRAPHY CHART THEME · ACID IS FOR DATA ONLY · {'DATA > OPINIONS'}
        </p>
      </header>
      <div style={{ maxWidth: 1500, margin: '0 auto', display: 'grid', gap: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 28 }}>
          <NeoBrutalistChartCard
            index="01"
            label="CPM BY QUARTER"
            data={cpmData}
            spec={cpmSpec}
            slots={nbSwatchSlots}
            height={520}
          />
          <NeoBrutalistChartCard
            index="02"
            label="LISTINGS BY SEGMENT"
            data={listingsData}
            spec={listingsSpec}
            slots={nbSwatchSlots}
            height={520}
          />
        </div>
        <div className={layout.trioContainer}>
          <div className={layout.trio} style={{ gap: 28 }}>
            <NeoBrutalistChartCard
              index="03"
              label="PRODUCT VALUE RACE"
              data={productValueData}
              spec={productRaceSpec}
              height={400}
            />
            <NeoBrutalistChartCard
              index="04"
              label="REVENUE BY REGION"
              data={revenueByRegionData}
              spec={revenueDonutSpec}
              height={400}
            />
            <NeoBrutalistChartCard
              index="05"
              label="PRODUCT VALUE, KEYED"
              data={productValueData}
              spec={productLegendSpec}
              height={400}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 28 }}>
          <NeoBrutalistChartCard
            index="06"
            label="AD DEMAND CLOCK"
            data={adDemandData}
            spec={seasonalityRoseSpec}
            height={520}
          />
          <NeoBrutalistChartCard
            index="07"
            label="TARGET RACETRACK"
            data={targetProgressData}
            spec={targetRacetrackSpec}
            height={520}
          />
        </div>
      </div>
    </div>
  ),
};
