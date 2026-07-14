import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { BarGeomParams, Data } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

type BarGraphArgs = {
  flipped: boolean;
  width: number;
  pill: boolean;
  borderRadius?: number;
  borderColor: string;
  borderWidth: number;
};

const buildBarStyleParams = (args: BarGraphArgs): Partial<BarGeomParams> => ({
  width: args.width,
  borderRadius: args.pill ? 'full' : args.borderRadius,
  borderColor: args.borderColor || undefined,
  borderWidth: args.borderWidth,
});

const meta: Meta<BarGraphArgs> = {
  title: 'Chart Types/Bar Graph',
  decorators: [ResizablePlotDecorator],
  args: {
    flipped: false,
    width: 0.7,
    pill: false,
    borderColor: '',
    borderWidth: 1,
  },
  argTypes: {
    flipped: {
      control: 'boolean',
      description: 'Flip x/y axes to render horizontal bars.',
    },
    width: {
      control: { type: 'range', min: 0.1, max: 1, step: 0.05 },
      description: 'Bar width as a fraction of the category band.',
    },
    pill: {
      control: 'boolean',
      description: "Pill-shaped bars (borderRadius: 'full') — overrides the numeric radius.",
    },
    borderRadius: {
      control: { type: 'range', min: 0, max: 24, step: 1 },
      description: 'Corner rounding in pixels. Unset uses the automatic radius; stacks round only the outer corners.',
      if: { arg: 'pill', truthy: false },
    },
    borderColor: {
      control: 'color',
      description: 'Border color. Empty draws no border.',
    },
    borderWidth: {
      control: { type: 'range', min: 1, max: 6, step: 1 },
      description: 'Border width in pixels. Only takes effect when a border color is set.',
    },
  },
};

export default meta;
type Story = StoryObj<BarGraphArgs>;

const flipIfNeeded = (flipped: boolean) => (flipped ? [coord.flip()] : []);

// ─── Simple bar graph ───────────────────────────────────────────────────────
const simpleData = {
  columns: [{ key: 'category' }, { key: 'revenue' }],
  rows: [
    { category: 'Product A', revenue: 1200 },
    { category: 'Product B', revenue: 1800 },
    { category: 'Product C', revenue: 2400 },
    { category: 'Product D', revenue: 1600 },
    { category: 'Product E', revenue: 3200 },
    { category: 'Product F', revenue: 2800 },
  ],
};

export const Simple: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={simpleData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'category', y: 'revenue' }),
        geom.bar({ params: buildBarStyleParams(args) }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'column',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Stacked / Dodged / Fill share the same underlying data ────────────────
const multiSeriesData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }],
  rows: [
    { quarter: 'Q1', North: 350, South: 200, West: 500 },
    { quarter: 'Q2', North: 300, South: 250, West: 350 },
    { quarter: 'Q3', North: 400, South: 300, West: 300 },
    { quarter: 'Q4', North: 200, South: 150, West: 400 },
  ],
};

const reshapeToLong = transform.reshape({
  keep: ['quarter'],
  reshape: ['North', 'South', 'West'],
  keyName: 'region',
  valueName: 'sales',
});

