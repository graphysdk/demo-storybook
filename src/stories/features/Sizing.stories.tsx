import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { useState } from 'react';

import { GraphRenderer, type ResizeObserverState } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, createSpec, geom, pipe, scale } from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

/**
 * Exercises the `sizing` prop on `GraphRenderer`:
 *
 * - `responsive` (the default) — the graph fills its parent and follows it as it resizes.
 * - `fixed` — the graph has explicit pixel dimensions, regardless of its parent.
 * - `keepAspectRatio` — the graph lays out at an intrinsic size, then scales (CSS transform)
 *   to fit the container width. Text and marks scale proportionally.
 */

const meta: Meta = {
  title: 'Features/Sizing',
};

export default meta;

const salesData: Data = {
  columns: [{ key: 'quarter' }, { key: 'region' }, { key: 'sales' }],
  rows: [
    { quarter: 'Q1', region: 'North', sales: 350 },
    { quarter: 'Q1', region: 'South', sales: 200 },
    { quarter: 'Q1', region: 'West', sales: 500 },
    { quarter: 'Q2', region: 'North', sales: 300 },
    { quarter: 'Q2', region: 'South', sales: 250 },
    { quarter: 'Q2', region: 'West', sales: 350 },
    { quarter: 'Q3', region: 'North', sales: 400 },
    { quarter: 'Q3', region: 'South', sales: 300 },
    { quarter: 'Q3', region: 'West', sales: 300 },
    { quarter: 'Q4', region: 'North', sales: 200 },
    { quarter: 'Q4', region: 'South', sales: 150 },
    { quarter: 'Q4', region: 'West', sales: 400 },
  ],
};

const salesSpec = pipe(
  createSpec({ x: 'quarter', y: 'sales', color: 'region' }),
  geom.bar({ position: 'stack' }),
  scale.x(),
  scale.y(),
  scale.color.palette(),
  config({ content: { title: 'Quarterly sales by region' } })
);

const salesConfig = {
  type: 'columnStacked' as const,
  content: { title: 'Quarterly sales by region' },
};

const containerStyle: CSSProperties = {
  border: '1px dashed #c3c7cc',
  borderRadius: 6,
  overflow: 'hidden',
};

const readoutStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 12,
  color: '#666',
};

const ResizeReadout = ({ size }: { size: ResizeObserverState | null }) => (
  <div style={readoutStyle}>onResize: {size ? `${size.width} × ${size.height}` : '—'}</div>
);

const ResponsiveDemo = () => {
  const [size, setSize] = useState<ResizeObserverState | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ ...containerStyle, width: 800, height: 450, resize: 'both' }}>
        <VizStoryGraphProvider data={salesData} spec={salesSpec} config={salesConfig}>
          <GraphRenderer onResize={setSize} />
        </VizStoryGraphProvider>
      </div>
      <ResizeReadout size={size} />
    </div>
  );
};

export const Responsive: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          'Default mode — no `sizing` prop. Drag the bottom-right corner of the dashed container: the graph follows it and re-lays out. The readout below shows the `onResize` callback values.',
      },
    },
  },
  render: () => <ResponsiveDemo />,
};

interface FixedArgs {
  chartWidth: number;
  chartHeight: number;
}

export const Fixed: StoryObj<FixedArgs> = {
  argTypes: {
    chartWidth: { control: { type: 'range', min: 240, max: 1000, step: 10 } },
    chartHeight: { control: { type: 'range', min: 180, max: 600, step: 10 } },
  },
  args: {
    chartWidth: 640,
    chartHeight: 400,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The graph claims exactly `width` × `height` pixels and ignores its parent — the dashed container is deliberately larger. Adjust the controls to resize the graph.',
      },
    },
  },
  render: (args) => (
    <div style={{ ...containerStyle, width: 1040, height: 640, padding: 10, resize: 'both' }}>
      <VizStoryGraphProvider data={salesData} spec={salesSpec} config={salesConfig}>
        <GraphRenderer sizing={{ mode: 'fixed', width: args.chartWidth, height: args.chartHeight }} />
      </VizStoryGraphProvider>
    </div>
  ),
};

interface KeepAspectRatioArgs {
  intrinsicWidth: number;
  intrinsicHeight: number;
}

const KeepAspectRatioDemo = ({ intrinsicWidth, intrinsicHeight }: KeepAspectRatioArgs) => {
  const [size, setSize] = useState<ResizeObserverState | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ ...containerStyle, width: 480, resize: 'horizontal' }}>
        <VizStoryGraphProvider data={salesData} spec={salesSpec} config={salesConfig}>
          <GraphRenderer sizing={{ mode: 'keepAspectRatio', intrinsicWidth, intrinsicHeight }} onResize={setSize} />
        </VizStoryGraphProvider>
      </div>
      <ResizeReadout size={size} />
    </div>
  );
};

export const KeepAspectRatio: StoryObj<KeepAspectRatioArgs> = {
  argTypes: {
    intrinsicWidth: { control: { type: 'range', min: 240, max: 1000, step: 10 } },
    intrinsicHeight: { control: { type: 'range', min: 180, max: 600, step: 10 } },
  },
  args: {
    intrinsicWidth: 640,
    intrinsicHeight: 400,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The graph lays out once at the intrinsic size, then scales as a whole to fit the container width — drag the right edge of the dashed container and note that text and marks scale proportionally (unlike `responsive`, which re-lays out). Hover the bars to check that tooltips track the pointer under the CSS transform.',
      },
    },
  },
  render: (args) => <KeepAspectRatioDemo intrinsicWidth={args.intrinsicWidth} intrinsicHeight={args.intrinsicHeight} />,
};
