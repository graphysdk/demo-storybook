import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

import { GraphRenderer, type HeaderSlotProps, type ThemeOverrides } from '@graphysdk/react-renderer';
import type { Data, RichTextContent, TextContent } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const COLORS = {
  actual: '#F8A24B',
  forecast: '#FCD9B8',
  card: '#FFF3EA',
  page: '#FBECE2',
  ink: '#322E2C',
  inkSecondary: '#97836E',
  gridLine: '#D6B29A',
};

/** Autumn ramp for ranked charts: orange leads, gold second, browns fading to cream. */
const AUTUMN_RAMP = ['#F5820D', '#F4B93F', '#AE9070', '#CBB499', '#E7DAC8'];

/** Full-strength brand orange — lines take full-strength hues only, and the title key phrase. */
const BRAND_ORANGE = '#F5820D';

/** Muted warm tones for the radial charts: the strong orange leads, these recede behind it. */
const ROSE_REST = '#CBB499';
const TRACK_REMAINING = '#E7DAC8';

const NewsletterPageDecorator: Decorator = (Story) => (
  <div style={{ backgroundColor: COLORS.page, padding: 32, minHeight: '100vh' }}>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800&display=swap"
    />
    <Story />
  </div>
);

const meta: Meta = {
  title: "Chart Styles/Lenny's Newsletter",
  decorators: [NewsletterPageDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const themeOverrides: ThemeOverrides = {
  fontFamilyDefault: "'Plus Jakarta Sans', sans-serif",
  fontFamilyHeading: "'Plus Jakarta Sans', sans-serif",
  textPrimary: COLORS.ink,
  textSecondary: COLORS.inkSecondary,
  gridLineColor: COLORS.gridLine,
  // Legend as plain dot + label, no pill chrome.
  legendBackground: 'transparent',
  legendBorderColor: 'transparent',
  // Value labels as plain bold ink, no plate behind them.
  dataLabelOutsideBackground: 'transparent',
  dataLabelTextColor: COLORS.ink,
  dataLabelInsideTextColor: COLORS.ink,
  fontDataLabel: { weight: 700, size: { value: 1.3, unit: 'em' } },
  fontCategoryLabel: { weight: 600, size: { value: 1.1, unit: 'em' } },
  fontTickLabel: { weight: 600 },
};

/** Headline as a rich-text doc: sentence case with the key phrase carried in brand orange. */
const createLennyTitle = (segments: Array<{ text: string; color?: string }>): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: segments.map(({ text, color }) => ({
        type: 'text',
        text,
        marks: color ? [{ type: 'textStyle', attrs: { color } }] : undefined,
      })),
    },
  ],
});

/** Reads the accent colour off a rich-text segment's `textStyle` mark, if it carries one. */
const readSegmentColor = (segment: RichTextContent): string | undefined => {
  const color = segment.marks?.find((mark) => mark.type === 'textStyle')?.attrs?.color;
  return typeof color === 'string' ? color : undefined;
};

/**
 * Renders a header title or subtitle inside the Lenny type ramp. A plain string prints as-is; a
 * {@link createLennyTitle} doc prints each segment as its own span, so the accent phrase keeps its
 * orange while the size and weight come from the wrapping element.
 */
const renderHeaderContent = (content: TextContent | null): ReactNode => {
  if (content === null) return null;
  if (typeof content === 'string') return content;
  const segments = content.content?.[0]?.content ?? [];
  return segments.map((segment, index) => {
    const color = readSegmentColor(segment);
    return (
      <span key={index} style={color ? { color } : undefined}>
        {segment.text}
      </span>
    );
  });
};

/**
 * Custom header matching the original's type ramp (title 800 24px ink, subtitle 500 15px warm
 * grey), which the theme can't express — there are no title/subtitle font tokens. The outer div
 * carries the layout `ref` so the reserved header band tracks this exact DOM.
 */
const LennyHeader = ({ ref, headerRect, title, subtitle }: HeaderSlotProps) => (
  <div
    ref={ref}
    style={{
      position: 'absolute',
      left: headerRect.x,
      top: headerRect.y,
      width: headerRect.width,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: 20,
    }}
  >
    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, lineHeight: 1.3, color: COLORS.ink }}>
      {renderHeaderContent(title)}
    </h2>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.4, color: '#6F6257' }}>
      {renderHeaderContent(subtitle)}
    </p>
  </div>
);

