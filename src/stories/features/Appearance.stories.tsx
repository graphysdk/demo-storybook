import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { BorderConfig, BorderPreset, Data } from '@graphysdk/viz-engine';
import { BORDER_PRESETS, config, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Appearance',
  decorators: [ResizablePlotDecorator],
};

export default meta;

// ─── Shared spec ──────────────────────────────────────────────────────────────

const salesData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }],
  rows: [
    { quarter: 'Q1', North: 350, South: 200, West: 500 },
    { quarter: 'Q2', North: 300, South: 250, West: 350 },
    { quarter: 'Q3', North: 400, South: 300, West: 300 },
    { quarter: 'Q4', North: 200, South: 150, West: 400 },
  ],
};

const baseSpec = pipe(
  createSpec(
    transform.reshape({
      keep: ['quarter'],
      reshape: ['North', 'South', 'West'],
      keyName: 'region',
      valueName: 'sales',
    }),
    mapping({ x: 'quarter', y: 'sales', color: 'region' })
  ),
  geom.bar({ position: 'stack' }),
  scale.x(),
  scale.y(),
  scale.color.palette()
);

// ─── Text scale ───────────────────────────────────────────────────────────────

interface TextScaleArgs {
  textScale: number;
}

export const TextScale: StoryObj<TextScaleArgs> = {
  argTypes: {
    textScale: {
      control: { type: 'range', min: 0.5, max: 3, step: 0.1 },
      description:
        'Multiplier applied to every text element. The renderer sets a CSS variable; em-based theme tokens scale automatically.',
    },
  },
  args: { textScale: 1 },
  parameters: {
    docs: {
      description: {
        story:
          'Drag the slider to scale all chart text uniformly. Tick labels, axis labels, the legend and headers all scale together.',
      },
    },
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(baseSpec, config({ appearance: { textScale: args.textScale } }))}
      config={{
        type: 'columnStacked',
        appearance: { textScale: args.textScale },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Background ───────────────────────────────────────────────────────────────

type BackgroundMode = 'theme' | 'solid' | 'transparent' | 'tinted';
type Mode = 'readonly' | 'editable';

interface BackgroundArgs {
  background: BackgroundMode;
  solidColor: string;
  tintAnchor: string;
  useFirstPaletteColor: boolean;
  mode: Mode;
}

const resolveBackground = (args: BackgroundArgs) => {
  if (args.background === 'theme') return { type: 'theme' as const };
  if (args.background === 'transparent') return { type: 'solid' as const, color: 'transparent' };
  if (args.background === 'tinted') {
    return args.useFirstPaletteColor
      ? { type: 'tinted' as const }
      : { type: 'tinted' as const, color: args.tintAnchor };
  }
  return { type: 'solid' as const, color: args.solidColor };
};

export const Background: StoryObj<BackgroundArgs> = {
  argTypes: {
    background: {
      control: { type: 'inline-radio' },
      options: ['theme', 'solid', 'transparent', 'tinted'] satisfies BackgroundMode[],
      description:
        'theme = inherit the active theme token. solid = override with the picked color. transparent = explicit no fill. tinted = mix the theme background with an anchor color.',
    },
    solidColor: {
      control: { type: 'color' },
      description: 'Used only when background is "solid".',
      if: { arg: 'background', eq: 'solid' },
    },
    useFirstPaletteColor: {
      control: { type: 'boolean' },
      description:
        'When true the compiler resolves the tint anchor to the first color of the active palette. When false the color picker is used.',
      if: { arg: 'background', eq: 'tinted' },
    },
    tintAnchor: {
      control: { type: 'color' },
      description: 'Anchor color mixed with the theme background. Used only when background is "tinted".',
      if: { arg: 'useFirstPaletteColor', truthy: false },
    },
    mode: {
      control: { type: 'inline-radio' },
      options: ['readonly', 'editable'] satisfies Mode[],
      description:
        'In editable mode the renderer paints a checkered backdrop behind a transparent background so the chart boundary stays visible to authors.',
      if: { arg: 'background', eq: 'transparent' },
    },
  },
  args: {
    background: 'theme',
    solidColor: '#fef3c7',
    tintAnchor: '#B399FE',
    useFirstPaletteColor: true,
    mode: 'readonly',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Control `config.appearance.background`. The renderer overrides the `--graphy-graph-background` CSS variable when a solid color (including `transparent`) is provided, or composes a `color-mix` expression for the tinted variant. Switch to `editable` mode with a transparent background to see the editor transparency backdrop.',
      },
    },
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(baseSpec, config({ appearance: { background: resolveBackground(args) } }))}
    >
      <GraphRenderer mode={args.mode} />
    </VizStoryGraphProvider>
  ),
};

