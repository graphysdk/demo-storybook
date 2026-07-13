import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';

import { createGraphyKit, defineGeomRenderer, GraphRenderer } from '@graphysdk/react-renderer';
import type { CompiledGeom, CompiledLayer, Data, GeomCompilerInput, Observation } from '@graphysdk/viz-engine';
import {
  Geom,
  getScaledAesthetic,
  getX,
  getYMax,
  getYMin,
  toPercent,
  toViewBoxX,
  toViewBoxY,
} from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';

interface CandlestickParams {
  /** Candle body width as a fraction of the band spacing (the wick sits at the band centre). */
  bodyWidth: number;
  /** Wick stroke width, in pixels. */
  wickWidth: number;
  /** Colour for a rising session (close ≥ open). */
  upColor: string;
  /** Colour for a falling session (close < open). */
  downColor: string;
}

/**
 * A custom OHLC `candlestick` geom that dogfoods ADR-034's **open positional aesthetic vocabulary**.
 * Open/high/low/close are authored as ordinary aesthetics, exactly like `x` or `color`: the high–low
 * wick is a y *interval* (`low`/`high` → the price-axis domain) and open/close are two **scalar** y
 * aesthetics the engine trains and scales through the same price scale (the raw prices are preserved,
 * so the tooltip can show them). The geom declares five positional aesthetics and the pipeline does
 * the rest — the price axis, the domain over all four prices, and the `[0, 1]` positions the renderer
 * reads — leaving `compile()` to only inject a representative `y` for hover.
 */
class CandlestickGeom extends Geom<CandlestickParams> {
  readonly type = 'candlestick' as const;
  override readonly defaultParams: CandlestickParams = {
    bodyWidth: 0.6,
    wickWidth: 1.5,
    upColor: '#26a69a',
    downColor: '#ef5350',
  };
  override readonly positionRoles = [
    { axis: 'x', role: 'point', valueKind: 'value' }, // band centre, from the root `x` mapping
    { axis: 'y', role: 'min', valueKind: 'value', aes: 'low' }, // wick bottom → yMin (drives the domain)
    { axis: 'y', role: 'max', valueKind: 'value', aes: 'high' }, // wick top → yMax
    { axis: 'y', role: 'scalar', valueKind: 'value', aes: 'open' }, // body (scaled; raw price preserved)
    { axis: 'y', role: 'scalar', valueKind: 'value', aes: 'close' },
  ] as const;
  override readonly supportedCoordTypes = ['cartesian'] as const;
  override readonly highlightStrategy = 'observation-rerender' as const;
  override readonly identityKey = 'index' as const;
  // The tooltip shows all four prices of the hovered session (raw values, formatted like any axis value).
  override readonly tooltip = [
    { key: 'Open', aes: 'open' },
    { key: 'High', aes: 'high' },
    { key: 'Low', aes: 'low' },
    { key: 'Close', aes: 'close' },
  ] as const;

  override readonly spatialKind = 'buckets';

  // The contract scales the prices; injecting a representative `y` (the session high — a raw column
  // preserved alongside the scaled positions) gives the hover hit-test its `POSITION_VARIABLES.y` and
  // the tooltip a value to show, both of which key on `mapping.y`.
  compile({ data, mapping }: GeomCompilerInput): CompiledGeom {
    return { data, mapping: { y: mapping.high } };
  }
}

/** One candle in `[0, 1]` data-up space — both wick bounds and both body bounds already scaled. */
interface Candle {
  x: number;
  low: number;
  high: number;
  open: number;
  close: number;
  halfBody: number;
  isUp: boolean;
}

/** Body half-width in `[0, 1]`: a fraction of the smallest gap between adjacent band centres. */
const resolveHalfBody = (xs: number[], bodyWidth: number): number => {
  const sorted = [...new Set(xs)].sort((left, right) => left - right);
  let minGap = Number.POSITIVE_INFINITY;
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];
    if (current === undefined || previous === undefined) continue;
    minGap = Math.min(minGap, current - previous);
  }
  const spacing = Number.isFinite(minGap) ? minGap : 0.1;
  return (spacing * bodyWidth) / 2;
};

const readCandles = (layer: CompiledLayer): Candle[] => {
  const params = layer.params as unknown as CandlestickParams;
  const rows: Array<Omit<Candle, 'halfBody' | 'isUp'>> = [];
  for (const observation of layer.data) {
    const x = getX(observation);
    const low = getYMin(observation);
    const high = getYMax(observation);
    // open/close scale into derived columns (raw prices preserved for the tooltip).
    const open = getScaledAesthetic(observation, 'open');
    const close = getScaledAesthetic(observation, 'close');
    if (x === null || low === null || high === null || open === null || close === null) continue;
    rows.push({ x, low, high, open, close });
  }
  const halfBody = resolveHalfBody(
    rows.map((row) => row.x),
    params.bodyWidth
  );
  return rows.map((row) => ({ ...row, halfBody, isUp: row.close >= row.open }));
};

/** Minimum body height in `[0, 1]` so a doji (open ≈ close) still shows a flat tick. */
const MIN_BODY = 0.0016;

