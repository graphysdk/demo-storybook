import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import type { ThemeOverrides } from '@graphysdk/react-renderer';
import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data, PanelOverflowStrategy, StyleRule } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale, style, styles, transform } from '@graphysdk/viz-engine';

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

type Placement = 'auto' | 'inside' | 'outside';
type Anchor = 'start' | 'center' | 'end';
type Justify = Anchor | 'panel-start' | 'panel-end';

interface PlacementArgs {
  position: Placement;
  justify: Justify;
  align: Anchor;
  offset: number;
}

const placementArgTypes = {
  position: {
    control: { type: 'inline-radio' as const },
    options: ['auto', 'inside', 'outside'] satisfies Placement[],
    description:
      'Where labels sit relative to the geom. Auto keeps the engine heuristics (fit inside, flip outside, drop); explicit values render exactly as asked.',
  },
  justify: {
    control: { type: 'inline-radio' as const },
    options: ['start', 'center', 'end', 'panel-start', 'panel-end'] satisfies Justify[],
    description:
      "Anchor along the geom's value axis — 'end' is the value tip on vertical, flipped, and negative bars alike (radial on pie). The panel anchors pin the label to the panel's edge instead, regardless of the geom's length. Ignored under auto.",
  },
  align: {
    control: { type: 'inline-radio' as const },
    options: ['start', 'center', 'end'] satisfies Anchor[],
    description:
      "Anchor across the geom's secondary axis — bandwidth for bars, angular for pie wedges. Always stays within the geom (point/line labels sit beside it). Ignored under auto.",
  },
  offset: {
    control: { type: 'number' as const },
    description:
      "Gap in pixels between the geom's edge and the label box along the value axis (align edges are unaffected).",
  },
};

const pickPlacement = (args: PlacementArgs): PlacementArgs => ({
  position: args.position,
  justify: args.justify,
  align: args.align,
  offset: args.offset,
});

type CategoryPlacement = Exclude<Placement, 'auto'>;

interface CategoryPlacementArgs {
  showCategoryLabels: boolean;
  categoryPosition: CategoryPlacement;
  categoryJustify: Justify;
  categoryAlign: Anchor;
  categoryOffset: number;
}

const categoryArgTypes = {
  showCategoryLabels: {
    control: 'boolean' as const,
    description: 'Adds a second label per bar carrying the category text, shown even without value labels.',
  },
  categoryPosition: {
    control: { type: 'inline-radio' as const },
    options: ['inside', 'outside'] satisfies CategoryPlacement[],
    description: 'Where the category label sits relative to its bar (no auto — it renders exactly as asked).',
  },
  categoryJustify: {
    control: { type: 'inline-radio' as const },
    options: ['start', 'center', 'end', 'panel-start', 'panel-end'] satisfies Justify[],
    description: "Category label's anchor along the bar's value axis; panel anchors pin it to the chart edge.",
  },
  categoryAlign: {
    control: { type: 'inline-radio' as const },
    options: ['start', 'center', 'end'] satisfies Anchor[],
    description: "Category label's anchor across the bar's bandwidth.",
  },
  categoryOffset: {
    control: { type: 'number' as const },
    description: 'Gap in pixels between the anchored edge and the category label box.',
  },
};

const pickCategoryPlacement = (args: CategoryPlacementArgs): CategoryPlacementArgs => ({
  showCategoryLabels: args.showCategoryLabels,
  categoryPosition: args.categoryPosition,
  categoryJustify: args.categoryJustify,
  categoryAlign: args.categoryAlign,
  categoryOffset: args.categoryOffset,
});

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

interface SingleBarArgs extends PlacementArgs, CategoryPlacementArgs {
  showDataLabels: boolean;
  flipped: boolean;
}

export const SingleBar: StoryObj<SingleBarArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean', description: 'Toggles per-observation labels on the bars.' },
    flipped: { control: 'boolean', description: 'Flip x/y axes (horizontal bars).' },
    ...placementArgTypes,
    ...categoryArgTypes,
  },
  args: {
    showDataLabels: true,
    flipped: false,
    position: 'auto',
    justify: 'end',
    align: 'center',
    offset: 4,
    showCategoryLabels: false,
    categoryPosition: 'inside',
    categoryJustify: 'start',
    categoryAlign: 'center',
    categoryOffset: 4,
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={productData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'product', y: 'revenue' }),
        geom.bar({
          dataLabels: {
            showDataLabels: args.showDataLabels,
            ...pickPlacement(args),
            ...pickCategoryPlacement(args),
          },
        }),
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

