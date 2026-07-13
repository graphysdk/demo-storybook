import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data, SmoothMethod } from '@graphysdk/viz-engine';
import { createSpec, geom, pipe, scale, stat, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Trendlines',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        component:
          'Interactive playground for the `smooth` stat. Toggle the regression family, the underlying data shape, noise level, point count, series count, and an outlier to explore how each fit behaves.',
      },
    },
  },
};

export default meta;

const ALL_METHODS = [
  'linear',
  'loess',
  'exponential',
  'logarithmic',
  'quadratic',
  'power',
  'polynomial',
] satisfies SmoothMethod[];

type Pattern = 'linear' | 'exponential' | 'logarithmic' | 'quadratic' | 'sinusoidal' | 'random';
const ALL_PATTERNS: Pattern[] = ['linear', 'exponential', 'logarithmic', 'quadratic', 'sinusoidal', 'random'];

interface PlaygroundArgs {
  method: SmoothMethod;
  pattern: Pattern;
  noise: number;
  sampleCount: number;
  seriesCount: number;
  seed: number;
  showPoints: boolean;
  outlier: boolean;
}

// Mulberry32 — small deterministic PRNG so a given `seed` always produces the same scatter.
const createRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const evaluatePattern = (pattern: Pattern, x: number, seriesIndex: number, rand: () => number): number => {
  // Per-series amplitude factor makes multiple series visually distinct.
  const amplitude = 1 + seriesIndex * 0.6;
  switch (pattern) {
    case 'linear':
      return amplitude * (2 * x + 1);
    case 'exponential':
      return amplitude * Math.exp(0.25 * x);
    case 'logarithmic':
      return amplitude * (4 * Math.log(Math.max(x, 0.01)) + 10);
    case 'quadratic':
      return amplitude * (0.3 * x * x + x + 5);
    case 'sinusoidal':
      return amplitude * (10 + 4 * Math.sin(x / 2 + seriesIndex));
    case 'random':
      return 10 + 8 * (rand() - 0.5);
  }
};

const generateData = (args: PlaygroundArgs): Data => {
  const rand = createRng(args.seed);
  const columns = args.seriesCount > 1 ? [{ key: 'x' }, { key: 'y' }, { key: 'series' }] : [{ key: 'x' }, { key: 'y' }];
  const rows: Array<Record<string, number | string>> = [];

  for (let seriesIndex = 0; seriesIndex < args.seriesCount; seriesIndex++) {
    const seriesLabel = String.fromCharCode(65 + seriesIndex);
    for (let sampleIndex = 0; sampleIndex < args.sampleCount; sampleIndex++) {
      const xValue = sampleIndex + 1;
      const base = evaluatePattern(args.pattern, xValue, seriesIndex, rand);
      const jitter = args.noise * (rand() - 0.5) * Math.max(Math.abs(base), 1) * 0.6;
      const yValue = base + jitter;
      rows.push(args.seriesCount > 1 ? { x: xValue, y: yValue, series: seriesLabel } : { x: xValue, y: yValue });
    }
    if (args.outlier) {
      const outlierX = args.sampleCount + 2;
      const outlierY = evaluatePattern(args.pattern, outlierX, seriesIndex, rand) * 3;
      rows.push(
        args.seriesCount > 1 ? { x: outlierX, y: outlierY, series: seriesLabel } : { x: outlierX, y: outlierY }
      );
    }
  }

  return { columns, rows };
};

