/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data, HighlightInput, HighlightScope, HighlightStyle, Predicate, SpecInput } from '@graphysdk/viz-engine';
import {
  config,
  coord,
  createSpec,
  geom,
  highlight,
  mapping,
  pipe,
  prefixInternalVariable,
  scale,
  transform,
} from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

type SharedArgs = { highlightStyle: HighlightStyle };

const GRAPH_CONFIG_HIGHLIGHT_STYLE: Record<HighlightStyle, 'fade-color' | 'grey'> = {
  dim: 'fade-color',
  desaturate: 'grey',
};

const meta: Meta<SharedArgs> = {
  title: 'Features/Highlights',
  decorators: [ResizablePlotDecorator],
  argTypes: {
    highlightStyle: {
      control: { type: 'inline-radio' },
      options: ['dim', 'desaturate'] satisfies HighlightStyle[],
    },
  },
  args: {
    highlightStyle: 'dim',
  },
};

export default meta;
type Story = StoryObj<SharedArgs>;

// ─── Sample data ─────────────────────────────────────────────────────────────

const regionalSalesData: Data = {
  columns: [{ key: 'quarter' }, { key: 'region' }, { key: 'sales' }],
  rows: [
    { quarter: 'Q1', region: 'EU', sales: 1200 },
    { quarter: 'Q1', region: 'US', sales: 1500 },
    { quarter: 'Q2', region: 'EU', sales: 1800 },
    { quarter: 'Q2', region: 'US', sales: 1600 },
    { quarter: 'Q3', region: 'EU', sales: 2400 },
    { quarter: 'Q3', region: 'US', sales: 2200 },
    { quarter: 'Q4', region: 'EU', sales: 2800 },
    { quarter: 'Q4', region: 'US', sales: 3100 },
  ],
};

const productRevenueData: Data = {
  columns: [{ key: 'product' }, { key: 'revenue' }],
  rows: [
    { product: 'Alpha', revenue: 1200 },
    { product: 'Beta', revenue: 1800 },
    { product: 'Gamma', revenue: 2400 },
    { product: 'Delta', revenue: 1600 },
    { product: 'Epsilon', revenue: 3200 },
    { product: 'Zeta', revenue: 2800 },
  ],
};

const marketShareData: Data = {
  columns: [{ key: 'segment' }, { key: 'share' }],
  rows: [
    { segment: 'Mobile', share: 42 },
    { segment: 'Desktop', share: 31 },
    { segment: 'Tablet', share: 17 },
    { segment: 'Other', share: 10 },
  ],
};

const legacyReshapedData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }],
  rows: [
    { quarter: 'Q1', North: 350, South: 200, West: 500 },
    { quarter: 'Q2', North: 300, South: 250, West: 350 },
    { quarter: 'Q3', North: 400, South: 300, West: 300 },
    { quarter: 'Q4', North: 200, South: 150, West: 400 },
  ],
};

// ─── Interactive playground ──────────────────────────────────────────────────
// One story, many knobs. Lets you mix geom × coordinate × predicate shape × scope ×
// layer × highlightStyle without hand-crafting a separate story per combination.
// The polar coordinates reuse the same quarter/region/sales data: θ=x turns a bar into
// a rose/coxcomb and a line/point/area into a radar; θ=y turns a bar into a radial bar.

type PlaygroundGeom = 'bar-dodge' | 'bar-stacked' | 'line' | 'area' | 'point';

type PlaygroundCoordinate = 'cartesian' | 'polar-theta-x' | 'polar-theta-y';

type PlaygroundPredicate =
  | 'single-q2-eu'
  | 'variable-eq-region-eu'
  | 'variable-oneof-q3q4'
  | 'variable-gte-2000'
  | 'variable-range-1500-2500'
  | 'and-eu-q34'
  | 'or-eu-q1'
  | 'not-eu';

type PlaygroundScope = 'auto' | 'data-point' | 'series' | 'x-value';

