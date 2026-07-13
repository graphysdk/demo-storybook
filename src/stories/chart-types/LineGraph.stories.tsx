import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

type LineGraphArgs = {
  flipped: boolean;
  showFill: boolean;
};

const meta: Meta<LineGraphArgs> = {
  title: 'Chart Types/Line Graph',
  decorators: [ResizablePlotDecorator],
  args: {
    flipped: false,
    showFill: false,
  },
  argTypes: {
    flipped: {
      control: 'boolean',
      description: 'Flip x/y axes to render horizontal lines.',
    },
    showFill: {
      control: 'boolean',
      description: 'Draw a gradient fill beneath the line.',
    },
  },
};

export default meta;
type Story = StoryObj<LineGraphArgs>;

const flipIfNeeded = (flipped: boolean) => (flipped ? [coord.flip()] : []);

// ─── Simple line graph ─────────────────────────────────────────────────────
const simpleData: Data = {
  columns: [{ key: 'month' }, { key: 'revenue' }],
  rows: [
    { month: 'Jan', revenue: 1200 },
    { month: 'Feb', revenue: 1800 },
    { month: 'Mar', revenue: 2400 },
    { month: 'Apr', revenue: 1600 },
    { month: 'May', revenue: 3200 },
    { month: 'Jun', revenue: 2800 },
  ],
};

export const Simple: Story = {
  args: { showFill: true },
  render: (args) => (
    <VizStoryGraphProvider
      data={simpleData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.line({ params: { showFill: args.showFill } }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'line', options: { showFill: args.showFill } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Multi-series line graph ───────────────────────────────────────────────
const REGIONS = ['North', 'South', 'East', 'West', 'Central'] as const;

const multiSeriesData: Data = {
  columns: [{ key: 'month' }, { key: 'North' }, { key: 'South' }, { key: 'East' }, { key: 'West' }, { key: 'Central' }],
  rows: [
    { month: 'Jan', North: 600, South: 900, East: 1400, West: 1800, Central: 2400 },
    { month: 'Feb', North: 700, South: 1050, East: 1600, West: 2000, Central: 2700 },
    { month: 'Mar', North: 800, South: 1200, East: 1800, West: 2200, Central: 3000 },
    { month: 'Apr', North: 900, South: 1350, East: 2000, West: 2400, Central: 3300 },
    { month: 'May', North: 1000, South: 1500, East: 2200, West: 2600, Central: 3600 },
    { month: 'Jun', North: 1100, South: 1650, East: 2400, West: 2800, Central: 3900 },
  ],
};

export const MultiSeries: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={multiSeriesData}
      spec={pipe(
        createSpec(
          transform.reshape({
            keep: ['month'],
            reshape: [...REGIONS],
            keyName: 'region',
            valueName: 'sales',
          }),
          mapping({ x: 'month', y: 'sales', color: 'region' })
        ),
        geom.line({ params: { showFill: args.showFill } }),
        geom.point({ interactive: false }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({ legend: { position: 'top' } }),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'line',
        options: { showPoints: true, showFill: args.showFill },
        axes: { y: { label: 'sales' } },
        legend: { position: 'top' },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Per-series line styles ────────────────────────────────────────────────
const LINE_STYLE_REGIONS = ['North', 'South', 'East'] as const;

const lineStylesData: Data = {
  columns: [{ key: 'month' }, { key: 'North' }, { key: 'South' }, { key: 'East' }],
  rows: [
    { month: 'Jan', North: 600, South: 900, East: 1400 },
    { month: 'Feb', North: 700, South: 1050, East: 1600 },
    { month: 'Mar', North: 800, South: 1200, East: 1800 },
    { month: 'Apr', North: 900, South: 1350, East: 2000 },
    { month: 'May', North: 1000, South: 1500, East: 2200 },
    { month: 'Jun', North: 1100, South: 1650, East: 2400 },
  ],
};

export const LineStyles: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={lineStylesData}
      spec={pipe(
        createSpec(
          transform.reshape({
            keep: ['month'],
            reshape: [...LINE_STYLE_REGIONS],
            keyName: 'region',
            valueName: 'sales',
          }),
          mapping({ x: 'month', y: 'sales', color: 'region', lineType: 'region' })
        ),
        geom.line({ params: { showFill: args.showFill } }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        scale.lineType.discrete({ domain: [...LINE_STYLE_REGIONS], range: ['solid', 'dashed', 'dotted'] }),
        config({ legend: { position: 'top' } }),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'line',
        options: { showFill: args.showFill },
        axes: { y: { label: 'sales' } },
        legend: { position: 'top' },
        appearance: {
          seriesStyles: {
            North: { lineStyle: 'solid' },
            South: { lineStyle: 'dashed' },
            East: { lineStyle: 'dotted' },
          },
        },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Smooth (catmull-rom) interpolation ────────────────────────────────────
export const Smooth: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={simpleData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.line({ params: { interpolate: 'catmull-rom', showFill: args.showFill } }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'line', options: { isSmoothLine: true, showFill: args.showFill } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── With missing values (gap) ─────────────────────────────────────────────
const missingData: Data = {
  columns: [{ key: 'month' }, { key: 'revenue' }],
  rows: [
    { month: 'Jan', revenue: 1200 },
    { month: 'Feb', revenue: 1800 },
    { month: 'Mar', revenue: null },
    { month: 'Apr', revenue: null },
    { month: 'May', revenue: 3200 },
    { month: 'Jun', revenue: 2800 },
  ],
};

export const MissingValuesGap: Story = {
  args: {
    showFill: true,
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={missingData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.line({ params: { missingValues: 'gap', showFill: args.showFill } }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'line', options: { missingValues: 'gap', showFill: args.showFill } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── With missing values (connect) ─────────────────────────────────────────
export const MissingValuesConnect: Story = {
  args: {
    showFill: true,
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={missingData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.line({ params: { missingValues: 'connect', showFill: args.showFill } }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'line', options: { missingValues: 'connect', showFill: args.showFill } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── With missing values (zero) ────────────────────────────────────────────
export const MissingValuesZero: Story = {
  args: {
    showFill: true,
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={missingData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.line({ params: { missingValues: 'zero', showFill: args.showFill } }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'line', options: { missingValues: 'zero', showFill: args.showFill } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
