import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data, LineStyleType, RuleLabelPosition } from '@graphysdk/viz-engine';
import { coord, createSpec, geom, pipe, scale, style, styles } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Reference Lines',
  decorators: [ResizablePlotDecorator],
};

export default meta;

const lineTypeControl = {
  control: { type: 'inline-radio' as const },
  options: ['solid', 'dashed', 'dotted'] satisfies LineStyleType[],
  description: 'Stroke style for the reference line.',
};

const labelPositionControl = {
  control: { type: 'inline-radio' as const },
  options: ['start', 'end'] satisfies RuleLabelPosition[],
  description: "Anchors the label at the 'start' or 'end' of the line.",
};

// ─── Horizontal goal line ──────────────────────────────────────────────────────

const revenueData: Data = {
  columns: [{ key: 'month' }, { key: 'revenue' }],
  rows: [
    { month: 'Jan', revenue: 1200 },
    { month: 'Feb', revenue: 1800 },
    { month: 'Mar', revenue: 2400 },
    { month: 'Apr', revenue: 1600 },
    { month: 'May', revenue: 3200 },
    { month: 'Jun', revenue: 2800 },
  ],
};

interface HorizontalRuleArgs {
  target: number;
  label: string;
  color: string;
  strokeWidth: number;
  lineType: LineStyleType;
  labelPosition: RuleLabelPosition;
}

/**
 * A horizontal reference line on top of a bar chart — the canonical "goal line" use case.
 * The rule value participates in y-scale auto-domain, so raising `target` above the data peak
 * also expands the y-axis to fit it.
 */