type PlaygroundLayer = 'all' | 'first';

type PlaygroundSecondPredicate = 'none' | 'variable-eq-region-us' | 'variable-gte-2500';

type PlaygroundCombine = 'and' | 'or' | 'separate-highlight';

interface PlaygroundArgs extends SharedArgs {
  geom: PlaygroundGeom;
  coordinate: PlaygroundCoordinate;
  predicate: PlaygroundPredicate;
  scope: PlaygroundScope;
  layer: PlaygroundLayer;
  secondPredicate: PlaygroundSecondPredicate;
  combineWith: PlaygroundCombine;
}

const PREDICATES: Record<PlaygroundPredicate, Predicate> = {
  'single-q2-eu': {
    and: [
      { variable: 'quarter', eq: 'Q2' },
      { variable: 'region', eq: 'EU' },
    ],
  },
  'variable-eq-region-eu': { variable: 'region', eq: 'EU' },
  'variable-oneof-q3q4': { variable: 'quarter', oneOf: ['Q3', 'Q4'] },
  'variable-gte-2000': { variable: 'sales', gte: 2000 },
  'variable-range-1500-2500': { variable: 'sales', range: [1500, 2500] },
  'and-eu-q34': {
    and: [
      { variable: 'region', eq: 'EU' },
      { variable: 'quarter', oneOf: ['Q3', 'Q4'] },
    ],
  },
  'or-eu-q1': {
    or: [
      { variable: 'region', eq: 'EU' },
      { variable: 'quarter', eq: 'Q1' },
    ],
  },
  'not-eu': { not: { variable: 'region', eq: 'EU' } },
};

const SECONDARY_PREDICATES: Record<Exclude<PlaygroundSecondPredicate, 'none'>, Predicate> = {
  'variable-eq-region-us': { variable: 'region', eq: 'US' },
  'variable-gte-2500': { variable: 'sales', gte: 2500 },
};

const applyPlaygroundGeom = (kind: PlaygroundGeom) => {
  switch (kind) {
    case 'line':
      return geom.line();
    case 'area':
      return geom.area();
    case 'point':
      return geom.point();
    case 'bar-dodge':
      return geom.bar({ position: 'dodge' });
    case 'bar-stacked':
      return geom.bar({ position: 'stack' });
    default:
      throw new Error(`Unknown geom kind: ${kind}`);
  }
};

