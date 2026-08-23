import type { Meta, StoryObj } from '@storybook/react';

import { type FontTokenOverride, GraphRenderer, type ThemeOverrides } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

/**
 * A live playground for the chrome theme tokens — the presentational style knobs lifted
 * out of module constants so they can be tuned via `themeOverrides` without swapping a whole region.
 * The structural ones (tick-label offset, legend swatch/gap/pill chrome) also feed the layout solve,
 * so dragging them moves the reserved space and the painted size together.
 */
const meta: Meta = {
  title: 'Features/Style Tokens',
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

const sharedSpec = pipe(
  createSpec(
    transform.reshape({
      keep: ['quarter'],
      reshape: ['North', 'South', 'West'],
      keyName: 'region',
      valueName: 'sales',
    }),
    mapping({ x: 'quarter', y: 'sales', color: 'region' })
  ),
  geom.bar({ position: 'stack', dataLabels: { showDataLabels: true, showStackTotals: true } }),
  scale.x(),
  scale.y(),
  scale.color.palette(),
  config({ legend: { position: 'top' } })
);

const sharedConfig = { type: 'columnStacked', axes: { y: { label: 'sales' } } } as const;

// ─── Controls ────────────────────────────────────────────────────────────────

interface StyleTokenArgs {
  // Legend (structural)
  legendSwatchWidth: number;
  legendSwatchHeight: number;
  legendSwatchGap: number;
  legendItemGap: number;
  legendPillPaddingInline: number;
  legendPillPaddingBlock: number;
  legendPillBorderWidth: number;
  legendBorderColor: string;
  // Tooltip (paint only — hover a bar to see)
  tooltipBorderRadius: number;
  tooltipPaddingBlock: number;
  tooltipPaddingInline: number;
  tooltipShadow: string;
  // Fonts (structural — measurement follows paint)
  fontLegendLabel: FontTokenOverride;
  fontFamilyDefault: string;
}

const pxRange = (min: number, max: number, category: string, description: string) => ({
  control: { type: 'range' as const, min, max, step: 1 },
  table: { category },
  description,
});

// Storybook's raw JSON editor can deliver null for a valid "null" input.
const hasFontFields = (override: FontTokenOverride | null | undefined): boolean =>
  override !== null && override !== undefined && Object.keys(override).length > 0;

const fontToken = (description: string) => ({
  control: 'object' as const,
  table: { category: 'Fonts (structural)' },
  description: `${description} Structured override, e.g. { "weight": 600, "size": { "value": 14, "unit": "px" }, "family": "Georgia, serif" } (px sizes ignore text scale). Omitted fields keep the theme default. Moves JS measurement together with paint.`,
});

type Story = StoryObj<StyleTokenArgs>;

export const Playground: Story = {
  args: {
    legendSwatchWidth: 10,
    legendSwatchHeight: 12,
    legendSwatchGap: 8,
    legendItemGap: 8,
    legendPillPaddingInline: 8,
    legendPillPaddingBlock: 2,
    legendPillBorderWidth: 1,
    legendBorderColor: '',
    tooltipBorderRadius: 6,
    tooltipPaddingBlock: 8,
    tooltipPaddingInline: 10,
    tooltipShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
    fontLegendLabel: {},
    fontFamilyDefault: '',
  },
  argTypes: {
    legendSwatchWidth: pxRange(4, 40, 'Legend (structural)', 'Swatch width; feeds the legend width measure.'),
    legendSwatchHeight: pxRange(4, 40, 'Legend (structural)', 'Swatch height; feeds the legend height measure.'),
    legendSwatchGap: pxRange(0, 24, 'Legend (structural)', 'Gap between a swatch and its label.'),
    legendItemGap: pxRange(0, 40, 'Legend (structural)', 'Gap between legend pills.'),
    legendPillPaddingInline: pxRange(0, 24, 'Legend (structural)', 'Pill horizontal padding.'),
    legendPillPaddingBlock: pxRange(0, 24, 'Legend (structural)', 'Pill vertical padding.'),
    legendPillBorderWidth: pxRange(0, 6, 'Legend (structural)', 'Pill border width.'),
    legendBorderColor: {
      control: 'color',
      table: { category: 'Legend (structural)' },
      description:
        'Pill border color — a color, not a chrome token. Leave empty for the theme default; set one to make the border width visible.',
    },
    tooltipBorderRadius: pxRange(0, 24, 'Tooltip (paint, hover)', 'Tooltip corner radius.'),
    tooltipPaddingBlock: pxRange(0, 32, 'Tooltip (paint, hover)', 'Tooltip vertical padding.'),
    tooltipPaddingInline: pxRange(0, 32, 'Tooltip (paint, hover)', 'Tooltip horizontal padding.'),
    tooltipShadow: {
      control: 'text',
      table: { category: 'Tooltip (paint, hover)' },
      description: 'Tooltip box-shadow.',
    },
    fontLegendLabel: fontToken('Legend pill labels; the legend band follows the measured size.'),
    fontFamilyDefault: fontToken('Base family cascading into every font token (family list only, no shorthand).'),
  },
  render: (args) => {
    const themeOverrides: ThemeOverrides = {
      legendSwatchWidth: `${args.legendSwatchWidth}px`,
      legendSwatchHeight: `${args.legendSwatchHeight}px`,
      legendSwatchGap: `${args.legendSwatchGap}px`,
      legendItemGap: `${args.legendItemGap}px`,
      legendPillPaddingInline: `${args.legendPillPaddingInline}px`,
      legendPillPaddingBlock: `${args.legendPillPaddingBlock}px`,
      legendPillBorderWidth: `${args.legendPillBorderWidth}px`,
      // Empty keeps the theme's `border10` default; a set color overrides it.
      ...(args.legendBorderColor ? { legendBorderColor: args.legendBorderColor } : {}),
      tooltipBorderRadius: `${args.tooltipBorderRadius}px`,
      tooltipPaddingBlock: `${args.tooltipPaddingBlock}px`,
      tooltipPaddingInline: `${args.tooltipPaddingInline}px`,
      tooltipShadow: args.tooltipShadow,
      // Empty text/colour controls keep the theme defaults.
      ...(hasFontFields(args.fontLegendLabel) ? { fontLegendLabel: args.fontLegendLabel } : {}),
      ...(args.fontFamilyDefault ? { fontFamilyDefault: args.fontFamilyDefault } : {}),
    };

    return (
      <VizStoryGraphProvider data={salesData} spec={sharedSpec} config={sharedConfig} themeOverrides={themeOverrides}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
