import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { AnchorAlign, AnnotationItem, Data, Predicate } from '@graphysdk/viz-engine';
import { annotation } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

import { ALIGN_POINTS, buildBar, buildLabel, quarterlyData } from './anchor-story-fixtures';

/** Grouped data: each quarter has a `new` and a `churned` segment, so a predicate can match a set. */
const segmentedData: Data = {
  columns: [
    { key: 'quarter', label: 'Quarter' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'segment', label: 'Segment' },
  ],
  rows: [
    { quarter: 'Q1', revenue: 1200, segment: 'new' },
    { quarter: 'Q1', revenue: 600, segment: 'churned' },
    { quarter: 'Q2', revenue: 1800, segment: 'new' },
    { quarter: 'Q2', revenue: 500, segment: 'churned' },
    { quarter: 'Q3', revenue: 2400, segment: 'new' },
    { quarter: 'Q3', revenue: 400, segment: 'churned' },
    { quarter: 'Q4', revenue: 2800, segment: 'new' },
    { quarter: 'Q4', revenue: 300, segment: 'churned' },
  ],
};

const highlightShape = (id: string, predicate: Predicate, padding?: number): AnnotationItem =>
  annotation.shape({
    id,
    kind: 'rectangle',
    zOrder: 'background',
    region: { anchorType: 'selection', predicate, ...(padding !== undefined ? { padding } : {}) },
    fillColor: '#ff6b6b',
    fillOpacity: 0.18,
    strokeWidth: 1.5,
    strokeColor: '#ff6b6b',
  });

const meta: Meta = {
  title: 'Features/Annotations/Selection Anchors',
  decorators: [ResizablePlotDecorator],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

/**
 * A `region` selection folds every matched observation's true extent into one tight box. Here
 * `oneOf: ['Q2', 'Q3']` hugs the Q2 and Q3 bars exactly — the box spans their combined x-extent and
 * reaches up to the taller bar's top.
 */
export const RegionHugRange: Story = {
  name: 'Region — hug a data range',
  render: () => (
    <VizStoryGraphProvider
      data={quarterlyData}
      spec={buildBar([highlightShape('hug', { variable: 'quarter', oneOf: ['Q2', 'Q3'] })])}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * A selection matches observations anywhere in the chart. With dodged segments, `{ variable:
 * 'segment', eq: 'churned' }` boxes every churned bar across all four quarters — the bbox tracks the
 * data, not fixed coordinates. `padding` (panel fraction) grows the box so it breathes around the bars.
 */
export const RegionAcrossChart: Story = {
  name: 'Region — box a category across the chart',
  render: () => (
    <VizStoryGraphProvider
      data={segmentedData}
      spec={buildBar([highlightShape('churned', { variable: 'segment', eq: 'churned' }, 0.02)], {
        color: 'segment',
        position: 'dodge',
      })}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * A `point` selection reduces the matched set's box to one box-point named by `align`. The label below
 * sits at the `top` of the Q3+Q4 selection box, and an arrow runs from the `bottom-left` of the same
 * box up to it.
 */
export const PointFromSelection: Story = {
  name: 'Point — from a selection box',
  render: () => {
    const predicate: Predicate = { variable: 'quarter', oneOf: ['Q3', 'Q4'] };
    const annotations: AnnotationItem[] = [
      highlightShape('set', predicate),
      annotation.text({
        id: 'set-label',
        content: buildLabel('top of Q3–Q4'),
        at: { anchorType: 'selection', predicate, align: 'top' },
        width: 0.24,
        backgroundColor: '#ffffff',
        backgroundColorStyle: 'opaque',
      }),
      annotation.arrow({
        id: 'set-arrow',
        start: { anchorType: 'selection', predicate, align: 'bottom-left' },
        end: { anchorType: 'selection', predicate, align: 'top' },
        color: null,
        thickness: 'medium',
        lineStyle: 'dashed',
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

interface PlaygroundArgs {
  field: 'quarter' | 'revenue';
  quarter: string;
  revenueMin: number;
  revenueMax: number;
  mode: 'region' | 'point';
  align: AnchorAlign;
  padding: number;
}

const buildPredicate = (args: PlaygroundArgs): Predicate =>
  args.field === 'quarter'
    ? { variable: 'quarter', eq: args.quarter }
    : { variable: 'revenue', range: [args.revenueMin, args.revenueMax] };

/**
 * Pick a predicate (a quarter, or a revenue range), then render it as a `region` box or as a `point`
 * label at a chosen `align`. The box/point re-resolves from whatever observations match.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  name: 'Playground',
  parameters: { controls: { disable: false } },
  argTypes: {
    field: { control: { type: 'inline-radio' }, options: ['quarter', 'revenue'] },
    quarter: { control: { type: 'inline-radio' }, options: ['Q1', 'Q2', 'Q3', 'Q4'], description: 'quarter eq' },
    revenueMin: { control: { type: 'number', min: 0, max: 4000, step: 100 }, description: 'revenue range (low)' },
    revenueMax: { control: { type: 'number', min: 0, max: 4000, step: 100 }, description: 'revenue range (high)' },
    mode: { control: { type: 'inline-radio' }, options: ['region', 'point'] },
    align: { control: { type: 'select' }, options: ALIGN_POINTS, description: 'point mode only' },
    padding: { control: { type: 'number', min: 0, max: 0.2, step: 0.01 }, description: 'region mode only' },
  },
  args: {
    field: 'quarter',
    quarter: 'Q2',
    revenueMin: 1500,
    revenueMax: 2600,
    mode: 'region',
    align: 'top',
    padding: 0.02,
  },
  render: (args: PlaygroundArgs) => {
    const predicate = buildPredicate(args);
    const marker: AnnotationItem =
      args.mode === 'region'
        ? highlightShape('pg', predicate, args.padding)
        : annotation.text({
            id: 'pg-label',
            content: buildLabel(args.align),
            at: { anchorType: 'selection', predicate, align: args.align },
            width: 0.2,
            backgroundColor: '#ffffff',
            backgroundColorStyle: 'opaque',
          });
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={buildBar([marker])}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
