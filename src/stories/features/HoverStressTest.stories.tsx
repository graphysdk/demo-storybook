import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data, SpecInput } from '@graphysdk/viz-engine';
import { config, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

// Stress-test stories targeting the hover hit-detection engine. The engine
// stores indexes in [0,1]² normalized space and aspect-corrects distances
// at query time, so the two ways it can fail are (a) extreme viewport aspect
// ratios that blow up relative pixel distances, and (b) datasets whose
// normalization collapses or smears points so that the "nearest" point on
// screen is ambiguous. Third axis is raw size: stressing Delaunay prep and
// query cost with large point counts.
const meta: Meta = {
  title: 'Features/Hover Stress Test',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Helpers ──────────────────────────────────────────────────────────────

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

const BUBBLE_CATEGORIES = ['A', 'B', 'C', 'D'] as const;

function randomScatter(count: number, seed: number): Data {
  const rand = mulberry32(seed);
  return {
    columns: [{ key: 'x' }, { key: 'y' }, { key: 'size' }, { key: 'category' }],
    rows: Array.from({ length: count }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 100,
      category: BUBBLE_CATEGORIES[Math.floor(rand() * BUBBLE_CATEGORIES.length)]!,
    })),
  };
}

function scatterSpec(): SpecInput {
  return pipe(
    createSpec({ x: 'x', y: 'y', size: 'size', color: 'category' }),
    geom.point(),
    scale.x(),
    scale.y(),
    scale.size.continuous(),
    scale.color.palette(),
    config({
      content: {
        title: 'A large scatter plot',
        subtitle: 'Suspendisse elementum ac lorem in facilisis.',
        caption: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
      axes: {
        x: { label: 'X axis' },
        y: { label: 'Y axis' },
      },
    })
  );
}

// =========================================================================
// 1. WEIRD ASPECT RATIOS
// =========================================================================
// HoverEngine.setViewport({ aspectRatio: width/height }) drives the aspect
// correction in query/nearest-2d.ts. Wide charts should favor Y-proximity,
// tall charts should favor X-proximity. Drag the container to exercise
// extreme aspect ratios.

const aspectData = randomScatter(60, 42);

export const AspectUltraWide: Story = {
  name: 'Aspect · Ultra wide (drag wide)',
  render: () => (
    <VizStoryGraphProvider data={aspectData} spec={scatterSpec()}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

export const AspectUltraTall: Story = {
  name: 'Aspect · Ultra tall (drag tall)',
  render: () => (
    <VizStoryGraphProvider data={aspectData} spec={scatterSpec()}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// =========================================================================
// 2. NORMALIZATION STRESS
// =========================================================================
// Indexes live in [0,1] domain-space, so extreme raw values collapse after
// normalization. These stories construct datasets where the raw-space and
// normalized-space nearest-neighbor answers diverge.

// Microscopic spread: all X values are huge (~1e9) but differ by tiny amounts.
// Float normalization into [0,1] should preserve order; tests precision.
const microscopicData: Data = {
  columns: [{ key: 'x' }, { key: 'y' }, { key: 'size' }, { key: 'category' }],
  rows: Array.from({ length: 30 }, (_, index) => ({
    x: 1e9 + index * 1e-3,
    y: Math.sin(index * 0.5) * 10 + 10,
    size: 10 + (index % 10) * 5,
    category: BUBBLE_CATEGORIES[index % BUBBLE_CATEGORIES.length]!,
  })),
};

export const NormalizeMicroscopicX: Story = {
  name: 'Normalize · Microscopic X deltas on large magnitude',
  render: () => (
    <VizStoryGraphProvider data={microscopicData} spec={scatterSpec()}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// Outlier on X: one far-away point compresses the rest of the cluster to a
// tiny sliver near x=0. Tests whether hit detection inside the compressed
// cluster still resolves correctly.
const xOutlierRand = mulberry32(7);
const xOutlierData: Data = {
  columns: [{ key: 'x' }, { key: 'y' }, { key: 'size' }, { key: 'category' }],
  rows: [
    ...Array.from({ length: 50 }, () => ({
      x: xOutlierRand() * 10,
      y: xOutlierRand() * 10,
      size: xOutlierRand() * 100,
      category: BUBBLE_CATEGORIES[Math.floor(xOutlierRand() * BUBBLE_CATEGORIES.length)]!,
    })),
    { x: 1e6, y: 5, size: 80, category: 'A' as const },
  ],
};

export const NormalizeXOutlier: Story = {
  name: 'Normalize · Outlier compresses X cluster',
  render: () => (
    <VizStoryGraphProvider data={xOutlierData} spec={scatterSpec()}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// Outlier on Y: same idea on the other axis.
const yOutlierRand = mulberry32(11);
const yOutlierData: Data = {
  columns: [{ key: 'x' }, { key: 'y' }, { key: 'size' }, { key: 'category' }],
  rows: [
    ...Array.from({ length: 40 }, (_, index) => ({
      x: index,
      y: yOutlierRand() * 0.01,
      size: 10 + yOutlierRand() * 90,
      category: BUBBLE_CATEGORIES[index % BUBBLE_CATEGORIES.length]!,
    })),
    { x: 20, y: 1e5, size: 80, category: 'B' as const },
  ],
};

export const NormalizeYOutlier: Story = {
  name: 'Normalize · Outlier compresses Y cluster',
  render: () => (
    <VizStoryGraphProvider data={yOutlierData} spec={scatterSpec()}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// Dense stacks at same X: many points sharing the same x coordinate force
// the Delaunay to resolve by Y alone within the stack.
const stackData: Data = {
  columns: [{ key: 'x' }, { key: 'y' }, { key: 'size' }, { key: 'category' }],
  rows: Array.from({ length: 60 }, (_, index) => ({
    x: index % 4,
    y: Math.floor(index / 4) * 5 + (index % 4) * 0.2,
    size: 20 + (index % 5) * 15,
    category: BUBBLE_CATEGORIES[index % BUBBLE_CATEGORIES.length]!,
  })),
};

export const NormalizeDenseStacks: Story = {
  name: 'Normalize · Dense vertical stacks at same X',
  render: () => (
    <VizStoryGraphProvider data={stackData} spec={scatterSpec()}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// Mixed-scale points: a dense cluster near origin plus a few points at
// extreme coordinates. The cluster collapses into a speck after normalize.
const mixedScaleRand = mulberry32(23);
const mixedScaleData: Data = {
  columns: [{ key: 'x' }, { key: 'y' }, { key: 'size' }, { key: 'category' }],
  rows: [
    ...Array.from({ length: 40 }, () => ({
      x: mixedScaleRand() * 2,
      y: mixedScaleRand() * 2,
      size: mixedScaleRand() * 100,
      category: BUBBLE_CATEGORIES[Math.floor(mixedScaleRand() * BUBBLE_CATEGORIES.length)]!,
    })),
    { x: 1000, y: 1000, size: 90, category: 'A' as const },
    { x: 1000, y: 0, size: 60, category: 'B' as const },
    { x: 0, y: 1000, size: 30, category: 'C' as const },
  ],
};

export const NormalizeMixedScales: Story = {
  name: 'Normalize · Mixed-scale (cluster + far corners)',
  render: () => (
    <VizStoryGraphProvider data={mixedScaleData} spec={scatterSpec()}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// =========================================================================
// 3. LARGE DATASETS (controls)
// =========================================================================
// Delaunay prep is O(N log N) and async; fallback is linear scan. These
// stories crank N to shake out perf cliffs and index-diff re-work.

const LARGE_SIZE_OPTIONS = [100, 500, 1000, 5000, 10000, 25000];

interface LargeScatterArgs {
  pointCount: number;
  seed: number;
}

export const LargeScatter: StoryObj<LargeScatterArgs> = {
  name: 'Large · Random scatter (controls)',
  args: { pointCount: 1000, seed: 1 },
  argTypes: {
    pointCount: { options: LARGE_SIZE_OPTIONS, control: { type: 'select' } },
    seed: { control: { type: 'number' } },
  },
  render: ({ pointCount, seed }) => {
    const data = useMemo(() => randomScatter(pointCount, seed), [pointCount, seed]);
    return (
      <VizStoryGraphProvider data={data} spec={scatterSpec()}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

interface LargeLineArgs {
  pointsPerSeries: number;
  seriesCount: number;
  seed: number;
}

export const LargeMultiSeriesLine: StoryObj<LargeLineArgs> = {
  name: 'Large · Multi-series line (controls)',
  args: { pointsPerSeries: 500, seriesCount: 5, seed: 1 },
  argTypes: {
    pointsPerSeries: { options: LARGE_SIZE_OPTIONS, control: { type: 'select' } },
    seriesCount: { control: { type: 'range', min: 1, max: 20, step: 1 } },
    seed: { control: { type: 'number' } },
  },
  render: ({ pointsPerSeries, seriesCount, seed }) => {
    const { data, spec } = useMemo(() => {
      const rand = mulberry32(seed);
      const seriesParams = Array.from({ length: seriesCount }, (_, index) => ({
        name: `S${index + 1}`,
        baseline: 20 + index * 12,
        amplitude: 8 + rand() * 6,
        cycles: 2 + rand() * 3,
        phase: rand() * Math.PI * 2,
      }));
      const seriesNames = seriesParams.map((series) => series.name);
      const columns = [{ key: 'index' }, ...seriesNames.map((name) => ({ key: name }))];
      const denom = Math.max(1, pointsPerSeries - 1);
      const rows = Array.from({ length: pointsPerSeries }, (_, rowIndex) => {
        const progress = rowIndex / denom;
        const row: Record<string, number> = { index: rowIndex };
        for (const series of seriesParams) {
          const signal =
            series.baseline + series.amplitude * Math.sin(progress * series.cycles * 2 * Math.PI + series.phase);
          const noise = (rand() - 0.5) * 1.5;
          row[series.name] = signal + noise;
        }
        return row;
      });
      const nextData: Data = { columns, rows };
      const nextSpec = pipe(
        createSpec(
          transform.reshape({
            keep: ['index'],
            reshape: seriesNames,
            keyName: 'series',
            valueName: 'value',
          }),
          mapping({ x: 'index', y: 'value', color: 'series' })
        ),
        geom.line(),
        scale.x(),
        scale.y(),
        scale.color.palette()
      );
      return { data: nextData, spec: nextSpec };
    }, [pointsPerSeries, seriesCount, seed]);
    return (
      <VizStoryGraphProvider data={data} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

interface LargeBarArgs {
  categoryCount: number;
  seriesCount: number;
  seed: number;
}

export const LargeBar: StoryObj<LargeBarArgs> = {
  name: 'Large · Many categories stacked bar (controls)',
  args: { categoryCount: 100, seriesCount: 4, seed: 1 },
  argTypes: {
    categoryCount: { options: LARGE_SIZE_OPTIONS, control: { type: 'select' } },
    seriesCount: { control: { type: 'range', min: 2, max: 10, step: 1 } },
    seed: { control: { type: 'number' } },
  },
  render: ({ categoryCount, seriesCount, seed }) => {
    const { data, spec } = useMemo(() => {
      const rand = mulberry32(seed);
      const seriesNames = Array.from({ length: seriesCount }, (_, index) => `S${index + 1}`);
      const rows = Array.from({ length: categoryCount }, (_, index) => {
        const row: Record<string, number | string> = {
          category: `C${index.toString().padStart(3, '0')}`,
        };
        for (const name of seriesNames) {
          row[name] = rand() * 100;
        }
        return row;
      });
      const nextData: Data = {
        columns: [{ key: 'category' }, ...seriesNames.map((name) => ({ key: name }))],
        rows,
      };
      const nextSpec = pipe(
        createSpec(
          transform.reshape({
            keep: ['category'],
            reshape: seriesNames,
            keyName: 'series',
            valueName: 'value',
          }),
          mapping({ x: 'category', y: 'value', color: 'series' })
        ),
        geom.bar({ position: 'stack' }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      );
      return { data: nextData, spec: nextSpec };
    }, [categoryCount, seriesCount, seed]);
    return (
      <VizStoryGraphProvider data={data} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