export const Playground: StoryObj<PlaygroundArgs> = {
  name: 'Playground',
  argTypes: {
    geom: {
      control: { type: 'select' },
      options: ['bar-dodge', 'bar-stacked', 'line', 'area', 'point'] satisfies PlaygroundGeom[],
      table: { category: 'Spec' },
    },
    coordinate: {
      control: {
        type: 'select',
        labels: {
          cartesian: 'Cartesian',
          'polar-theta-x': 'Polar · θ=x (rose / radar)',
          'polar-theta-y': 'Polar · θ=y (radial bar)',
        },
      },
      options: ['cartesian', 'polar-theta-x', 'polar-theta-y'] satisfies PlaygroundCoordinate[],
      description: 'Wraps the geom in a polar projection. θ=x drives a rose/radar, θ=y a radial bar.',
      table: { category: 'Spec' },
    },
    predicate: {
      control: { type: 'select' },
      options: [
        'single-q2-eu',
        'variable-eq-region-eu',
        'variable-oneof-q3q4',
        'variable-gte-2000',
        'variable-range-1500-2500',
        'and-eu-q34',
        'or-eu-q1',
        'not-eu',
      ] satisfies PlaygroundPredicate[],
      table: { category: 'Highlight' },
    },
    scope: {
      control: { type: 'inline-radio' },
      options: ['auto', 'data-point', 'series', 'x-value'] satisfies PlaygroundScope[],
      table: { category: 'Highlight' },
    },
    layer: {
      control: { type: 'inline-radio' },
      options: ['all', 'first'] satisfies PlaygroundLayer[],
      description: '"first" scopes the highlight to layerIndex 0.',
      table: { category: 'Highlight' },
    },
    combineWith: {
      control: { type: 'inline-radio' },
      options: ['and', 'or', 'separate-highlight'] satisfies PlaygroundCombine[],
      description:
        '`and`/`or` wrap both predicates in one highlight(). `separate-highlight` emits two highlight() calls — the engine unions matches across highlights, so this is OR by construction.',
      table: { category: 'Highlight' },
      if: { arg: 'secondPredicate', neq: 'none' },
    },
    secondPredicate: {
      control: { type: 'select' },
      options: ['none', 'variable-eq-region-us', 'variable-gte-2500'] satisfies PlaygroundSecondPredicate[],
      description: 'A second predicate combined with the primary one via `combineWith`.',
      table: { category: 'Highlight' },
    },
    highlightStyle: { table: { category: 'Appearance' } },
  },
  args: {
    geom: 'bar-dodge',
    coordinate: 'cartesian',
    predicate: 'variable-eq-region-eu',
    scope: 'auto',
    layer: 'all',
    secondPredicate: 'none',
    combineWith: 'and',
  },
  render: ({ geom: geomKind, coordinate, predicate, scope, layer, secondPredicate, combineWith, highlightStyle }) => {
    const [insertedQuarters, setInsertedQuarters] = useState(0);

    const data = useMemo<Data>(() => {
      const inserted: Data['rows'] = [];
      for (let index = 0; index < insertedQuarters; index += 1) {
        inserted.push({ quarter: `Q2.${index + 1}`, region: 'EU', sales: 1900 + index * 120 });
        inserted.push({ quarter: `Q2.${index + 1}`, region: 'US', sales: 1750 + index * 90 });
      }
      const insertAt = 4;
      return {
        columns: regionalSalesData.columns,
        rows: [...regionalSalesData.rows.slice(0, insertAt), ...inserted, ...regionalSalesData.rows.slice(insertAt)],
      };
    }, [insertedQuarters]);

    const highlightOptions: { scope?: HighlightScope; layerIndex?: number } = {};
    if (scope !== 'auto') highlightOptions.scope = scope;
    if (layer === 'first') highlightOptions.layerIndex = 0;

    const primary = PREDICATES[predicate];
    const secondary = secondPredicate === 'none' ? null : SECONDARY_PREDICATES[secondPredicate];

    const highlightItems = (() => {
      if (secondary === null) {
        return [highlight(primary, highlightOptions)];
      }
      if (combineWith === 'and') {
        return [highlight({ and: [primary, secondary] }, highlightOptions)];
      }
      if (combineWith === 'or') {
        return [highlight({ or: [primary, secondary] }, highlightOptions)];
      }
      return [highlight(primary, highlightOptions), highlight(secondary, highlightOptions)];
    })();

    // Polar reuses the same mapping; it just needs a discrete angular axis and a zero-based radius.
    const isPolar = coordinate !== 'cartesian';
    const coordSteps = isPolar
      ? [coord.polar(coordinate === 'polar-theta-y' ? { theta: 'y', innerRadius: 0.15 } : { theta: 'x' })]
      : [];
    const scaleSteps = isPolar ? [scale.x.discrete(), scale.y({ zero: true })] : [scale.x(), scale.y()];

    return (
      <>
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setInsertedQuarters((count) => count + 1)}
            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', backgroundColor: '#f0f0f0' }}
          >
            Insert quarter between Q2 and Q3
          </button>
          <button
            type="button"
            onClick={() => setInsertedQuarters(0)}
            disabled={insertedQuarters === 0}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #ccc',
              backgroundColor: '#f0f0f0',
              cursor: insertedQuarters === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Reset
          </button>
          <span style={{ color: '#666', fontSize: 12 }}>
            {insertedQuarters} quarter{insertedQuarters === 1 ? '' : 's'} inserted
          </span>
        </div>
        <VizStoryGraphProvider
          data={data}
          spec={pipe(
            createSpec({ x: 'quarter', y: 'sales', color: 'region' }),
            applyPlaygroundGeom(geomKind),
            ...coordSteps,
            ...scaleSteps,
            scale.color.palette(),
            ...highlightItems,
            config({ appearance: { highlightStyle } })
          )}
        >
          <GraphRenderer />
        </VizStoryGraphProvider>
      </>
    );
  },
};

