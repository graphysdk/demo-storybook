import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { createSpec, geom, pipe, prefixInternalVariable, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Chart Types/Combo Graph',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const LINE_SERIES_LABEL_VARIABLE = prefixInternalVariable('lineSeriesLabel');
const BAR_SERIES_LABEL_VARIABLE = prefixInternalVariable('barSeriesLabel');
const AREA_SERIES_LABEL_VARIABLE = prefixInternalVariable('areaSeriesLabel');

// ─── Stacked bars + total line overlay ────────────────────────────────────
const regionalData: Data = {
  columns: [
    { key: 'month', label: 'Month' },
    { key: 'c1', label: 'North' },
    { key: 'South', label: 'South' },
    { key: 'West', label: 'West' },
    { key: 'total' },
  ],
  rows: [
    { month: 'Jan', c1: '$350', South: '$200', West: '$500', total: '$1050' },
    { month: 'Feb', c1: '$300', South: '$250', West: '$350', total: '$900' },
    { month: 'Mar', c1: '$400', South: '$300', West: '$300', total: '$1000' },
    { month: 'Apr', c1: '$200', South: '$150', West: '$400', total: '$750' },
    { month: 'May', c1: '$500', South: '$400', West: '$450', total: '$1350' },
    { month: 'Jun', c1: '$450', South: '$350', West: '$500', total: '$1300' },
  ],
};

export const StackedBarWithTotalLine: Story = {
  render: () => (
    <VizStoryGraphProvider
      data={regionalData}
      spec={pipe(
        createSpec({ x: 'month' }),
        geom.bar({
          transforms: [
            transform.reshape({
              keep: ['month'],
              reshape: ['c1', 'South', 'West'],
              keyName: 'region',
              valueName: 'sales',
            }),
          ],
          aes: { y: 'sales', color: 'region' },
          position: 'stack',
        }),
        geom.line({
          transforms: [
            transform.constant({
              variableName: LINE_SERIES_LABEL_VARIABLE,
              type: 'categorical',
              value: 'total',
            }),
          ],
          aes: { y: 'total', color: LINE_SERIES_LABEL_VARIABLE },
          yScaleType: 'secondary',
        }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
      config={{
        type: 'combo',
        options: { comboType: 'stacked-bars' },
        axes: { hasDualYAxis: true, y: { label: 'sales' } },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Dual-axis: revenue bars + growth-rate line ───────────────────────────
// Classic combo: two series with different units ($ vs %) forcing a
// secondary y-axis. Bars carry the absolute magnitude while the line tracks
// a percentage rate on its own scale.
const revenueGrowthData: Data = {
  columns: [{ key: 'quarter' }, { key: 'Revenue' }, { key: 'Growth' }],
  rows: [
    { quarter: 'Q1', Revenue: '$12000', Growth: '5%' },
    { quarter: 'Q2', Revenue: '$15000', Growth: '25%' },
    { quarter: 'Q3', Revenue: '$14000', Growth: '-7%' },
    { quarter: 'Q4', Revenue: '$18500', Growth: '32%' },
    { quarter: 'Q5', Revenue: '$21000', Growth: '14%' },
    { quarter: 'Q6', Revenue: '$19500', Growth: '-7%' },
  ],
};

export const RevenueBarsAndGrowthLine: Story = {
  render: () => (
    <VizStoryGraphProvider
      data={revenueGrowthData}
      spec={pipe(
        createSpec({ x: 'quarter' }),
        geom.bar({
          transforms: [
            transform.constant({ variableName: BAR_SERIES_LABEL_VARIABLE, type: 'categorical', value: 'Revenue' }),
          ],
          aes: { y: 'Revenue', color: BAR_SERIES_LABEL_VARIABLE },
        }),
        geom.line({
          transforms: [
            transform.constant({
              variableName: LINE_SERIES_LABEL_VARIABLE,
              type: 'categorical',
              value: 'Growth',
            }),
          ],
          aes: { y: 'Growth', color: LINE_SERIES_LABEL_VARIABLE },
          yScaleType: 'secondary',
        }),
        scale.x(),
        scale.y(),
        scale.ySecondary(),
        scale.color.palette()
      )}
      config={{
        type: 'combo',
        options: { comboType: 'grouped-bars' },
        axes: { hasDualYAxis: true },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Dodged bars + average reference line (shared axis) ───────────────────
// Both geoms share the primary y-scale. The reference line is synthesized
// from a constant-valued column so it renders as a single flat series with
// its own legend entry.
const regionQuarterData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }, { key: 'average' }],
  rows: [
    { quarter: 'Q1', North: '$350', South: '$200', West: '$500', average: '$350' },
    { quarter: 'Q2', North: '$300', South: '$250', West: '$350', average: '$300' },
    { quarter: 'Q3', North: '$400', South: '$300', West: '$300', average: '$333' },
    { quarter: 'Q4', North: '$200', South: '$150', West: '$400', average: '$250' },
  ],
};

export const DodgedBarsWithAverageLine: Story = {
  render: () => (
    <VizStoryGraphProvider
      data={regionQuarterData}
      spec={pipe(
        createSpec({ x: 'quarter' }),
        geom.bar({
          transforms: [
            transform.reshape({
              keep: ['quarter'],
              reshape: ['North', 'South', 'West'],
              keyName: 'region',
              valueName: 'sales',
            }),
          ],
          aes: { y: 'sales', color: 'region' },
          position: 'dodge',
        }),
        geom.line({
          transforms: [
            transform.constant({
              variableName: LINE_SERIES_LABEL_VARIABLE,
              type: 'categorical',
              value: 'average',
            }),
          ],
          aes: { y: 'average', color: LINE_SERIES_LABEL_VARIABLE },
        }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
      config={{
        type: 'combo',
        options: { comboType: 'grouped-bars' },
        axes: { y: { label: 'sales' } },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Area + target threshold line on secondary axis ───────────────────────
// Demonstrates combining an area geom with a line carrying a completely
// different unit (absolute $ vs target %).
const cumulativeData: Data = {
  columns: [{ key: 'month' }, { key: 'cumulative' }, { key: 'targetPct' }],
  rows: [
    { month: 'Jan', cumulative: '$1200', targetPct: '80%' },
    { month: 'Feb', cumulative: '$3000', targetPct: '80%' },
    { month: 'Mar', cumulative: '$5400', targetPct: '80%' },
    { month: 'Apr', cumulative: '$7000', targetPct: '80%' },
    { month: 'May', cumulative: '$10200', targetPct: '80%' },
    { month: 'Jun', cumulative: '$13000', targetPct: '80%' },
  ],
};

export const AreaWithTargetLine: Story = {
  render: () => (
    <VizStoryGraphProvider
      data={cumulativeData}
      spec={pipe(
        createSpec({ x: 'month' }),
        geom.area({
          transforms: [
            transform.constant({
              variableName: AREA_SERIES_LABEL_VARIABLE,
              type: 'categorical',
              value: 'Cumulative',
            }),
          ],
          aes: { y: 'cumulative', color: AREA_SERIES_LABEL_VARIABLE },
        }),
        geom.line({
          transforms: [
            transform.constant({
              variableName: LINE_SERIES_LABEL_VARIABLE,
              type: 'categorical',
              value: 'Target %',
            }),
          ],
          aes: { y: 'targetPct', color: LINE_SERIES_LABEL_VARIABLE },
          yScaleType: 'secondary',
        }),
        scale.x(),
        scale.y(),
        scale.ySecondary(),
        scale.color.palette()
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Heterogeneous-format reshape (USD + EUR collapsed into one column) ────
// One bar layer reshapes two currency columns with different ISOs (USD vs EUR) into a
// single `revenue` column. The propagated `valueFormat` is a `lookup` keyed on `currency`,
// so each observation resolves to its source column's format — tooltips on USD bars
// render `$12,000` and tooltips on EUR bars render `€10,500`, even though both groups
// share one `revenue` column and one y-scale. The overlay line carries a running total
// (own currency, own y-scale) to make this a true combo.
const multiCurrencyData: Data = {
  columns: [{ key: 'quarter' }, { key: 'USD' }, { key: 'EUR' }, { key: 'Share' }],
  rows: [
    { quarter: 'Q1', USD: '$12,000', EUR: '€10,500', Share: '12%' },
    { quarter: 'Q2', USD: '$15,000', EUR: '€13,200', Share: '15%' },
    { quarter: 'Q3', USD: '$14,000', EUR: '€12,800', Share: '12%' },
    { quarter: 'Q4', USD: '$18,500', EUR: '€16,000', Share: '16%' },
  ],
};

export const HeterogeneousReshapeCombo: Story = {
  render: () => (
    <VizStoryGraphProvider
      data={multiCurrencyData}
      spec={pipe(
        createSpec({ x: 'quarter' }),
        geom.bar({
          transforms: [
            transform.reshape({
              keep: ['quarter'],
              reshape: ['USD', 'EUR'],
              keyName: 'currency',
              valueName: 'revenue',
            }),
          ],
          aes: { y: 'revenue', color: 'currency' },
          position: 'dodge',
        }),
        geom.line({
          transforms: [
            transform.constant({
              variableName: LINE_SERIES_LABEL_VARIABLE,
              type: 'categorical',
              value: 'Share',
            }),
          ],
          aes: { y: 'Share', color: LINE_SERIES_LABEL_VARIABLE },
          yScaleType: 'secondary',
        }),
        scale.x(),
        scale.y(),
        scale.ySecondary(),
        scale.color.palette()
      )}
      config={{
        type: 'combo',
        options: { comboType: 'grouped-bars' },
        axes: { hasDualYAxis: true },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
