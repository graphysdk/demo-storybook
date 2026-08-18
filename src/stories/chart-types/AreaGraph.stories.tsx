import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { coord, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

type AreaGraphArgs = {
  flipped: boolean;
};

const meta: Meta<AreaGraphArgs> = {
  title: 'Chart Types/Area Graph',
  decorators: [ResizablePlotDecorator],
  args: {
    flipped: false,
  },
  argTypes: {
    flipped: {
      control: 'boolean',
      description: 'Flip x/y axes to render horizontal areas.',
    },
  },
};

export default meta;
type Story = StoryObj<AreaGraphArgs>;

const flipIfNeeded = (flipped: boolean) => (flipped ? [coord.flip()] : []);

// ─── Simple area graph ─────────────────────────────────────────────────────
const simpleData: Data = {
  columns: [{ key: 'month' }, { key: 'revenue' }],
  rows: [
    { month: '1 Jan', revenue: 1200 },
    { month: '2 Jan', revenue: 1800 },
    { month: '3 Jan', revenue: 2400 },
    { month: '4 Jan', revenue: 1600 },
    { month: '5 Jan', revenue: 3200 },
    { month: '6 Jan', revenue: 2800 },
  ],
};

export const Simple: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={simpleData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.area(),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'areaStacked',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Stacked area graph ────────────────────────────────────────────────────
const stackedData: Data = {
  columns: [{ key: 'month' }, { key: 'North' }, { key: 'South' }],
  rows: [
    { month: 'Jan', North: 300, South: 200 },
    { month: 'Feb', North: 400, South: 350 },
    { month: 'Mar', North: 350, South: 300 },
    { month: 'Apr', North: 500, South: 400 },
    { month: 'May', North: 450, South: 500 },
    { month: 'Jun', North: 600, South: 450 },
  ],
};

export const Stacked: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={stackedData}
      spec={pipe(
        createSpec(transform.reshape(), mapping({ x: 'month', y: 'value', color: 'key' })),
        geom.area(),
        geom.point({ position: 'stack', interactive: false }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'areaStacked', options: { showPoints: true } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Stacked, divergent year-less month sequences (ADR-036) ──────────────────
// Year synthesis runs per group before the geom sorts and before stacking, so on this
// CONTINUOUS datetime axis the Dec→Jan wrap is honoured: Alpha leads with `Dec`, so its
// Jan/Feb/Mar advance to the next year, while Beta (starting at `Jan`) stays on the base
// year. The two series therefore occupy different time regions and do NOT share an x, so
// nothing is falsely stacked: Beta sits in early-year on the baseline, Alpha runs from its
// Dec into the next year, and the points sit exactly on the area.
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
        createSpec(mapping({ x: 'month', y: 'revenue', color: 'product' })),
        geom.area(),
        geom.point({ position: 'stack', interactive: false }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{ type: 'areaStacked', options: { showPoints: true } }}
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
        geom.area({ params: { interpolate: 'catmull-rom' } }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'areaStacked',
        options: { isSmoothLine: true },
      }}
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
  render: (args) => (
    <VizStoryGraphProvider
      data={missingData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.area({ params: { missingValues: 'gap' } }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'areaStacked',
        options: { missingValues: 'gap' },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── With missing values (connect) ─────────────────────────────────────────

export const MissingValuesConnect: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={missingData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.area({ params: { missingValues: 'connect' } }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'areaStacked',
        options: { missingValues: 'connect' },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── With missing values (zero) ────────────────────────────────────────────

export const MissingValuesZero: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={missingData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.area({ params: { missingValues: 'zero' } }),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'areaStacked',
        options: { missingValues: 'zero' },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
