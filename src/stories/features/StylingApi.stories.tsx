import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { BorderRadiusToken, Data, LineStyleType, StyleRule, Stylesheet } from '@graphysdk/viz-engine';
import {
  BORDER_RADIUS_TOKENS,
  createSpec,
  DEFAULT_GRAPH_BACKGROUND,
  geom,
  highlight,
  mapping,
  pipe,
  scale,
  style,
  styles,
  token,
} from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

type StylingApiArgs = {
  threshold: number;
  ruleColor: string;
  defaultColor: string;
  ruleBorderRadius: BorderRadiusToken;
  dimAlpha: number;
  dimSaturation: number;
  hoverColor: string;
  tokenLight: string;
  tokenDark: string;
  preset: 'lennysNewsletter' | 'blueprint';
  overrideBrand: boolean;
  brandOverride: string;
  background: 'builtin' | 'solid' | 'tinted';
  backgroundColor: string;
  frameBorder: 'none' | 'solid' | 'tinted';
  frameColor: string;
  frameWidth: number;
  frameRadius: number;
  showTopEdge: boolean;
  showRightEdge: boolean;
  showBottomEdge: boolean;
  showLeftEdge: boolean;
  edgeLineType: LineStyleType;
  edgeWidth: number;
  panelRadius: number;
  gridLineType: LineStyleType;
  gridWidth: number;
  gridColor: string;
};

const edgeToggleArgType = (edge: string) => ({
  control: { type: 'boolean' as const },
  description: `Draw the ${edge} edge (off = strokeWidth 0: no paint, no reserved space).`,
  table: { category: 'Panel border' },
});

const meta: Meta<StylingApiArgs> = {
  title: 'Features/Styling API',
  decorators: [ResizablePlotDecorator],
  args: {
    threshold: 500,
    ruleColor: '#e5484d',
    defaultColor: '#c9ced8',
    ruleBorderRadius: 'full',
    dimAlpha: 0.25,
    dimSaturation: 0,
    hoverColor: '#ffcc00',
    tokenLight: '#e5484d',
    tokenDark: '#ff6369',
    preset: 'lennysNewsletter',
    overrideBrand: false,
    brandOverride: '#12b886',
    background: 'builtin',
    backgroundColor: '#ff6719',
    frameBorder: 'solid',
    frameColor: '#1d2129',
    frameWidth: 2,
    frameRadius: 8,
    showTopEdge: true,
    showRightEdge: true,
    showBottomEdge: true,
    showLeftEdge: true,
    edgeLineType: 'dashed',
    edgeWidth: 1,
    panelRadius: 8,
    gridLineType: 'dashed',
    gridWidth: 1,
    gridColor: 'rgba(29, 33, 41, 0.1)',
  },
  argTypes: {
    threshold: {
      control: { type: 'range', min: 0, max: 1000, step: 50 },
      description: 'Rule predicate threshold — bars with sales above it take the rule color.',
    },
    ruleColor: { control: 'color', description: 'Color the matching rule applies (beats the encoding).' },
    defaultColor: {
      control: 'color',
      description: 'Stylesheet default color — applies only where no encoding decided (yields to the encoding).',
    },
    ruleBorderRadius: {
      control: { type: 'select' },
      options: BORDER_RADIUS_TOKENS,
      description: 'Corner rounding the predicated rule applies to matching bars.',
    },
    dimAlpha: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: "Opacity of de-emphasized marks — the `{ state: 'dimmed' }` entry's alpha.",
    },
    dimSaturation: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Saturation of de-emphasized marks — `0` drains them to grey.',
    },
    hoverColor: { control: 'color', description: "Paint applied through a `{ state: 'hovered' }` entry." },
    tokenLight: { control: 'color', description: "The `accent` token's light variant." },
    tokenDark: { control: 'color', description: "The `accent` token's dark variant." },
    preset: {
      control: { type: 'inline-radio' },
      options: ['lennysNewsletter', 'blueprint'],
      description: 'The theme preset both graphs extend.',
    },
    overrideBrand: {
      control: 'boolean',
      description: "Redefine the preset's `brand` token from the spec — later wins, name-by-name.",
    },
    brandOverride: { control: 'color', description: 'The redefined `brand` value.' },
    background: {
      control: { type: 'inline-radio' },
      options: ['builtin', 'solid', 'tinted'],
      description:
        'builtin = the `graphBackground` token; solid = the picked color; tinted = the built-in ground mixed with the color.',
      table: { category: 'Frame' },
    },
    backgroundColor: {
      control: 'color',
      description: 'Solid background, or the tint anchor.',
      table: { category: 'Frame' },
    },
    frameBorder: {
      control: { type: 'inline-radio' },
      options: ['none', 'solid', 'tinted'],
      description: 'Ring around the chart. tinted derives a light-dark pair from the color.',
      table: { category: 'Frame' },
    },
    frameColor: { control: 'color', description: "The ring's color (or tint anchor).", table: { category: 'Frame' } },
    frameWidth: {
      control: { type: 'range', min: 0, max: 24, step: 1 },
      description: 'Ring width in px — it also shrinks the laid-out chart area.',
      table: { category: 'Frame' },
    },
    frameRadius: {
      control: { type: 'range', min: 0, max: 40, step: 1 },
      description: "The frame's corner rounding in px.",
      table: { category: 'Frame' },
    },
    showTopEdge: edgeToggleArgType('top'),
    showRightEdge: edgeToggleArgType('right'),
    showBottomEdge: edgeToggleArgType('bottom'),
    showLeftEdge: edgeToggleArgType('left'),
    edgeLineType: {
      control: { type: 'inline-radio' },
      options: ['solid', 'dashed', 'dotted'],
      description: 'Line type of the drawn border edges.',
      table: { category: 'Panel border' },
    },
    edgeWidth: {
      control: { type: 'range', min: 1, max: 6, step: 0.5 },
      description: 'Stroke width of the drawn edges — the panel shrinks by exactly this much per edge.',
      table: { category: 'Panel border' },
    },
    panelRadius: {
      control: { type: 'range', min: 0, max: 24, step: 1 },
      description: 'Corner rounding of the panel border; a corner rounds only between two drawn edges.',
      table: { category: 'Panel border' },
    },
    gridLineType: {
      control: { type: 'inline-radio' },
      options: ['solid', 'dashed', 'dotted'],
      description: "The grid lines' dash rhythm.",
      table: { category: 'Grid' },
    },
    gridWidth: {
      control: { type: 'range', min: 0.5, max: 4, step: 0.5 },
      description: "The grid lines' stroke width.",
      table: { category: 'Grid' },
    },
    gridColor: { control: 'color', description: "The grid lines' color.", table: { category: 'Grid' } },
  },
};

