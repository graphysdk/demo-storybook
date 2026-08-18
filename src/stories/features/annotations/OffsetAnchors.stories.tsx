import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { AnchorOffset, AnnotationItem, Predicate } from '@graphysdk/viz-engine';
import { annotation } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

import { buildBar, buildLabel, quarterlyData } from './anchor-story-fixtures';

/**
 * An `offset` nudges a point anchor after it resolves. The `unit` decides the frame, and that decides
 * what happens on **reshape** — resize the plot with the drag handle to see it:
 *
 * - `unit: 'panel'` (default) is a fraction of the plot rect, folded in at compile time, so the gap
 *   **scales** with the panel.
 * - `unit: 'px'` is device pixels resolved in the runtime pass (it needs the panel size), so the gap
 *   **holds constant** across resizes.
 *
 * Region selections take the same offset as `padding`. Offsets are **spec-only**, so these stories use
 * the low-level spec API.
 */
const buildNudgedLabel = (id: string, text: string, quarter: string, offset: AnchorOffset, backgroundColor: string) =>
  annotation.text({
    id,
    content: buildLabel(text),
    at: { anchorType: 'observation', anchorValue: quarter, align: 'top', offset },
    width: 0.16,
    backgroundColor,
    backgroundColorStyle: 'opaque',
  });

const meta: Meta = {
  title: 'Features/Annotations/Offset Anchors',
  decorators: [ResizablePlotDecorator],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

/**
 * A `px` offset is resolved against the panel size at runtime, so the label sits a fixed number of
 * pixels above each bar's top edge. Resize the plot — the gap stays the same in pixels.
 */
export const PixelOffsets: Story = {
  name: 'Pixel offsets — fixed gap',
  render: () => {
    const annotations: AnnotationItem[] = quarterlyData.rows.map((row) =>
      buildNudgedLabel(
        `px-${row.quarter}`,
        `${row.quarter} · −24px`,
        String(row.quarter),
        { y: -24, unit: 'px' },
        '#ffffff'
      )
    );
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

/**
 * The same nudge in two frames on the same bar. The sticker marks Q3's true top (no offset). The
 * **px** label holds a constant gap above it; the **panel** label's gap grows and shrinks with the
 * panel height as you resize. At one particular height they line up — drag away from it to see them
 * separate.
 */
export const PanelVsPixel: Story = {
  name: 'Panel vs pixel — drag to compare',
  render: () => {
    const annotations: AnnotationItem[] = [
      annotation.sticker({ id: 'top', sticker: 'thumbs-up', at: { anchorType: 'observation', anchorValue: 'Q3' } }),
      buildNudgedLabel('px', 'px · −60', 'Q3', { y: -60, unit: 'px' }, '#d0ebff'),
      buildNudgedLabel('panel', 'panel · −12%', 'Q3', { y: -0.12 }, '#ffe3e3'),
    ];
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

const churnPredicate: Predicate = { variable: 'quarter', oneOf: ['Q1', 'Q2'] };

/**
 * Region selections take the same offset as `padding`. A `px` padding grows the box by a fixed number
 * of pixels on every edge, resolved at runtime — so the breathing room around the matched bars stays
 * constant as the plot resizes (a panel-fraction padding would scale instead).
 */
export const RegionPixelPadding: Story = {
  name: 'Region px padding — fixed breathing room',
  render: () => {
    const annotations: AnnotationItem[] = [
      annotation.shape({
        id: 'box',
        kind: 'rectangle',
        zOrder: 'background',
        region: { anchorType: 'selection', predicate: churnPredicate, padding: { x: 16, y: 16, unit: 'px' } },
        fillColor: '#ff6b6b',
        fillOpacity: 0.18,
        strokeWidth: 1.5,
        strokeColor: '#ff6b6b',
      }),
    ];
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

interface OffsetArgs {
  quarter: string;
  offsetX: number;
  offsetY: number;
  unit: 'panel' | 'px';
}

/**
 * Pin a label to a bar's top edge, then nudge it. Switch `unit` between `panel` and `px` and resize
 * the plot to feel the difference: panel offsets scale, px offsets hold.
 */
export const Playground: StoryObj<OffsetArgs> = {
  name: 'Playground',
  parameters: { controls: { disable: false } },
  argTypes: {
    quarter: { control: { type: 'inline-radio' }, options: ['Q1', 'Q2', 'Q3', 'Q4'] },
    unit: { control: { type: 'inline-radio' }, options: ['px', 'panel'] },
    offsetX: { control: { type: 'number', step: 1 }, description: 'px, or panel fraction when unit=panel' },
    offsetY: { control: { type: 'number', step: 1 }, description: 'negative = up' },
  },
  args: { quarter: 'Q3', offsetX: 0, offsetY: -24, unit: 'px' },
  render: (args) => {
    const offset: AnchorOffset = { x: args.offsetX, y: args.offsetY, unit: args.unit };
    const marker = buildNudgedLabel(
      'pg',
      `${args.unit} · ${args.offsetX},${args.offsetY}`,
      args.quarter,
      offset,
      '#ffffff'
    );
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar([marker])}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
