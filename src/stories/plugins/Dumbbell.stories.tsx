import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';

import { createGraphyKit, defineGeomRenderer, GraphRenderer } from '@graphysdk/react-renderer';
import type { CompiledGeom, CompiledLayer, Data, GeomCompilerInput, Observation } from '@graphysdk/viz-engine';
import { Geom, getX, getYMax, getYMin, toPercent, toViewBoxX, toViewBoxY } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';

const CONNECTOR_COLOR = '#cdd2dc';

interface DumbbellParams {
  /** Endpoint dot radius, in pixels. */
  dotRadius: number;
  /** Connector stroke width, in pixels. */
  connectorWidth: number;
  /** Fill of the start dot. */
  startColor: string;
  /** Fill of the end dot. */
  endColor: string;
}

/**
 * A custom `dumbbell` geom comparing two values per category.
 *
 * `start` and `end` are custom y aesthetics declared as a `lower`/`upper` interval, so the engine
 * fills and scales them into yMin/yMax and trains the value axis over both. The geom declares three
 * positional aesthetics (an `x` category plus the two endpoints) and `compile()` only injects a
 * representative `y` for hover + tooltip; the plugin just draws a connector and two dots.
 */
class DumbbellGeom extends Geom<DumbbellParams> {
  readonly type = 'dumbbell' as const;
  override readonly defaultParams: DumbbellParams = {
    dotRadius: 5,
    connectorWidth: 2,
    startColor: '#a0a8c0',
    endColor: '#4e79a7',
  };
  override readonly positionRoles = [
    { axis: 'x', role: 'point', valueKind: 'value' }, // the category band, from the root `x` mapping
    { axis: 'y', role: 'min', valueKind: 'value', aes: 'start' }, // → yMin (and trains the value axis)
    { axis: 'y', role: 'max', valueKind: 'value', aes: 'end' }, // → yMax
  ] as const;
  override readonly supportedCoordTypes = ['cartesian'] as const;
  override readonly highlightStrategy = 'observation-rerender' as const;
  override readonly identityKey = 'index' as const;
  // The tooltip shows both endpoints of the hovered category (raw values, preserved by the interval fill).
  override readonly tooltip = [
    { key: 'Start', aes: 'start' },
    { key: 'End', aes: 'end' },
  ] as const;

  override readonly spatialKind = 'buckets';

  // A representative `y` (the end value — a raw column preserved alongside yMin/yMax) gives the hover
  // hit-test its `POSITION_VARIABLES.y` and the tooltip a value, both of which key on `mapping.y`.
  compile({ data, mapping }: GeomCompilerInput): CompiledGeom {
    return { data, mapping: { y: mapping.end } };
  }
}

/** One dumbbell in `[0, 1]` data-up space — the band centre and both scaled endpoints. */
interface Dumbbell {
  x: number;
  start: number;
  end: number;
}

const readDumbbell = (observation: Observation): Dumbbell | null => {
  const x = getX(observation);
  // `start`/`end` were filled into the interval columns and scaled by the pipeline.
  const start = getYMin(observation);
  const end = getYMax(observation);
  if (x === null || start === null || end === null) return null;
  return { x, start, end };
};

const DumbbellMark = ({ mark, params }: { mark: Dumbbell; params: DumbbellParams }) => {
  const cx = toPercent(toViewBoxX(mark.x));
  return (
    <g>
      <line
        x1={cx}
        x2={cx}
        y1={toPercent(toViewBoxY(mark.start))}
        y2={toPercent(toViewBoxY(mark.end))}
        stroke={CONNECTOR_COLOR}
        strokeWidth={params.connectorWidth}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={toPercent(toViewBoxY(mark.start))} r={params.dotRadius} fill={params.startColor} />
      <circle cx={cx} cy={toPercent(toViewBoxY(mark.end))} r={params.dotRadius} fill={params.endColor} />
    </g>
  );
};

const DumbbellLayer = ({ layer }: { layer: CompiledLayer }) => {
  const params = layer.params as unknown as DumbbellParams;
  const marks = useMemo(
    () => [...layer.data].map(readDumbbell).filter((mark): mark is Dumbbell => mark !== null),
    [layer.data]
  );
  return (
    <>
      {marks.map((mark, index) => (
        <DumbbellMark key={index} mark={mark} params={params} />
      ))}
    </>
  );
};

/** Re-paints the hovered dumbbell above the CSS-dimmed siblings (the `observation-rerender` strategy). */
const HoveredDumbbell = ({ layer, observation }: { layer: CompiledLayer; observation: Observation }) => {
  const params = layer.params as unknown as DumbbellParams;
  const mark = readDumbbell(observation);
  return mark ? <DumbbellMark mark={mark} params={params} /> : null;
};

const dumbbell = defineGeomRenderer(new DumbbellGeom(), {
  coord: 'cartesian',
  guideMode: 'band',
  render: ({ layer }) => <DumbbellLayer layer={layer} />,
  renderHover: ({ layer, primary }) => <HoveredDumbbell layer={layer} observation={primary.observation} />,
  renderHoverCompanions: () => null,
});

const kit = createGraphyKit({ plugins: [dumbbell] });

const toData = (rows: Array<[string, number, number]>): Data => ({
  columns: [{ key: 'category' }, { key: 'start' }, { key: 'end' }],
  rows: rows.map(([category, start, end]) => ({ category, start, end })),
});

// Median full-time salary by role, women vs men ($k); men lead in every role, the gap the chart shows.
const payGap = toData([
  ['Product', 125, 140],
  ['Eng', 118, 132],
  ['Data', 112, 128],
  ['Design', 95, 104],
  ['Sales', 82, 99],
  ['Marketing', 78, 88],
  ['Support', 58, 63],
]);

// Life expectancy at birth by region, 1970 vs 2020 (years); broad gains, widest where it started lowest.
const lifeExpectancy = toData([
  ['Europe', 71, 81],
  ['N. America', 71, 79],
  ['E. Asia', 59, 77],
  ['Latin Am.', 60, 75],
  ['Mid. East', 52, 74],
  ['S. Asia', 49, 70],
  ['Africa', 45, 61],
]);

const payGapSpec = kit.pipe(
  kit.createSpec({ x: 'category' }),
  kit.geom.dumbbell({ aes: { start: 'start', end: 'end' } }),
  kit.scale.x.discrete(),
  // The value axis zooms to the data so the comparison gaps read clearly.
  kit.scale.y.continuous({ zero: false })
);

const lifeExpectancySpec = kit.pipe(
  kit.createSpec({ x: 'category' }),
  kit.geom.dumbbell({ aes: { start: 'start', end: 'end' }, params: { startColor: '#c9a96e', endColor: '#2e7d5b' } }),
  kit.scale.x.discrete(),
  kit.scale.y.continuous({ zero: false })
);

const DumbbellGraph = ({ spec, data }: { spec: Parameters<typeof kit.GraphProvider>[0]['input']; data: Data }) => {
  return (
    <kit.GraphProvider input={spec} data={data}>
      <GraphRenderer />
    </kit.GraphProvider>
  );
};

const meta: Meta = {
  title: 'Plugins/Dumbbell',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj;

export const PayGap: Story = {
  render: () => <DumbbellGraph spec={payGapSpec} data={payGap} />,
};

export const LifeExpectancy: Story = {
  render: () => <DumbbellGraph spec={lifeExpectancySpec} data={lifeExpectancy} />,
};
