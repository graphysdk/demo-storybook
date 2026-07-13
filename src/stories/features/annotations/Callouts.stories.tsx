import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useMemo, useRef } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type {
  CalloutMeasurer,
  CartesianCoordSystem,
  Data,
  PinnedNumberAnnotationInput,
  PlacedCallout,
  Rect,
  ResolvedObservationPoint,
  SpecInput,
} from '@graphysdk/viz-engine';
import {
  config,
  coord,
  createSpec,
  geom,
  HeuristicTextMeasurer,
  mapping,
  pipe,
  placeCallouts,
  scale,
} from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Annotations/Callouts',
};

export default meta;

const heuristic = new HeuristicTextMeasurer();
const measurer: CalloutMeasurer = (_kind, text) => {
  const measured = heuristic.measureText(text, { family: 'Inter', size: 13 });
  return { width: measured.width + 16, height: measured.height + 10 };
};

const makeAnchor = (
  x: number,
  y: number,
  geomKind: ResolvedObservationPoint['geom'] = 'bar'
): ResolvedObservationPoint => ({
  x,
  y,
  geom: geomKind,
  measurementValue: 0,
  valueFormat: { type: 'decimal' },
  color: undefined,
});

const cartesianCoord = (mainAxis: 'x' | 'y'): CartesianCoordSystem => ({
  type: 'cartesian',
  mainAxis,
  axisMapping: {
    x: { position: 'bottom', geometry: 'linear' },
    y: { position: 'left', geometry: 'linear' },
  },
});

const PAD = 28;

const argTypes = {
  panelWidth: { control: { type: 'range', min: 160, max: 520, step: 20 }, description: 'Panel width in px.' },
  panelHeight: { control: { type: 'range', min: 120, max: 400, step: 20 }, description: 'Panel height in px.' },
  mainAxis: {
    control: { type: 'inline-radio' },
    options: ['x', 'y'] as const,
    description: '`x` = vertical bars (lead top), `y` = horizontal/flipped bars (lead right).',
  },
} as const;

interface Pin {
  id: string;
  label: string;
  anchor: ResolvedObservationPoint;
}

const Legend = () => (
  <p style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
    🔴 anchor (panel-local SVG px) · blue box = mini bubble · grey/dim = out of view · small grey label = chosen
    placement
  </p>
);

// Deterministic pseudo-random in [0, 1) seeded by an integer — same seed always yields the same
// value, so each point keeps its spot and raising the count only appends new ones (no reshuffle).
function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function makeRandomPins(count: number): Pin[] {
  return Array.from({ length: count }, (_unused, index) => {
    const x = 0.04 + pseudoRandom(index * 2 + 1) * 0.92;
    const y = 0.04 + pseudoRandom(index * 2 + 2) * 0.92;
    const value = Math.round(pseudoRandom(index + 100) * 9900 + 100);
    return { id: `pin-${index}`, label: `$${value.toLocaleString()}`, anchor: makeAnchor(x, y) };
  });
}

const drawRoundedRect = (ctx: CanvasRenderingContext2D, rect: Rect, radius: number) => {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
    return;
  }
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
};

