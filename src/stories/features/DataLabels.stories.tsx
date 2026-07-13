import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data, PanelOverflowStrategy } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Data Labels',
  decorators: [ResizablePlotDecorator],
};

export default meta;

type Format = 'absolute' | 'percentage';

const formatControl = {
  control: { type: 'inline-radio' as const },
  options: ['absolute', 'percentage'] satisfies Format[],
  description:
    'Absolute prints the raw value; percentage divides by the per-stack total (stacked bar) or the layer grand total (grouped bar / pie).',
};

const paddingModeOptions = {
  control: { type: 'inline-radio' as const },
  options: ['inside', 'outside', 'none'] satisfies PanelOverflowStrategy[],
};

const overflowStrategyArgTypes = {
  overflowStrategyX: {
    ...paddingModeOptions,
    description: 'Overflow strategy to use for labels that overflow the panel on the left/right edges.',
  },
  overflowStrategyY: {
    ...paddingModeOptions,
    description: 'Overflow strategy to use for labels that overflow the panel on the top/bottom edges.',
  },
};

const overflowStrategyArgs = {
  overflowStrategyX: 'inside' as PanelOverflowStrategy,
  overflowStrategyY: 'inside' as PanelOverflowStrategy,
};

// ─── Single bar ────────────────────────────────────────────────────────────────

const productData: Data = {
  columns: [{ key: 'product' }, { key: 'revenue' }],
  rows: [
    { product: 'Alpha', revenue: 1240 },
    { product: 'Bravo', revenue: 1860 },
    { product: 'Charlie', revenue: 2410 },
    { product: 'Delta', revenue: 1620 },
    { product: 'Echo', revenue: 3220 },
    { product: 'Foxtrot', revenue: 2790 },
  ],
};

interface SingleBarArgs {
  showDataLabels: boolean;
  flipped: boolean;
}

export const SingleBar: StoryObj<SingleBarArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean', description: 'Toggles per-observation labels on the bars.' },
    flipped: { control: 'boolean', description: 'Flip x/y axes (horizontal bars).' },
  },
  args: { showDataLabels: true, flipped: false },
  render: (args) => (
    <VizStoryGraphProvider
      data={productData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'product', y: 'revenue' }),
        geom.bar({ dataLabels: { showDataLabels: args.showDataLabels } }),
        scale.x(),
        scale.y(),
        ...(args.flipped ? [coord.flip()] : []),
        config({ axes: { y: { label: 'revenue' } } })
      )}
      config={{
        type: 'column',
        dataLabels: { showDataLabels: args.showDataLabels },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Stacked bar (segment labels + stack totals) ───────────────────────────────

const REGIONS = ['North', 'South', 'West'] as const;

const regionData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }],
  rows: [
    { quarter: 'Q1', North: 350, South: 200, West: 500 },
    { quarter: 'Q2', North: 300, South: 250, West: 350 },
    { quarter: 'Q3', North: 400, South: 300, West: 300 },
    { quarter: 'Q4', North: 200, South: 150, West: 400 },
  ],
};

const regionReshape = transform.reshape({
  keep: ['quarter'],
  reshape: [...REGIONS],
  keyName: 'region',
  valueName: 'sales',
});

interface StackedBarArgs {
  showDataLabels: boolean;
  showStackTotals: boolean;
  format: Format;
  overflowStrategyX: PanelOverflowStrategy;
  overflowStrategyY: PanelOverflowStrategy;
}