export const Stacked: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={multiSeriesData}
      spec={pipe(
        createSpec(),
        reshapeToLong,
        mapping({ x: 'quarter', y: 'sales', color: 'region' }),
        geom.bar({ position: 'stack', params: buildBarStyleParams(args) }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'columnStacked', axes: { y: { label: 'sales' } } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

export const Dodged: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={multiSeriesData}
      spec={pipe(
        createSpec(),
        reshapeToLong,
        mapping({ x: 'quarter', y: 'sales', color: 'region' }),
        geom.bar({ position: 'dodge', params: buildBarStyleParams(args) }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'column' }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

export const Fill: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={multiSeriesData}
      spec={pipe(
        createSpec(),
        reshapeToLong,
        mapping({ x: 'quarter', y: 'sales', color: 'region' }),
        geom.bar({ position: 'fill', params: buildBarStyleParams(args) }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'columnStackedFill' }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Stacked long-format series ─────────────────────────────────────────────
// Already in long format: `product` is the series column, so it maps straight to
// color with no reshape.
const multiSeries: Data = {
  columns: [{ key: 'month' }, { key: 'revenue' }, { key: 'product' }],
  rows: [
    { month: 'Jan', revenue: 120, product: 'Alpha' },
    { month: 'Feb', revenue: 280, product: 'Alpha' },
    { month: 'Mar', revenue: 200, product: 'Alpha' },
    { month: 'Apr', revenue: 340, product: 'Alpha' },
    { month: 'Jan', revenue: 90, product: 'Beta' },
    { month: 'Feb', revenue: 150, product: 'Beta' },
    { month: 'Mar', revenue: 240, product: 'Beta' },
    { month: 'Apr', revenue: 180, product: 'Beta' },
  ],
};

export const StackedByProduct: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={multiSeries}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'revenue', color: 'product' }),
        geom.bar({ position: 'stack', params: buildBarStyleParams(args) }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'columnStacked' }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Stacked, divergent year-less month sequences (ADR-036) ──────────────────
// Year synthesis assigns divergent years per group here too (Alpha's Jan advances a year
// because its leading `Dec` wraps; Beta's stays on the base year). But a BAR uses a band
// scale whose identity is the year-less month label, so both January values collapse into
// one `Jan` band and stack — the assigned year only affects band ordering (Dec sorts last).
// EXPECTED: four clean stacked bars (Jan/Feb/Mar stacked, Dec as Alpha-only). Contrast
// AreaGraph → StackedDivergentMonths, whose continuous axis keeps the years distinct.
const divergentMonthSeries: Data = {
  columns: [{ key: 'month' }, { key: 'revenue' }, { key: 'product' }],
  rows: [
    { month: 'Dec', revenue: 100, product: 'Alpha' },
    { month: 'Jan', revenue: 120, product: 'Alpha' },
    { month: 'Feb', revenue: 280, product: 'Alpha' },
    { month: 'Mar', revenue: 200, product: 'Alpha' },
    { month: 'Jan', revenue: 90, product: 'Beta' },
    { month: 'Feb', revenue: 150, product: 'Beta' },
    { month: 'Mar', revenue: 240, product: 'Beta' },
  ],
};

export const StackedDivergentMonths: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={divergentMonthSeries}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'revenue', color: 'product' }),
        geom.bar({ position: 'stack', params: buildBarStyleParams(args) }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'columnStacked' }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Single bar ─────────────────────────────────────────────────────────────

const singleBarData: Data = {
  columns: [{ key: 'item' }, { key: 'amount' }],
  rows: [{ item: 'Revenue', amount: 42000 }],
};

export const SingleBar: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={singleBarData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'item', y: 'amount' }),
        geom.bar({ position: 'identity', params: buildBarStyleParams(args) }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'column',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Count stat ─────────────────────────────────────────────────────────────
// Raw observations: each row is a single order. The `count` stat tallies
// observations per x value, so no `y` mapping is needed.
const ordersData: Data = {
  columns: [{ key: 'category' }],
  rows: [
    { category: 'Electronics' },
    { category: 'Electronics' },
    { category: 'Electronics' },
    { category: 'Electronics' },
    { category: 'Electronics' },
    { category: 'Books' },
    { category: 'Books' },
    { category: 'Clothing' },
    { category: 'Clothing' },
    { category: 'Clothing' },
    { category: 'Clothing' },
    { category: 'Home' },
    { category: 'Home' },
    { category: 'Home' },
  ],
};

export const CountStat: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={ordersData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'category' }),
        geom.bar({ stat: 'count', params: buildBarStyleParams(args) }),
        scale.x(),
        scale.y(),
        config({ axes: { y: { label: 'Count' } } }),
        ...flipIfNeeded(args.flipped)
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── With negative values ───────────────────────────────────────────────────
const negativeData: Data = {
  columns: [{ key: 'month' }, { key: 'pnl' }],
  rows: [
    { month: 'Jan', pnl: 500 },
    { month: 'Feb', pnl: -200 },
    { month: 'Mar', pnl: 800 },
    { month: 'Apr', pnl: -300 },
    { month: 'May', pnl: 1200 },
    { month: 'Jun', pnl: -100 },
  ],
};

export const NegativeValues: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={negativeData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'pnl' }),
        geom.bar({ position: 'identity', params: buildBarStyleParams(args) }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'column',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
