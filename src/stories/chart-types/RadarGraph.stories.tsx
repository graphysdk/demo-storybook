import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Chart Types/Radar Graph',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

// A two-player skills profile in long format: one row per (player, skill). `color: 'player'`
// splits the rows into one series (spoke polygon) per player.
const skillsData: Data = {
  columns: [{ key: 'skill' }, { key: 'score' }, { key: 'player' }],
  rows: [
    { skill: 'Speed', score: 8, player: 'Alice' },
    { skill: 'Power', score: 6, player: 'Alice' },
    { skill: 'Defense', score: 7, player: 'Alice' },
    { skill: 'Stamina', score: 9, player: 'Alice' },
    { skill: 'Technique', score: 5, player: 'Alice' },
    { skill: 'Agility', score: 8, player: 'Alice' },
    { skill: 'Speed', score: 6, player: 'Bob' },
    { skill: 'Power', score: 9, player: 'Bob' },
    { skill: 'Defense', score: 5, player: 'Bob' },
    { skill: 'Stamina', score: 6, player: 'Bob' },
    { skill: 'Technique', score: 8, player: 'Bob' },
    { skill: 'Agility', score: 7, player: 'Bob' },
  ],
};

// ─── Spider outline (line + vertex dots) ───────────────────────────────────
export const Spider: Story = {
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
        config({ legend: { position: 'top' } })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Vertex dots only ──────────────────────────────────────────────────────
export const Points: Story = {
  render: () => (
    <VizStoryGraphProvider
      data={skillsData}
      spec={pipe(
        createSpec({ x: 'skill', y: 'score', color: 'player' }),
        geom.point(),
        coord.polar({ theta: 'x' }),
        scale.x.discrete(),
        scale.y({ zero: true }),
        scale.color.palette(),
        config({ legend: { position: 'top' } })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Filled spider (area + outline) ────────────────────────────────────────
export const Filled: Story = {
  render: () => (
    <VizStoryGraphProvider
      data={skillsData}
      spec={pipe(
        createSpec({ x: 'skill', y: 'score', color: 'player' }),
        geom.area({ position: 'identity' }),
        geom.point({ interactive: false }),
        coord.polar({ theta: 'x' }),
        scale.x.discrete(),
        scale.y({ zero: true }),
        scale.color.palette(),
        config({ legend: { position: 'top' } })
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