// ─── Stress test ─────────────────────────────────────────────────────────────
// One mega-knob story that exercises the three highlight hot paths:
//   1. compileHighlights — predicate eval per row × per highlight × scope expansion.
//   2. highlightIndex — observation / series / x-value maps, each a HighlightId[].
//   3. renderer composition — dim base + matched re-render + (path geoms) overlay
//      markers per match.
//
// Dial scale, match density, predicate depth, and highlight count to push any of
// the three; switch geom / layout / scope to exercise the dispatch policy.

type StressGeom = 'point' | 'bar' | 'line' | 'area';
type StressLayout = 'single-series' | 'multi-series';
type StressScope = 'data-point' | 'series' | 'x-value';

interface StressTestArgs extends SharedArgs {
  stressGeom: StressGeom;
  layout: StressLayout;
  rowCount: number;
  seriesCount: number;
  matchPercent: number;
  scope: StressScope;
  highlightCount: number;
  predicateDepth: number;
  seed: number;
}

const STRESS_ROW_OPTIONS = [100, 500, 1000, 5000, 10000];
const STRESS_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function applyStressGeom(kind: StressGeom) {
  if (kind === 'point') return geom.point();
  if (kind === 'bar') return geom.bar();
  if (kind === 'line') return geom.line();
  return geom.area();
}

// Wrap the inner predicate in `depth - 1` levels of logical composition. Each
// added level alternates and/or/not so the evaluator visits every branch type;
// the leaves are always-true (`score lte 1`) or always-false (`score gt 1`) so
// the wrap doesn't shift the match set the inner predicate produced.
function wrapPredicate(inner: Predicate, depth: number): Predicate {
  let result = inner;
  for (let level = 0; level < depth - 1; level += 1) {
    if (level % 3 === 0) result = { and: [result, { variable: 'score', lte: 1 }] };
    else if (level % 3 === 1) result = { or: [result, { variable: 'score', gt: 1 }] };
    else result = { not: { not: result } };
  }
  return result;
}

interface BuildHighlightsArgs {
  scope: StressScope;
  matchPercent: number;
  highlightCount: number;
  predicateDepth: number;
  seriesNames: string[];
  pointsPerSeries: number;
  multiSeries: boolean;
}

