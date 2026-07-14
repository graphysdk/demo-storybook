import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { BarGeomParams, Data } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

interface BarStyleArgs {
  width: number;
  borderColor: string;
  borderWidth: number;
}

const barStyleDefaults: BarStyleArgs = {
  width: 0.7,
  borderColor: '',
  borderWidth: 1,
};

const barStyleArgTypes = {
  width: {
    control: { type: 'range', min: 0.1, max: 1, step: 0.05 },
    description: 'Bar width as a fraction of the category band — angular for rose petals, radial for tracks.',
  },
  borderColor: {
    control: 'color',
    description: 'Segment border color. Empty draws no border.',
  },
  borderWidth: {
    control: { type: 'range', min: 1, max: 6, step: 1 },
    description: 'Border width in pixels. Only takes effect when a border color is set.',
  },
} as const;

const buildBarStyleParams = (args: BarStyleArgs): Partial<BarGeomParams> => ({
  width: args.width,
  borderColor: args.borderColor || undefined,
  borderWidth: args.borderWidth,
});

const meta: Meta = {
  title: 'Chart Types/Polar Bar Graph',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<BarStyleArgs>;

// Signups per weekday, split across three acquisition channels — long format, one row per
// (day, channel). `color: 'channel'` splits each category into one series per channel.
const signupsData: Data = {
  columns: [{ key: 'day' }, { key: 'signups' }, { key: 'channel' }],
  rows: [
    { day: 'Mon', signups: 5, channel: 'Organic' },
    { day: 'Mon', signups: 3, channel: 'Referral' },
    { day: 'Mon', signups: 2, channel: 'Ads' },
    { day: 'Tue', signups: 7, channel: 'Organic' },
    { day: 'Tue', signups: 4, channel: 'Referral' },
    { day: 'Tue', signups: 3, channel: 'Ads' },
    { day: 'Wed', signups: 6, channel: 'Organic' },
    { day: 'Wed', signups: 5, channel: 'Referral' },
    { day: 'Wed', signups: 4, channel: 'Ads' },
    { day: 'Thu', signups: 9, channel: 'Organic' },
    { day: 'Thu', signups: 3, channel: 'Referral' },
    { day: 'Thu', signups: 5, channel: 'Ads' },
    { day: 'Fri', signups: 8, channel: 'Organic' },
    { day: 'Fri', signups: 6, channel: 'Referral' },
    { day: 'Fri', signups: 2, channel: 'Ads' },
    { day: 'Sat', signups: 4, channel: 'Organic' },
    { day: 'Sat', signups: 2, channel: 'Referral' },
    { day: 'Sat', signups: 6, channel: 'Ads' },
    { day: 'Sun', signups: 3, channel: 'Organic' },
    { day: 'Sun', signups: 4, channel: 'Referral' },
    { day: 'Sun', signups: 7, channel: 'Ads' },
  ],
};

// ─── Rose / coxcomb (theta: x) ─────────────────────────────────────────────
// Category spokes the angle (one wedge band per day), value grows the radius outward. Dodge splits
// each day's band into one sub-wedge per channel — the "petals".
export const Rose: Story = {
  args: barStyleDefaults,
  argTypes: barStyleArgTypes,
  render: (args) => (
    <VizStoryGraphProvider
      data={signupsData}
      spec={pipe(
        createSpec({ x: 'day', y: 'signups', color: 'channel' }),
        geom.bar({ position: 'dodge', params: buildBarStyleParams(args) }),
        coord.polar({ theta: 'x' }),
        scale.x.discrete(),
        scale.y({ zero: true }),
        scale.color.palette(),
        config({
          legend: { position: 'top' },
          axes: {
            x: { isVisible: true },
            y: { isVisible: true },
          },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Stacked rose ──────────────────────────────────────────────────────────
// Same wedge-per-day layout, but the channels stack outward along the radius instead of dodging.
export const StackedRose: Story = {
  args: barStyleDefaults,
  argTypes: barStyleArgTypes,
  render: (args) => (
    <VizStoryGraphProvider
      data={signupsData}
      spec={pipe(
        createSpec({ x: 'day', y: 'signups', color: 'channel' }),
        geom.bar({ position: 'stack', params: buildBarStyleParams(args) }),
        coord.polar({ theta: 'x' }),
        scale.x.discrete(),
        scale.y({ zero: true }),
        scale.color.palette(),
        config({
          legend: { position: 'top' },
          axes: {
            x: { isVisible: true },
            y: { isVisible: true },
          },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Radial bar / race-track (theta: y) ─────────────────────────────────────
// Category picks the radius (one concentric track per day), value sweeps the angle. Channels stack
// along the arc so each track reads as consecutive coloured segments.
export const RadialBar: Story = {
  args: barStyleDefaults,
  argTypes: barStyleArgTypes,
  render: (args) => (
    <VizStoryGraphProvider
      data={signupsData}
      spec={pipe(
        createSpec({ x: 'day', y: 'signups', color: 'channel' }),
        geom.bar({ position: 'stack', params: buildBarStyleParams(args) }),
        coord.polar({ theta: 'y', innerRadius: 0.15 }),
        scale.x.discrete(),
        scale.y({ zero: true }),
        scale.color.palette(),
        config({
          legend: { position: 'top' },
          axes: {
            x: { isVisible: true },
            y: { isVisible: true },
          },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
