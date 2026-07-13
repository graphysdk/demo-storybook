import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';

import { createGraphyKit, defineGeomRenderer, GraphRenderer } from '@graphysdk/react-renderer';
import type { CompiledGeom, CompiledLayer, Data, GeomCompilerInput, Observation } from '@graphysdk/viz-engine';
import {
  Geom,
  getColor,
  getX,
  getYMax,
  getYMin,
  POSITION_VARIABLES,
  toPercent,
  toViewBoxX,
  toViewBoxY,
} from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';

const DEFAULT_INK = '#4e79a7';

/**
 * A custom geom: a dot atop a stem dropped to the baseline. It declares a y *interval* — an `x` point
 * plus a `lower`/`upper` y pair (like `area`/`bar`) — and a `color` aesthetic, plus one `stemWidth`
 * param. So the typed builder derives `kit.geom.lollipop({ aes: { x, y, color }, params: { stemWidth } })`,
 * and crucially every position (including the baseline) is produced by the compiler: `compile` writes
 * `yMin = 0` in *data* units, the `upper` role fills `yMax` from the `y` aesthetic, both are scaled by
 * the shared y-scale, and the renderer reads them via `getYMin`/`getYMax`. The renderer invents no
 * positions — so the stem stays anchored to the axis baseline under any y domain (zoomed, log, …).
 */
class LollipopGeom extends Geom<{ stemWidth: number }> {
  readonly type = 'lollipop' as const;
  override readonly defaultParams = { stemWidth: 2 };
  override readonly positionRoles = [
    { axis: 'x', role: 'point', valueKind: 'value' },
    { axis: 'y', role: 'min', valueKind: 'value' },
    { axis: 'y', role: 'max', valueKind: 'value', aes: 'y' },
  ] as const;
  override readonly aesthetics = [{ kind: 'visual', name: 'color' }] as const;
  override readonly supportedCoordTypes = ['cartesian'] as const;

  override readonly spatialKind = 'buckets';

  compile({ data }: GeomCompilerInput): CompiledGeom {
    // The baseline is a position, not a render constant: write it in data units so the y-scale maps it.
    const withBaseline = data.hasVariable(POSITION_VARIABLES.yMin)
      ? data
      : data.addConstantVariable(POSITION_VARIABLES.yMin, 'numeric', 0);
    return { data: withBaseline, mapping: {} };
  }
}

const LollipopRenderer = ({ layer }: { layer: CompiledLayer }) => {
  const items = useMemo(() => [...layer.data], [layer.data]);

  return (
    <>
      {items.map((observation, index) => (
        <LollipopItem key={index} layer={layer} observation={observation} isHovered={false} />
      ))}
    </>
  );
};

/** In-place hover highlight: the hovered lollipop redrawn with a bolder stem and a haloed dot. */
const LollipopItem = ({
  layer,
  observation,
  isHovered,
}: {
  layer: CompiledLayer;
  observation: Observation;
  isHovered: boolean;
}) => {
  const { stemWidth } = layer.params as { stemWidth: number };
  const point = useMemo(() => {
    const x = getX(observation);
    const yBase = getYMin(observation);
    const yTop = getYMax(observation);
    if (x === null || yBase === null || yTop === null) return null;
    return {
      cx: toPercent(toViewBoxX(x)),
      baseY: toPercent(toViewBoxY(yBase)),
      topY: toPercent(toViewBoxY(yTop)),
      color: getColor(observation) ?? DEFAULT_INK,
    };
  }, [observation]);

  if (point === null) return null;

  return (
    <g>
      <line
        x1={point.cx}
        x2={point.cx}
        y1={point.baseY}
        y2={point.topY}
        stroke={point.color}
        strokeWidth={isHovered ? stemWidth + 2 : stemWidth}
      />
      <circle cx={point.cx} cy={point.topY} r={isHovered ? 8 : 5} fill={point.color} strokeWidth={isHovered ? 2 : 0} />
    </g>
  );
};

// `defineGeomRenderer(definition, contract)` binds both halves; passing the result to `createGraphyKit`
// derives the typed `kit.geom.lollipop` method AND registers the geom with the bound compiler.
const lollipop = defineGeomRenderer(new LollipopGeom(), {
  coord: 'cartesian',
  render: ({ layer }) => <LollipopRenderer layer={layer} />,
  renderHover: ({ layer, primary }) => <LollipopItem layer={layer} observation={primary.observation} isHovered />,
  renderHoverCompanions: () => null,
});

const kit = createGraphyKit({ plugins: [lollipop] });

const data: Data = {
  columns: [{ key: 'category' }, { key: 'revenue' }],
  rows: [
    { category: 'Product A', revenue: 1200 },
    { category: 'Product B', revenue: 1800 },
    { category: 'Product C', revenue: 2400 },
    { category: 'Product D', revenue: 1600 },
    { category: 'Product E', revenue: 3200 },
    { category: 'Product F', revenue: 2800 },
  ],
};

// The whole point of GRAPH-4727: `kit.geom.lollipop` exists and is typed from the registered def —
// `aes` is constrained to x/y/color and `params` to `{ stemWidth }`, with no cast anywhere.
const spec = kit.pipe(
  kit.createSpec({ x: 'category', y: 'revenue' }),
  kit.geom.lollipop({ aes: { color: 'category' }, params: { stemWidth: 3 } }),
  kit.scale.x(),
  kit.scale.y(),
  kit.scale.color.palette()
);

const LollipopGraph = () => {
  return (
    <kit.GraphProvider input={spec} data={data}>
      <GraphRenderer />
    </kit.GraphProvider>
  );
};

const meta: Meta = {
  title: 'Plugins/Lollipop',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <LollipopGraph />,
};
