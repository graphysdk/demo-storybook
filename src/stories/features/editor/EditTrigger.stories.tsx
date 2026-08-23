import type { Meta, StoryObj } from '@storybook/react';

import { EditableGraphRenderer } from '@graphysdk/react-renderer/editable';
import type { Data } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Editor/Edit trigger',
  parameters: {
    docs: {
      description: {
        component:
          'The canvas creation trigger. Hovering an observation paints a `(+)` at the `pin` anchor its geom declares; ' +
          'moving onto it grows it without dropping the hover, and clicking it turns it into a close cross. ' +
          'It comes with `EditableGraphRenderer` from `@graphysdk/react-renderer/editable`: importing that ' +
          'decides editing can happen, and `mode="editable"` decides it currently is.',
      },
    },
  },
};

export default meta;

const monthlyData: Data = {
  columns: [
    { key: 'month', label: 'Month' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'segment', label: 'Segment' },
  ],
  rows: [
    { month: 'Jul', revenue: 1200, segment: 'Direct' },
    { month: 'Aug', revenue: 1800, segment: 'Direct' },
    { month: 'Sep', revenue: 2400, segment: 'Direct' },
    { month: 'Oct', revenue: 2100, segment: 'Direct' },
    { month: 'Jul', revenue: 900, segment: 'Partner' },
    { month: 'Aug', revenue: 1500, segment: 'Partner' },
    { month: 'Sep', revenue: 1100, segment: 'Partner' },
    { month: 'Oct', revenue: 1900, segment: 'Partner' },
  ],
};

const departmentData: Data = {
  columns: [
    { key: 'department', label: 'Department' },
    { key: 'spend', label: 'Spend' },
  ],
  rows: [
    { department: 'Engineering', spend: 420 },
    { department: 'Sales', spend: 310 },
    { department: 'Marketing', spend: 180 },
    { department: 'Support', spend: 95 },
  ],
};

export const StackedBar: StoryObj = {
  name: 'Stacked bar',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        story:
          'A stacked segment shares its outer edge with its neighbour, so the `pin` anchor moves in to the ' +
          "segment's own centre — the trigger reads as belonging to one segment rather than either.",
      },
    },
  },
  render: () => {
    const spec = pipe(
      createSpec(mapping({ x: 'month', y: 'revenue', color: 'segment' })),
      geom.bar({ position: 'stack' }),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({})
    );
    return (
      <VizStoryGraphProvider data={monthlyData} spec={spec}>
        <EditableGraphRenderer mode="editable" />
      </VizStoryGraphProvider>
    );
  },
};

export const GroupedBarFlipped: StoryObj = {
  name: 'Grouped bar — flipped',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Flipped axes: an unstacked bar anchors on its outer edge, which `coord.flip()` moves to the right.',
      },
    },
  },
  render: () => {
    const spec = pipe(
      createSpec(mapping({ x: 'month', y: 'revenue', color: 'segment' })),
      geom.bar({ position: 'dodge' }),
      coord.flip(),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({})
    );
    return (
      <VizStoryGraphProvider data={monthlyData} spec={spec}>
        <EditableGraphRenderer mode="editable" />
      </VizStoryGraphProvider>
    );
  },
};

export const LineAndPoints: StoryObj = {
  name: 'Line with points',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        story: 'A vertex has no extent, so `pin` and `value` resolve to the same place: the observation itself.',
      },
    },
  },
  render: () => {
    const spec = pipe(
      createSpec(mapping({ x: 'month', y: 'revenue', color: 'segment' })),
      geom.line({}),
      geom.point({}),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({})
    );
    return (
      <VizStoryGraphProvider data={monthlyData} spec={spec}>
        <EditableGraphRenderer mode="editable" />
      </VizStoryGraphProvider>
    );
  },
};

export const Pie: StoryObj = {
  name: 'Pie',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        story:
          'Polar: a slice has no rectangular box, so the anchor is its midpoint projected out of the inscribed square.',
      },
    },
  },
  render: () => {
    const spec = pipe(
      createSpec(mapping({ x: '', y: 'spend', color: 'department' })),
      geom.bar({ position: 'fill' }),
      coord.polar({ theta: 'y' }),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({})
    );
    return (
      <VizStoryGraphProvider data={departmentData} spec={spec}>
        <EditableGraphRenderer mode="editable" />
      </VizStoryGraphProvider>
    );
  },
};

export const ReadOnly: StoryObj = {
  name: 'Read-only — no trigger',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        story:
          'The same component in the default mode: no trigger, and hover is tooltip-only. A host with a ' +
          'View/Edit switch flips `mode` here rather than swapping the chart out.',
      },
    },
  },
  render: () => {
    const spec = pipe(
      createSpec(mapping({ x: 'month', y: 'revenue', color: 'segment' })),
      geom.bar({ position: 'stack' }),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({})
    );
    return (
      <VizStoryGraphProvider data={monthlyData} spec={spec}>
        <EditableGraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