const CalloutCanvas = ({
  panelRect,
  placed,
  labels,
}: {
  panelRect: Rect;
  placed: PlacedCallout[];
  labels: Map<string, string>;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logicalWidth = panelRect.width + PAD * 2;
  const logicalHeight = panelRect.height + PAD * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.translate(PAD, PAD);

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, panelRect.width, panelRect.height);
    ctx.strokeRect(0, 0, panelRect.width, panelRect.height);
    ctx.setLineDash([]);

    for (const callout of placed) {
      const { miniRect, anchorPx, placement, inView, id } = callout;
      const cx = miniRect.x + miniRect.width / 2;
      const cy = miniRect.y + miniRect.height / 2;
      ctx.globalAlpha = inView ? 1 : 0.5;

      ctx.strokeStyle = inView ? '#2563eb' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(anchorPx.x, anchorPx.y);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      ctx.fillStyle = inView ? '#dbeafe' : '#f1f5f9';
      drawRoundedRect(ctx, miniRect, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels.get(id) ?? id, cx, cy);

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Inter, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(placement, cx, miniRect.y - 2);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(anchorPx.x, anchorPx.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [logicalWidth, logicalHeight, panelRect.width, panelRect.height, placed, labels]);

  return <canvas ref={canvasRef} style={{ width: logicalWidth, height: logicalHeight }} />;
};

interface CanvasArgs {
  panelWidth: number;
  panelHeight: number;
  mainAxis: 'x' | 'y';
  count: number;
}

export const Canvas: StoryObj<CanvasArgs> = {
  argTypes: {
    ...argTypes,
    count: {
      control: { type: 'range', min: 1, max: 60, step: 1 },
      description: 'Number of pinned-number callouts, placed at deterministic pseudo-random positions.',
    },
  },
  args: { panelWidth: 420, panelHeight: 300, mainAxis: 'x', count: 12 },
  parameters: {
    docs: {
      description: {
        story:
          'Paints `placeCallouts` output onto an HTML canvas. Raise the count to watch the sibling sweep spread bubbles around dense anchors; positions are seeded by index so existing points stay put.',
      },
    },
  },
  render: ({ panelWidth, panelHeight, mainAxis, count }) => {
    const panelRect = useMemo<Rect>(
      () => ({ x: 0, y: 0, width: panelWidth, height: panelHeight }),
      [panelWidth, panelHeight]
    );
    const pins = useMemo(() => makeRandomPins(count), [count]);
    const labels = useMemo(() => new Map(pins.map((pin) => [pin.id, pin.label])), [pins]);
    const placed = useMemo(
      () =>
        placeCallouts({
          pinnedNumbers: pins.map((pin) => ({ id: pin.id, at: pin.anchor })),
          comments: [],
          panelRect,
          coordSystem: cartesianCoord(mainAxis),
          measurer,
          formatPinnedNumber: (annotation) => labels.get(annotation.id) ?? '',
        }),
      [pins, labels, panelRect, mainAxis]
    );
    return (
      <div style={{ font: '14px Inter, system-ui, sans-serif', color: '#0f172a' }}>
        <Legend />
        <CalloutCanvas panelRect={panelRect} placed={placed} labels={labels} />
      </div>
    );
  },
};

// --- Pinned numbers painted by the real renderer -------------------------------------------

const quarterlyData: Data = {
  columns: [
    { key: 'quarter', label: 'Quarter' },
    { key: 'revenue', label: 'Revenue' },
  ],
  rows: [
    { quarter: 'Q1', revenue: 1200 },
    { quarter: 'Q2', revenue: 1800 },
    { quarter: 'Q3', revenue: 2400 },
    { quarter: 'Q4', revenue: 2800 },
  ],
};

const departmentData: Data = {
  columns: [
    { key: 'department', label: 'Department' },
    { key: 'spend', label: 'Spend' },
  ],
  rows: [
    { department: 'Engineering', spend: 420 },
    { department: 'Sales', spend: 310 },
    { department: 'Marketing', spend: 180 },
    { department: 'Support', spend: 95 },
  ],
};

const pinnedNumbersFor = (quarters: string[]): PinnedNumberAnnotationInput[] =>
  quarters.map((quarter) => ({ id: `pin-${quarter}`, at: { anchorValue: quarter } }));

export const PinnedNumbers: StoryObj = {
  name: 'Pinned numbers — cartesian bar',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        story:
          'Mini value bubbles placed around clustered bar anchors. Hover a bubble to reveal the live chart tooltip for that observation.',
      },
    },
  },
  render: () => {
    const baseSpec = pipe(
      createSpec(mapping({ x: 'quarter', y: 'revenue', color: 'quarter' })),
      geom.bar({ position: 'identity' }),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({})
    );
    const spec = {
      ...baseSpec,
      annotations: { pinnedNumbers: pinnedNumbersFor(['Q1', 'Q2', 'Q3', 'Q4']) },
    } satisfies SpecInput;
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

export const PinnedNumbersFlipped: StoryObj = {
  name: 'Pinned numbers — flipped (horizontal bars)',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Flipped axes: `mainAxis` is `y`, so the placement try-order leads with `right`.',
      },
    },
  },
  render: () => {
    const baseSpec = pipe(
      createSpec(mapping({ x: 'quarter', y: 'revenue', color: 'quarter' })),
      geom.bar({ position: 'identity' }),
      coord.flip(),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({})
    );
    const spec = {
      ...baseSpec,
      annotations: { pinnedNumbers: pinnedNumbersFor(['Q1', 'Q2', 'Q3', 'Q4']) },
    } satisfies SpecInput;
    return (
      <VizStoryGraphProvider data={quarterlyData} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};

export const PinnedNumbersPolar: StoryObj = {
  name: 'Pinned numbers — polar (pie)',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        story: 'Polar bars: each bubble leads with the cardinal pointing radially outward from the pie center.',
      },
    },
  },
  render: () => {
    const baseSpec = pipe(
      createSpec(mapping({ x: '', y: 'spend', color: 'department' })),
      geom.bar({ position: 'fill' }),
      coord.polar({ theta: 'y' }),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({})
    );
    const spec = {
      ...baseSpec,
      annotations: {
        pinnedNumbers: [
          { id: 'pin-eng', at: { anchorValue: 'Engineering' } },
          { id: 'pin-sales', at: { anchorValue: 'Sales' } },
        ],
      },
    } satisfies SpecInput;
    return (
      <VizStoryGraphProvider data={departmentData} spec={spec}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