// ─── Style gallery (placement + typography presets) ────────────────────────────

interface LabelStyle {
  name: string;
  dataLabels: {
    position: CategoryPlacement;
    justify: Justify;
    align: Anchor;
    offset: number;
    showCategoryLabels?: boolean;
    categoryPosition?: CategoryPlacement;
    categoryJustify?: Justify;
    categoryAlign?: Anchor;
    categoryOffset?: number;
  };
  /** The preset's `style.dataLabel` entries — its label typography and colour. */
  labelStyles: StyleRule[];
  themeOverrides: ThemeOverrides;
  /** Fill(s) for the bars — one colour paints every bar the same, several cycle per bar. */
  barColors: string[];
  background: string;
  theme: 'light' | 'dark';
  flipped?: boolean;
}

const DEFAULT_LABEL_STYLE: LabelStyle = {
  name: 'Highlight pills',
  dataLabels: { position: 'outside', justify: 'end', align: 'center', offset: 8 },
  labelStyles: [
    style.dataLabel({ fontSize: 11, fontWeight: 800, textColor: '#1a1b2e' }),
    style.dataLabel.observation.outside({ background: '#ffd43b' }),
  ],
  themeOverrides: {},
  barColors: ['#1a1b2e'],
  background: '#f4f1ea',
  theme: 'light',
};

const LABEL_STYLES: LabelStyle[] = [
  DEFAULT_LABEL_STYLE,
  {
    name: 'Poster',
    dataLabels: { position: 'inside', justify: 'end', align: 'center', offset: 10 },
    labelStyles: [
      style.dataLabel({ fontFamily: `'Arial Narrow', Impact, sans-serif`, fontSize: 20, fontWeight: 900 }),
      style.dataLabel.observation.inside({ textColor: '#ffffff' }),
    ],
    themeOverrides: {},
    barColors: ['#ff5470', '#ff8e3c', '#3da9fc', '#7f5af0', '#2cb67d', '#ef4565'],
    background: '#fffffe',
    theme: 'light',
  },
  {
    name: 'Terminal',
    dataLabels: { position: 'inside', justify: 'start', align: 'center', offset: 10 },
    labelStyles: [
      style.dataLabel({ fontFamily: `'SF Mono', Menlo, monospace`, fontSize: 11, fontWeight: 700 }),
      style.dataLabel.observation.inside({ textColor: '#39ff14' }),
    ],
    themeOverrides: {},
    barColors: ['#0f2e18'],
    background: '#050a05',
    theme: 'dark',
    flipped: true,
  },
  {
    name: 'Ledger',
    dataLabels: {
      position: 'inside',
      justify: 'panel-end',
      align: 'center',
      offset: 14,
      showCategoryLabels: true,
      categoryPosition: 'inside',
      categoryJustify: 'start',
      categoryAlign: 'center',
      categoryOffset: 14,
    },
    // The bare entry's gold reaches inside labels too, over the built-in inside white.
    labelStyles: [
      style.dataLabel({ fontSize: 12, fontWeight: 800, textColor: '#f5c518' }),
      style.dataLabel.category({ fontSize: 11, fontWeight: 500 }),
    ],
    themeOverrides: {},
    barColors: ['#1e2a4a'],
    background: '#0d1526',
    theme: 'dark',
    flipped: true,
  },
  {
    name: 'Editorial',
    dataLabels: { position: 'outside', justify: 'end', align: 'center', offset: 14 },
    labelStyles: [
      style.dataLabel({ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, textColor: '#9f1239' }),
      style.dataLabel.observation.outside({ background: 'transparent' }),
    ],
    themeOverrides: {},
    barColors: ['#e8b4b8'],
    background: '#fdf6ec',
    theme: 'light',
  },
];