export default meta;
type Story = StoryObj<StylingApiArgs>;

const ALL_CONTROL_NAMES = [
  'threshold',
  'ruleColor',
  'defaultColor',
  'ruleBorderRadius',
  'dimAlpha',
  'dimSaturation',
  'hoverColor',
  'tokenLight',
  'tokenDark',
  'preset',
  'overrideBrand',
  'brandOverride',
  'background',
  'backgroundColor',
  'frameBorder',
  'frameColor',
  'frameWidth',
  'frameRadius',
  'showTopEdge',
  'showRightEdge',
  'showBottomEdge',
  'showLeftEdge',
  'edgeLineType',
  'edgeWidth',
  'panelRadius',
  'gridLineType',
  'gridWidth',
  'gridColor',
] as const;

/** Shows only the meta-level controls a story reads, so every visible knob has an effect. */
const showOnly = (...names: Array<keyof StylingApiArgs>) =>
  Object.fromEntries(
    ALL_CONTROL_NAMES.filter((name) => !names.includes(name)).map((name) => [name, { table: { disable: true } }])
  );

const salesData: Data = {
  columns: [{ key: 'month' }, { key: 'sales' }],
  rows: [
    { month: 'Jan', sales: 320 },
    { month: 'Feb', sales: 640 },
    { month: 'Mar', sales: 210 },
    { month: 'Apr', sales: 870 },
    { month: 'May', sales: 470 },
    { month: 'Jun', sales: 550 },
  ],
};

// A year of daily values — deterministic (layered sine waves), so the story is stable across
// reloads. Weekly and seasonal cycles push some days over the rule threshold and keep runs of
// matching bars visually grouped.
const dailyData: Data = {
  columns: [{ key: 'day' }, { key: 'sales' }],
  rows: Array.from({ length: 365 }, (_, dayIndex) => {
    const date = new Date(Date.UTC(2024, 0, 1 + dayIndex));
    const seasonal = 250 * Math.sin((dayIndex / 365) * Math.PI * 2);
    const weekly = 140 * Math.sin((dayIndex / 7) * Math.PI * 2);
    const drift = 90 * Math.sin(dayIndex / 11);
    return { day: date.toISOString().slice(0, 10), sales: Math.round(500 + seasonal + weekly + drift) };
  }),
};

