/* eslint-disable id-length */
import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data, HeadlinePosition, HeadlineShow, HeadlineSize } from '@graphysdk/viz-engine';
import {
  config,
  coord,
  createSpec,
  geom,
  mapping,
  pipe,
  prefixInternalVariable,
  scale,
  transform,
} from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Headlines',
  decorators: [ResizablePlotDecorator],
};

export default meta;

type HeadlineCompare = 'none' | 'previous' | 'first';

const showControl = {
  control: { type: 'inline-radio' as const },
  options: ['total', 'average', 'current', 'conversion', 'none'] satisfies HeadlineShow[],
  description: 'Aggregate each series reduces to. "current" is the latest value in main-axis order.',
};

const compareControl = {
  control: { type: 'inline-radio' as const },
  options: ['none', 'previous', 'first'] satisfies HeadlineCompare[],
  description: 'Trend reference for "current". Renders only on a datetime axis.',
};

const sizeControl = {
  control: { type: 'inline-radio' as const },
  options: ['auto', 'small', 'medium', 'large'] satisfies HeadlineSize[],
  description: 'Fixed token, or "auto" to pick the largest of large/medium/small that fits the strip.',
};

// ─── Datasets ────────────────────────────────────────────────────────────────

const REGIONS = ['North', 'South', 'East'] as const;

// Wide multi-series timeseries, reshaped to long form so each region becomes a
// swatched headline item (and replaces the legend).
const regionalTimeseries: Data = {
  columns: [
    { key: 'month' },
    { key: 'North', label: 'North Region' },
    { key: 'South', label: 'South Region' },
    { key: 'East', label: 'East Region' },
  ],
  rows: [
    { month: new Date('2025-01-01'), North: 6000, South: 9000, East: 14000 },
    { month: new Date('2025-02-01'), North: 7000, South: 10500, East: 16000 },
    { month: new Date('2025-03-01'), North: 8000, South: 12000, East: 18000 },
    { month: new Date('2025-04-01'), North: 9000, South: 13500, East: 20000 },
    { month: new Date('2025-05-01'), North: 10000, South: 15000, East: 22000 },
    { month: new Date('2025-06-01'), North: 11000, South: 16500, East: 24000 },
  ],
};

// Three series whose final step diverges, so `current` with `compareWith: 'previous'` renders one
// headline per trend direction: Rising steps up (Mar 130 → Apr 160), Falling steps down
// (170 → 150), and Flat holds steady (150 → 150).
const trendTimeseries: Data = {
  columns: [{ key: 'month' }, { key: 'Rising' }, { key: 'Falling' }, { key: 'Flat' }, { key: 'Other' }],
  rows: [
    { month: new Date('2025-01-01'), Rising: 100, Falling: 200, Flat: 150, Other: 120 },
    { month: new Date('2025-02-01'), Rising: 110, Falling: 190, Flat: 150, Other: 130 },
    { month: new Date('2025-03-01'), Rising: 130, Falling: 170, Flat: 150, Other: 145 },
    { month: new Date('2025-04-01'), Rising: 160, Falling: 150, Flat: 150, Other: null },
  ],
};

// Slices for the polar grand total.
const budgetData: Data = {
  columns: [{ key: 'department' }, { key: 'spend' }],
  rows: [
    { department: 'Engineering', spend: 420 },
    { department: 'Marketing', spend: 180 },
    { department: 'Sales', spend: 150 },
    { department: 'Operations', spend: 95 },
    { department: 'HR', spend: 80 },
  ],
};

// ─── Playground ──────────────────────────────────────────────────────────────

interface PlaygroundArgs {
  show: HeadlineShow;
  compareWith: HeadlineCompare;
  size: HeadlineSize;
}

/**
 * Interactive single-series headline on a datetime line. Try `current` with a
 * comparison to see the trend arrow; `total`/`average` show the date-range label.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  argTypes: { show: showControl, compareWith: compareControl, size: sizeControl },
  args: { show: 'total', compareWith: 'none', size: 'auto' },
  render: (args) => (
    <VizStoryGraphProvider
      data={trendTimeseries}
      spec={pipe(
        createSpec(
          transform.reshape({
            keep: ['month'],
            reshape: ['Rising', 'Falling', 'Flat', 'Other'],
            keyName: 'series',
            valueName: 'revenue',
          }),
          mapping({ x: 'month', y: 'revenue', color: 'series' })
        ),
        geom.line(),
        scale.x(),
        scale.y(),
        config({ headline: { show: args.show, compareWith: args.compareWith, size: args.size } })
      )}
      config={{
        type: 'line',
        headlineNumbers: { show: args.show, compareWith: args.compareWith, size: args.size },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Current value with trend ────────────────────────────────────────────────

/**
 * `current` compared to the previous observation, across multiple series — one headline per trend
 * direction: Rising climbs (green ↑), Falling drops (red ↓), and Flat holds steady (muted →).
 */
