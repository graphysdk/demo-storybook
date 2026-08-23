import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useMemo, useState } from 'react';

import type { GraphAnimationProps } from '@graphysdk/react-renderer';
import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { coord, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';
import type { GraphConfig } from '@graphysdk/viz-engine/graph-config';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

interface IntroStoryArgs {
  enabled: boolean;
  durationScale: number;
  transitions: boolean;
  stagger?: boolean;
  staggerOrder?: 'main-axis' | 'value-ascending' | 'value-descending';
  barCount?: number;
}

const meta: Meta<IntroStoryArgs> = {
  title: 'Features/Intro Animations',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<IntroStoryArgs>;

// ─── Datasets ──────────────────────────────────────────────────────────────

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const revenues = [1200, 2400, 1800, 3200, 2600, 3800];
const swappedRevenues = [3800, 1200, 2900, 800, 3300, 1600];

const buildSingleSeriesData = (values: readonly number[]): Data => ({
  columns: [{ key: 'month' }, { key: 'revenue' }],
  rows: months.map((month, index) => ({ month, revenue: values[index] ?? 0 })),
});

const buildMultiSeriesData = (): Data => ({
  columns: [{ key: 'month' }, { key: 'North' }, { key: 'South' }],
  rows: months.map((month, index) => ({
    month,
    North: [300, 420, 380, 520, 460, 610][index] ?? 0,
    South: [280, 360, 340, 470, 420, 540][index] ?? 0,
  })),
});

const buildManyBarsData = (barCount: number): Data => ({
  columns: [{ key: 'bucket' }, { key: 'value' }],
  rows: Array.from({ length: barCount }, (_, index) => ({
    bucket: `b${String(index).padStart(3, '0')}`,
    value: Math.round(1000 + 900 * Math.sin(index / 5) + (index % 7) * 90),
  })),
});

const multiReshapeToLong = transform.reshape({
  keep: ['month'],
  reshape: ['North', 'South'],
  keyName: 'region',
  valueName: 'sales',
});

// ─── Controls ──────────────────────────────────────────────────────────────

/** Args for chart types whose entrance staggers (bars and roses). */
const GROW_INTRO_ARGS = { enabled: true, durationScale: 1, transitions: true, stagger: true };
/** Args for everything else — the entrance is a single shared motion. */
const INTRO_ARGS = { enabled: true, durationScale: 1, transitions: true };

const INTRO_ARG_TYPES: Meta<IntroStoryArgs>['argTypes'] = {
  durationScale: { control: { type: 'range', min: 0.5, max: 4, step: 0.5 } },
};

const buildAnimation = ({
  enabled,
  durationScale,
  transitions,
  stagger,
  staggerOrder,
}: IntroStoryArgs): GraphAnimationProps => ({
  intro: {
    enabled,
    durationScale,
    ...(stagger === undefined ? {} : { stagger }),
    ...(staggerOrder === undefined ? {} : { staggerOrder }),
  },
  transitions,
});

/**
 * Remount key: bumping on control changes replays the entrance with the new settings.
 * `transitions` is deliberately left out — toggling it must reach the mounted chart (even
 * mid-entrance) rather than remounting it, so its effect on a live animation can be observed.
 */
const argsKey = ({ enabled, durationScale, stagger, staggerOrder, barCount }: IntroStoryArgs): string =>
  `${enabled}-${durationScale}-${stagger}-${staggerOrder}-${barCount}`;

const buttonStyle = {
  padding: '6px 14px',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: '#333',
  color: '#fff',
  cursor: 'pointer' as const,
  fontSize: 13,
  fontWeight: 600,
};

const StoryLayout = ({ onReplay, children }: { onReplay: () => void; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
      <button style={buttonStyle} onClick={onReplay}>
        Replay intro
      </button>
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);

/**
 * The intro plays once per chart mount, so every story remounts the whole provider subtree
 * (React key bump) to replay it.
 */
const useReplay = () => {
  const [replayCount, setReplayCount] = useState(0);
  return { mountKey: replayCount, replay: () => setReplayCount((count) => count + 1) };
};

// ─── Column chart ──────────────────────────────────────────────────────────

export const ColumnIntro: Story = {
  args: GROW_INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildSingleSeriesData(revenues), []);
    const initialSpec = useMemo(
      () => pipe(createSpec({ x: 'month', y: 'revenue' }), geom.bar({ position: 'identity' }), scale.x(), scale.y()),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'column' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Horizontal bars (flipped coord) ───────────────────────────────────────

export const HorizontalBarIntro: Story = {
  args: GROW_INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildSingleSeriesData(revenues), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: 'month', y: 'revenue' }),
          geom.bar({ position: 'identity' }),
          coord.flip(),
          scale.x(),
          scale.y()
        ),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'bar' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Stacked columns ───────────────────────────────────────────────────────

export const StackedColumnIntro: Story = {
  args: GROW_INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildMultiSeriesData(), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec(multiReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
          geom.bar({ position: 'stack' }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'columnStacked' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Grouped columns ───────────────────────────────────────────────────────

export const GroupedColumnIntro: Story = {
  args: GROW_INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildMultiSeriesData(), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec(multiReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
          geom.bar({ position: 'dodge' }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'column' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Many bars (bucketed stagger keeps the window fixed) ───────────────────

export const ManyBarsIntro: Story = {
  args: { ...GROW_INTRO_ARGS, barCount: 60 },
  argTypes: {
    ...INTRO_ARG_TYPES,
    barCount: { control: { type: 'select' }, options: [12, 60, 300] },
  },
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const barCount = args.barCount ?? 60;
    const data = useMemo(() => buildManyBarsData(barCount), [barCount]);
    const initialSpec = useMemo(
      () => pipe(createSpec({ x: 'bucket', y: 'value' }), geom.bar({ position: 'identity' }), scale.x(), scale.y()),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'column' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Data swap mid-intro (clean interruption hand-off) ─────────────────────

const MidIntroSwapChart = ({ swapDelayMs, animation }: { swapDelayMs: number; animation: GraphAnimationProps }) => {
  const [data, setData] = useState(() => buildSingleSeriesData(revenues));

  // Swap the data while the entrance is still playing: bars mid-grow must retarget with the
  // spring, pending-delay bars spring straight from the baseline.
  useEffect(() => {
    const timeout = setTimeout(() => setData(buildSingleSeriesData(swappedRevenues)), swapDelayMs);
    return () => clearTimeout(timeout);
  }, [swapDelayMs]);

  const initialSpec = useMemo(
    () => pipe(createSpec({ x: 'month', y: 'revenue' }), geom.bar({ position: 'identity' }), scale.x(), scale.y()),
    []
  );
  const initialConfig = useMemo<GraphConfig>(() => ({ type: 'column' }), []);

  return (
    <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
      <GraphRenderer animation={animation} />
    </VizStoryGraphProvider>
  );
};

export const MidIntroDataSwap: Story = {
  args: GROW_INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    return (
      <StoryLayout onReplay={replay}>
        <MidIntroSwapChart key={`${mountKey}-${argsKey(args)}`} swapDelayMs={250} animation={buildAnimation(args)} />
      </StoryLayout>
    );
  },
};

// ─── Pie / donut (angle grow) ──────────────────────────────────────────────

export const PieIntro: Story = {
  args: INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildSingleSeriesData(revenues), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: '', y: 'revenue', color: 'month' }),
          geom.bar({ position: 'fill' }),
          coord.polar({ theta: 'y' }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'pie' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

export const DonutIntro: Story = {
  args: INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildSingleSeriesData(revenues), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: '', y: 'revenue', color: 'month' }),
          geom.bar({ position: 'fill' }),
          coord.polar({ theta: 'y', innerRadius: 0.6 }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'donut' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Rose / stacked rose (radial grow with stagger) ────────────────────────

export const RoseIntro: Story = {
  args: GROW_INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildSingleSeriesData(revenues), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: 'month', y: 'revenue', color: 'month' }),
          geom.bar({ position: 'identity' }),
          coord.polar({ theta: 'x' }),
          scale.x.discrete(),
          scale.y({ zero: true }),
          scale.color.palette()
        ),
      []
    );

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider key={`${mountKey}-${argsKey(args)}`} data={data} spec={initialSpec}>
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

export const StackedRoseIntro: Story = {
  args: GROW_INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildMultiSeriesData(), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec(multiReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
          geom.bar({ position: 'stack' }),
          coord.polar({ theta: 'x' }),
          scale.x.discrete(),
          scale.y({ zero: true }),
          scale.color.palette()
        ),
      []
    );

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider key={`${mountKey}-${argsKey(args)}`} data={data} spec={initialSpec}>
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Lines (clip-rect wipe) ────────────────────────────────────────────────

export const LineIntro: Story = {
  args: INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildSingleSeriesData(revenues), []);
    const initialSpec = useMemo(
      () => pipe(createSpec({ x: 'month', y: 'revenue' }), geom.line(), scale.x(), scale.y()),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'line' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

export const MultiLineIntro: Story = {
  args: INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildMultiSeriesData(), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec(multiReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
          geom.line(),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'line' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Stacked area (clip-rect wipe) ─────────────────────────────────────────

export const AreaIntro: Story = {
  args: INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildMultiSeriesData(), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec(multiReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
          geom.area(),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'areaStacked' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Data labels (delayed fade behind the geom entrance) ───────────────────

export const DataLabelsIntro: Story = {
  args: INTRO_ARGS,
  argTypes: INTRO_ARG_TYPES,
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildSingleSeriesData(revenues), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: 'month', y: 'revenue' }),
          geom.bar({ position: 'identity', dataLabels: { showDataLabels: true } }),
          scale.x(),
          scale.y()
        ),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'column', dataLabels: { showDataLabels: true } }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

// ─── Scatter / bubble (points pop in from zero size) ───────────────────────

const buildScatterData = (): Data => ({
  columns: [{ key: 'height' }, { key: 'weight' }, { key: 'count' }],
  rows: Array.from({ length: 24 }, (_, index) => ({
    height: 150 + index * 2 + (index % 5) * 3,
    weight: 50 + index * 1.5 + (index % 7) * 4,
    count: 5 + ((index * 13) % 40),
  })),
});

export const ScatterIntro: Story = {
  args: { ...GROW_INTRO_ARGS, staggerOrder: 'main-axis' },
  argTypes: {
    ...INTRO_ARG_TYPES,
    staggerOrder: { control: { type: 'select' }, options: ['main-axis', 'value-ascending', 'value-descending'] },
  },
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildScatterData(), []);
    const initialSpec = useMemo(
      () => pipe(createSpec({ x: 'height', y: 'weight' }), geom.point(), scale.x(), scale.y()),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'scatter' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};

export const BubbleIntro: Story = {
  args: { ...GROW_INTRO_ARGS, staggerOrder: 'value-descending' },
  argTypes: {
    ...INTRO_ARG_TYPES,
    staggerOrder: { control: { type: 'select' }, options: ['main-axis', 'value-ascending', 'value-descending'] },
  },
  render: (args) => {
    const { mountKey, replay } = useReplay();

    const data = useMemo(() => buildScatterData(), []);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: 'height', y: 'weight', size: 'count' }),
          geom.point(),
          scale.x(),
          scale.y(),
          scale.size.continuous()
        ),
      []
    );
    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'bubble' }), []);

    return (
      <StoryLayout onReplay={replay}>
        <VizStoryGraphProvider
          key={`${mountKey}-${argsKey(args)}`}
          data={data}
          spec={initialSpec}
          config={initialConfig}
        >
          <GraphRenderer animation={buildAnimation(args)} />
        </VizStoryGraphProvider>
      </StoryLayout>
    );
  },
};