const CandleMark = ({ candle, params }: { candle: Candle; params: CandlestickParams }) => {
  const color = candle.isUp ? params.upColor : params.downColor;
  const bodyTop = Math.max(candle.open, candle.close);
  const bodyBottom = Math.min(candle.open, candle.close);
  const rawHeight = bodyTop - bodyBottom;
  const height = Math.max(rawHeight, MIN_BODY);
  // Centre a clamped near-doji body on the open/close midpoint so it doesn't drift off the wick.
  const top = rawHeight < MIN_BODY ? (bodyTop + bodyBottom) / 2 + height / 2 : bodyTop;
  return (
    <g>
      <line
        x1={toPercent(toViewBoxX(candle.x))}
        x2={toPercent(toViewBoxX(candle.x))}
        y1={toPercent(toViewBoxY(candle.high))}
        y2={toPercent(toViewBoxY(candle.low))}
        stroke={color}
        strokeWidth={params.wickWidth}
      />
      <rect
        x={toPercent(toViewBoxX(candle.x - candle.halfBody))}
        width={toPercent(candle.halfBody * 2)}
        y={toPercent(toViewBoxY(top))}
        height={toPercent(height)}
        fill={color}
      />
    </g>
  );
};

const CandlestickLayer = ({ layer }: { layer: CompiledLayer }) => {
  const candles = useMemo(() => readCandles(layer), [layer]);
  const params = layer.params as unknown as CandlestickParams;
  return (
    <>
      {candles.map((candle, index) => (
        <CandleMark key={index} candle={candle} params={params} />
      ))}
    </>
  );
};

/** Re-paints the hovered candle above the CSS-dimmed siblings (the `observation-rerender` strategy). */
const HoveredCandle = ({ layer, observation }: { layer: CompiledLayer; observation: Observation }) => {
  const params = layer.params as unknown as CandlestickParams;
  // Read every candle so band spacing (and thus body width) matches the base layer, then pick the
  // hovered one by its band centre — each candle owns a distinct x.
  const candle = useMemo(() => {
    const hoveredX = getX(observation);
    return readCandles(layer).find((entry) => entry.x === hoveredX) ?? null;
  }, [layer, observation]);
  return candle ? <CandleMark candle={candle} params={params} /> : null;
};

const candlestick = defineGeomRenderer(new CandlestickGeom(), {
  coord: 'cartesian',
  guideMode: 'band',
  render: ({ layer }) => <CandlestickLayer layer={layer} />,
  renderHover: ({ layer, primary }) => <HoveredCandle layer={layer} observation={primary.observation} />,
  renderHoverCompanions: () => null,
});

const kit = createGraphyKit({ plugins: [candlestick] });

const toData = (rows: Array<[string, number, number, number, number]>): Data => ({
  columns: [{ key: 'date' }, { key: 'open' }, { key: 'high' }, { key: 'low' }, { key: 'close' }],
  rows: rows.map(([date, open, high, low, close]) => ({ date, open, high, low, close })),
});

// A 20-session equity uptrend with realistic pullbacks (open ≈ prior close); rising sessions teal, falling red.
const equityPrices = toData([
  ['Apr 01', 100, 103, 99, 102],
  ['Apr 02', 102, 104, 101, 101],
  ['Apr 03', 101, 105, 100, 104],
  ['Apr 04', 104, 106, 103, 103],
  ['Apr 07', 103, 104, 100, 100],
  ['Apr 08', 100, 102, 98, 101],
  ['Apr 09', 101, 107, 101, 106],
  ['Apr 10', 106, 108, 105, 107],
  ['Apr 11', 107, 109, 104, 105],
  ['Apr 14', 105, 106, 102, 103],
  ['Apr 15', 103, 105, 102, 105],
  ['Apr 16', 105, 110, 104, 109],
  ['Apr 17', 109, 112, 108, 111],
  ['Apr 18', 111, 113, 109, 110],
  ['Apr 21', 110, 111, 106, 107],
  ['Apr 22', 107, 109, 106, 108],
  ['Apr 23', 108, 114, 108, 113],
  ['Apr 24', 113, 116, 112, 115],
  ['Apr 25', 115, 117, 113, 114],
  ['Apr 28', 114, 118, 113, 117],
]);

// A 14-session selloff with wide intraday wicks — a downtrend so the red bodies dominate.
const volatileSelloff = toData([
  ['May 01', 250, 256, 244, 248],
  ['May 02', 248, 252, 240, 242],
  ['May 05', 242, 248, 238, 246],
  ['May 06', 246, 250, 235, 237],
  ['May 07', 237, 241, 228, 230],
  ['May 08', 230, 236, 225, 234],
  ['May 09', 234, 238, 226, 228],
  ['May 12', 228, 232, 218, 220],
  ['May 13', 220, 226, 214, 224],
  ['May 14', 224, 229, 216, 218],
  ['May 15', 218, 222, 210, 212],
  ['May 16', 212, 219, 209, 217],
  ['May 19', 217, 221, 213, 215],
  ['May 20', 215, 223, 212, 221],
]);

const candlestickSpec = kit.pipe(
  kit.createSpec({ x: 'date' }),
  // Open/high/low/close are authored as ordinary aesthetics — the open-vocabulary payoff.
  kit.geom.candlestick({ aes: { open: 'open', high: 'high', low: 'low', close: 'close' } }),
  // Trading sessions are ordinal: candles sit one-per-band at equal spacing (weekend gaps collapse).
  kit.scale.x.discrete(),
  // The price axis zooms to the data rather than anchoring at zero, the way a candlestick chart reads.
  kit.scale.y.continuous({ zero: false })
);

const CandlestickGraph = ({ data }: { data: Data }) => {
  return (
    <kit.GraphProvider input={candlestickSpec} data={data}>
      <GraphRenderer />
    </kit.GraphProvider>
  );
};

const meta: Meta = {
  title: 'Plugins/Candlestick',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj;

export const EquityUptrend: Story = {
  render: () => <CandlestickGraph data={equityPrices} />,
};

export const VolatileSelloff: Story = {
  render: () => <CandlestickGraph data={volatileSelloff} />,
};
