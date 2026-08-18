import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { AnchorAlign, AnnotationItem, Data, RichTextContent } from '@graphysdk/viz-engine';
import { annotation, config, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

/**
 * An `annotation` anchor pins a point or region to **another annotation's box** by its `id`, reduced to
 * the box-point named by `align`. The target box is finished at runtime — a text note's height is
 * measured in the browser — so the reference re-flows as the target moves or its content changes.
 *
 * The target must declare an explicit `id`. A missing id drops the referencing annotation with a
 * warning; a reference cycle drops the annotations in it. References are **spec-only**, so these stories
 * use the low-level spec API.
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

const note = (id: string, text: string, x: number, y: number) =>
  annotation.text({
    id,
    content: label(text),
    at: { anchorType: 'panel', x, y },
    width: 0.22,
    backgroundColor: '#fff3bf',
    backgroundColorStyle: 'opaque',
  });

const meta: Meta = {
  title: 'Features/Annotations/Annotation References',
  decorators: [ResizablePlotDecorator],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

/**
 * The canonical case: an arrow from a floating note's edge to a datum. The tail anchors to the note's
 * `bottom` edge (measured), the head pins to Q3's bar top. Resize the plot — the arrow keeps connecting
 * the note to the bar.
 */
export const ArrowFromNoteToDatum: Story = {
  name: 'Arrow from a note to a datum',
  render: () => {
    const annotations: AnnotationItem[] = [
      note('note', 'Record quarter', 0.08, 0.12),
      annotation.arrow({
        start: { anchorType: 'annotation', ref: 'note', align: 'bottom' },
        end: { anchorType: 'observation', anchorValue: 'Q3', align: 'top' },
        endArrowheadStyle: 'line-arrow',
      }),
    ];
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

/**
 * A region reference copies another annotation's box. The outline shape references the highlight box's
 * `id`, so the two stay locked together — edit the selection and the outline follows.
 */
export const RegionTracksRegion: Story = {
  name: 'Region tracks another region',
  render: () => {
    const annotations: AnnotationItem[] = [
      annotation.shape({
        id: 'highlight',
        zOrder: 'background',
        region: {
          anchorType: 'selection',
          predicate: { variable: 'quarter', oneOf: ['Q3', 'Q4'] },
          padding: { x: 10, y: 10, unit: 'px' },
        },
        fillColor: '#4dabf7',
        fillOpacity: 0.16,
        strokeWidth: 0,
        strokeColor: null,
      }),
      annotation.shape({
        id: 'outline',
        zOrder: 'foreground',
        region: { anchorType: 'annotation', ref: 'highlight' },
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeWidth: 2,
        strokeColor: '#1c7ed6',
      }),
    ];
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

/**
 * References chain: a sticker anchors to an arrow, whose tail anchors to a note. Each link resolves in
 * dependency order, so moving the note carries the whole chain.
 */
export const ChainedReferences: Story = {
  name: 'Chained references',
  render: () => {
    const annotations: AnnotationItem[] = [
      note('lead', 'Peak', 0.1, 0.1),
      annotation.arrow({
        id: 'connector',
        start: { anchorType: 'annotation', ref: 'lead', align: 'bottom' },
        end: { anchorType: 'observation', anchorValue: 'Q4', align: 'top' },
        endArrowheadStyle: 'line-arrow',
      }),
      annotation.sticker({ sticker: 'rocket', at: { anchorType: 'annotation', ref: 'connector', align: 'center' } }),
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
  quarter: string;
}

/**
 * Point an arrow from a note's box-point to a bar. Switch `align` to move the tail around the note's
 * box; the box-point is computed from the note's measured size.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  name: 'Playground',
  parameters: { controls: { disable: false } },
  argTypes: {
    align: {
      control: { type: 'select' },
      options: ['center', 'top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
    },
    quarter: { control: { type: 'inline-radio' }, options: ['Q1', 'Q2', 'Q3', 'Q4'] },
  },
  args: { align: 'bottom', quarter: 'Q3' },
  render: (args) => {
    const annotations: AnnotationItem[] = [
      note('note', `align: ${args.align}`, 0.08, 0.12),
      annotation.arrow({
        start: { anchorType: 'annotation', ref: 'note', align: args.align },
        end: { anchorType: 'observation', anchorValue: args.quarter, align: 'top' },
        endArrowheadStyle: 'line-arrow',
      }),
    ];
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
