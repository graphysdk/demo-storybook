import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data, LineStyleType } from '@graphysdk/viz-engine';
import { config, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

type GeomKind = 'bar' | 'line' | 'point';

const GEOM_KINDS: GeomKind[] = ['bar', 'line', 'point'];
const LINE_STYLES: LineStyleType[] = ['solid', 'dashed', 'dotted'];

const buildGeomLayer = (geomKind: GeomKind) =>
  geomKind === 'bar' ? geom.bar({ position: 'dodge' }) : geomKind === 'line' ? geom.line() : geom.point();

const meta: Meta = {
  title: 'Features/Panel',
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

const edgeVisibilityArgType = (edge: string) => ({
  control: { type: 'boolean' as const },
  description: `Draw the ${edge} edge of the panel border.`,
  table: { category: 'Border edges' },
});

const edgeStyleArgType = (edge: string) => ({
  control: { type: 'inline-radio' as const },
  options: LINE_STYLES,
  description: `Line style of the ${edge} edge.`,
  table: { category: 'Border edges' },
});

const gridVisibilityArgType = (axis: string) => ({
  control: { type: 'boolean' as const },
  description: `Show grid lines aligned with the ${axis} axis.`,
  table: { category: 'Grid lines' },
});

const gridStyleArgType = (axis: string) => ({
  control: { type: 'inline-radio' as const },
  options: LINE_STYLES,
  description: `Line style of the ${axis}-axis grid lines.`,
  table: { category: 'Grid lines' },
});

const gridWidthArgType = (axis: string) => ({
  control: { type: 'number' as const, min: 0.5, step: 0.5 },
  description: `Stroke width (px) of the ${axis}-axis grid lines. Clear to inherit the theme width.`,
  table: { category: 'Grid lines' },
});

interface BorderAndGridArgs {
  geomKind: GeomKind;
  showTopEdge: boolean;
  topEdgeStyle: LineStyleType;
  showRightEdge: boolean;
  rightEdgeStyle: LineStyleType;
  showBottomEdge: boolean;
  bottomEdgeStyle: LineStyleType;
  showLeftEdge: boolean;
  leftEdgeStyle: LineStyleType;
  borderWidth?: number;
  showXGrid: boolean;
  xGridStyle: LineStyleType;
  xGridWidth?: number;
  showYGrid: boolean;
  yGridStyle: LineStyleType;
  yGridWidth?: number;
}

/**
 * Playground for the panel chrome: toggle each border edge and its line style independently,
 * and set grid visibility/style per axis. Corners stay rounded only where two visible edges meet.
 */
export const BorderAndGridPlayground: StoryObj<BorderAndGridArgs> = {
  argTypes: {
    geomKind: {
      control: { type: 'inline-radio' },
      options: GEOM_KINDS,
      description: 'Which geom to render.',
      table: { category: 'Chart' },
    },
    showTopEdge: edgeVisibilityArgType('top'),
    topEdgeStyle: edgeStyleArgType('top'),
    showRightEdge: edgeVisibilityArgType('right'),
    rightEdgeStyle: edgeStyleArgType('right'),
    showBottomEdge: edgeVisibilityArgType('bottom'),
    bottomEdgeStyle: edgeStyleArgType('bottom'),
    showLeftEdge: edgeVisibilityArgType('left'),
    leftEdgeStyle: edgeStyleArgType('left'),
    borderWidth: {
      control: { type: 'number', min: 0.5, step: 0.5 },
      description: 'Stroke width (px) applied to every border edge. Clear to inherit the theme width.',
      table: { category: 'Border edges' },
    },
    showXGrid: gridVisibilityArgType('x'),
    xGridStyle: gridStyleArgType('x'),
    xGridWidth: gridWidthArgType('x'),
    showYGrid: gridVisibilityArgType('y'),
    yGridStyle: gridStyleArgType('y'),
    yGridWidth: gridWidthArgType('y'),
  },
  args: {
    geomKind: 'line',
    showTopEdge: true,
    topEdgeStyle: 'dashed',
    showRightEdge: true,
    rightEdgeStyle: 'dashed',
    showBottomEdge: true,
    bottomEdgeStyle: 'dashed',
    showLeftEdge: true,
    leftEdgeStyle: 'dashed',
    showXGrid: true,
    xGridStyle: 'dashed',
    showYGrid: true,
    yGridStyle: 'dashed',
  },
  render: (args) => {
    const spec = pipe(
      createSpec(reshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
      buildGeomLayer(args.geomKind),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({
        content: {
          title: 'Panel border and grid lines',
          subtitle: 'Toggle border edges and grid lines, and pick a line style for each',
        },
        panel: {
          border: {
            top: { isVisible: args.showTopEdge, lineStyle: args.topEdgeStyle, lineWidth: args.borderWidth ?? null },
            right: {
              isVisible: args.showRightEdge,
              lineStyle: args.rightEdgeStyle,
              lineWidth: args.borderWidth ?? null,
            },
            bottom: {
              isVisible: args.showBottomEdge,
              lineStyle: args.bottomEdgeStyle,
              lineWidth: args.borderWidth ?? null,
            },
            left: { isVisible: args.showLeftEdge, lineStyle: args.leftEdgeStyle, lineWidth: args.borderWidth ?? null },
          },
        },
        axes: {
          x: { grid: { isVisible: args.showXGrid, lineStyle: args.xGridStyle, lineWidth: args.xGridWidth ?? null } },
          y: { grid: { isVisible: args.showYGrid, lineStyle: args.yGridStyle, lineWidth: args.yGridWidth ?? null } },
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