/** Shared card chrome: cream ground, radius 28 with a hairline ink outline. */
const cardAppearance = {
  background: { type: 'solid', color: COLORS.card },
  border: { type: 'solid', color: COLORS.ink, width: 1 },
  cornerRadius: 28,
  textScale: 1.2,
} as const;

// ---------------------------------------------------------------------------
// 1 — CPM columns, actual vs forecast (orange pair)
// ---------------------------------------------------------------------------

const cpmData: Data = {
  columns: [{ key: 'quarter' }, { key: 'series' }, { key: 'cpm' }],
  rows: [
    { quarter: "Q2 '24", series: 'Actual', cpm: 3.97 },
    { quarter: "Q3 '24", series: 'Actual', cpm: 6.01 },
    { quarter: "Q4 '24", series: 'Actual', cpm: 5.89 },
    { quarter: "Q1 '25", series: 'Actual', cpm: 3.82 },
    { quarter: "Q2 '25", series: 'Forecast', cpm: 6.48 },
  ],
};

const buildCpmSpec = (pair: { actual: string; forecast: string }) =>
  pipe(
    createSpec(),
    mapping({ x: 'quarter', y: 'cpm', color: 'series' }),
    // Each quarter has exactly one series, so 'identity' keeps bars full-width and
    // centered (the default 'dodge' would reserve a slot for the missing series,
    // and 'stack' would coerce the outside labels to inside).
    geom.bar({
      position: 'identity',
      dataLabels: { showDataLabels: true, position: 'outside', offset: 8 },
    }),
    // Wider gaps between bars to match the original's slim columns.
    scale.x({ padding: 0.45 }),
    scale.y.continuous({ domainMax: 10 }),
    scale.color.palette({
      overrides: { 1: { hex: pair.actual }, 2: { hex: pair.forecast } },
    }),
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
      axes: {
        x: { ticks: { isVisible: false } },
        y: { position: 'left', grid: { lineStyle: 'solid' } },
      },
      panel: {
        border: {
          top: { isVisible: false },
          right: { isVisible: false },
          bottom: { isVisible: true, lineStyle: 'solid', lineWidth: 2, color: COLORS.ink },
          left: { isVisible: false },
        },
      },
      appearance: cardAppearance,
    })
  );

// ---------------------------------------------------------------------------
// 2 — Listings by segment (stacked decline)
// ---------------------------------------------------------------------------
// The dominant UK segment takes the orange; the smaller international segment
// recedes into the muted taupe. Card-coloured hairlines cut the stack into slabs.

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
  geom.bar({ position: 'stack', params: { borderRadius: 0, borderColor: COLORS.card, borderWidth: 1 } }),
  scale.x({ padding: 0.3 }),
  scale.y.continuous(),
  scale.color.discrete({ domain: ['UK', 'International'], range: [COLORS.actual, ROSE_REST] }),
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
    axes: {
      x: { ticks: { isVisible: false } },
      y: { position: 'left', grid: { lineStyle: 'solid' } },
    },
    panel: {
      border: {
        top: { isVisible: false },
        right: { isVisible: false },
        bottom: { isVisible: true, lineStyle: 'solid', lineWidth: 2, color: COLORS.ink },
        left: { isVisible: false },
      },
    },
    appearance: cardAppearance,
  })
);

// ---------------------------------------------------------------------------
// 3 — Ranked bar: revenue by region, autumn ramp, labels inside, no zero
// ---------------------------------------------------------------------------

const revenueData: Data = {
  columns: [{ key: 'region' }, { key: 'revenue' }],
  rows: [
    { region: 'North', revenue: 318 },
    { region: 'East', revenue: 258 },
    { region: 'Central', revenue: 238 },
    { region: 'South', revenue: 208 },
    { region: 'West', revenue: 178 },
  ],
};