export const CurrentWithTrend: StoryObj = {
  render: () => (
    <VizStoryGraphProvider
      data={trendTimeseries}
      spec={pipe(
        createSpec(
          transform.reshape({
            keep: ['month'],
            reshape: ['Rising', 'Falling', 'Flat'],
            keyName: 'series',
            valueName: 'revenue',
          }),
          mapping({ x: 'month', y: 'revenue', color: 'series' })
        ),
        geom.line(),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({ headline: { show: 'current', compareWith: 'previous' } })
      )}
      config={{ type: 'line', headlineNumbers: { show: 'current', compareWith: 'previous' } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Multi-series (one headline per series) ───────────────────────────────────

/**
 * One headline per series, each carrying its swatch. The per-series strip
 * replaces the legend entirely.
 */
export const MultiSeriesTotal: StoryObj = {
  render: () => (
    <VizStoryGraphProvider
      data={regionalTimeseries}
      spec={pipe(
        createSpec(
          transform.reshape({
            keep: ['month'],
            reshape: [...REGIONS],
            keyName: 'region',
            valueName: 'revenue',
          }),
          mapping({ x: 'month', y: 'revenue', color: 'region' })
        ),
        geom.line(),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({ headline: { show: 'total' } })
      )}
      config={{ type: 'line', headlineNumbers: { show: 'total' } }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Combo: per-layer formats ────────────────────────────────────────────────

const PRODUCT_D_LABEL_VARIABLE = prefixInternalVariable('productDLabel');
const BAR_PRODUCT_SERIES = ['A', 'B', 'C'] as const;

// Quarterly sales for three products as dodged bars (currency $) plus a single
// product as a line (percentage %) on a secondary axis. Each column's first cell
// drives format inference — "$10000" → currency, "10%" → percentage — so the
// four series cover two formats across two layers.
const productMixData: Data = {
  columns: [{ key: 'quarter' }, { key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }],
  rows: [
    { quarter: 'Q1 2024', A: '$10000', B: '$20000', C: '$10000', D: '10%' },
    { quarter: 'Q2 2024', A: '$11000', B: '$15000', C: '$8000', D: '21%' },
    { quarter: 'Q3 2024', A: '$20000', B: '$10000', C: '$7000', D: '15%' },
    { quarter: 'Q4 2024', A: '$25000', B: '$6000', C: '$4000', D: '22%' },
  ],
};

/**
 * Combo with per-layer formats: three product bars (sales in $) plus one product
 * line (rate in %) on a secondary axis. The legacy headline strip renders one
 * headline per series in the merged legend, each formatted by its owning layer
 * — `$66.00k | $51.00k | $29.00k | 68%`. Documents the parity target for
 * per-owning-layer headlines in combo charts.
 */
export const ComboPerLayerFormats: StoryObj = {
  render: () => (
    <VizStoryGraphProvider
      data={productMixData}
      spec={pipe(
        createSpec({ x: 'quarter' }),
        geom.bar({
          transforms: [
            transform.reshape({
              keep: ['quarter'],
              reshape: [...BAR_PRODUCT_SERIES],
              keyName: 'product',
              valueName: 'sales',
            }),
          ],
          aes: { y: 'sales', color: 'product' },
          position: 'dodge',
        }),
        geom.line({
          transforms: [transform.constant({ variableName: PRODUCT_D_LABEL_VARIABLE, type: 'categorical', value: 'D' })],
          aes: { y: 'D', color: PRODUCT_D_LABEL_VARIABLE },
          yScaleType: 'secondary',
        }),
        scale.x(),
        scale.y(),
        scale.ySecondary(),
        scale.color.palette(),
        config({ headline: { show: 'total' } })
      )}
      config={{
        type: 'combo',
        options: { comboType: 'grouped-bars' },
        axes: { hasDualYAxis: true, y: { label: 'sales' } },
        headlineNumbers: { show: 'total' },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Donut grand total ───────────────────────────────────────────────────────

const positionControl = {
  control: { type: 'inline-radio' as const },
  options: ['above', 'center'] satisfies HeadlinePosition[],
  description: 'Where the grand total sits on a donut — above the chart or inside the centre hole.',
};

interface DonutGrandTotalArgs {
  position: HeadlinePosition;
}

/**
 * Grand total on a donut, coexisting with the legend. `center` reads as the focal figure inside
 * the hole (bare number — no prefix, label, or swatch); `above` falls back to the strip.
 */
export const DonutGrandTotal: StoryObj<DonutGrandTotalArgs> = {
  argTypes: { position: positionControl },
  args: { position: 'center' },
  render: (args) => (
    <VizStoryGraphProvider
      data={budgetData}
      spec={pipe(
        createSpec({ x: '', y: 'spend', color: 'department' }),
        geom.bar({ position: 'fill' }),
        coord.polar({ theta: 'y', innerRadius: 0.55 }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({ headline: { show: 'total', position: args.position } })
      )}
      config={{
        type: 'donut',
        options: { pieTotalPosition: args.position === 'center' ? 'center' : undefined },
        headlineNumbers: { show: 'total' },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
