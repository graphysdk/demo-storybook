import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

type LegendPosition = 'auto' | 'top' | 'right' | 'bottom' | 'left' | 'none';
type LegendDisplay = 'auto' | 'pill' | 'direct';
type XAxisPosition = 'top' | 'bottom';
type YAxisPosition = 'left' | 'right';
type GeomKind = 'bar' | 'line' | 'point';
type LineOrPointGeomKind = 'line' | 'point';
type AxisTickMode = 'auto' | 'edges';
type AxisScaleType = 'linear' | 'log';

const LEGEND_POSITIONS: LegendPosition[] = ['auto', 'top', 'right', 'bottom', 'left', 'none'];
const LEGEND_DISPLAYS: LegendDisplay[] = ['auto', 'pill', 'direct'];
const X_AXIS_POSITIONS: XAxisPosition[] = ['bottom', 'top'];
const Y_AXIS_POSITIONS: YAxisPosition[] = ['left', 'right'];
const GEOM_KINDS: GeomKind[] = ['bar', 'line', 'point'];
const LINE_OR_POINT_GEOMS: LineOrPointGeomKind[] = ['line', 'point'];
const AXIS_TICK_MODES: AxisTickMode[] = ['auto', 'edges'];
const AXIS_SCALE_TYPES: AxisScaleType[] = ['linear', 'log'];

const buildGeomLayer = (geomKind: GeomKind) =>
  geomKind === 'bar' ? geom.bar({ position: 'dodge' }) : geomKind === 'line' ? geom.line() : geom.point();

/** A flipped chart swaps the x and y axes (horizontal orientation, e.g. horizontal bars); cartesian is the default. */
const coordFor = (flip: boolean) => (flip ? coord.flip() : coord.cartesian());

const flipArgType = {
  control: { type: 'boolean' },
  description:
    'Swap the x and y axes (horizontal orientation). Axis config is bound to the data axis, so flipping rotates which side each axis is drawn on.',
} as const;

const meta: Meta = {
  title: 'Features/Axis',
  decorators: [ResizablePlotDecorator],
};

export default meta;

const REGIONS = ['North', 'South', 'East'] as const;

const sourceData: Data = {
  columns: [{ key: 'month' }, ...REGIONS.map((region) => ({ key: region }))],
  rows: [
    { month: 'Jan', North: 300, South: 200, East: 400 },
    { month: 'Feb', North: 350, South: 250, East: 450 },
    { month: 'Mar', North: 400, South: 300, East: 500 },
    { month: 'Apr', North: 450, South: 350, East: 550 },
    { month: 'May', North: 500, South: 400, East: 600 },
    { month: 'Jun', North: 550, South: 450, East: 650 },
  ],
};

const reshapeToLong = transform.reshape({
  keep: ['month'],
  reshape: [...REGIONS],
  keyName: 'region',
  valueName: 'sales',
});

interface AxisAndLegendPositionArgs {
  geomKind: GeomKind;
  flip: boolean;
  legendPosition: LegendPosition;
  legendDisplay: LegendDisplay;
  xAxisPosition: XAxisPosition;
  yAxisPosition: YAxisPosition;
  isXAxisVisible: boolean;
  isYAxisVisible: boolean;
}

