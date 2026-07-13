import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type {
  AnnotationItem,
  Data,
  DifferenceArrowLabelKind,
  DifferenceArrowSize,
  GraphConfig,
  PanelOverflowStrategy,
} from '@graphysdk/viz-engine';
import { annotation, config, coord, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

type ChartShape = 'column' | 'bar' | 'line';

interface DifferenceArrowArgs {
  chartShape: ChartShape;
  label: DifferenceArrowLabelKind;
  size: DifferenceArrowSize;
  startMonth: 'Jan' | 'Feb' | 'Mar' | 'Apr';
  endMonth: 'Jan' | 'Feb' | 'Mar' | 'Apr';
  series: 'EU' | 'US';
  color: string;
  labelCrossPosition: number;
  showSecondArrow: boolean;
  overflowStrategyX: PanelOverflowStrategy;
  overflowStrategyY: PanelOverflowStrategy;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr'] as const;

// Wide-format data: one row per month, one column per series. Matches the
// shape converters expect when translating `columnKey` to `groupValue`.
// The month column is parsed into temporal Dates, so an anchor like `'Jan'`
// only resolves once it is parsed against the column's format — the case this
// story set exercises.
const salesData: Data = {
  columns: [
    { key: 'month', label: 'Month' },
    { key: 'EU', label: 'Europe' },
    { key: 'US', label: 'United States' },
  ],
  rows: [
    { month: 'Jan', EU: 1200, US: 1500 },
    { month: 'Feb', EU: 1800, US: 1600 },
    { month: 'Mar', EU: 2400, US: 2200 },
    { month: 'Apr', EU: 2800, US: 3100 },
  ],
};

const meta: Meta<DifferenceArrowArgs> = {
  title: 'Features/Annotations/Difference Arrows',
  decorators: [ResizablePlotDecorator],
  argTypes: {
    chartShape: {
      control: { type: 'inline-radio' },
      options: ['column', 'bar', 'line'] satisfies ChartShape[],
      description: '`column` is upright bars; `bar` flips the axes; `line` uses a line geom.',
      table: { category: 'Spec' },
    },
    label: {
      control: { type: 'select' },
      options: ['absolute-difference', 'relative-difference', 'proportion'] satisfies DifferenceArrowLabelKind[],
      table: { category: 'Arrow' },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['small', 'medium', 'large'] satisfies DifferenceArrowSize[],
      table: { category: 'Arrow' },
    },
    startMonth: {
      control: { type: 'inline-radio' },
      options: MONTHS,
      table: { category: 'Arrow' },
    },
    endMonth: {
      control: { type: 'inline-radio' },
      options: MONTHS,
      table: { category: 'Arrow' },
    },
    series: {
      control: { type: 'inline-radio' },
      options: ['EU', 'US'],
      description: 'Which series the arrow anchors to. Maps to the column key in wide-format data.',
      table: { category: 'Arrow' },
    },
    color: {
      control: { type: 'color' },
      description: 'Empty falls back to the theme `defaultArrowAnnotationColor`.',
      table: { category: 'Arrow' },
    },
    labelCrossPosition: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Fraction along the arrow where the label sits (0 = start, 1 = end).',
      table: { category: 'Arrow' },
    },
    showSecondArrow: {
      control: { type: 'boolean' },
      description: 'Render a second arrow on the other series.',
      table: { category: 'Arrow' },
    },
    overflowStrategyX: {
      control: { type: 'inline-radio' },
      options: ['outside', 'inside', 'none'] satisfies PanelOverflowStrategy[],
      description:
        'Overflow strategy for horizontal (left/right) arrow overflow — e.g. a flipped (horizontal-bar) arrow whose label spills past the right.',
      table: { category: 'Spec' },
    },
    overflowStrategyY: {
      control: { type: 'inline-radio' },
      options: ['outside', 'inside', 'none'] satisfies PanelOverflowStrategy[],
      description:
        'Overflow strategy for vertical (top/bottom) arrow overflow — e.g. an upright-bar arrow whose label spills past the top.',
      table: { category: 'Spec' },
    },
  },
  args: {
    chartShape: 'column',
    label: 'relative-difference',
    size: 'small',
    startMonth: 'Jan',
    endMonth: 'Apr',
    series: 'EU',
    color: '',
    labelCrossPosition: 0.5,
    showSecondArrow: false,
    overflowStrategyX: 'outside',
    overflowStrategyY: 'outside',
  },
};

export default meta;
type Story = StoryObj<DifferenceArrowArgs>;

const otherSeries = (series: 'EU' | 'US'): 'EU' | 'US' => (series === 'EU' ? 'US' : 'EU');

const buildSpecArrows = (args: DifferenceArrowArgs): AnnotationItem[] => {
  const arrows: AnnotationItem[] = [
    annotation.differenceArrow({
      id: 'arrow-primary',
      start: { anchorValue: args.startMonth, groupValue: args.series },
      end: { anchorValue: args.endMonth, groupValue: args.series },
      label: args.label,
      size: args.size,
      color: args.color === '' ? null : args.color,
      labelCrossPosition: args.labelCrossPosition,
    }),
  ];
  if (args.showSecondArrow) {
    arrows.push(
      annotation.differenceArrow({
        id: 'arrow-secondary',
        start: { anchorValue: args.startMonth, groupValue: otherSeries(args.series) },
        end: { anchorValue: args.endMonth, groupValue: otherSeries(args.series) },
        label: args.label,
        size: args.size,
        color: args.color === '' ? null : args.color,
        labelCrossPosition: args.labelCrossPosition,
      })
    );
  }
  return arrows;
};

const buildConfigAnnotations = (args: DifferenceArrowArgs): NonNullable<GraphConfig['annotations']> => {
  const annotations: NonNullable<GraphConfig['annotations']> = [
    {
      id: 'arrow-primary',
      type: 'difference-arrow',
      show: args.label,
      size: args.size,
      start: { rowIndex: MONTHS.indexOf(args.startMonth), columnKey: args.series, rowValue: args.startMonth },
      end: { rowIndex: MONTHS.indexOf(args.endMonth), columnKey: args.series, rowValue: args.endMonth },
      ...(args.color === '' ? {} : { color: args.color }),
      labelPosition: args.labelCrossPosition,
    },
  ];
  if (args.showSecondArrow) {
    const other = otherSeries(args.series);
    annotations.push({
      id: 'arrow-secondary',
      type: 'difference-arrow',
      show: args.label,
      size: args.size,
      start: { rowIndex: MONTHS.indexOf(args.startMonth), columnKey: other, rowValue: args.startMonth },
      end: { rowIndex: MONTHS.indexOf(args.endMonth), columnKey: other, rowValue: args.endMonth },
      ...(args.color === '' ? {} : { color: args.color }),
      labelPosition: args.labelCrossPosition,
    });
  }
  return annotations;
};

const buildGraphConfigType = (shape: ChartShape): GraphConfig['type'] => {
  switch (shape) {
    case 'column':
      return 'column';
    case 'bar':
      return 'bar';
    case 'line':
      return 'line';
  }
};

const renderStory = (args: DifferenceArrowArgs) => <DifferenceArrowStory {...args} />;

const DifferenceArrowStory = (args: DifferenceArrowArgs) => {
  const { spec, configForApi } = useMemo(() => {
    const specInput = pipe(
      createSpec(
        transform.reshape({ keep: ['month'], reshape: ['EU', 'US'], keyName: 'series', valueName: 'value' }),
        mapping({ x: 'month', y: 'value', color: 'series' })
      ),
      args.chartShape === 'line' ? geom.line() : geom.bar({ position: 'dodge' }),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      ...(args.chartShape === 'bar' ? [coord.flip()] : []),
      config({ panel: { overflow: { differenceArrows: { x: args.overflowStrategyX, y: args.overflowStrategyY } } } }),
      ...buildSpecArrows(args)
    );
    return {
      spec: specInput,
      configForApi: {
        type: buildGraphConfigType(args.chartShape),
        annotations: buildConfigAnnotations(args),
        headlineNumbers: { show: 'none' as const },
      } satisfies GraphConfig,
    };
  }, [args]);

  return (
    <VizStoryGraphProvider data={salesData} spec={spec} config={configForApi}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  );
};

export const Playground: Story = {
  name: 'Playground',
  render: renderStory,
};

export const MultipleArrows: Story = {
  name: 'Two arrows',
  args: { chartShape: 'column', label: 'relative-difference', showSecondArrow: true, size: 'medium' },
  render: renderStory,
};
