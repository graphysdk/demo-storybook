import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Layout',
  decorators: [ResizablePlotDecorator],
};

export default meta;

const salesData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }],
  rows: [
    { quarter: 'Q1', North: 350, South: 200, West: 500 },
    { quarter: 'Q2', North: 300, South: 250, West: 350 },
    { quarter: 'Q3', North: 400, South: 300, West: 300 },
    { quarter: 'Q4', North: 200, South: 150, West: 400 },
  ],
};

const baseSpec = pipe(
  createSpec(
    transform.reshape({
      keep: ['quarter'],
      reshape: ['North', 'South', 'West'],
      keyName: 'region',
      valueName: 'sales',
    }),
    mapping({ x: 'quarter', y: 'sales', color: 'region' })
  ),
  geom.bar({ position: 'stack' }),
  scale.x(),
  scale.y(),
  scale.color.palette()
);

// ─── Spacing (config.layout) ────────────────────────────────────────────────
// The layout grid stacks the header, legend, axes and plot with fixed pixel gaps
// between them. `config.layout` overrides those defaults: `padding` for the outer
// frame, and `gaps.<region>` for the spacing after each named region.

interface SpacingArgs {
  padding: number;
  header: number;
  topLegend: number;
  bottomAxisLabel: number;
  leftAxis: number;
}

const gapControl = (max: number, description: string) => ({
  control: { type: 'range' as const, min: 0, max, step: 1 },
  description,
});

export const Spacing: StoryObj<SpacingArgs> = {
  argTypes: {
    padding: gapControl(48, 'Outer padding around the whole chart via `config.layout.padding`.'),
    header: gapControl(
      48,
      'Gap between the title/subtitle block and the plot/top legend via `config.layout.gaps.header`.'
    ),
    topLegend: gapControl(32, 'Gap between the top legend and the plot via `config.layout.gaps.topLegend`.'),
    bottomAxisLabel: gapControl(
      40,
      'Gap after the x-axis title (before the bottom legend) via `config.layout.gaps.bottomAxisLabel`.'
    ),
    leftAxis: gapControl(32, 'Gap between the left y-axis and the plot via `config.layout.gaps.leftAxis`.'),
  },
  // Defaults mirror the engine's built-in gaps, so the story starts at the baseline layout.
  args: { padding: 24, header: 10, topLegend: 8, bottomAxisLabel: 16, leftAxis: 4 },
  parameters: {
    docs: {
      description: {
        story:
          'Drag the sliders to retune the layout grid via `config.layout`. `padding` is the outer frame; each `gaps.<region>` value is the pixel gap after that region. A bare number sets the trailing (`after`) gap; pass `{ before, after }` for per-edge control. Unset regions keep the engine defaults.',
      },
    },
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(
        baseSpec,
        config({
          content: {
            title: 'Quarterly sales by region',
            isTitleVisible: true,
            subtitle: 'Stacked totals across North, South and West',
            isSubtitleVisible: true,
            caption: 'Source: Sales data',
            isCaptionVisible: true,
          },
          legend: { position: 'top' },
          axes: {
            x: { label: 'Quarter' },
            y: { position: 'left', label: 'Sales', ticks: { isVisible: true } },
          },
          layout: {
            padding: args.padding,
            gaps: {
              header: args.header,
              topLegend: args.topLegend,
              bottomAxisLabel: args.bottomAxisLabel,
              leftAxis: args.leftAxis,
            },
          },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Per-side padding (config.layout.padding as an object) ───────────────────
// `padding` also accepts `{ top, right, bottom, left }`. Any side left unset falls
// back to the engine default (`LAYOUT_PADDING`, 24px); an explicit `0` removes it.

interface PerSidePaddingArgs {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const PerSidePadding: StoryObj<PerSidePaddingArgs> = {
  argTypes: {
    top: gapControl(80, 'Top outer padding via `config.layout.padding.top`.'),
    right: gapControl(80, 'Right outer padding via `config.layout.padding.right`.'),
    bottom: gapControl(80, 'Bottom outer padding via `config.layout.padding.bottom`.'),
    left: gapControl(80, 'Left outer padding via `config.layout.padding.left`.'),
  },
  // Defaults match the engine's uniform default, so the story starts at the baseline frame.
  args: { top: 24, right: 24, bottom: 24, left: 24 },
  parameters: {
    docs: {
      description: {
        story:
          'Set the outer frame per side by passing `config.layout.padding` as an object. Any omitted side falls back to the engine default (24px); pass an explicit `0` to remove a side.',
      },
    },
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(
        baseSpec,
        config({
          content: {
            title: 'Quarterly sales by region',
            isTitleVisible: true,
            subtitle: 'Stacked totals across North, South and West',
            isSubtitleVisible: true,
          },
          legend: { position: 'top' },
          axes: {
            x: { label: 'Quarter' },
            y: { position: 'left', label: 'Sales', ticks: { isVisible: true } },
          },
          layout: {
            padding: { top: args.top, right: args.right, bottom: args.bottom, left: args.left },
            gaps: {},
          },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