function buildStressHighlights(args: BuildHighlightsArgs): HighlightInput[] {
  const { scope, matchPercent, highlightCount, predicateDepth, seriesNames, pointsPerSeries, multiSeries } = args;
  const fraction = Math.max(0, Math.min(1, matchPercent / 100));
  const effectiveScope: StressScope = multiSeries ? scope : 'data-point';

  if (effectiveScope === 'series') {
    const matched = seriesNames.slice(0, Math.round(fraction * seriesNames.length));
    if (matched.length === 0) {
      return [highlight(wrapPredicate({ variable: 'series', eq: '__none__' }, predicateDepth), { scope: 'series' })];
    }
    const cappedCount = Math.min(Math.max(1, highlightCount), matched.length);
    const sliceSize = Math.max(1, Math.ceil(matched.length / cappedCount));
    return Array.from({ length: cappedCount }, (_, index) => {
      const slice = matched.slice(index * sliceSize, (index + 1) * sliceSize);
      const predicate: Predicate =
        slice.length === 1 ? { variable: 'series', eq: slice[0]! } : { variable: 'series', oneOf: slice };
      return highlight(index === 0 ? wrapPredicate(predicate, predicateDepth) : predicate, { scope: 'series' });
    });
  }

  if (effectiveScope === 'x-value') {
    const matchedCount = Math.round(fraction * pointsPerSeries);
    if (matchedCount === 0) {
      return [highlight(wrapPredicate({ variable: 'index', eq: -1 }, predicateDepth), { scope: 'x-value' })];
    }
    const cappedCount = Math.min(Math.max(1, highlightCount), matchedCount);
    const sliceSize = Math.max(1, Math.ceil(matchedCount / cappedCount));
    return Array.from({ length: cappedCount }, (_, index) => {
      const sliceStart = index * sliceSize;
      const sliceLength = Math.min(sliceSize, matchedCount - sliceStart);
      const slice = Array.from({ length: sliceLength }, (__, offset) => sliceStart + offset);
      const predicate: Predicate =
        slice.length === 1 ? { variable: 'index', eq: slice[0]! } : { variable: 'index', oneOf: slice };
      return highlight(index === 0 ? wrapPredicate(predicate, predicateDepth) : predicate, { scope: 'x-value' });
    });
  }

  // data-point scope. Stamp N highlights at increasing score thresholds — their
  // union covers `matchPercent` of rows, and each row in the matched band ends
  // up in the index entries of every highlight whose threshold covers it.
  const cappedCount = Math.max(1, highlightCount);
  return Array.from({ length: cappedCount }, (_, index) => {
    const threshold = ((index + 1) / cappedCount) * fraction;
    const predicate: Predicate = { variable: 'score', lt: threshold };
    return highlight(index === 0 ? wrapPredicate(predicate, predicateDepth) : predicate, { scope: 'data-point' });
  });
}

