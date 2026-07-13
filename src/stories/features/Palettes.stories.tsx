import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { CustomPalettesInput, Data, MonoPaletteBase, NeonPaletteBase } from '@graphysdk/viz-engine';
import { createSpec, geom, mapping, MONO_BASES, NEON_BASES, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Palettes',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Shared spec ──────────────────────────────────────────────────────────────

const sharedData: Data = {
  columns: [{ key: 'Category' }, { key: 'Value' }],
  rows: [
    { Category: 'A', Value: 100 },
    { Category: 'B', Value: 200 },
    { Category: 'C', Value: 300 },
    { Category: 'D', Value: 400 },
    { Category: 'E', Value: 500 },
    { Category: 'F', Value: 600 },
    { Category: 'G', Value: 700 },
  ],
};

const sharedSpec = pipe(
  createSpec(mapping({ x: 'Category', y: 'Value', color: 'Category' })),
  geom.bar(),
  scale.x(),
  scale.y()
);

// ─── Custom palettes ─────────────────────────────────────────────────────────────

const customPalettes: CustomPalettesInput = {
  canaries: [
    { id: '0', hex: '#00A650' },
    { id: '1', hex: '#FFF200' },
  ],
  rainbow: [
    { id: '0', hex: '#E40303' },
    { id: '1', hex: '#FF8C00' },
    { id: '2', hex: '#FFED00' },
    { id: '3', hex: '#008026' },
    { id: '4', hex: '#004CFF' },
    { id: '5', hex: '#732982' },
    { id: '6', hex: '#F5A9B8' },
  ],
};

// ─── Default ─────────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'When no palette is passed, the default palette is used.',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider data={sharedData} spec={pipe(sharedSpec)} config={{}}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Graphy ─────────────────────────────────────────────────────────────────────

export const Bright: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Opt into the built-in graphy (bright) palette by using `preset:graphy` as the paletteId',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider
      data={sharedData}
      spec={pipe(sharedSpec, scale.color.palette({ palette: { type: 'graphy' } }))}
      config={{ appearance: { paletteId: 'preset:graphy' } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Pastel ─────────────────────────────────────────────────────────────────────

export const Pastel: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Opt into the built-in pastel palette by using `preset:pastel` as the paletteId',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider
      data={sharedData}
      spec={pipe(sharedSpec, scale.color.palette({ palette: { type: 'pastel' } }))}
      config={{ appearance: { paletteId: 'preset:pastel' } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Mono  ─────────────────────────────────────────────────────────────────────

export const Mono: StoryObj<{ base: MonoPaletteBase }> = {
  parameters: {
    docs: {
      description: {
        story: 'Opt into the built-in mono palette by using `preset:mono:<base>` as the paletteId.',
      },
    },
  },
  args: {
    base: 'blue',
  },
  argTypes: {
    base: {
      control: { type: 'select' },
      options: MONO_BASES,
    },
  },
  render: ({ base }) => (
    <VizStoryGraphProvider
      data={sharedData}
      spec={pipe(sharedSpec, scale.color.palette({ palette: { type: 'mono', base } }))}
      config={{ appearance: { paletteId: `preset:mono:${base}` } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Neon  ─────────────────────────────────────────────────────────────────────

export const Neon: StoryObj<{ base: NeonPaletteBase }> = {
  parameters: {
    docs: {
      description: {
        story: 'Opt into the built-in neon palette by using `preset:neon:<base>` as the paletteId.',
      },
    },
  },
  args: {
    base: 'blue',
  },
  argTypes: {
    base: {
      control: { type: 'select' },
      options: NEON_BASES,
    },
  },
  render: ({ base }) => (
    <VizStoryGraphProvider
      data={sharedData}
      spec={pipe(sharedSpec, scale.color.palette({ palette: { type: 'neon', base } }))}
      config={{ appearance: { paletteId: `preset:neon:${base}` } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Custom ─────────────────────────────────────────────────────────────────────

export const Custom: StoryObj<{ paletteId: string }> = {
  parameters: {
    docs: {
      description: {
        story:
          'Opt into a custom palette by using a paletteId from the customPalettes object (`GraphConfig`) or by passing the custom palette directly (`SpecInput`).',
      },
    },
  },
  args: {
    paletteId: 'canaries',
  },
  argTypes: {
    paletteId: {
      control: { type: 'select' },
      options: Object.keys(customPalettes),
    },
  },
  render: ({ paletteId }) => (
    <VizStoryGraphProvider
      data={sharedData}
      customPalettes={customPalettes}
      spec={pipe(sharedSpec, scale.color.palette({ palette: { type: 'custom', id: paletteId } }))}
      config={{ appearance: { paletteId } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Overrides ─────────────────────────────────────────────────────────────────────

export const SeriesOverrides: StoryObj<{ base: MonoPaletteBase }> = {
  parameters: {
    docs: {
      description: {
        story: 'Override individual colors of a palette.',
      },
    },
  },
  args: {
    base: 'blue',
  },
  argTypes: {
    base: {
      control: { type: 'select' },
      options: MONO_BASES,
    },
  },
  render: ({ base }) => (
    <VizStoryGraphProvider
      data={sharedData}
      customPalettes={customPalettes}
      spec={pipe(
        sharedSpec,
        scale.color.palette({
          palette: { type: 'mono', base: base },
          overrides: { 2: { hex: '#FF0000' }, 5: { hex: '#ff0000' } },
        })
      )}
      config={{
        appearance: {
          paletteId: `preset:mono:${base}`,
          seriesStyles: {
            series2: { customColor: '#FF0000' },
            series5: { customColor: '#FF0000' },
          },
        },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

const smallData: Data = {
  columns: [{ key: 'Category' }, { key: 'Value' }],
  rows: [
    { Category: 'A', Value: 100 },
    { Category: 'B', Value: 200 },
    { Category: 'C', Value: 300 },
  ],
};

export const NamedOverrides: StoryObj<{ base: MonoPaletteBase }> = {
  parameters: {
    docs: {
      description: {
        story: 'Override custom palette colors by referencing another palette color by its id.',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider
      data={smallData}
      customPalettes={{
        brand: [
          { id: 'primary', hex: '#222222' },
          { id: 'secondary', hex: '#333333' },
          { id: 'tertiary', hex: '#444444' },
          { id: 'warning', hex: '#ff0000' },
        ],
      }}
      spec={pipe(
        sharedSpec,
        scale.color.palette({
          palette: { type: 'custom', id: 'brand' },
          overrides: { 2: { id: 'warning' } },
        })
      )}
      config={{
        appearance: {
          paletteId: 'brand',
          seriesStyles: {
            series2: { paletteColorId: 'warning' },
          },
        },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
