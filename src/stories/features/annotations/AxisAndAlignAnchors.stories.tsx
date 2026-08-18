import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { AnchorAlign, AnnotationItem, PointAnchorInput } from '@graphysdk/viz-engine';
import { annotation } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

import { ALIGN_POINTS, buildBar, buildLabel, quarterlyData } from './anchor-story-fixtures';

interface AnchorArgs {
  anchorType: 'axis' | 'observation';
  quarter: string;
  yValue: number;
  align: AnchorAlign | 'none';
  flip: boolean;
  marker: 'sticker' | 'text';
}

const buildAt = (args: AnchorArgs): PointAnchorInput => {
  const align = args.align === 'none' ? undefined : args.align;
  if (args.anchorType === 'axis') {
    return { anchorType: 'axis', x: args.quarter, y: args.yValue, ...(align ? { align } : {}) };
  }
  return { anchorType: 'observation', anchorValue: args.quarter, ...(align ? { align } : {}) };
};

const meta: Meta<AnchorArgs> = {
  title: 'Features/Annotations/Axis & Align Anchors',
  decorators: [ResizablePlotDecorator],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj<AnchorArgs>;

/**
 * An `axis` anchor places a point at an arbitrary coordinate given as axis values. A sticker sits on
 * Q3's top (`x: 'Q3', y: 2400`), a label floats above Q2 at a value with no bar (`y: 2600`), and an
 * arrow tracks the trend from Q1's top to Q4's top — all following the bars across reshape.
 */
export const AxisAnchors: Story = {
  name: 'Axis anchors',
  render: () => {
    const annotations: AnnotationItem[] = [
      annotation.sticker({ id: 'on-q3', sticker: 'rocket', at: { anchorType: 'axis', x: 'Q3', y: 2400 } }),
      annotation.text({
        id: 'floating',
        content: buildLabel('axis · Q2 / 2600'),
        at: { anchorType: 'axis', x: 'Q2', y: 2600 },
        width: 0.2,
        backgroundColor: null,
        backgroundColorStyle: 'opaque',
      }),
      annotation.arrow({
        id: 'trend',
        start: { anchorType: 'axis', x: 'Q1', y: 1200 },
        end: { anchorType: 'axis', x: 'Q4', y: 2800 },
        color: null,
        thickness: 'medium',
        lineStyle: 'solid',
        startArrowheadStyle: 'none',
        endArrowheadStyle: 'line-arrow',
        hasStickerStyle: false,
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
 * An `axis` anchor at an observation's coordinates resolves to the same point as a matching
 * `observation` anchor: the two stickers — one axis (`x: 'Q3', y: 2400`), one observation
 * (`anchorValue: 'Q3'`) — land on top of each other on Q3's bar.
 */
export const AxisMatchesObservation: Story = {
  name: 'Axis matches observation',
  render: () => {
    const annotations: AnnotationItem[] = [
      annotation.sticker({ id: 'axis', sticker: 'rocket', at: { anchorType: 'axis', x: 'Q3', y: 2400 } }),
      annotation.sticker({ id: 'obs', sticker: 'thumbs-up', at: { anchorType: 'observation', anchorValue: 'Q3' } }),
    ];
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

/**
 * `align` selects which point of the target's box the anchor resolves to. Each label pins to the same
 * Q3 bar with a different `align`, spreading them around the bar's extent. Omitting `align` keeps the
 * geom-natural point (a bar's top-edge midpoint).
 */
export const Align: Story = {
  name: 'Align — box points of a bar',
  render: () => {
    const annotations: AnnotationItem[] = ALIGN_POINTS.map((align) =>
      annotation.text({
        id: `align-${align}`,
        content: buildLabel(align),
        at: { anchorType: 'observation', anchorValue: 'Q3', align },
        width: 0.14,
        backgroundColor: '#ffffff',
        backgroundColorStyle: 'opaque',
      })
    );
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations)}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

/**
 * Under `coord.flip()` an `axis` anchor keeps its data meaning — `x: 'Q3'` still tracks the Q3
 * category, `y: 2400` the revenue value — so the sticker follows the bar onto the swapped panel axes,
 * and the align labels hug the now-horizontal bar's box.
 */
export const AxisFlipped: Story = {
  name: 'Axis + align under coord.flip()',
  render: () => {
    const annotations: AnnotationItem[] = [
      annotation.sticker({ id: 'on-q3', sticker: 'rocket', at: { anchorType: 'axis', x: 'Q3', y: 2400 } }),
      ...(['left', 'right'] as const).map((align) =>
        annotation.text({
          id: `q3-${align}`,
          content: buildLabel(align),
          at: { anchorType: 'observation', anchorValue: 'Q3', align },
          width: 0.12,
          backgroundColor: '#ffffff',
          backgroundColorStyle: 'opaque',
        })
      ),
    ];
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar(annotations, { flip: true })}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

/**
 * Mix and match: choose the marker (sticker or text), the anchor type, the quarter, the axis value,
 * alignment, and flip, then watch it resolve. `yValue` is ignored for an `observation` anchor.
 */
export const Playground: Story = {
  name: 'Playground',
  parameters: { controls: { disable: false } },
  argTypes: {
    marker: { control: { type: 'inline-radio' }, options: ['sticker', 'text'] },
    anchorType: { control: { type: 'inline-radio' }, options: ['axis', 'observation'] },
    quarter: { control: { type: 'inline-radio' }, options: ['Q1', 'Q2', 'Q3', 'Q4'] },
    yValue: { control: { type: 'number', min: 0, max: 4000, step: 100 }, description: 'Axis anchor only.' },
    align: {
      control: { type: 'select' },
      options: ['none', ...ALIGN_POINTS],
    },
    flip: { control: { type: 'boolean' } },
  },
  args: { marker: 'sticker', anchorType: 'axis', quarter: 'Q3', yValue: 2400, align: 'none', flip: false },
  render: (args) => {
    const at = buildAt(args);
    const marker =
      args.marker === 'sticker'
        ? annotation.sticker({ id: 'pin', sticker: 'rocket', at })
        : annotation.text({
            id: 'pin-label',
            content: buildLabel(`${args.anchorType}${args.align === 'none' ? '' : ` · ${args.align}`}`),
            at,
            width: 0.2,
            backgroundColor: '#ffffff',
            backgroundColorStyle: 'opaque',
          });
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar([marker], { flip: args.flip })}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