export const StressTest: StoryObj<StressTestArgs> = {
  name: 'Stress test',
  argTypes: {
    stressGeom: {
      control: { type: 'select' },
      options: ['point', 'bar', 'line', 'area'] satisfies StressGeom[],
      table: { category: 'Spec' },
    },
    layout: {
      control: { type: 'inline-radio' },
      options: ['single-series', 'multi-series'] satisfies StressLayout[],
      table: { category: 'Spec' },
    },
    rowCount: {
      options: STRESS_ROW_OPTIONS,
      control: { type: 'select' },
      table: { category: 'Scale' },
    },
    seriesCount: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      table: { category: 'Scale' },
      if: { arg: 'layout', eq: 'multi-series' },
    },
    matchPercent: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { category: 'Match' },
    },
    scope: {
      control: { type: 'inline-radio' },
      options: ['data-point', 'series', 'x-value'] satisfies StressScope[],
      description: 'Series / x-value scope only have an effect in the multi-series layout.',
      table: { category: 'Match' },
    },
    highlightCount: {
      control: { type: 'range', min: 1, max: 50, step: 1 },
      description: 'Number of independently-authored highlights covering the matched slice.',
      table: { category: 'Composition' },
    },
    predicateDepth: {
      control: { type: 'range', min: 1, max: 30, step: 1 },
      description: 'Depth of the and/or/not-nested wrapper around the first highlight predicate.',
      table: { category: 'Composition' },
    },
    seed: { control: { type: 'number' }, table: { category: 'Misc' } },
    highlightStyle: { table: { category: 'Appearance' } },
  },
  args: {
    stressGeom: 'point',
    layout: 'single-series',
    rowCount: 1000,
    seriesCount: 5,
    matchPercent: 20,
    scope: 'data-point',
    highlightCount: 1,
    predicateDepth: 1,
    seed: 1,
  },
  render: ({
    stressGeom,
    layout,
    rowCount,
    seriesCount,
    matchPercent,
    scope,
    highlightCount,
    predicateDepth,
    seed,
    highlightStyle,
  }) => {
    const { spec, data } = useMemo<{ spec: SpecInput; data: Data }>(() => {
      const rand = mulberry32(seed);

      if (layout === 'single-series') {
        const singleData: Data = {
          columns: [{ key: 'index' }, { key: 'value' }, { key: 'score' }, { key: 'category' }],
          rows: Array.from({ length: rowCount }, (_, index) => ({
            index,
            value: 50 + Math.sin(index * 0.1) * 30 + rand() * 5,
            score: rand(),
            category: STRESS_CATEGORIES[index % STRESS_CATEGORIES.length]!,
          })),
        };
        const highlights = buildStressHighlights({
          scope,
          matchPercent,
          highlightCount,
          predicateDepth,
          seriesNames: [],
          pointsPerSeries: rowCount,
          multiSeries: false,
        });
        return {
          data: singleData,
          spec: pipe(
            createSpec({ x: 'index', y: 'value', color: 'category' }),
            applyStressGeom(stressGeom),
            scale.x(),
            scale.y(),
            scale.color.palette(),
            ...highlights,
            config({ appearance: { highlightStyle } })
          ),
        };
      }

      const seriesNames = Array.from({ length: seriesCount }, (_, index) => `S${index + 1}`);
      const pointsPerSeries = Math.max(1, Math.floor(rowCount / Math.max(1, seriesCount)));
      const columns = [{ key: 'index' }, { key: 'score' }, ...seriesNames.map((name) => ({ key: name }))];
      const rows = Array.from({ length: pointsPerSeries }, (_, rowIndex) => {
        const row: Record<string, number> = { index: rowIndex, score: rand() };
        for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
          row[seriesNames[seriesIndex]!] =
            20 + seriesIndex * 8 + Math.sin(rowIndex * 0.1 + seriesIndex) * 10 + rand() * 3;
        }
        return row;
      });
      const multiData: Data = { columns, rows };
      const highlights = buildStressHighlights({
        scope,
        matchPercent,
        highlightCount,
        predicateDepth,
        seriesNames,
        pointsPerSeries,
        multiSeries: true,
      });
      return {
        data: multiData,
        spec: pipe(
          createSpec(
            transform.reshape({
              keep: ['index', 'score'],
              reshape: seriesNames,
              keyName: 'series',
              valueName: 'value',
            }),
            mapping({ x: 'index', y: 'value', color: 'series' })
          ),
          applyStressGeom(stressGeom),
          scale.x(),
          scale.y(),
          scale.color.palette(),
          ...highlights,
          config({ appearance: { highlightStyle } })
        ),
      };
    }, [
      stressGeom,
      layout,
      rowCount,
      seriesCount,
      matchPercent,
      scope,
      highlightCount,
      predicateDepth,
      seed,
      highlightStyle,
    ]);
    return (
      <VizStoryGraphProvider data={data} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Polar bar (pie) ─────────────────────────────────────────────────────────

export const PolarBarSingleSlice: Story = {
  name: 'Polar bar / single slice',
  render: ({ highlightStyle }) => (
    <VizStoryGraphProvider
      data={marketShareData}
      spec={pipe(
        createSpec({ x: '', y: 'share', color: 'segment' }),
        geom.bar({ position: 'fill' }),
        coord.polar({ theta: 'y' }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        highlight({ variable: 'segment', eq: 'Mobile' }),
        config({ appearance: { highlightStyle } })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Combo: layer-scoped highlight ───────────────────────────────────────────

const LINE_SERIES_LABEL_VARIABLE = prefixInternalVariable('lineSeriesLabel');

const comboData: Data = {
  columns: [{ key: 'month' }, { key: 'bars' }, { key: 'trend' }],
  rows: [
    { month: 'Jan', bars: 800, trend: 850 },
    { month: 'Feb', bars: 950, trend: 950 },
    { month: 'Mar', bars: 1100, trend: 1050 },
    { month: 'Apr', bars: 1400, trend: 1200 },
    { month: 'May', bars: 1250, trend: 1350 },
    { month: 'Jun', bars: 1700, trend: 1500 },
    { month: 'Jul', bars: 1900, trend: 1700 },
    { month: 'Aug', bars: 2200, trend: 1900 },
    { month: 'Sep', bars: 2050, trend: 2050 },
    { month: 'Oct', bars: 2400, trend: 2200 },
    { month: 'Nov', bars: 2600, trend: 2350 },
    { month: 'Dec', bars: 2900, trend: 2500 },
  ],
};

export const ComboLayerScoped: Story = {
  name: 'Combo / per-layer scoping',
  render: ({ highlightStyle }) => (
    <VizStoryGraphProvider
      data={comboData}
      spec={pipe(
        createSpec({ x: 'month' }),
        geom.bar({ aes: { y: 'bars' }, position: 'identity' }),
        geom.line({
          transforms: [
            transform.constant({
              variableName: LINE_SERIES_LABEL_VARIABLE,
              type: 'categorical',
              value: 'trend',
            }),
          ],
          aes: { y: 'trend', color: LINE_SERIES_LABEL_VARIABLE },
        }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        // Q4-only highlight, bound to the bar layer (layerIndex 0). The trendline at the
        // same x ticks is untouched — its layerId never matches this highlight.
        highlight({ variable: 'month', oneOf: ['Oct', 'Nov', 'Dec'] }, { layerIndex: 0 }),
        config({ appearance: { highlightStyle } })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Legacy GraphConfig converter ────────────────────────────────────────────
// Demonstrates `convertHighlights` desugaring the legacy annotation shape into a
// predicate the engine evaluates the same way native predicates do.

export const LegacyXValue: Story = {
  name: 'Legacy / x-value annotation',
  render: ({ highlightStyle }) => (
    <VizStoryGraphProvider
      data={productRevenueData}
      config={{
        type: 'column',
        annotations: [{ id: 'hl-x', type: 'highlight', highlight: 'x-value', rowValue: 'Epsilon' }],
        appearance: { highlightStyle: GRAPH_CONFIG_HIGHLIGHT_STYLE[highlightStyle] },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

export const LegacySeries: StoryObj<SharedArgs & { chartType: 'columnStacked' | 'line' }> = {
  name: 'Legacy / series annotation',
  argTypes: {
    chartType: {
      control: { type: 'inline-radio' },
      options: ['columnStacked', 'line'],
    },
  },
  args: {
    chartType: 'columnStacked',
  },
  render: ({ chartType, highlightStyle }) => (
    <VizStoryGraphProvider
      data={legacyReshapedData}
      config={{
        type: chartType,
        annotations: [{ id: 'hl-series', type: 'highlight', highlight: 'series', columnKey: 'South' }],
        appearance: { highlightStyle: GRAPH_CONFIG_HIGHLIGHT_STYLE[highlightStyle] },
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

export const LegacyDataPoint: Story = {
  name: 'Legacy / data-point annotation',
  render: ({ highlightStyle }) => (
    <VizStoryGraphProvider
      data={{
        columns: [
          { key: 'c1', label: 'Month' },
          { key: 'c2', label: 'Revenue' },
        ],
        rows: [
          { c1: 'Jan', c2: 42 },
          { c1: 'Feb', c2: 48 },
          { c1: 'Aug', c2: 95 },
          { c1: 'Dec', c2: 102 },
        ],
      }}
      config={{
        type: 'column',
        appearance: { highlightStyle: GRAPH_CONFIG_HIGHLIGHT_STYLE[highlightStyle] },
        annotations: [
          {
            id: 'highlight-aug',
            type: 'highlight',
            highlight: 'data-point',
            rowValue: 'Aug',
            columnKey: 'c2',
            rowIndex: 2,
          },
        ],
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