export const HorizontalGoalLine: StoryObj<HorizontalRuleArgs> = {
  argTypes: {
    target: {
      control: { type: 'range', min: -5000, max: 5000, step: 100 },
      description: 'Y-value the reference line marks. Drag past the data peak to see auto-domain extend.',
    },
    label: { control: 'text', description: 'Optional inline label. Leave blank to hide.' },
    color: { control: 'color', description: 'Stroke color. Empty falls back to the built-in rule color.' },
    strokeWidth: { control: { type: 'range', min: 1, max: 8, step: 1 } },
    lineType: lineTypeControl,
    labelPosition: labelPositionControl,
  },
  args: {
    target: 2500,
    label: 'Target',
    color: '',
    strokeWidth: 1,
    lineType: 'dashed',
    labelPosition: 'start',
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={revenueData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.bar(),
        geom.rule({
          aes: { y: { value: args.target } },
          params: {
            label: args.label || undefined,
            labelPosition: args.labelPosition,
          },
        }),
        styles({
          defaults: [
            style.geom.rule({
              ...(args.color ? { color: args.color } : {}),
              strokeWidth: args.strokeWidth,
              lineType: args.lineType,
            }),
          ],
        }),
        scale.x(),
        scale.y()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Horizontal bar chart (flipped) with a goal line ──────────────────────────

/**
 * Same horizontal-rule API on a flipped bar chart. Under `coord.flip()` the y-axis runs
 * horizontally — the rule's `{ y: { value: ... } }` still marks a constant y in data space,
 * which the renderer paints as a vertical line on screen because `coordSystem.mainAxis === 'y'`.
 */
export const HorizontalBarGoalLine: StoryObj<HorizontalRuleArgs> = {
  argTypes: {
    target: {
      control: { type: 'range', min: -5000, max: 5000, step: 100 },
      description: 'Y-value the reference line marks (renders as a vertical line under flip).',
    },
    label: { control: 'text' },
    color: { control: 'color' },
    strokeWidth: { control: { type: 'range', min: 1, max: 8, step: 1 } },
    lineType: lineTypeControl,
    labelPosition: labelPositionControl,
  },
  args: {
    target: 2500,
    label: 'Target',
    color: '',
    strokeWidth: 1,
    lineType: 'dashed',
    labelPosition: 'end',
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={revenueData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.bar(),
        geom.rule({
          aes: { y: { value: args.target } },
          params: {
            label: args.label || undefined,
            labelPosition: args.labelPosition,
          },
        }),
        styles({
          defaults: [
            style.geom.rule({
              ...(args.color ? { color: args.color } : {}),
              strokeWidth: args.strokeWidth,
              lineType: args.lineType,
            }),
          ],
        }),
        scale.x(),
        scale.y(),
        coord.flip()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Vertical event marker (numeric x-axis) ────────────────────────────────────

const ageDistributionData: Data = {
  columns: [{ key: 'age' }, { key: 'count' }],
  rows: [
    { age: 20, count: 5 },
    { age: 25, count: 12 },
    { age: 30, count: 18 },
    { age: 35, count: 22 },
    { age: 40, count: 25 },
    { age: 45, count: 20 },
    { age: 50, count: 15 },
    { age: 55, count: 10 },
    { age: 60, count: 6 },
  ],
};

interface VerticalRuleArgs {
  threshold: number;
  label: string;
  color: string;
  strokeWidth: number;
  lineType: LineStyleType;
  labelPosition: RuleLabelPosition;
}

/**
 * A vertical reference line on a numeric x-axis (scatter plot). v1 of `geom.rule` supports
 * vertical rules only when the x-scale is numeric — date and categorical x-axes are out of scope.
 */
export const VerticalThreshold: StoryObj<VerticalRuleArgs> = {
  argTypes: {
    threshold: {
      control: { type: 'range', min: -50, max: 100, step: 1 },
      description: 'X-value the reference line marks. The x-scale auto-extends if the rule sits outside the data.',
    },
    label: { control: 'text' },
    color: { control: 'color' },
    strokeWidth: { control: { type: 'range', min: 1, max: 8, step: 1 } },
    lineType: lineTypeControl,
    labelPosition: labelPositionControl,
  },
  args: {
    threshold: 40,
    label: 'Threshold',
    color: '',
    strokeWidth: 1,
    lineType: 'dashed',
    labelPosition: 'end',
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={ageDistributionData}
      spec={pipe(
        createSpec({ x: 'age', y: 'count' }),
        geom.point(),
        geom.rule({
          aes: { x: { value: args.threshold } },
          params: {
            label: args.label || undefined,
            labelPosition: args.labelPosition,
          },
        }),
        styles({
          defaults: [
            style.geom.rule({
              ...(args.color ? { color: args.color } : {}),
              strokeWidth: args.strokeWidth,
              lineType: args.lineType,
            }),
          ],
        }),
        scale.x(),
        scale.y()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Multiple reference lines ──────────────────────────────────────────────────

interface MultipleRulesArgs {
  showFloor: boolean;
  showTarget: boolean;
  showCeiling: boolean;
}

/**
 * Three stacked reference lines (floor / target / ceiling) layered on the same chart.
 * Layers compose declaratively — paint order matches the spec order, so the rules added
 * after `geom.bar()` render in front of the bars. The floor and ceiling carry authored layer
 * ids, so layer-targeted style entries can dot them while the target keeps the built-in dash.
 */
export const MultipleRules: StoryObj<MultipleRulesArgs> = {
  argTypes: {
    showFloor: { control: 'boolean', description: 'Lower bound at 1000.' },
    showTarget: { control: 'boolean', description: 'Target at 2500.' },
    showCeiling: { control: 'boolean', description: 'Ceiling at 3500 — pushes y-domain above data peak.' },
  },
  args: { showFloor: true, showTarget: true, showCeiling: true },
  render: (args) => (
    <VizStoryGraphProvider
      data={revenueData}
      spec={pipe(
        createSpec({ x: 'month', y: 'revenue' }),
        geom.bar(),
        ...(args.showFloor
          ? [
              geom.rule({
                id: 'floor',
                aes: { y: { value: 1000 } },
                params: { label: 'Floor', labelPosition: 'start' },
              }),
            ]
          : []),
        ...(args.showTarget ? [geom.rule({ aes: { y: { value: 2500 } }, params: { label: 'Target' } })] : []),
        ...(args.showCeiling
          ? [
              geom.rule({
                id: 'ceiling',
                aes: { y: { value: 3500 } },
                params: { label: 'Ceiling' },
              }),
            ]
          : []),
        styles({
          defaults: [
            ...(args.showFloor ? [style.geom.rule({ lineType: 'dotted' }, { layer: 'floor' })] : []),
            ...(args.showCeiling ? [style.geom.rule({ lineType: 'dotted' }, { layer: 'ceiling' })] : []),
          ],
        }),
        scale.x(),
        scale.y()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
