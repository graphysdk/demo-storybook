import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { AnchorAlign, AnnotationItem, Data, RichTextContent } from '@graphysdk/viz-engine';
import { annotation, config, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

/**
 * A text annotation's `align` selects which point of its **own box** sits at the anchor. It defaults to
 * `center`, so text reads centered on its point; `top-left` reproduces the legacy corner placement.
 * Because the box height is only known once the browser flows the content, the box is offset in the
 * renderer by a fraction of its measured size — no layout pass required.
 */
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

const buildBar = (annotations: AnnotationItem[]) =>
  pipe(
    createSpec(mapping({ x: 'quarter', y: 'revenue', color: 'quarter' })),
    geom.bar({ position: 'identity' }),
    scale.x(),
    scale.y(),
    scale.color.palette(),
    config({}),
    ...annotations
  );

const label = (text: string): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: 'center' },
      content: [{ type: 'text', text, marks: [{ type: 'bold' }] }],
    },
  ],
});

const note = (id: string, text: string, align: AnchorAlign, x: number, y: number, backgroundColor: string) =>
  annotation.text({ id, content: label(text), at: { anchorType: 'panel', x, y }, width: 0.18, align, backgroundColor });

const meta: Meta = {
  title: 'Features/Annotations/Text Self-Align',
  decorators: [ResizablePlotDecorator],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

/**
 * Three boxes pinned to the same vertical line at different `align` values. `center` (the default)
 * straddles the line; `top-left` hangs below-right of it; `bottom-right` sits above-left.
 */
export const AlignVariants: Story = {
  name: 'Align variants on one anchor',
  render: () => {
    const annotations: AnnotationItem[] = [
      note('c', 'center', 'center', 0.5, 0.25, '#d0ebff'),
      note('tl', 'top-left', 'top-left', 0.5, 0.55, '#ffe3e3'),
      note('br', 'bottom-right', 'bottom-right', 0.5, 0.85, '#e6fcf5'),
    ];
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

interface PlaygroundArgs {
  align: AnchorAlign;
}

/**
 * Move the same box's `align` around its anchor (the marked point at the panel centre).
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  name: 'Playground',
  parameters: { controls: { disable: false } },
  argTypes: {
    align: {
      control: { type: 'select' },
      options: ['center', 'top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
    },
  },
  args: { align: 'center' },
  render: (args) => {
    const annotations: AnnotationItem[] = [
      annotation.sticker({ sticker: 'rocket', at: { anchorType: 'panel', x: 0.5, y: 0.5 } }),
      note('pg', `align: ${args.align}`, args.align, 0.5, 0.5, '#fff3bf'),
    ];
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
