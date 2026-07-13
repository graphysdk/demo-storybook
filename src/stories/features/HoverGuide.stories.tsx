import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, pipe, prefixInternalVariable, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

// The hover guide follows the *hovered* layer's renderer under both coord systems: a bar draws a band,
// a line/area draws a crosshair, a scatter point draws nothing. These stories exercise that one model.
// The guide only paints on hover, so each subtitle says what to hover and which guide to expect.
const meta: Meta = {
  title: 'Features/Hover Guide',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

const BAR_SERIES_LABEL_VARIABLE = prefixInternalVariable('barSeriesLabel');
const LINE_SERIES_LABEL_VARIABLE = prefixInternalVariable('lineSeriesLabel');

// ─── Baseline: bar → band ───────────────────────────────────────────────────
const monthlySales: Data = {
  columns: [{ key: 'month' }, { key: 'sales' }],
  rows: [
    { month: 'Jan', sales: '$320' },
    { month: 'Feb', sales: '$280' },
    { month: 'Mar', sales: '$410' },
    { month: 'Apr', sales: '$260' },
    { month: 'May', sales: '$500' },
    { month: 'Jun', sales: '$440' },
  ],
};

export const BarBand: Story = {
  name: 'Bar · band guide',
  render: () => (
    <VizStoryGraphProvider
      data={monthlySales}
      spec={pipe(
        createSpec({ x: 'month', y: 'sales' }),
        geom.bar(),
        scale.x(),
        scale.y(),
        config({
          content: { subtitle: 'Hover a bar → a translucent band spanning the whole category column.' },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Baseline: line → crosshair ─────────────────────────────────────────────
export const LineCrosshair: Story = {
  name: 'Line · crosshair guide',
  render: () => (
    <VizStoryGraphProvider
      data={monthlySales}
      spec={pipe(
        createSpec({ x: 'month', y: 'sales' }),
        geom.line(),
        scale.x(),
        scale.y(),
        config({
          content: { subtitle: 'Hover the line → a dashed vertical rule snapped to the nearest point.' },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Headline change: combo draws each layer's own guide ────────────────────
// Sales (bars) and Target (line) share one y-scale. The guide is no longer a chart-wide consensus that
// always wins with a band — it follows whichever layer the cursor resolves to.
const salesVsTarget: Data = {
  columns: [{ key: 'month' }, { key: 'Sales' }, { key: 'Target' }],
  rows: [
    { month: 'Jan', Sales: '$320', Target: '$380' },
    { month: 'Feb', Sales: '$280', Target: '$360' },
    { month: 'Mar', Sales: '$410', Target: '$380' },
    { month: 'Apr', Sales: '$260', Target: '$360' },
    { month: 'May', Sales: '$500', Target: '$400' },
    { month: 'Jun', Sales: '$440', Target: '$400' },
  ],
};

export const ComboPerLayerGuide: Story = {
  name: 'Combo · band on bars, crosshair on line',
  render: () => (
    <VizStoryGraphProvider
      data={salesVsTarget}
      spec={pipe(
        createSpec({ x: 'month' }),
        geom.bar({
          transforms: [
            transform.constant({ variableName: BAR_SERIES_LABEL_VARIABLE, type: 'categorical', value: 'Sales' }),
          ],
          aes: { y: 'Sales', color: BAR_SERIES_LABEL_VARIABLE },
        }),
        geom.line({
          transforms: [
            transform.constant({ variableName: LINE_SERIES_LABEL_VARIABLE, type: 'categorical', value: 'Target' }),
          ],
          aes: { y: 'Target', color: LINE_SERIES_LABEL_VARIABLE },
        }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({
          legend: { position: 'top' },
          content: { subtitle: 'Hover a bar → band; hover the line → crosshair. Each layer draws its own guide.' },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Veto fix: an interactive point overlay no longer suppresses the crosshair ──
// A point overlay contributes no guide of its own. Reading only the hovered layer means it can't veto
// the line's crosshair, so the overlay no longer needs `interactive: false` to keep the guide alive.
export const LineWithInteractivePointOverlay: Story = {
  name: 'Line + point overlay · crosshair survives (no veto)',
  render: () => (
    <VizStoryGraphProvider
      data={monthlySales}
      spec={pipe(
        createSpec({ x: 'month', y: 'sales' }),
        geom.line(),
        geom.point(),
        scale.x(),
        scale.y(),
        config({
          content: {
            subtitle: 'Hover a line segment → the crosshair still draws, even with an interactive point overlay.',
          },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Polar consistency: radar line → spoke ──────────────────────────────────
const skillsData: Data = {
  columns: [{ key: 'skill' }, { key: 'score' }, { key: 'player' }],
  rows: [
    { skill: 'Speed', score: 8, player: 'Alice' },
    { skill: 'Power', score: 6, player: 'Alice' },
    { skill: 'Defense', score: 7, player: 'Alice' },
    { skill: 'Stamina', score: 9, player: 'Alice' },
    { skill: 'Technique', score: 5, player: 'Alice' },
    { skill: 'Agility', score: 8, player: 'Alice' },
  ],
};

export const RadarSpoke: Story = {
  name: 'Radar (polar line) · spoke guide',
  render: () => (
    <VizStoryGraphProvider
      data={skillsData}
      spec={pipe(
        createSpec({ x: 'skill', y: 'score', color: 'player' }),
        geom.line(),
        geom.point({ interactive: false }),
        coord.polar({ theta: 'x' }),
        scale.x.discrete(),
        scale.y({ zero: true }),
        scale.color.palette(),
        config({
          legend: { position: 'top' },
          content: { subtitle: 'Hover a vertex → a centre-to-rim spoke, the polar analog of the crosshair.' },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Polar consistency: rose (polar bar) → wedge ────────────────────────────
const signupsData: Data = {
  columns: [{ key: 'day' }, { key: 'signups' }, { key: 'channel' }],
  rows: [
    { day: 'Mon', signups: 5, channel: 'Organic' },
    { day: 'Mon', signups: 3, channel: 'Referral' },
    { day: 'Tue', signups: 7, channel: 'Organic' },
    { day: 'Tue', signups: 4, channel: 'Referral' },
    { day: 'Wed', signups: 6, channel: 'Organic' },
    { day: 'Wed', signups: 5, channel: 'Referral' },
    { day: 'Thu', signups: 9, channel: 'Organic' },
    { day: 'Thu', signups: 3, channel: 'Referral' },
    { day: 'Fri', signups: 8, channel: 'Organic' },
    { day: 'Fri', signups: 6, channel: 'Referral' },
  ],
};

export const RoseWedge: Story = {
  name: 'Rose (polar bar) · wedge guide',
  render: () => (
    <VizStoryGraphProvider
      data={signupsData}
      spec={pipe(
        createSpec({ x: 'day', y: 'signups', color: 'channel' }),
        geom.bar({ position: 'dodge' }),
        coord.polar({ theta: 'x' }),
        scale.x.discrete(),
        scale.y({ zero: true }),
        scale.color.palette(),
        config({
          legend: { position: 'top' },
          content: {
            subtitle: 'Hover a petal → a translucent wedge spanning its spoke, the polar analog of the band.',
          },
        })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