const StyleGalleryPreview = () => {
  const [selectedStyle, setSelectedStyle] = useState<LabelStyle>(DEFAULT_LABEL_STYLE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {LABEL_STYLES.map((labelStyle) => {
          const isSelected = labelStyle.name === selectedStyle.name;
          return (
            <button
              key={labelStyle.name}
              type="button"
              onClick={() => setSelectedStyle(labelStyle)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: isSelected ? '1px solid #4c6ef5' : '1px solid #ccc',
                background: isSelected ? '#edf2ff' : '#fff',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {labelStyle.name}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <VizStoryGraphProvider
          key={selectedStyle.name}
          data={productData}
          spec={pipe(
            createSpec(),
            mapping({ x: 'product', y: 'revenue', color: 'product' }),
            geom.bar({ dataLabels: { showDataLabels: true, ...selectedStyle.dataLabels } }),
            scale.x(),
            scale.y(),
            scale.color.discrete({ range: selectedStyle.barColors }),
            ...(selectedStyle.flipped ? [coord.flip()] : []),
            config({
              legend: { position: 'none' },
              axes: { y: { label: 'revenue' } },
            }),
            styles({ defaults: [style.graph({ background: selectedStyle.background }), ...selectedStyle.labelStyles] })
          )}
          colorScheme={selectedStyle.theme}
          themeOverrides={selectedStyle.themeOverrides}
        >
          <GraphRenderer />
        </VizStoryGraphProvider>
      </div>
    </div>
  );
};

/**
 * Five preset label looks, each combining placement (position / justify / align / offset) with
 * label typography and colour via `style.dataLabel` entries, plus matching bar and background
 * colours. Switch presets with the buttons above the preview.
 */
export const StyleGallery: StoryObj = {
  render: () => <StyleGalleryPreview />,
};

// ─── Bar list (categories inside, values at the panel edge) ────────────────────

const routeData: Data = {
  columns: [{ key: 'route' }, { key: 'requests' }],
  rows: [
    { route: '/login', requests: 207000 },
    { route: '/', requests: 149000 },
    { route: '/oauth/git', requests: 125000 },
    { route: '/new/import', requests: 78000 },
    { route: '/login/v0', requests: 64000 },
    { route: '/signup/v0', requests: 51000 },
    { route: '/signup', requests: 48000 },
  ],
};

interface BarListArgs {
  dark: boolean;
}

/**
 * The Vercel-style bar list, recreated as closely as the spec + theme surface allows: flipped
 * grey bars on a near-black canvas, the route inside each bar at its base, and the bold value
 * pinned to the panel's right edge via `justify: 'panel-end'` — flush at one x regardless of bar
 * length. Chrome is stripped (axes, grid, panel border, legend); `domainMax` leaves headroom so
 * the longest bar stops short of the value column; the outside label background is disabled and
 * the label type restyled through `style.dataLabel` entries.
 */
export const BarList: StoryObj<BarListArgs> = {
  argTypes: {
    dark: { control: 'boolean', description: 'Render on the dark theme, as in the reference design.' },
  },
  args: { dark: true },
  render: (args) => (
    <VizStoryGraphProvider
      data={routeData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'route', y: 'requests', color: 'route' }),
        geom.bar({
          dataLabels: {
            showDataLabels: true,
            showCategoryLabels: true,
            position: 'inside',
            justify: 'panel-end',
            offset: 16,
            categoryPosition: 'inside',
            categoryJustify: 'start',
            categoryOffset: 16,
          },
        }),
        // padding 0.35 reproduces the reference's bar-to-gap ratio (~68px bars, ~36px gaps).
        scale.x(),
        // The reference's longest bar spans the full width with its value over it — end the
        // domain exactly at the data maximum instead of nice-ing past it.
        scale.y.continuous({ nice: false }),
        // A single-colour range paints every bar the same neutral grey without a legend.
        scale.color.discrete({ range: [args.dark ? '#2a2a2a' : '#e8e8e8'] }),
        coord.flip(),
        config({
          legend: { position: 'none' },
          axes: {
            x: { isVisible: false, grid: { isVisible: false } },
            y: { isVisible: false, grid: { isVisible: false } },
          },
        }),
        styles({
          defaults: [
            style.panelBorder({ strokeWidth: 0 }),
            style.graph({ background: args.dark ? '#0b0b0b' : '#fafafa' }),
            style.dataLabel({ fontSize: 14, fontWeight: 600, textColor: args.dark ? '#ffffff' : '#111111' }),
            style.dataLabel.category({ fontWeight: 400 }),
            style.dataLabel.observation.inside({ textColor: args.dark ? '#d9d9d9' : '#333333' }),
            style.dataLabel.category.inside({ textColor: args.dark ? '#d9d9d9' : '#333333' }),
            style.dataLabel.observation.outside({ background: 'transparent' }),
            style.dataLabel.category.outside({ background: 'transparent' }),
          ],
        })
      )}
      colorScheme={args.dark ? 'dark' : 'light'}
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

interface StackedBarArgs extends PlacementArgs {
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
    ...placementArgTypes,
  },
  args: {
    showDataLabels: true,
    showStackTotals: true,
    format: 'absolute',
    ...overflowStrategyArgs,
    position: 'auto',
    justify: 'center',
    align: 'center',
  },
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
            ...pickPlacement(args),
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

// ─── Grouped negative bars (sign-invariant justify) ────────────────────────────

interface NegativeBarArgs extends PlacementArgs {
  showDataLabels: boolean;
  flipped: boolean;
}

/**
 * Dogfoods the geometry-relative anchor: with `justify: 'end'` every label tracks the value tip —
 * the top of positive bars and the bottom of negative bars — under both orientations.
 */
export const GroupedNegativeBars: StoryObj<NegativeBarArgs> = {
  argTypes: {
    showDataLabels: { control: 'boolean' },
    flipped: { control: 'boolean', description: 'Flip x/y axes (horizontal bars).' },
    ...placementArgTypes,
  },
  args: { showDataLabels: true, flipped: false, position: 'outside', justify: 'end', align: 'center' },
  render: (args) => (
    <VizStoryGraphProvider
      data={profitData}
      spec={pipe(
        createSpec(profitReshape, mapping({ x: 'month', y: 'amount', color: 'kind' })),
        geom.bar({
          position: 'dodge',
          dataLabels: { showDataLabels: args.showDataLabels, ...pickPlacement(args) },
        }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        ...(args.flipped ? [coord.flip()] : []),
        config({ axes: { y: { label: 'amount' } } })
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

interface PieArgs extends PlacementArgs {
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
    ...placementArgTypes,
  },
  args: {
    showDataLabels: true,
    format: 'percentage',
    showCategoryLabels: false,
    position: 'auto',
    justify: 'end',
    align: 'center',
  },
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
            ...pickPlacement(args),
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

interface LineArgs extends PlacementArgs {
  showDataLabels: boolean;
  overflowStrategyX: PanelOverflowStrategy;
  overflowStrategyY: PanelOverflowStrategy;
}

export const Line: StoryObj<LineArgs> = {
  argTypes: { showDataLabels: { control: 'boolean' }, ...overflowStrategyArgTypes, ...placementArgTypes },
  args: {
    showDataLabels: true,
    ...overflowStrategyArgs,
    position: 'auto',
    justify: 'end',
    align: 'center',
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={trendData}
      spec={pipe(
        createSpec(trendReshape, mapping({ x: 'month', y: 'sales', color: 'region' })),
        geom.line({ dataLabels: { showDataLabels: args.showDataLabels, ...pickPlacement(args) } }),
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

interface BubbleArgs extends PlacementArgs {
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
    ...placementArgTypes,
  },
  args: {
    showDataLabels: true,
    labelBy: 'default',
    ...overflowStrategyArgs,
    position: 'auto',
    justify: 'end',
    align: 'center',
  },
  render: (args) => {
    const labelAes = bubbleLabelAes(args.labelBy);
    return (
      <VizStoryGraphProvider
        data={bubbleData}
        spec={pipe(
          createSpec({ x: 'gdp', y: 'lifeExpectancy', size: 'population', color: 'continent' }),
          geom.point({
            aes: labelAes === undefined ? undefined : { label: labelAes },
            dataLabels: { showDataLabels: args.showDataLabels, ...pickPlacement(args) },
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

interface AreaArgs extends PlacementArgs {
  showDataLabels: boolean;
  overflowStrategyX: PanelOverflowStrategy;
  overflowStrategyY: PanelOverflowStrategy;
}

export const Area: StoryObj<AreaArgs> = {
  argTypes: { showDataLabels: { control: 'boolean' }, ...overflowStrategyArgTypes, ...placementArgTypes },
  args: {
    showDataLabels: true,
    ...overflowStrategyArgs,
    position: 'auto',
    justify: 'end',
    align: 'center',
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={trendData}
      spec={pipe(
        createSpec(trendReshape, mapping({ x: 'month', y: 'sales', color: 'region' })),
        geom.area({
          position: 'stack',
          dataLabels: { showDataLabels: args.showDataLabels, ...pickPlacement(args) },
        }),
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
