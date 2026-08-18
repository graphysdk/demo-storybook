import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { AnnotationItem, Data, SpecInput, StickerAnnotationInput, StickerId } from '@graphysdk/viz-engine';
import { annotation, config, coord, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';
import type { GraphConfig } from '@graphysdk/viz-engine/graph-config';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

const STICKER_IDS: StickerId[] = ['rocket', 'clapping-hands', 'thumbs-up', 'thumbs-down', 'grinning-face'];

const quarterlyData: Data = {
  columns: [
    { key: 'quarter', label: 'Quarter' },
    { key: 'revenue', label: 'Revenue' },
  ],
  rows: [
    { quarter: 'Q1', revenue: 1200 },
    { quarter: 'Q2', revenue: 1800 },
    { quarter: 'Q3', revenue: 2400 },
    { quarter: 'Q4', revenue: 2800 },
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

interface StickerArgs {
  sticker: StickerId;
  anchorQuarter: string;
}

const meta: Meta<StickerArgs> = {
  title: 'Features/Annotations/Sticker Annotations',
  decorators: [ResizablePlotDecorator],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj<StickerArgs>;

const buildCartesianBar = (annotations: AnnotationItem[]) => {
  return pipe(
    createSpec(mapping({ x: 'quarter', y: 'revenue', color: 'quarter' })),
    geom.bar({ position: 'identity' }),
    scale.x(),
    scale.y(),
    scale.color.palette(),
    config({}),
    ...annotations
  );
};

const buildCartesianConfig = (stickers: Array<{ id: string; sticker: StickerId; rowIndex: number }>): GraphConfig => ({
  type: 'column',
  annotations: stickers.map((item) => {
    return {
      id: item.id,
      type: 'sticker',
      sticker: item.sticker,
      rowIndex: item.rowIndex,
      columnKey: 'revenue',
    } as NonNullable<GraphConfig['annotations']>[number];
  }),
  headlineNumbers: { show: 'none' },
});

const QUARTER_TO_ROW: Record<string, number> = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 };

const CartesianStickerStory = ({ sticker, anchorQuarter }: StickerArgs) => {
  return (
    <VizStoryGraphProvider
      data={quarterlyData}
      spec={buildCartesianBar([
        annotation.sticker({ id: 's1', sticker, at: { anchorType: 'observation', anchorValue: anchorQuarter } }),
      ])}
      config={buildCartesianConfig([{ id: 's1', sticker, rowIndex: QUARTER_TO_ROW[anchorQuarter] ?? 3 }])}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  );
};

export const Playground: Story = {
  name: 'Playground',
  parameters: { controls: { disable: false } },
  argTypes: {
    sticker: { control: { type: 'inline-radio' }, options: STICKER_IDS },
    anchorQuarter: {
      control: { type: 'inline-radio' },
      options: ['Q1', 'Q2', 'Q3', 'Q4'],
      description: 'Quarter the sticker is pinned to.',
    },
  },
  args: { sticker: 'rocket', anchorQuarter: 'Q4' },
  render: (args) => <CartesianStickerStory {...args} />,
};

export const MultipleOnCartesian: Story = {
  name: 'Multiple on cartesian bar',
  render: () => {
    const stickers: AnnotationItem[] = [
      annotation.sticker({ id: 's-rocket', sticker: 'rocket', at: { anchorType: 'observation', anchorValue: 'Q4' } }),
      annotation.sticker({ id: 's-up', sticker: 'thumbs-up', at: { anchorType: 'observation', anchorValue: 'Q3' } }),
      annotation.sticker({
        id: 's-down',
        sticker: 'thumbs-down',
        at: { anchorType: 'observation', anchorValue: 'Q1' },
      }),
    ];
    return (
      <VizStoryGraphProvider
        data={quarterlyData}
        spec={buildCartesianBar(stickers)}
        config={buildCartesianConfig([
          { id: 's-rocket', sticker: 'rocket', rowIndex: 3 },
          { id: 's-up', sticker: 'thumbs-up', rowIndex: 2 },
          { id: 's-down', sticker: 'thumbs-down', rowIndex: 0 },
        ])}
      >
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

export const PolarPie: Story = {
  name: 'Polar (pie) — no y-flip',
  render: () => {
    const stickers: StickerAnnotationInput[] = [
      { id: 's-polar', sticker: 'rocket', at: { anchorType: 'observation', anchorValue: 'Engineering' } },
    ];
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
      <VizStoryGraphProvider
        data={departmentData}
        spec={{ ...spec, annotations: { stickers } } satisfies SpecInput}
        config={{
          type: 'pie',
          annotations: [{ id: 's-polar', type: 'sticker', sticker: 'rocket', rowIndex: 0, columnKey: 'spend' }],
        }}
      >
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

/**
 * Wide series data for a multi-series chart: `quarter` (x) plus three numeric series.
 * `North` is the first/smaller series and `South` is the standout — used to make a
 * misplaced sticker obvious.
 */
const multiSeriesData: Data = {
  columns: [
    { key: 'quarter', label: 'Quarter' },
    { key: 'north', label: 'North' },
    { key: 'south', label: 'South' },
    { key: 'target', label: 'Target' },
  ],
  rows: [
    { quarter: 'Q3', north: 200, south: 1700, target: 1500 },
    { quarter: 'Q4', north: 300, south: 2600, target: 2400 },
  ],
};

/**
 * A `column` chart reshapes its series at the top level, so the mapping the annotation converter sees
 * carries the series key on `color`. The sticker's `columnKey: 'south'` becomes the `groupValue`, and
 * the 🚀 lands on South's Q4 bar (2600). The baseline for {@link CorrectAnchoringCombo}.
 *
 * Rendered through the high-level GraphConfig API (`vizApi: 'config'`).
 */
export const CorrectAnchoringColumn: Story = {
  name: 'Series anchoring (column)',
  globals: { vizApi: 'config' },
  parameters: {
    docs: {
      description: {
        story: "The 🚀 anchors to South's Q4 bar via `columnKey: 'south'`.",
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider
      data={multiSeriesData}
      config={{
        type: 'column',
        annotations: [{ id: 's1', type: 'sticker', sticker: 'rocket', rowIndex: 1, columnKey: 'south' }],
        headlineNumbers: { show: 'none' },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * A `combo` chart reshapes its bar series *inside the bar layer*, so the top-level mapping the annotation
 * converter sees is just `{ x: 'quarter' }` — no series/color variable. The converter detects the
 * multi-series chart from its `seriesVariables` and keeps the sticker's `columnKey` as the `groupValue`,
 * so the 🚀 still lands on South's Q4 bar (2600) rather than North's (300, the first series in reshape
 * order). Matches {@link CorrectAnchoringColumn}, which renders the same data as a top-level-reshaped
 * `column` chart.
 *
 * Rendered through the high-level GraphConfig API (`vizApi: 'config'`).
 */
export const CorrectAnchoringCombo: Story = {
  name: 'Series anchoring (combo)',
  globals: { vizApi: 'config' },
  parameters: {
    docs: {
      description: {
        story:
          "Per-layer reshape: the combo converter keeps the sticker's `columnKey`, so the 🚀 anchors to South's Q4 bar.",
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider
      data={multiSeriesData}
      config={{
        type: 'combo',
        options: { comboType: 'grouped-bars' },
        annotations: [{ id: 's1', type: 'sticker', sticker: 'rocket', rowIndex: 1, columnKey: 'south' }],
        headlineNumbers: { show: 'none' },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
