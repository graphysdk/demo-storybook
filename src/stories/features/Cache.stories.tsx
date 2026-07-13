/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Meta, StoryObj } from '@storybook/react';
import { useCallback } from 'react';

import {
  DevToolsPanel,
  GraphProvider,
  GraphRenderer,
  useCompiledSelector,
  useGraphCommandDispatcher,
} from '@graphysdk/react-renderer';
import type { Command, Data, Spec } from '@graphysdk/viz-engine';
import {
  config,
  createSpec,
  geom,
  highlight,
  pipe,
  scale,
  SetAxisPositionCommand,
  SetHeadlineShowCommand,
  SetLineWidthCommand,
  SetScaleDomainCommand,
  transform,
} from '@graphysdk/viz-engine';

/**
 * Visual proof of the compile cache. The fixture is deliberately heavy — 10,000 rows feeding
 * two layers (a per-series line and a per-series sparse monthly point overlay) — so per-stage
 * compile work is in the milliseconds range, not microseconds. That makes the cache impact
 * obvious in the DevToolsPanel's duration column: dispatch any command, toggle the
 * `cache enabled` checkbox, dispatch it again, watch the duration shift.
 *
 * Two series-scope highlights keep the highlights stage in play so its cache row participates
 * in the demo: config-only commands hit it; scale- and layer-touching commands invalidate it.
 */

const meta: Meta = {
  title: 'Features/Cache',
};

export default meta;

const ROW_COUNT = 10000;
const SERIES = ['North', 'South', 'East', 'West'] as const;

const RAW_DATA: Data = {
  columns: [{ key: 'date' }, { key: 'value' }, { key: 'monthlyMarker' }, { key: 'isMonthlyMarker' }, { key: 'series' }],
  rows: Array.from({ length: ROW_COUNT }, (_unused, index) => {
    const seriesIndex = index % SERIES.length;
    const dayOffset = Math.floor(index / SERIES.length);
    const date = new Date(2015, 0, 1 + dayOffset);
    // Sparse per-series monthly marker: each series fires roughly every 30 days,
    // staggered by series so the four series' points don't share x positions.
    const isMonthlyMarker = (dayOffset + seriesIndex * 7) % 30 === 0 ? 1 : 0;
    return {
      date: date.toISOString(),
      value: Math.sin(dayOffset / 40 + seriesIndex) * 30 + 80 + seriesIndex * 12 + dayOffset * 0.01,
      monthlyMarker: 240 + Math.sin(dayOffset * 13.7 + seriesIndex * 41.3) * 30,
      isMonthlyMarker,
      series: SERIES[seriesIndex]!,
    };
  }),
};

const BASE_SPEC = pipe(
  createSpec({ x: 'date', y: 'value', color: 'series' }),
  geom.line({ params: { lineWidth: 2 } }),
  geom.point({
    aes: { y: 'monthlyMarker' },
    transforms: [transform.filter({ variableName: 'isMonthlyMarker', operator: 'eq', value: 1 })],
    params: { size: 6 },
  }),
  scale.x(),
  scale.y(),
  scale.color.palette(),
  highlight({ variable: 'series', eq: 'North' }, { scope: 'series' }),
  highlight(
    {
      and: [
        { variable: 'series', eq: 'West' },
        { variable: 'monthlyMarker', lte: 215 },
      ],
    },
    { scope: 'data-point', layerIndex: 1 }
  ),
  config({
    content: {
      title: `Compile cache demo · ${ROW_COUNT.toLocaleString()} rows · 2 layers · 2 highlights`,
      subtitle: 'Dispatch a command; the dev panel shows which stages re-ran and how long they took.',
    },
    appearance: { highlightStyle: 'dim' },
  })
);

interface CommandEntry {
  label: string;
  description: string;
  build: (spec: Spec) => Command;
}

const COMMANDS: CommandEntry[] = [
  {
    label: 'setAxisPosition (y: left ↔ right)',
    description: 'Config-only. Only GuideCompiler re-runs — every other stage hits cache.',
    build: (spec) =>
      new SetAxisPositionCommand({
        axis: 'y',
        position: spec.config.axes.y.position === 'right' ? 'left' : 'right',
      }),
  },
  {
    label: 'setHeadlineShow (total ↔ none)',
    description: "Touches config.headline — inside GuideCompiler's narrowed slice. Same shape as above.",
    build: (spec) =>
      new SetHeadlineShowCommand({
        show: spec.config.headline.show === 'total' ? 'none' : 'total',
      }),
  },
  {
    label: 'setScaleDomain (y: 0–300 ↔ 25–350)',
    description: 'Scale-touching. LayerCompiler hits; scale + downstream stages rebuild.',
    build: (spec) => {
      const yScale = spec.scales.find((entry) => entry.scaledAesthetic === 'y');
      const flipped = yScale && 'domainMin' in yScale && yScale.domainMin === 0;
      return new SetScaleDomainCommand({
        scaledAesthetic: 'y',
        domainMin: flipped ? 25 : 0,
        domainMax: flipped ? 350 : 300,
      });
    },
  },
  {
    label: 'setLineWidth (line: 5 ↔ 2)',
    description: 'Per-layer. The line layer re-runs the pipeline; the point layer hits the WeakMap cache.',
    build: (spec) => {
      const target = spec.layers.find((layer) => layer.geom === 'line' || layer.geom === 'area');
      const currentWidth = target && 'lineWidth' in target.params ? target.params.lineWidth : undefined;
      return new SetLineWidthCommand({ lineWidth: currentWidth === 5 ? 2 : 5 });
    },
  },
];

const StoryShell = () => {
  const dispatch = useGraphCommandDispatcher();
  const currentSpec = useCompiledSelector((compiled) => compiled.spec);

  const run = useCallback(
    (entry: CommandEntry) => {
      dispatch(entry.build(currentSpec));
    },
    [dispatch, currentSpec]
  );

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ width: 640, height: 420, border: '1px solid #e3e5e8', borderRadius: 8 }}>
        <GraphRenderer mode="editable" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 380, maxWidth: 480 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              type="button"
              onClick={() => run(cmd)}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                border: '1px solid #d1d5da',
                borderRadius: 6,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{cmd.label}</div>
              <div style={{ color: '#5f6469', fontSize: 12, marginTop: 2 }}>{cmd.description}</div>
            </button>
          ))}
        </div>
        <DevToolsPanel />
      </div>
    </div>
  );
};

/**
 * A per-series line over 10,000 raw observations, plus a sparse per-series point overlay that
 * filters those observations to roughly one marker per month per series (staggered across series
 * so they don't share x positions). The cache skips redundant config-only re-renders entirely and
 * reuses unchanged stage outputs across recompiles; per-layer commands only invalidate the
 * touched layer.
 */
export const Demo: StoryObj = {
  render: () => (
    <GraphProvider data={RAW_DATA} input={BASE_SPEC}>
      <StoryShell />
    </GraphProvider>
  ),
};