// ─── Border ───────────────────────────────────────────────────────────────────

type BorderType = BorderConfig['type'];

interface BorderArgs {
  type: BorderType;
  color: string;
  preset: BorderPreset;
  width: number;
  cornerRadius: number;
}

const resolveBorder = (args: BorderArgs): BorderConfig => {
  if (args.type === 'none') return { type: 'none' };
  if (args.type === 'solid') return { type: 'solid', color: args.color, width: args.width };
  if (args.type === 'tinted') return { type: 'tinted', color: args.color, width: args.width };
  if (args.type === 'gradient') return { type: 'gradient', color: args.color, width: args.width };
  return { type: 'preset', preset: args.preset, width: args.width };
};

export const Border: StoryObj<BorderArgs> = {
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['none', 'solid', 'tinted', 'gradient', 'preset'] satisfies BorderType[],
      description: 'Border paint style. For a theme-aware grey ring use `solid` with `var(--graphy-grey-70)`.',
    },
    color: {
      control: { type: 'color' },
      description: 'Used when type is solid, tinted, or gradient.',
      if: { arg: 'type', neq: 'none' },
    },
    preset: {
      control: { type: 'select' },
      options: BORDER_PRESETS,
      description: 'Named gradient preset. Only used when type is "preset".',
      if: { arg: 'type', eq: 'preset' },
    },
    width: {
      control: { type: 'range', min: 0, max: 48, step: 1 },
      description: 'Ring thickness in pixels. Subtracted from plot/panel dimensions.',
      if: { arg: 'type', neq: 'none' },
    },
    cornerRadius: {
      control: { type: 'range', min: 0, max: 24, step: 1 },
      description: 'Corner radius (px) applied to both the chart frame and inner content.',
    },
  },
  args: {
    type: 'solid',
    color: '#B399FE',
    preset: 'lilac',
    width: 12,
    cornerRadius: 8,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Control `config.appearance.border` and `config.appearance.cornerRadius`. The ring is painted INSIDE the chart bounds — increasing `width` shrinks the plot/panel area. `tinted` and `gradient` fall back to the first palette color when no `color` is provided.',
      },
    },
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      spec={pipe(baseSpec, config({ appearance: { border: resolveBorder(args), cornerRadius: args.cornerRadius } }))}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Text style (fonts) ─────────────────────────────────────────────────────────

const fontList = [
  { id: 'arial', fontFamily: 'Arial' },
  { id: 'verdana', fontFamily: 'Verdana' },
  { id: 'tahoma', fontFamily: 'Tahoma' },
  { id: 'trebuchet-ms', fontFamily: 'Trebuchet MS' },
  { id: 'times-new-roman', fontFamily: 'Times New Roman' },
  { id: 'georgia', fontFamily: 'Georgia' },
  { id: 'garamond', fontFamily: 'Garamond' },
  { id: 'courier-new', fontFamily: 'Courier New' },
  { id: 'brush-script-mt', fontFamily: 'Brush Script MT' },
] as const;

interface TextStyleArgs {
  headingFont: string;
  bodyFont: string;
}

const fontControl = {
  control: { type: 'select' as const },
  options: fontList.map((font) => font.id),
};

export const TextStyle: StoryObj<TextStyleArgs> = {
  argTypes: {
    headingFont: { ...fontControl, description: 'Font for the title and subtitle.' },
    bodyFont: { ...fontControl, description: 'Font for axis labels, tick labels and the legend.' },
  },
  args: { headingFont: 'tahoma', bodyFont: 'courier-new' },
  parameters: {
    docs: {
      description: {
        story:
          'Override heading and body fonts via `config.appearance.textStyle`. The config stores font `id`s which should match an entry in the `fontList` prop. ',
      },
    },
  },
  render: (args) => (
    <VizStoryGraphProvider
      data={salesData}
      fontList={[...fontList]}
      config={{
        type: 'columnStacked',
        content: { title: 'Quarterly sales by region', subtitle: 'Heading vs. body font families' },
        appearance: {
          textStyle: {
            heading: { fontId: args.headingFont },
            body: { fontId: args.bodyFont },
          },
        },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