/**
 * Interactive playground. Default args show ~30 noisy linear points fit with linear regression.
 * Things worth trying from the controls panel:
 *   - **method**: swap to a wrong family (e.g. linear on `exponential` data) to see the fit fail.
 *   - **pattern**: pair it with the matching method to reach a near-perfect fit, then dial up `noise`.
 *   - **sampleCount**: small N (5-8) shows how unstable polynomial / loess get with little data.
 *   - **seriesCount**: > 1 splits by `color`, producing one regression per group.
 *   - **outlier**: appends a single high-leverage point at the right edge — watch the linear line
 *     pivot toward it; loess shrugs it off; polynomial chases it.
 *   - **seed**: change to re-roll the noise without touching anything else.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  argTypes: {
    method: {
      name: 'Regression method',
      control: { type: 'select' },
      options: ALL_METHODS,
    },
    pattern: {
      name: 'Underlying pattern',
      control: { type: 'select' },
      options: ALL_PATTERNS,
      description: 'Shape of the "true" signal before noise. Pair with the matching method for the best fit.',
    },
    noise: {
      name: 'Noise',
      control: { type: 'range', min: 0, max: 2, step: 0.05 },
      description: 'Scales the random jitter added on top of the underlying pattern.',
    },
    sampleCount: {
      name: 'Sample count',
      control: { type: 'range', min: 3, max: 200, step: 1 },
    },
    seriesCount: {
      name: 'Series count',
      control: { type: 'range', min: 1, max: 4, step: 1 },
      description: 'When > 1, splits data into N color-grouped series with progressively scaled magnitudes.',
    },
    seed: {
      name: 'Seed (re-roll)',
      control: { type: 'number', min: 0, step: 1 },
      description: 'Deterministic PRNG seed. Bump it to regenerate the noise.',
    },
    showPoints: { name: 'Show raw points', control: 'boolean' },
    outlier: { name: 'Add outlier', control: 'boolean', description: 'Appends one high-leverage point per series.' },
  },
  args: {
    method: 'linear',
    pattern: 'linear',
    noise: 0.4,
    sampleCount: 30,
    seriesCount: 1,
    seed: 1,
    showPoints: true,
    outlier: false,
  },
  render: (args) => {
    // Memoised so a resize (which re-renders the story via the decorator's
    // dimensions state) doesn't rebuild the data/spec and force a full recompile.
    const data = useMemo(() => generateData(args), [args]);
    const spec = useMemo(() => {
      const mapping = args.seriesCount > 1 ? { x: 'x', y: 'y', color: 'series' } : { x: 'x', y: 'y' };
      return pipe(
        createSpec(mapping),
        ...(args.showPoints ? [geom.point()] : []),
        geom.line({
          stat: stat.smooth({ method: args.method }),
          interactive: false,
          aes: { lineType: { value: 'dashed' } },
        }),
        scale.x(),
        scale.y()
      );
    }, [args]);
    return (
      <VizStoryGraphProvider data={data} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Fit sensitivity to sample size ──────────────────────────────────────────

const CARS_TOTAL = 320;

interface CarPoint {
  weight: number;
  power: number;
}

/**
 * Hand-rolled "cars-like" sample: weight (lb) on x, horsepower on y, with realistic spread.
 * Generated once at module load so the points stay put across re-renders — only the
 * row-index filter that picks "the first m points" changes as the slider moves.
 */
const carsSample: CarPoint[] = (() => {
  const rand = createRng(7);
  const rows: CarPoint[] = [];
  for (let index = 0; index < CARS_TOTAL; index++) {
    const weight = 1700 + rand() * 3400; // 1700..5100 lb
    // Power ≈ 0.045 * weight, with heteroscedastic noise (variance grows with weight).
    const baseline = 0.045 * weight - 10;
    const noise = (rand() - 0.5) * Math.max(20, weight * 0.018);
    const power = Math.max(45, baseline + noise);
    rows.push({ weight: Math.round(weight), power: Math.round(power) });
  }
  return rows;
})();

interface FitSubsetArgs {
  pointsInFit: number;
  method: SmoothMethod;
}

/**
 * Storybook port of the Observable Plot linear-regression demo (https://observablehq.com/plot).
 * Reference code:
 *
 *   Plot.dot(cars, { x: "weight (lb)", y: "power (hp)", fillOpacity: 0.2 }),
 *   Plot.dot(cars.slice(0, m), { x: "weight (lb)", y: "power (hp)" }),
 *   Plot.linearRegressionY(cars.slice(0, m), { x: "weight (lb)", y: "power (hp)", stroke: "red" }),
 *
 * Same three-layer structure here: a dim background of every point, a bright overlay of the
 * first `m`, and the regression fit on the first `m`. The PRNG-generated dataset is in random
 * order, so the row-index filter already picks a scattered subset.
 */
