import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data, GraphConfig } from '@graphysdk/viz-engine';
import { config, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

type LegendPosition = 'auto' | 'top' | 'right' | 'bottom' | 'left' | 'none';
type LegendDisplay = 'auto' | 'pill' | 'direct';

const meta: Meta = {
  title: 'Features/Legends',
  decorators: [ResizablePlotDecorator],
};

export default meta;

const POSITION_OPTIONS: LegendPosition[] = ['auto', 'top', 'right', 'bottom', 'left', 'none'];
const DISPLAY_OPTIONS: LegendDisplay[] = ['auto', 'pill', 'direct'];

const positionControl = {
  control: { type: 'select' as const },
  options: POSITION_OPTIONS,
  description: 'Where the legend is anchored relative to the plot.',
};

const displayControl = {
  control: { type: 'select' as const },
  options: DISPLAY_OPTIONS,
  description: 'Pill = boxed swatches; direct = inline labels at series endpoints (line/area/stacked-bar only).',
};

/**
 * GraphConfig's Legend only supports `'auto' | 'top' | 'right' | 'none'` and has
 * no `display` field. When args exercise features outside that set, drop the
 * config and let the helper render the "Not expressible" placeholder.
 */
const toConfigLegendPosition = (
  position: LegendPosition,
  display: LegendDisplay
): 'auto' | 'top' | 'right' | 'none' | undefined => {
  if (display !== 'auto') return undefined;
  if (position === 'bottom' || position === 'left') return undefined;
  return position;
};

// ─── Bar geom ─────────────────────────────────────────────────────────────────

const BAR_REGIONS = ['North', 'South', 'West'] as const;

const barData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }],
  rows: [
    { quarter: 'Q1', North: 350, South: 200, West: 500 },
    { quarter: 'Q2', North: 300, South: 250, West: 350 },
    { quarter: 'Q3', North: 400, South: 300, West: 300 },
    { quarter: 'Q4', North: 200, South: 150, West: 400 },
  ],
};

const barReshapeToLong = transform.reshape({
  keep: ['quarter'],
  reshape: [...BAR_REGIONS],
  keyName: 'region',
  valueName: 'sales',
});

interface BarLegendArgs {
  position: LegendPosition;
  display: LegendDisplay;
  barPosition: 'stack' | 'dodge' | 'fill';
}