const groupedData: Data = {
  columns: [{ key: 'month' }, { key: 'region' }, { key: 'sales' }],
  rows: [
    { month: 'Jan', region: 'North', sales: 320 },
    { month: 'Jan', region: 'South', sales: 180 },
    { month: 'Feb', region: 'North', sales: 640 },
    { month: 'Feb', region: 'South', sales: 90 },
    { month: 'Mar', region: 'North', sales: 210 },
    { month: 'Mar', region: 'South', sales: 560 },
    { month: 'Apr', region: 'North', sales: 470 },
    { month: 'Apr', region: 'South', sales: 610 },
  ],
};

/** Predicated rule on an unmapped graph: bars above the threshold take the rule color. */
export const BarsAboveThreshold: Story = {
  argTypes: showOnly('threshold', 'ruleColor', 'ruleBorderRadius'),
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales' }),
        geom.bar(),
        styles({
          overrides: [
            style.geom.bar(
              { color: args.ruleColor, borderRadius: args.ruleBorderRadius },
              { where: { variable: 'sales', gt: args.threshold } }
            ),
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

/** The same predicated rule over a year of daily bars — 365 observations through the cascade. */
export const DailyValuesAboveThreshold: Story = {
  argTypes: showOnly('threshold', 'ruleColor', 'defaultColor'),
  render: (args) => (
    <VizStoryGraphProvider
      data={dailyData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'day', y: 'sales' }),
        geom.bar({ params: { width: 1 } }),
        styles({
          defaults: [style.geom.bar({ color: args.defaultColor, borderRadius: 'none' })],
          overrides: [style.geom({ color: args.ruleColor }, { where: { variable: 'sales', gt: args.threshold } })],
        }),
        scale.x(),
        scale.y()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * Defaults vs rules against an encoding: the default grey is ignored (the color scale decided),
 * while the rule overrides the scale for matching observations only.
 */
export const DefaultsYieldRulesBeat: Story = {
  argTypes: showOnly('threshold', 'ruleColor', 'defaultColor'),
  render: (args) => (
    <VizStoryGraphProvider
      data={groupedData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales', color: 'region' }),
        geom.bar({ position: 'dodge' }),
        styles({
          defaults: [style.geom({ color: args.defaultColor })],
          overrides: [style.geom({ color: args.ruleColor }, { where: { variable: 'sales', gt: args.threshold } })],
        }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/** The same default grey on an unmapped graph: nothing decided the color, so the default applies. */
export const DefaultsOwnTheUnmapped: Story = {
  argTypes: showOnly('threshold', 'ruleColor', 'defaultColor'),
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales' }),
        geom.bar(),
        styles({
          defaults: [style.geom({ color: args.defaultColor })],
          overrides: [style.geom({ color: args.ruleColor }, { where: { variable: 'sales', gt: args.threshold } })],
        }),
        scale.x(),
        scale.y()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * Predicate-scoped border paint on stacks. Border and rounding shape the whole stack's
 * silhouette and resolve from its first observation — a stack whose first segment matches gets
 * the border; a match only in a later segment does not restyle it.
 */
export const PredicatedBorders: Story = {
  argTypes: showOnly('threshold', 'ruleColor', 'ruleBorderRadius'),
  render: (args) => (
    <VizStoryGraphProvider
      data={groupedData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales', color: 'region' }),
        geom.bar({ position: 'stack' }),
        styles({
          overrides: [
            style.geom.bar(
              { borderColor: args.ruleColor, borderWidth: 2, borderRadius: args.ruleBorderRadius },
              { where: { variable: 'sales', gt: args.threshold } }
            ),
          ],
        }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * An intentionally broken entry (unknown variable): the graph renders the built-in look and the
 * compile records an `INVALID_STYLE_RULE` warning instead of failing — it surfaces through
 * `CompileResult.warnings`, the same channel as every other user-input problem.
 */
export const InvalidRuleDegradesGracefully: Story = {
  argTypes: showOnly('threshold', 'ruleColor'),
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales' }),
        geom.bar(),
        styles({
          overrides: [style.geom({ color: args.ruleColor }, { where: { variable: 'salse', gt: args.threshold } })],
        }),
        scale.x(),
        scale.y()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * A custom `'dimmed'` state entry drives both de-emphasis systems from one declaration: the
 * highlight dims the South series with this paint, and hovering any bar dims the rest of the plot
 * with the same paint. `saturation: 0` at full alpha reads as "greyed out"; low alpha as "faded".
 */
export const CustomDimming: Story = {
  argTypes: showOnly('dimAlpha', 'dimSaturation'),
  render: (args) => (
    <VizStoryGraphProvider
      data={groupedData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales', color: 'region' }),
        geom.bar({ position: 'dodge' }),
        highlight({ variable: 'region', eq: 'North' }, { scope: 'series' }),
        styles({
          defaults: [style.geom({ alpha: args.dimAlpha, saturation: args.dimSaturation }, { state: 'dimmed' })],
        }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * `where` and `state` combine: dimmed marks below the threshold nearly vanish while dimmed marks
 * above it stay legible — the de-emphasis itself is data-aware. The unconditional dimmed entry is
 * the floor; the predicated one wins where it matches.
 */
export const ConditionalDimming: Story = {
  argTypes: showOnly('threshold', 'dimAlpha'),
  render: (args) => (
    <VizStoryGraphProvider
      data={groupedData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales', color: 'region' }),
        geom.bar({ position: 'dodge' }),
        highlight({ variable: 'region', eq: 'North' }, { scope: 'series' }),
        styles({
          defaults: [
            style.geom({ alpha: args.dimAlpha }, { state: 'dimmed' }),
            style.geom({ alpha: 0.05 }, { state: 'dimmed', where: { variable: 'sales', lt: args.threshold } }),
          ],
        }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * A `'hovered'` state entry recolors the point marker's ring, which is builtin-white otherwise.
 * The stateless border entry on the same layer styles the resting markers only — state paint
 * answers exclusively to state-scoped entries.
 */
export const HoveredPointRing: Story = {
  argTypes: showOnly('hoverColor'),
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales' }),
        geom.point(),
        styles({
          defaults: [
            style.geom.point({ size: 14, borderColor: '#1d2129', borderWidth: 1 }),
            style.geom.point({ borderColor: args.hoverColor }, { state: 'hovered' }),
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

/**
 * A `'hovered'` bar entry recolors the halo painted around the hovered segment (builtin-white).
 * The same axis serves every kind — this is the bar counterpart of {@link HoveredPointRing}.
 */
export const HoveredBarHalo: Story = {
  argTypes: showOnly('hoverColor'),
  render: (args) => (
    <VizStoryGraphProvider
      data={groupedData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales', color: 'region' }),
        geom.bar({ position: 'stack' }),
        styles({
          defaults: [style.geom.bar({ borderColor: args.hoverColor }, { state: 'hovered' })],
        }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * A token table names colors once; entries reference them with `token()`. The `accent` token is a
 * light-dark pair resolved against the provider's `colorScheme` — flip the storybook theme toolbar
 * and the same spec renders the other variant. The `base` token is a single literal, identical in
 * both schemes.
 */
/**
 * Two complete looks, each a plain constant. A preset restyles graphs it has never seen — its
 * `brand` token feeds the geom color default, and redefining the builtin `ruleColor` token
 * restyles every goal line without authoring a rule entry.
 */
const THEME_PRESETS: Record<StylingApiArgs['preset'], Stylesheet> = {
  lennysNewsletter: {
    tokens: {
      brand: '#ff6719',
      ruleColor: { light: '#1c1b1a', dark: '#f5f2ec' },
    },
    defaults: [
      style.geom({ color: token('brand') }),
      style.geom.bar({ borderRadius: 'full' }),
      style.geom.line({ strokeWidth: 3, fillAlpha: 0.18 }),
      style.geom.rule({ lineType: 'solid', strokeWidth: 2 }),
    ],
  },
  blueprint: {
    tokens: {
      brand: { light: '#1971c2', dark: '#74c0fc' },
      ruleColor: '#e8590c',
    },
    defaults: [
      style.geom({ color: token('brand') }),
      style.geom.bar({ borderRadius: 'none' }),
      style.geom.line({ strokeWidth: 1.5 }),
      style.geom.rule({ lineType: 'dotted' }),
    ],
  },
};

/**
 * One theme, two graphs. Both specs extend the selected preset; switching it reskins bars, line,
 * wash, and goal lines in one move. `overrideBrand` then redefines a single token from the spec —
 * the preset's own defaults repaint with it, later-wins, name-by-name.
 */
export const ThemePresets: Story = {
  argTypes: showOnly('threshold', 'preset', 'overrideBrand', 'brandOverride'),
  render: (args) => {
    const sheet = styles({
      extends: [THEME_PRESETS[args.preset]],
      ...(args.overrideBrand ? { tokens: { brand: args.brandOverride } } : {}),
    });
    return (
      <div style={{ display: 'flex', gap: 16, width: '100%', height: '100%' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <VizStoryGraphProvider
            data={salesData}
            spec={pipe(
              createSpec(),
              mapping({ x: 'month', y: 'sales' }),
              geom.bar(),
              geom.rule({ aes: { y: { value: args.threshold } }, params: { label: 'Goal', labelPosition: 'start' } }),
              sheet,
              scale.x(),
              scale.y()
            )}
          >
            <GraphRenderer />
          </VizStoryGraphProvider>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <VizStoryGraphProvider
            data={dailyData}
            spec={pipe(
              createSpec(),
              mapping({ x: 'day', y: 'sales' }),
              geom.line(),
              geom.rule({ aes: { y: { value: args.threshold } }, params: { label: 'Goal' } }),
              sheet,
              scale.x(),
              scale.y()
            )}
          >
            <GraphRenderer />
          </VizStoryGraphProvider>
        </div>
      </div>
    );
  },
};

export const Tokens: Story = {
  argTypes: showOnly('threshold', 'tokenLight', 'tokenDark'),
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(
        createSpec(),
        mapping({ x: 'month', y: 'sales' }),
        geom.bar(),
        styles({
          tokens: { base: '#c9ced8', accent: { light: args.tokenLight, dark: args.tokenDark } },
          defaults: [style.geom({ color: token('base') })],
          overrides: [style.geom({ color: token('accent') }, { where: { variable: 'sales', gt: args.threshold } })],
        }),
        scale.x(),
        scale.y()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

/**
 * The graph frame through `style.graph`: background, border ring, and corner rounding. The ring's
 * width both paints and shrinks the laid-out area — one resolved value feeds layout and paint.
 * The `tinted` variants replicate the retired appearance math with computed CSS colors.
 */
export const GraphFrame: Story = {
  argTypes: showOnly('background', 'backgroundColor', 'frameBorder', 'frameColor', 'frameWidth', 'frameRadius'),
  render: (args) => {
    const background =
      args.background === 'solid'
        ? args.backgroundColor
        : args.background === 'tinted'
          ? {
              light: `color-mix(in srgb, ${DEFAULT_GRAPH_BACKGROUND.light}, ${args.backgroundColor} 5%)`,
              dark: `color-mix(in srgb, ${DEFAULT_GRAPH_BACKGROUND.dark}, ${args.backgroundColor} 10%)`,
            }
          : undefined;
    const borderColor =
      args.frameBorder === 'solid'
        ? args.frameColor
        : args.frameBorder === 'tinted'
          ? {
              light: `hsl(from ${args.frameColor} h s calc(l * 1.1))`,
              dark: `hsl(from ${args.frameColor} h s calc(l * 0.9))`,
            }
          : undefined;
    return (
      <VizStoryGraphProvider
        data={groupedData}
        spec={pipe(
          createSpec(),
          mapping({ x: 'month', y: 'sales', color: 'region' }),
          geom.bar({ position: 'dodge' }),
          styles({
            defaults: [
              style.graph({
                ...(background === undefined ? {} : { background }),
                ...(borderColor === undefined ? { borderWidth: 0 } : { borderColor, borderWidth: args.frameWidth }),
                borderRadius: args.frameRadius,
              }),
            ],
          }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        )}
      >
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

/**
 * Panel border and grid through `style.panelBorder` / `style.gridLine`: toggle each edge (a hidden
 * edge reserves no layout space), pick the shared stroke, and restyle the grid — all through the
 * same cascade as geom paint.
 */
export const PanelBorderAndGrid: Story = {
  argTypes: showOnly(
    'showTopEdge',
    'showRightEdge',
    'showBottomEdge',
    'showLeftEdge',
    'edgeLineType',
    'edgeWidth',
    'panelRadius',
    'gridLineType',
    'gridWidth',
    'gridColor'
  ),
  render: (args) => {
    const hiddenEdges: StyleRule[] = [
      ...(args.showTopEdge ? [] : [style.panelBorder.top({ strokeWidth: 0 })]),
      ...(args.showRightEdge ? [] : [style.panelBorder.right({ strokeWidth: 0 })]),
      ...(args.showBottomEdge ? [] : [style.panelBorder.bottom({ strokeWidth: 0 })]),
      ...(args.showLeftEdge ? [] : [style.panelBorder.left({ strokeWidth: 0 })]),
    ];
    return (
      <VizStoryGraphProvider
        data={groupedData}
        spec={pipe(
          createSpec(),
          mapping({ x: 'month', y: 'sales', color: 'region' }),
          geom.bar({ position: 'dodge' }),
          styles({
            defaults: [
              style.panelBorder({
                lineType: args.edgeLineType,
                strokeWidth: args.edgeWidth,
                borderRadius: args.panelRadius,
              }),
              ...hiddenEdges,
              style.gridLine({ lineType: args.gridLineType, strokeWidth: args.gridWidth, color: args.gridColor }),
            ],
          }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        )}
      >
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