const revenueSpec = pipe(
  createSpec(),
  mapping({ x: 'region', y: 'revenue', color: 'region' }),
  geom.bar({
    position: 'identity',
    dataLabels: {
      showDataLabels: false,
      showCategoryLabels: true,
      categoryPosition: 'inside',
      categoryJustify: 'start',
      categoryOffset: 16,
    },
  }),
  coord.flip(),
  // Ranked bars run 85% of the pitch in the original.
  scale.x({ padding: 0.15 }),
  scale.y.continuous(),
  scale.color.palette({
    overrides: Object.fromEntries(AUTUMN_RAMP.map((hex, index) => [index + 1, { hex }])),
  }),
  config({
    content: {
      title: createLennyTitle([
        { text: 'North', color: BRAND_ORANGE },
        { text: ' leads revenue across every region.' },
      ]),
      subtitle: 'Total revenue by region, $K.',
    },
    legend: { position: 'none' },
    axes: {
      // Category names live inside the bars, so the axis band would duplicate them.
      x: { isVisible: false, ticks: { isVisible: false } },
      y: { ticks: { isVisible: false }, grid: { lineStyle: 'solid' } },
    },
    panel: {
      border: {
        top: { isVisible: false },
        right: { isVisible: false },
        bottom: { isVisible: false },
        // The dark ink category-axis line, vertical after the flip.
        left: { isVisible: true, lineStyle: 'solid', lineWidth: 2, color: COLORS.ink },
      },
    },
    appearance: cardAppearance,
  })
);

// ---------------------------------------------------------------------------
// 4 — Tracker: one thick line, area fill, temporal axis
// ---------------------------------------------------------------------------

const openRolesValues = [
  10000, 9200, 8600, 7200, 6100, 5400, 5000, 4700, 4500, 4400, 4300, 4200, 4200, 4400, 4350, 4450, 4400, 4500, 4450,
  5600, 5650, 5600, 5700, 5650, 5800, 5650, 6000, 6100, 6200, 6150, 6300, 6100, 6500, 6900, 6800, 7100, 7400,
];

const openRolesData: Data = {
  columns: [{ key: 'month' }, { key: 'roles' }],
  rows: openRolesValues.map((roles, index) => ({
    month: new Date(Date.UTC(2023, index, 1)),
    roles,
  })),
};

const openRolesSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'roles' }),
  geom.area({ params: { lineWidth: 6 } }),
  scale.x.datetime(),
  scale.y.continuous({ domainMax: 10000, zero: true }),
  scale.color.palette({ overrides: { 1: { hex: BRAND_ORANGE } } }),
  config({
    content: {
      title: createLennyTitle([
        { text: 'Open roles ' },
        { text: 'rebound 80%', color: BRAND_ORANGE },
        { text: ' from the low.' },
      ]),
      subtitle: 'Open roles per month · 7,400 and climbing.',
    },
    legend: { position: 'none' },
    numberFormat: { abbreviation: 'k' },
    axes: {
      x: { ticks: { isVisible: false }, grid: { isVisible: true, lineStyle: 'solid' } },
      y: { position: 'left', grid: { lineStyle: 'solid' } },
    },
    panel: {
      border: {
        top: { isVisible: false },
        right: { isVisible: false },
        bottom: { isVisible: false },
        left: { isVisible: false },
      },
    },
    appearance: cardAppearance,
  })
);

// ---------------------------------------------------------------------------
// 5 — Ad demand seasonality (rose / coxcomb)
// ---------------------------------------------------------------------------
// One wedge per month around a twelve-month clock; the radius carries the demand
// index. The golden-quarter months take the full-strength orange, the rest of the
// year recedes into the muted taupe. One observation per month, so `geom.bar` uses
// identity positioning.

const adDemandData: Data = {
  columns: [{ key: 'month' }, { key: 'demand' }, { key: 'period' }],
  rows: [
    { month: 'Jan', demand: 62, period: 'Rest of Year' },
    { month: 'Feb', demand: 58, period: 'Rest of Year' },
    { month: 'Mar', demand: 70, period: 'Rest of Year' },
    { month: 'Apr', demand: 74, period: 'Rest of Year' },
    { month: 'May', demand: 78, period: 'Rest of Year' },
    { month: 'Jun', demand: 72, period: 'Rest of Year' },
    { month: 'Jul', demand: 68, period: 'Rest of Year' },
    { month: 'Aug', demand: 71, period: 'Rest of Year' },
    { month: 'Sep', demand: 84, period: 'Rest of Year' },
    { month: 'Oct', demand: 96, period: 'Golden Quarter' },
    { month: 'Nov', demand: 132, period: 'Golden Quarter' },
    { month: 'Dec', demand: 141, period: 'Golden Quarter' },
  ],
};