export const StackedBar: StoryObj<StackedBarArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean', description: 'Per-segment labels (centred inside each segment).' },
    showStackTotals: { control: 'boolean', description: 'One label per stack at the top of the topmost segment.' },
    format: formatControl,
    ...overflowStrategyArgTypes,
  },
  args: { showDataLabels: true, showStackTotals: true, format: 'absolute', ...overflowStrategyArgs },
  render: (args) => (
    <VizStoryGraphProvider
      data={regionData}
      spec={pipe(
        createSpec(regionReshape, mapping({ x: 'quarter', y: 'sales', color: 'region' })),
        geom.bar({
          position: 'stack',
          dataLabels: {
            showDataLabels: args.showDataLabels,
            showStackTotals: args.showStackTotals,
            format: args.format,
          },
        }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({
          axes: { y: { label: 'sales' } },
          panel: { overflow: { dataLabels: { x: args.overflowStrategyX, y: args.overflowStrategyY } } },
        })
      )}
      config={{
        type: 'columnStacked',
        dataLabels: {
          showDataLabels: args.showDataLabels,
          showStackTotals: args.showStackTotals,
          dataLabelFormat: args.format,
        },
        axes: { y: { label: 'sales' } },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Diverging stack (positive + negative) ────────────────────────────────────

const profitData: Data = {
  columns: [{ key: 'month' }, { key: 'gains' }, { key: 'losses' }],
  rows: [
    { month: 'Jan', gains: 420, losses: -180 },
    { month: 'Feb', gains: 380, losses: -240 },
    { month: 'Mar', gains: 510, losses: -150 },
    { month: 'Apr', gains: 290, losses: -310 },
    { month: 'May', gains: 460, losses: -200 },
  ],
};

const profitReshape = transform.reshape({
  keep: ['month'],
  reshape: ['gains', 'losses'],
  keyName: 'kind',
  valueName: 'amount',
});

interface DivergingArgs {
  showDataLabels: boolean;
  showStackTotals: boolean;
  format: Format;
  overflowStrategyX: PanelOverflowStrategy;
  overflowStrategyY: PanelOverflowStrategy;
}

export const DivergingStack: StoryObj<DivergingArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean' },
    showStackTotals: {
      control: 'boolean',
      description: 'Two totals per x — one above the positive stack, one below the negative stack.',
    },
    format: formatControl,
    ...overflowStrategyArgTypes,
  },
  args: { showDataLabels: true, showStackTotals: true, format: 'absolute', ...overflowStrategyArgs },
  render: (args) => (
    <VizStoryGraphProvider
      data={profitData}
      spec={pipe(
        createSpec(profitReshape, mapping({ x: 'month', y: 'amount', color: 'kind' })),
        geom.bar({
          position: 'stack',
          dataLabels: {
            showDataLabels: args.showDataLabels,
            showStackTotals: args.showStackTotals,
            format: args.format,
          },
        }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({
          axes: { y: { label: 'amount' } },
          panel: { overflow: { dataLabels: { x: args.overflowStrategyX, y: args.overflowStrategyY } } },
        })
      )}
      config={{
        type: 'columnStacked',
        dataLabels: {
          showDataLabels: args.showDataLabels,
          showStackTotals: args.showStackTotals,
        },
        axes: { y: { label: 'amount' } },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Dodged bar (grand-total share) ────────────────────────────────────────────

interface DodgedBarArgs {
  showDataLabels: boolean;
  format: Format;
}

export const DodgedBar: StoryObj<DodgedBarArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean' },
    format: formatControl,
  },
  args: { showDataLabels: true, format: 'absolute' },
  render: (args) => (
    <VizStoryGraphProvider
      data={regionData}
      spec={pipe(
        createSpec(regionReshape, mapping({ x: 'quarter', y: 'sales', color: 'region' })),
        geom.bar({
          position: 'dodge',
          dataLabels: { showDataLabels: args.showDataLabels, format: args.format },
        }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({ axes: { y: { label: 'sales' } } })
      )}
      config={{
        type: 'column',
        dataLabels: {
          showDataLabels: args.showDataLabels,
          dataLabelFormat: args.format,
        },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Filled bar (100% stacks) ──────────────────────────────────────────────────

interface FilledBarArgs {
  showDataLabels: boolean;
  format: Format;
}

export const FilledBar: StoryObj<FilledBarArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean' },
    format: formatControl,
  },
  args: { showDataLabels: true, format: 'percentage' },
  render: (args) => (
    <VizStoryGraphProvider
      data={regionData}
      spec={pipe(
        createSpec(regionReshape, mapping({ x: 'quarter', y: 'sales', color: 'region' })),
        geom.bar({
          position: 'fill',
          dataLabels: {
            showDataLabels: args.showDataLabels,
            format: args.format,
          },
        }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
      config={{
        type: 'columnStackedFill',
        dataLabels: { showDataLabels: args.showDataLabels, dataLabelFormat: args.format },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Pie / donut (polar bars) ──────────────────────────────────────────────────

const departmentSpendData: Data = {
  columns: [{ key: 'department' }, { key: 'spend' }],
  rows: [
    { department: 'Engineering', spend: 420 },
    { department: 'Marketing', spend: 180 },
    { department: 'Sales', spend: 150 },
    { department: 'Operations', spend: 95 },
    { department: 'HR', spend: 80 },
    { department: 'Legal', spend: 75 },
  ],
};

interface PieArgs {
  showDataLabels: boolean;
  format: Format;
  showCategoryLabels: boolean;
}

export const Pie: StoryObj<PieArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean', description: 'Per-wedge labels outside the arc.' },
    format: formatControl,
    showCategoryLabels: {
      control: 'boolean',
      description: 'Prepends the X-mapped category to each wedge label (e.g. "Engineering · 42.0%").',
    },
  },
  args: { showDataLabels: true, format: 'percentage', showCategoryLabels: false },
  render: (args) => (
    <VizStoryGraphProvider
      data={departmentSpendData}
      spec={pipe(
        createSpec({ x: '', y: 'spend', color: 'department' }),
        geom.bar({
          position: 'fill',
          dataLabels: {
            showDataLabels: args.showDataLabels,
            format: args.format,
            showCategoryLabels: args.showCategoryLabels,
          },
        }),
        coord.polar({ theta: 'y' }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
      config={{
        type: 'pie',
        dataLabels: {
          showDataLabels: args.showDataLabels,
          dataLabelFormat: args.format,
          showCategoryLabels: args.showCategoryLabels,
        },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

export const Donut: StoryObj<PieArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean', description: 'Per-wedge labels outside the arc.' },
    format: formatControl,
    showCategoryLabels: {
      control: 'boolean',
      description: 'Prepends the X-mapped category to each wedge label (e.g. "Engineering · 42.0%").',
    },
  },
  args: { showDataLabels: true, format: 'percentage', showCategoryLabels: false },
  render: (args) => (
    <VizStoryGraphProvider
      data={departmentSpendData}
      spec={pipe(
        createSpec({ x: '', y: 'spend', color: 'department' }),
        geom.bar({
          position: 'fill',
          dataLabels: {
            showDataLabels: args.showDataLabels,
            format: args.format,
            showCategoryLabels: args.showCategoryLabels,
          },
        }),
        coord.polar({ theta: 'y', innerRadius: 0.55 }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
      config={{
        type: 'donut',
        dataLabels: {
          showDataLabels: args.showDataLabels,
          dataLabelFormat: args.format,
          showCategoryLabels: args.showCategoryLabels,
        },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Rose / coxcomb (theta: x, dodged) ─────────────────────────────────────────
// Quarter spokes the angle, sales grows the radius, region dodges each spoke into petals. Labels
// sit outside each petal's arc; percentage is share of the layer grand total.

interface RadialArgs {
  showDataLabels: boolean;
  format: Format;
}

export const Rose: StoryObj<RadialArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean', description: 'Per-petal labels outside the arc.' },
    format: formatControl,
  },
  args: { showDataLabels: true, format: 'absolute' },
  render: (args) => (
    <VizStoryGraphProvider
      data={regionData}
      spec={pipe(
        createSpec(regionReshape, mapping({ x: 'quarter', y: 'sales', color: 'region' })),
        geom.bar({
          position: 'dodge',
          dataLabels: { showDataLabels: args.showDataLabels, format: args.format },
        }),
        coord.polar({ theta: 'x' }),
        scale.x.discrete(),
        scale.y({ zero: true }),
        scale.color.palette()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Radial bar / race-track (theta: y, stacked) ───────────────────────────────
// Quarter picks a concentric track, sales sweeps the angle, regions stack along the arc. Labels sit
// centred on each segment's track band.

export const RadialBar: StoryObj<RadialArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean', description: 'Per-segment labels centred on each track band.' },
    format: formatControl,
  },
  args: { showDataLabels: true, format: 'absolute' },
  render: (args) => (
    <VizStoryGraphProvider
      data={regionData}
      spec={pipe(
        createSpec(regionReshape, mapping({ x: 'quarter', y: 'sales', color: 'region' })),
        geom.bar({
          position: 'stack',
          dataLabels: { showDataLabels: args.showDataLabels, format: args.format },
        }),
        coord.polar({ theta: 'y', innerRadius: 0.15 }),
        scale.x.discrete(),
        scale.y({ zero: true }),
        scale.color.palette()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Line + point ──────────────────────────────────────────────────────────────

const trendData: Data = {
  columns: [{ key: 'month' }, { key: 'North' }, { key: 'South' }],
  rows: [
    { month: 'Jan', North: 320, South: 220 },
    { month: 'Feb', North: 380, South: 260 },
    { month: 'Mar', North: 410, South: 300 },
    { month: 'Apr', North: 470, South: 340 },
    { month: 'May', North: 520, South: 410 },
    { month: 'Jun', North: 590, South: 460 },
  ],
};

const trendReshape = transform.reshape({
  keep: ['month'],
  reshape: ['North', 'South'],
  keyName: 'region',
  valueName: 'sales',
});

export const Line: StoryObj<{
  showDataLabels: boolean;
  overflowStrategyX: PanelOverflowStrategy;
  overflowStrategyY: PanelOverflowStrategy;
}> = {
  argTypes: { showDataLabels: { control: 'boolean' }, ...overflowStrategyArgTypes },
  args: { showDataLabels: true, ...overflowStrategyArgs },
  render: (args) => (
    <VizStoryGraphProvider
      data={trendData}
      spec={pipe(
        createSpec(trendReshape, mapping({ x: 'month', y: 'sales', color: 'region' })),
        geom.line({ dataLabels: { showDataLabels: args.showDataLabels } }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({
          axes: { y: { label: 'sales' } },
          panel: { overflow: { dataLabels: { x: args.overflowStrategyX, y: args.overflowStrategyY } } },
        })
      )}
      config={{
        type: 'line',
        dataLabels: { showDataLabels: args.showDataLabels },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Scatter (size = bubble) ───────────────────────────────────────────────────

const bubbleData: Data = {
  columns: [{ key: 'gdp' }, { key: 'lifeExpectancy' }, { key: 'population' }, { key: 'continent' }],
  rows: [
    { gdp: 2000, lifeExpectancy: 55, population: 200, continent: 'Africa' },
    { gdp: 5000, lifeExpectancy: 60, population: 50, continent: 'Asia' },
    { gdp: 10000, lifeExpectancy: 65, population: 300, continent: 'Asia' },
    { gdp: 15000, lifeExpectancy: 70, population: 100, continent: 'Europe' },
    { gdp: 25000, lifeExpectancy: 75, population: 30, continent: 'Europe' },
    { gdp: 40000, lifeExpectancy: 80, population: 60, continent: 'Europe' },
    { gdp: 8000, lifeExpectancy: 62, population: 180, continent: 'Americas' },
    { gdp: 45000, lifeExpectancy: 81, population: 40, continent: 'Americas' },
  ],
};

interface BubbleArgs {
  showDataLabels: boolean;
  labelBy: 'default' | 'population' | 'continent' | 'lifeExpectancy' | 'star';
  overflowStrategyX: PanelOverflowStrategy;
  overflowStrategyY: PanelOverflowStrategy;
}

const bubbleLabelAes = (labelBy: BubbleArgs['labelBy']) => {
  switch (labelBy) {
    case 'default':
      return undefined;
    case 'star':
      return { value: '★' };
    default:
      return labelBy;
  }
};

/**
 * Demonstrates the per-geom default and the explicit aes.label override.
 * - `default` — no aes.label set; the point geom falls back to the first categorical mapped
 *   variable (continent), so each bubble is labelled with its continent.
 * - The other options exercise the explicit override path: any column can be the label, and
 *   the constant `★` shows the `{ value }` form.
 */
export const ScatterBubble: StoryObj<BubbleArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean' },
    labelBy: {
      control: { type: 'inline-radio' },
      options: ['default', 'population', 'continent', 'lifeExpectancy', 'star'],
      description:
        'What each bubble is labelled with. `default` lets the point geom pick: it uses the first categorical mapped variable (continent here), then size, then y.',
    },
    ...overflowStrategyArgTypes,
  },
  args: { showDataLabels: true, labelBy: 'default', ...overflowStrategyArgs },
  render: (args) => {
    const labelAes = bubbleLabelAes(args.labelBy);
    return (
      <VizStoryGraphProvider
        data={bubbleData}
        spec={pipe(
          createSpec({ x: 'gdp', y: 'lifeExpectancy', size: 'population', color: 'continent' }),
          geom.point({
            aes: labelAes === undefined ? undefined : { label: labelAes },
            dataLabels: { showDataLabels: args.showDataLabels },
          }),
          scale.x(),
          scale.y(),
          scale.size.continuous(),
          scale.color.palette(),
          config({ panel: { overflow: { dataLabels: { x: args.overflowStrategyX, y: args.overflowStrategyY } } } })
        )}
      >
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Stacked area ──────────────────────────────────────────────────────────────

export const Area: StoryObj<{
  showDataLabels: boolean;
  overflowStrategyX: PanelOverflowStrategy;
  overflowStrategyY: PanelOverflowStrategy;
}> = {
  argTypes: { showDataLabels: { control: 'boolean' }, ...overflowStrategyArgTypes },
  args: { showDataLabels: true, ...overflowStrategyArgs },
  render: (args) => (
    <VizStoryGraphProvider
      data={trendData}
      spec={pipe(
        createSpec(trendReshape, mapping({ x: 'month', y: 'sales', color: 'region' })),
        geom.area({ position: 'stack', dataLabels: { showDataLabels: args.showDataLabels } }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({ panel: { overflow: { dataLabels: { x: args.overflowStrategyX, y: args.overflowStrategyY } } } })
      )}
      config={{
        type: 'areaStacked',
        dataLabels: { showDataLabels: args.showDataLabels },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Multi-layer (per-layer toggle) ────────────────────────────────────────────

const comboData: Data = {
  columns: [{ key: 'month' }, { key: 'revenue' }, { key: 'forecast' }],
  rows: [
    { month: 'Jan', revenue: 1200, forecast: 1100 },
    { month: 'Feb', revenue: 1450, forecast: 1300 },
    { month: 'Mar', revenue: 1380, forecast: 1500 },
    { month: 'Apr', revenue: 1700, forecast: 1700 },
    { month: 'May', revenue: 1920, forecast: 1900 },
    { month: 'Jun', revenue: 2150, forecast: 2100 },
  ],
};

/**
 * Per-layer dataLabels: bars carry labels, the forecast line stays clean. The legacy GraphConfig
 * is chart-wide so it can't express this — the helper renders the "Not expressible" placeholder.
 */
export const MultiLayer: StoryObj = {
  render: () => (
    <VizStoryGraphProvider
      data={comboData}
      spec={pipe(
        createSpec(mapping({ x: 'month' })),
        geom.bar({ aes: { y: 'revenue' }, dataLabels: { showDataLabels: true } }),
        geom.line({ aes: { y: 'forecast' } }),
        scale.x(),
        scale.y()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