export const AxisAndLegendPosition: StoryObj<AxisAndLegendPositionArgs> = {
  argTypes: {
    geomKind: {
      control: { type: 'inline-radio' },
      options: GEOM_KINDS,
      description: 'Which geom to render.',
    },
    flip: flipArgType,
    legendPosition: {
      control: { type: 'select' },
      options: LEGEND_POSITIONS,
      description: 'Where the legend is anchored relative to the plot.',
    },
    legendDisplay: {
      control: { type: 'select' },
      options: LEGEND_DISPLAYS,
      description: 'pill = boxed swatches; direct = inline labels at series endpoints.',
    },
    xAxisPosition: {
      control: { type: 'inline-radio' },
      options: X_AXIS_POSITIONS,
      description: 'Side of the plot where the x axis is drawn.',
    },
    yAxisPosition: {
      control: { type: 'inline-radio' },
      options: Y_AXIS_POSITIONS,
      description: 'Side of the plot where the y axis is drawn.',
    },
    isXAxisVisible: {
      control: { type: 'boolean' },
      description: 'Toggle x axis visibility.',
    },
    isYAxisVisible: {
      control: { type: 'boolean' },
      description: 'Toggle y axis visibility.',
    },
  },
  args: {
    geomKind: 'bar',
    flip: false,
    legendPosition: 'auto',
    legendDisplay: 'auto',
    xAxisPosition: 'bottom',
    yAxisPosition: 'right',
    isXAxisVisible: true,
    isYAxisVisible: true,
  },
  render: (args) => {
    const spec = pipe(
      createSpec(reshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
      buildGeomLayer(args.geomKind),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      coordFor(args.flip),
      config({
        content: {
          title: 'Sales by month and region',
          subtitle: 'Drag the controls to reposition the axes and legend',
        },
        legend: { position: args.legendPosition, display: args.legendDisplay },
        axes: {
          x: { isVisible: args.isXAxisVisible, position: args.xAxisPosition },
          y: { isVisible: args.isYAxisVisible, position: args.yAxisPosition },
        },
      })
    );

    return (
      <VizStoryGraphProvider data={sourceData} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

interface AxisLabelsArgs {
  geomKind: GeomKind;
  flip: boolean;
  xLabel: string;
  yLabel: string;
}

export const AxisLabels: StoryObj<AxisLabelsArgs> = {
  argTypes: {
    geomKind: {
      control: { type: 'inline-radio' },
      options: GEOM_KINDS,
      description: 'Which geom to render.',
    },
    flip: flipArgType,
    xLabel: {
      control: { type: 'text' },
      description: 'X axis title. Clear the field to hide the label.',
    },
    yLabel: {
      control: { type: 'text' },
      description: 'Y axis title. Clear the field to hide the label.',
    },
  },
  args: {
    geomKind: 'bar',
    flip: false,
    xLabel: 'Month',
    yLabel: 'Sales',
  },
  render: (args) => {
    const spec = pipe(
      createSpec(reshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
      buildGeomLayer(args.geomKind),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      coordFor(args.flip),
      config({
        content: { title: 'Axis labels', subtitle: 'Set axis titles; clear a field to hide that axis label' },
        axes: {
          x: { label: args.xLabel.trim() === '' ? null : args.xLabel },
          y: { label: args.yLabel.trim() === '' ? null : args.yLabel },
        },
      })
    );

    return (
      <VizStoryGraphProvider data={sourceData} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

interface AxisGridAndTicksArgs {
  geomKind: GeomKind;
  flip: boolean;
  showXGrid: boolean;
  showYGrid: boolean;
  showXTicks: boolean;
  showYTicks: boolean;
}

export const AxisGridAndTicks: StoryObj<AxisGridAndTicksArgs> = {
  argTypes: {
    geomKind: {
      control: { type: 'inline-radio' },
      options: GEOM_KINDS,
      description: 'Which geom to render.',
    },
    flip: flipArgType,
    showXGrid: { control: { type: 'boolean' }, description: 'Show grid lines aligned with the x axis.' },
    showYGrid: { control: { type: 'boolean' }, description: 'Show grid lines aligned with the y axis.' },
    showXTicks: { control: { type: 'boolean' }, description: 'Show tick marks on the x axis.' },
    showYTicks: { control: { type: 'boolean' }, description: 'Show tick marks on the y axis.' },
  },
  args: {
    geomKind: 'line',
    flip: false,
    showXGrid: true,
    showYGrid: true,
    showXTicks: true,
    showYTicks: true,
  },
  render: (args) => {
    const spec = pipe(
      createSpec(reshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
      buildGeomLayer(args.geomKind),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      coordFor(args.flip),
      config({
        content: { title: 'Grid lines and tick marks', subtitle: 'Toggle grid lines and tick marks per axis' },
        axes: {
          x: { grid: { isVisible: args.showXGrid }, ticks: { isVisible: args.showXTicks } },
          y: { grid: { isVisible: args.showYGrid }, ticks: { isVisible: args.showYTicks } },
        },
      })
    );

    return (
      <VizStoryGraphProvider data={sourceData} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

interface AxisScaleArgs {
  geomKind: LineOrPointGeomKind;
  flip: boolean;
  yScaleType: AxisScaleType;
  yMin?: number;
  yMax?: number;
}

export const AxisScale: StoryObj<AxisScaleArgs> = {
  argTypes: {
    geomKind: {
      control: { type: 'inline-radio' },
      options: LINE_OR_POINT_GEOMS,
      description: 'Which geom to render.',
    },
    flip: flipArgType,
    yScaleType: {
      control: { type: 'inline-radio' },
      options: AXIS_SCALE_TYPES,
      description: 'Linear or base-10 logarithmic value scale (log requires positive values).',
    },
    yMin: { control: { type: 'number' }, description: 'Fixed value-axis minimum. Leave empty for auto.' },
    yMax: { control: { type: 'number' }, description: 'Fixed value-axis maximum. Leave empty for auto.' },
  },
  args: {
    geomKind: 'line',
    flip: false,
    yScaleType: 'linear',
    yMin: undefined,
    yMax: undefined,
  },
  render: (args) => {
    const yScaleOptions = {
      ...(args.yMin !== undefined ? { domainMin: args.yMin } : {}),
      ...(args.yMax !== undefined ? { domainMax: args.yMax } : {}),
    };
    const yScale = args.yScaleType === 'log' ? scale.y.log(yScaleOptions) : scale.y.continuous(yScaleOptions);

    const spec = pipe(
      createSpec(reshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
      buildGeomLayer(args.geomKind),
      scale.x(),
      yScale,
      scale.color.palette(),
      coordFor(args.flip),
      config({
        content: { title: 'Value scale and range', subtitle: 'Fix the value range or switch to a logarithmic scale' },
      })
    );

    return (
      <VizStoryGraphProvider data={sourceData} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

const monthlyVisitorsData: Data = {
  columns: [{ key: 'date' }, { key: 'visitors' }],
  rows: [
    { date: new Date('2024-01-01'), visitors: 1200 },
    { date: new Date('2024-02-01'), visitors: 1480 },
    { date: new Date('2024-03-01'), visitors: 1350 },
    { date: new Date('2024-04-01'), visitors: 1620 },
    { date: new Date('2024-05-01'), visitors: 1890 },
    { date: new Date('2024-06-01'), visitors: 2050 },
    { date: new Date('2024-07-01'), visitors: 1970 },
    { date: new Date('2024-08-01'), visitors: 2240 },
    { date: new Date('2024-09-01'), visitors: 2410 },
    { date: new Date('2024-10-01'), visitors: 2300 },
    { date: new Date('2024-11-01'), visitors: 2680 },
    { date: new Date('2024-12-01'), visitors: 2950 },
  ],
};

interface AxisTickModeArgs {
  geomKind: LineOrPointGeomKind;
  flip: boolean;
  xTickMode: AxisTickMode;
  yTickMode: AxisTickMode;
}

export const AxisTickModes: StoryObj<AxisTickModeArgs> = {
  argTypes: {
    geomKind: {
      control: { type: 'inline-radio' },
      options: LINE_OR_POINT_GEOMS,
      description: 'Which geom to render over the datetime axis.',
    },
    flip: flipArgType,
    xTickMode: {
      control: { type: 'inline-radio' },
      options: AXIS_TICK_MODES,
      description: "'edges' collapses the datetime x axis to only its first and last tick.",
    },
    yTickMode: {
      control: { type: 'inline-radio' },
      options: AXIS_TICK_MODES,
      description: "'edges' collapses the continuous y axis to only its first and last tick.",
    },
  },
  args: {
    geomKind: 'line',
    flip: false,
    xTickMode: 'edges',
    yTickMode: 'auto',
  },
  render: (args) => {
    const spec = pipe(
      createSpec(mapping({ x: 'date', y: 'visitors' })),
      buildGeomLayer(args.geomKind),
      scale.x.datetime(),
      scale.y(),
      coordFor(args.flip),
      config({
        content: {
          title: 'Monthly visitors',
          subtitle: "Switch tick mode — 'edges' shows only the first and last tick (numeric/datetime axes only)",
        },
        axes: {
          x: { ticks: { mode: args.xTickMode } },
          y: { ticks: { mode: args.yTickMode } },
        },
      })
    );

    return (
      <VizStoryGraphProvider data={monthlyVisitorsData} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