export const FitSensitivityToSampleSize: StoryObj<FitSubsetArgs> = {
  argTypes: {
    pointsInFit: {
      name: 'Number of points (m)',
      control: { type: 'range', min: 5, max: CARS_TOTAL, step: 1 },
      description: 'How many points are used for the regression. The full cloud stays visible underneath.',
    },
    method: {
      name: 'Regression method',
      control: { type: 'select' },
      options: ALL_METHODS,
    },
  },
  args: { pointsInFit: 238, method: 'linear' },
  render: (args) => {
    const data = useMemo<Data>(
      () => ({
        columns: [{ key: 'weight' }, { key: 'power' }, { key: 'rowIndex' }],
        rows: carsSample.map((point, index) => ({
          weight: point.weight,
          power: point.power,
          rowIndex: index,
        })),
      }),
      []
    );

    const spec = useMemo(
      () =>
        pipe(
          createSpec({ x: 'weight', y: 'power' }),
          // Background: every point, dim. Mirrors Plot.dot(cars, …).
          geom.point({
            aes: { alpha: { value: 0.2 } },
            params: { size: 7 },
            interactive: false,
          }),
          // Foreground: the first m points, full opacity. Mirrors Plot.dot(cars.slice(0, m), …).
          geom.point({
            aes: { alpha: { value: 1 } },
            transforms: [transform.filter({ variableName: 'rowIndex', operator: 'lt', value: args.pointsInFit })],
            params: { size: 7 },
          }),
          // Regression fit on the first m points, red stroke. Mirrors Plot.linearRegressionY(…).
          geom.line({
            stat: stat.smooth({ method: args.method }),
            interactive: false,
            transforms: [transform.filter({ variableName: 'rowIndex', operator: 'lt', value: args.pointsInFit })],
            aes: { color: { value: 'red' }, lineType: { value: 'solid' } },
            params: { lineWidth: 2 },
          }),
          scale.x(),
          scale.y()
        ),
      [args]
    );

    return (
      <VizStoryGraphProvider data={data} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Multi-series with per-series trendline toggle ───────────────────────────

const MULTI_SERIES_LABELS = ['A', 'B', 'C', 'D'];

interface MultiSeriesTrendArgs {
  method: SmoothMethod;
  seriesWithTrendline: string[];
}

/**
 * One regression per series (the `smooth` stat partitions by the `color` group). The
 * "Series with trendline" control picks which series get a fit: every series' points are
 * always drawn, but the trendline layer filters out any unselected series, so unchecking a
 * series removes only its trendline. (Filtering supports `neq` only, so the layer excludes
 * the complement rather than including the selection.)
 */
export const MultiSeriesTrendlineToggle: StoryObj<MultiSeriesTrendArgs> = {
  argTypes: {
    method: {
      name: 'Regression method',
      control: { type: 'select' },
      options: ALL_METHODS,
    },
    seriesWithTrendline: {
      name: 'Series with trendline',
      control: { type: 'check' },
      options: MULTI_SERIES_LABELS,
      description: 'Each series is always plotted; only the checked series get a regression trendline.',
    },
  },
  args: { method: 'linear', seriesWithTrendline: MULTI_SERIES_LABELS },
  render: (args) => {
    const rand = createRng(11);
    const rows: Array<Record<string, number | string>> = [];
    for (let seriesIndex = 0; seriesIndex < MULTI_SERIES_LABELS.length; seriesIndex++) {
      const seriesLabel = MULTI_SERIES_LABELS[seriesIndex];
      if (!seriesLabel) continue;
      for (let sampleIndex = 0; sampleIndex < 24; sampleIndex++) {
        const xValue = sampleIndex + 1;
        const base = (1 + seriesIndex * 0.7) * (2 * xValue + 5);
        const jitter = (rand() - 0.5) * base * 0.4;
        rows.push({ x: xValue, y: Math.round(base + jitter), series: seriesLabel });
      }
    }
    const data: Data = { columns: [{ key: 'x' }, { key: 'y' }, { key: 'series' }], rows };

    const excludedSeries = MULTI_SERIES_LABELS.filter((label) => !args.seriesWithTrendline.includes(label));

    return (
      <VizStoryGraphProvider
        data={data}
        spec={pipe(
          createSpec({ x: 'x', y: 'y', color: 'series' }),
          geom.point({ params: { size: 6 } }),
          geom.line({
            stat: stat.smooth({ method: args.method }),
            interactive: false,
            transforms: excludedSeries.map((label) =>
              transform.filter({ variableName: 'series', operator: 'neq', value: label })
            ),
            aes: { lineType: { value: 'dashed' } },
            params: { lineWidth: 2 },
          }),
          scale.x(),
          scale.y()
        )}
      >
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Categorical x-axis ──────────────────────────────────────────────────────

interface MethodOnlyArgs {
  method: SmoothMethod;
}

const METHOD_ARG_TYPE = {
  method: {
    name: 'Regression method',
    control: { type: 'select' } as const,
    options: ALL_METHODS,
  },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Categorical x. The `smooth` stat encodes each category to its ordinal rank (1..N) by
 * data-insertion order, fits the regression in rank space, then evaluates the curve at each
 * category and emits the original month label as x. The fitted line therefore lands exactly
 * on the discrete axis ticks.
 */
export const CategoricalXAxis: StoryObj<MethodOnlyArgs> = {
  argTypes: METHOD_ARG_TYPE,
  args: { method: 'linear' },
  render: (args) => {
    const data = useMemo<Data>(() => {
      const rand = createRng(3);
      return {
        columns: [{ key: 'month' }, { key: 'revenue' }],
        rows: MONTHS.map((month, index) => {
          const trend = 40 + index * 9;
          const jitter = (rand() - 0.5) * 22;
          return { month, revenue: Math.round(trend + jitter) };
        }),
      };
    }, []);

    const spec = useMemo(
      () =>
        pipe(
          createSpec({ x: 'month', y: 'revenue' }),
          geom.point(),
          geom.line({
            stat: stat.smooth({ method: args.method }),
            interactive: false,
            aes: { color: { value: 'red' }, lineType: { value: 'dashed' } },
            params: { lineWidth: 2 },
          }),
          scale.x(),
          scale.y()
        ),
      [args]
    );

    return (
      <VizStoryGraphProvider data={data} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Temporal x-axis ─────────────────────────────────────────────────────────

/**
 * Temporal x. The `smooth` stat encodes each date as unix-ms for the fit and decodes the
 * fitted x back into `Date` objects, so the trendline rides the datetime scale natively
 * (it is not snapped to the sampled timestamps).
 */
export const TemporalXAxis: StoryObj<MethodOnlyArgs> = {
  argTypes: METHOD_ARG_TYPE,
  args: { method: 'linear' },
  render: (args) => {
    const data = useMemo<Data>(() => {
      const rand = createRng(5);
      const start = Date.UTC(2023, 0, 1);
      const dayMs = 24 * 60 * 60 * 1000;
      return {
        columns: [{ key: 'date' }, { key: 'visitors' }],
        rows: Array.from({ length: 60 }, (_, index) => {
          const date = new Date(start + index * 7 * dayMs);
          const trend = 200 + index * 14;
          const jitter = (rand() - 0.5) * 90;
          return { date: date.toISOString().slice(0, 10), visitors: Math.round(trend + jitter) };
        }),
      };
    }, []);

    const spec = useMemo(
      () =>
        pipe(
          createSpec({ x: 'date', y: 'visitors' }),
          geom.point({ params: { size: 6 } }),
          geom.line({
            stat: stat.smooth({ method: args.method }),
            interactive: false,
            aes: { color: { value: 'red' }, lineType: { value: 'dashed' } },
            params: { lineWidth: 2 },
          }),
          scale.x(),
          scale.y()
        ),
      [args]
    );

    return (
      <VizStoryGraphProvider data={data} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