export const BarLegend: StoryObj<BarLegendArgs> = {
  argTypes: {
    position: positionControl,
    display: displayControl,
    barPosition: {
      control: { type: 'inline-radio' },
      options: ['stack', 'dodge', 'fill'],
      description: 'Bar position adjustment. Direct labels are only available for stack/fill.',
    },
  },
  args: {
    position: 'auto',
    display: 'auto',
    barPosition: 'stack',
  },
  render: (args) => {
    const spec = pipe(
      createSpec(barReshapeToLong, mapping({ x: 'quarter', y: 'sales', color: 'region' })),
      geom.bar({ position: args.barPosition }),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({
        content: {
          title: 'Sales by quarter and region',
          subtitle: 'Sales by quarter and region',
          caption: 'Sales by quarter and region',
        },
        legend: { position: args.position, display: args.display },
        axes: { y: { label: 'sales' } },
      })
    );

    const configPosition = toConfigLegendPosition(args.position, args.display);
    const graphConfig: GraphConfig | undefined =
      configPosition === undefined
        ? undefined
        : {
            type:
              args.barPosition === 'stack'
                ? 'columnStacked'
                : args.barPosition === 'fill'
                  ? 'columnStackedFill'
                  : 'column',
            legend: { position: configPosition },
            content: {
              title: 'Sales by quarter and region',
              subtitle: 'Sales by quarter and region',
              caption: 'Sales by quarter and region',
            },
          };

    return (
      <VizStoryGraphProvider data={barData} spec={spec} config={graphConfig}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Line geom ────────────────────────────────────────────────────────────────
const LINE_REGIONS = ['North', 'South', 'East', 'West', 'Central'] as const;

const lineData: Data = {
  columns: [{ key: 'month' }, ...LINE_REGIONS.map((region) => ({ key: region }))],
  rows: [
    { month: 'Jan', North: 300, South: 200, East: 400, West: 500, Central: 600 },
    { month: 'Feb', North: 350, South: 250, East: 450, West: 550, Central: 650 },
    { month: 'Mar', North: 400, South: 300, East: 500, West: 600, Central: 700 },
    { month: 'Apr', North: 450, South: 350, East: 550, West: 650, Central: 750 },
    { month: 'May', North: 500, South: 400, East: 600, West: 700, Central: 800 },
    { month: 'Jun', North: 550, South: 450, East: 650, West: 750, Central: 850 },
  ],
};

const lineReshapeToLong = transform.reshape({
  keep: ['month'],
  reshape: [...LINE_REGIONS],
  keyName: 'region',
  valueName: 'sales',
});

interface LineLegendArgs {
  position: LegendPosition;
  display: LegendDisplay;
}

export const LineLegend: StoryObj<LineLegendArgs> = {
  argTypes: {
    position: positionControl,
    display: displayControl,
  },
  args: {
    position: 'auto',
    display: 'auto',
  },
  render: (args) => {
    const configPosition = toConfigLegendPosition(args.position, args.display);
    const graphConfig: GraphConfig | undefined =
      configPosition === undefined
        ? undefined
        : {
            type: 'line',
            legend: { position: configPosition },
            content: {
              title: 'Sales by quarter and region',
              subtitle: 'Sales by quarter and region',
              caption: 'Sales by quarter and region',
            },
          };

    return (
      <VizStoryGraphProvider
        data={lineData}
        spec={pipe(
          createSpec(lineReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
          geom.line(),
          scale.x(),
          scale.y(),
          scale.color.palette(),
          config({
            content: {
              title: 'Sales by quarter and region',
              subtitle: 'Sales by quarter and region',
              caption: 'Sales by quarter and region',
            },
            legend: { position: args.position, display: args.display },
            axes: { y: { label: 'sales' } },
          })
        )}
        config={graphConfig}
      >
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Multi-layer (line + point overlay) ───────────────────────────────────────

interface MultiLayerArgs {
  position: LegendPosition;
  display: LegendDisplay;
}

export const MultiLayer: StoryObj<MultiLayerArgs> = {
  argTypes: {
    position: positionControl,
    display: displayControl,
  },
  args: {
    position: 'auto',
    display: 'auto',
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={lineData}
      spec={pipe(
        createSpec(lineReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
        geom.line(),
        geom.point({ interactive: false }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({
          content: {
            title: 'Sales by quarter and region',
            subtitle: 'Sales by quarter and region',
            caption: 'Sales by quarter and region',
          },
          legend: { position: args.position, display: args.display },
        })
      )}
      config={{
        type: 'line',
        options: { showPoints: true },
        content: {
          title: 'Sales by quarter and region',
          subtitle: 'Sales by quarter and region',
          caption: 'Sales by quarter and region',
        },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
// ─── Bubble size (continuous size scale) ──────────────────────────────────────
const bubbleData: Data = {
  columns: [{ key: 'gdp' }, { key: 'lifeExpectancy' }, { key: 'population' }, { key: 'continent' }],
  rows: [
    { gdp: 2000, lifeExpectancy: 55, population: 200, continent: 'Africa' },
    { gdp: 5000, lifeExpectancy: 60, population: 50, continent: 'Asia' },
    { gdp: 10000, lifeExpectancy: 65, population: 300, continent: 'Asia' },
    { gdp: 15000, lifeExpectancy: 70, population: 100, continent: 'Europe' },
    { gdp: 25000, lifeExpectancy: 75, population: 30, continent: 'Europe' },
    { gdp: 40000, lifeExpectancy: 80, population: 60, continent: 'Europe' },
    { gdp: 55000, lifeExpectancy: 82, population: 120, continent: 'Europe' },
    { gdp: 8000, lifeExpectancy: 62, population: 180, continent: 'Americas' },
    { gdp: 3000, lifeExpectancy: 58, population: 90, continent: 'Africa' },
    { gdp: 45000, lifeExpectancy: 81, population: 40, continent: 'Americas' },
  ],
};

interface BubbleLegendArgs {
  position: LegendPosition;
  display: LegendDisplay;
  withColor: boolean;
}

export const BubbleSize: StoryObj<BubbleLegendArgs> = {
  argTypes: {
    position: positionControl,
    display: displayControl,
  },
  args: {
    position: 'auto',
    display: 'auto',
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={bubbleData}
      spec={pipe(
        createSpec({
          x: 'gdp',
          y: 'lifeExpectancy',
          size: 'population',
        }),
        geom.point(),
        scale.x(),
        scale.y(),
        scale.size.continuous(),
        config({
          content: {
            title: 'Sales by quarter and region',
            subtitle: 'Sales by quarter and region',
            caption: 'Sales by quarter and region',
          },
          legend: { position: args.position, display: args.display },
        })
      )}
      config={{ type: 'bubble' }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Direct labels — overlap repulsion ───────────────────────────────────────
const CONVERGING_SERIES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'] as const;

const convergingLineData: Data = {
  columns: [{ key: 'month' }, ...CONVERGING_SERIES.map((series) => ({ key: series }))],
  rows: [
    { month: 'Jan', Alpha: 100, Bravo: 200, Charlie: 300, Delta: 400, Echo: 500, Foxtrot: 600 },
    { month: 'Feb', Alpha: 200, Bravo: 280, Charlie: 350, Delta: 420, Echo: 500, Foxtrot: 580 },
    { month: 'Mar', Alpha: 350, Bravo: 380, Charlie: 410, Delta: 450, Echo: 490, Foxtrot: 530 },
    { month: 'Apr', Alpha: 460, Bravo: 470, Charlie: 485, Delta: 500, Echo: 510, Foxtrot: 525 },
    { month: 'May', Alpha: 500, Bravo: 505, Charlie: 510, Delta: 515, Echo: 520, Foxtrot: 530 },
    { month: 'Jun', Alpha: 510, Bravo: 514, Charlie: 518, Delta: 522, Echo: 526, Foxtrot: 530 },
  ],
};

const convergingReshape = transform.reshape({
  keep: ['month'],
  reshape: [...CONVERGING_SERIES],
  keyName: 'series',
  valueName: 'value',
});

interface OverlapArgs {
  position: LegendPosition;
  textScale: number;
}

/**
 * Six line series converge near the right edge so their direct labels would
 * naturally stack. The `computeDirectLabelsLayout` runtime spreads them apart in pixel
 * space and the renderer draws dashed cubic-Bézier connectors back to each
 * line's true endpoint.
 */
export const OverlappingDirectLabels: StoryObj<OverlapArgs> = {
  argTypes: {
    position: positionControl,
    textScale: {
      control: { type: 'range', min: 0.5, max: 3, step: 0.1 },
      description: 'Scales all chart text. Direct-label spacing tracks the resolved line-box height.',
    },
  },
  args: {
    position: 'right',
    textScale: 1,
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={convergingLineData}
      spec={pipe(
        createSpec(convergingReshape, mapping({ x: 'month', y: 'value', color: 'series' })),
        geom.line(),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({
          content: {
            title: 'Converging series',
            subtitle: 'Direct labels are spread apart; dashed connectors trace each label back to its line endpoint.',
          },
          legend: { position: args.position, display: 'direct' },
          axes: { y: { label: 'value' } },
          appearance: { textScale: args.textScale },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Overflow (many series / long labels) ────────────────────────────────────

const OVERFLOW_REGIONS = [
  'North American Operations',
  'Latin American Markets',
  'European Headquarters',
  'Asia Pacific Region',
  'Middle East & Africa',
  'Oceania Distributors',
  'Central Asia Partners',
  'Nordic Subsidiaries',
] as const;

const overflowData: Data = {
  columns: [{ key: 'month' }, ...OVERFLOW_REGIONS.map((region) => ({ key: region }))],
  rows: [
    { month: 'Jan' },
    { month: 'Feb' },
    { month: 'Mar' },
    { month: 'Apr' },
    { month: 'May' },
    { month: 'Jun' },
  ].map((row, rowIndex) =>
    OVERFLOW_REGIONS.reduce<Record<string, string | number>>(
      (accumulator, region, regionIndex) => ({
        ...accumulator,
        [region]: 100 + rowIndex * 30 + regionIndex * 15,
      }),
      row
    )
  ),
};

const overflowReshape = transform.reshape({
  keep: ['month'],
  reshape: [...OVERFLOW_REGIONS],
  keyName: 'region',
  valueName: 'sales',
});

interface OverflowLegendArgs {
  position: LegendPosition;
  textScale: number;
}

/**
 * Demonstrates pill-legend overflow. With many series and long labels, only the
 * pills that fit are rendered; the remainder collapse into a `+N` pill whose
 * popover lists everything that's hidden. Resize the plot to see the overflow
 * threshold adjust live.
 */
export const OverflowPillLegends: StoryObj<OverflowLegendArgs> = {
  argTypes: {
    position: positionControl,
    textScale: {
      control: { type: 'range', min: 0.5, max: 3, step: 0.1 },
      description: 'Scales all chart text. Direct-label spacing tracks the resolved line-box height.',
    },
  },
  args: {
    position: 'top',
    textScale: 1,
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={overflowData}
      spec={pipe(
        createSpec(overflowReshape, mapping({ x: 'month', y: 'sales', color: 'region' })),
        geom.line(),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({
          content: { title: 'Regional sales' },
          legend: { position: args.position, display: 'pill' },
          appearance: { textScale: args.textScale },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