const seasonalityRoseSpec = pipe(
  createSpec(),
  mapping({ x: 'month', y: 'demand', color: 'period' }),
  geom.bar({ position: 'identity', params: { borderRadius: 0, borderColor: COLORS.card, borderWidth: 1, width: 1 } }),
  coord.polar({ theta: 'x' }),
  scale.x.discrete(),
  scale.y({ zero: true }),
  scale.color.discrete({ domain: ['Golden Quarter', 'Rest of Year'], range: [BRAND_ORANGE, ROSE_REST] }),
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
    axes: {
      x: { ticks: { isVisible: false } },
      y: { ticks: { isVisible: false }, grid: { isVisible: true, lineStyle: 'solid' } },
    },
    panel: {
      border: {
        top: { isVisible: false },
        right: { isVisible: false },
        bottom: { isVisible: false },
        left: { isVisible: false },
      },
    },
    appearance: cardAppearance,
  })
);

// ---------------------------------------------------------------------------
// 6 — Progress toward 2025 targets (racetrack)
// ---------------------------------------------------------------------------
// One concentric track per region; the orange arc sweeps the share of target
// achieved and the faint cream remainder completes each lap. Rings rank outward,
// best region outermost.

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
  scale.color.discrete({ domain: ['Achieved', 'Remaining'], range: [BRAND_ORANGE, TRACK_REMAINING] }),
  config({
    content: {
      title: createLennyTitle([{ text: 'North', color: BRAND_ORANGE }, { text: ' closes in on its 2025 target.' }]),
      subtitle: 'Share of 2025 revenue target achieved, %. The faint track is the distance left.',
    },
    legend: { position: 'none' },
    axes: {
      x: { ticks: { isVisible: false } },
      y: { ticks: { isVisible: false }, grid: { isVisible: false } },
    },
    panel: {
      border: {
        top: { isVisible: false },
        right: { isVisible: false },
        bottom: { isVisible: false },
        left: { isVisible: false },
      },
    },
    appearance: cardAppearance,
  })
);

// ---------------------------------------------------------------------------
// The dashboard — all six charts on one newsletter page
// ---------------------------------------------------------------------------

const ChartCard = ({ data, spec }: { data: Data; spec: Parameters<typeof VizStoryGraphProvider>[0]['spec'] }) => (
  <div style={{ height: 460 }}>
    <VizStoryGraphProvider data={data} spec={spec} themeOverrides={themeOverrides}>
      <GraphRenderer slots={{ Header: LennyHeader }} />
    </VizStoryGraphProvider>
  </div>
);

export const Dashboard: Story = {
  name: "Lenny's Newsletter",
  parameters: {
    docs: {
      description: {
        story:
          'The six charts of the newsletter system on one page: the CPM columns, the stacked decline of listed companies, the ranked revenue bars in the autumn ramp, the open-roles tracker, the ad-demand rose, and the target-progress racetrack. Every headline carries its key phrase in brand orange.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: 1560, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <h1 style={{ margin: '8px 0 24px', fontSize: 32, fontWeight: 800, color: COLORS.ink }}>
        Lenny&rsquo;s Newsletter
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(420px, 1fr))', gap: 24 }}>
        <ChartCard data={cpmData} spec={buildCpmSpec(COLORS)} />
        <ChartCard data={listingsData} spec={listingsSpec} />
        <ChartCard data={revenueData} spec={revenueSpec} />
        <ChartCard data={openRolesData} spec={openRolesSpec} />
        <ChartCard data={adDemandData} spec={seasonalityRoseSpec} />
        <ChartCard data={targetProgressData} spec={targetRacetrackSpec} />
      </div>
    </div>
  ),
};
