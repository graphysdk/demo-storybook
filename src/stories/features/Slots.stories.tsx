import type { Meta, StoryObj } from '@storybook/react';

import { type AxisTicksSlotProps, GraphRenderer, type TooltipSlotProps } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Slots',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Shared spec ──────────────────────────────────────────────────────────────

const salesData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }],
  rows: [
    { quarter: 'Q1', North: 350, South: 200, West: 500 },
    { quarter: 'Q2', North: 300, South: 250, West: 350 },
    { quarter: 'Q3', North: 400, South: 300, West: 300 },
    { quarter: 'Q4', North: 200, South: 150, West: 400 },
  ],
};

const sharedSpec = pipe(
  createSpec(
    transform.reshape({
      keep: ['quarter'],
      reshape: ['North', 'South', 'West'],
      keyName: 'region',
      valueName: 'sales',
    }),
    mapping({ x: 'quarter', y: 'sales', color: 'region' })
  ),
  geom.bar({ position: 'stack' }),
  scale.x(),
  scale.y(),
  scale.color.palette()
);

// ─── Custom tooltip slot ───────────────────────────────────────────────────────

/**
 * A swapped Tooltip region. It receives render-ready `content` ({ header, rows }) from the
 * viz-engine runtime — hit-testing, content-building, and positioning stay with the renderer.
 * The override only paints.
 */
const CustomTooltip = ({ content }: TooltipSlotProps) => {
  return (
    <div
      style={{
        background: '#0f172a',
        color: '#f8fafc',
        padding: '10px 12px',
        borderRadius: 10,
        font: '12px ui-sans-serif, system-ui, sans-serif',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        minWidth: 140,
      }}
    >
      {content.header !== null && <div style={{ fontWeight: 700, marginBottom: 6 }}>{content.header}</div>}
      {content.rows.map((row) => (
        <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ opacity: 0.8 }}>{row.label}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
};

export const CustomTooltipSlot: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Replace a single region by passing it to the `slots` prop of `GraphRenderer`. Here the tooltip is swapped for a custom dark card; every other region still renders from viz-engine. Hover a bar to see it.',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider
      data={salesData}
      spec={sharedSpec}
      config={{ type: 'columnStacked', axes: { y: { label: 'sales' } } }}
    >
      <GraphRenderer slots={{ Tooltip: CustomTooltip }} />
    </VizStoryGraphProvider>
  ),
};

// ─── Layout-coupled Axes slot: avatars instead of labels ───────────────────────

const playerData: Data = {
  columns: [{ key: 'player' }, { key: 'goals' }],
  rows: [
    { player: 'Lionel Messi', goals: 21 },
    { player: 'Cristiano Ronaldo', goals: 18 },
    { player: 'Kylian Mbappé', goals: 24 },
    { player: 'Erling Haaland', goals: 27 },
  ],
};

const playerSpec = pipe(
  createSpec({ x: 'player', y: 'goals' }),
  geom.bar({ position: 'identity' }),
  scale.x(),
  scale.y(),
  config({ axes: { x: { label: 'Player' } } })
);

/** A stand-in avatar per player — any bespoke SVG (an `<image href>`, an icon) works the same way. */
const AVATAR_BY_PLAYER: Record<string, string> = {
  'Lionel Messi': '🧔🏻',
  'Cristiano Ronaldo': '🧑🏻',
  'Kylian Mbappé': '🧑🏿',
  'Erling Haaland': '👱🏼',
};

const AVATAR_FONT_SIZE = 26;
// The band this slot reserves. Because it is the `measure`, the layout reserves exactly this much —
// no gap, no overlap — regardless of how long the underlying player names are. Keep it close to the
// glyph height and centre the avatar in it (below) so there is no one-sided slack under the row.
const AVATAR_BAND_HEIGHT = 30;

/**
 * A layout-coupled AxisTicks slot. It paints one avatar per tick at the tick's normalized position
 * (band center), and — crucially — ships a `measure` so the layout reserves the avatar band, not a
 * band sized for the (long, would-be-rotated) player names. Paint and reserved space come from one
 * source. The axis title ("Player") is a separate region (`AxisLabel`) left to its default, which
 * paints and reserves it correctly with no extra code here.
 */
const AvatarAxisTicks = ({ formattedAxes, tickRects }: AxisTicksSlotProps) => {
  const bottomAxis = formattedAxes.find((axis) => axis.position === 'bottom');
  const tickRect = tickRects.bottom;
  if (!bottomAxis || !tickRect) return null;

  return (
    <svg x={tickRect.x} y={tickRect.y} width={tickRect.width} height={tickRect.height} style={{ overflow: 'visible' }}>
      {bottomAxis.ticks.map((tick) => (
        <text
          key={String(tick.value)}
          x={`${tick.position * 100}%`}
          y={AVATAR_BAND_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={AVATAR_FONT_SIZE}
        >
          {AVATAR_BY_PLAYER[String(tick.value)] ?? '👤'}
        </text>
      ))}
    </svg>
  );
};

export const LayoutAwareAxesSlot: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A layout-coupled region is a `{ render, measure }` slot. Here only `AxisTicks` is overridden — it paints avatars instead of tick labels, and its `measure` tells the layout how tall a band to reserve, so the avatars sit in a snug band even though the underlying labels are long player names. The axis title ("Player") is a separate region (`AxisLabel`) left to its default: it still paints and reserves its own band, so overriding the ticks never leaves a title-band gap.',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider data={playerData} spec={playerSpec} config={{ type: 'column' }}>
      <GraphRenderer slots={{ AxisTicks: { render: AvatarAxisTicks, measure: () => AVATAR_BAND_HEIGHT } }} />
    </VizStoryGraphProvider>
  ),
};
