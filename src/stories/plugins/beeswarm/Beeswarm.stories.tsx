import type { Meta, StoryObj } from '@storybook/react';

import type { Data } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';

import { BeeswarmGraph, kit } from './BeeswarmGraph';

const meta: Meta = {
  title: 'Plugins/Beeswarm',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj;

// x is the scale-derived value axis the engine trains; the off-axis spread is the render-side pixel-radius
// dodge, not a scaled dimension, so the chart carries no y axis. `color` is author-mapped, so the engine's
// categorical scale colours each point by its group and the legend lists the groups.
const spec = kit.pipe(
  kit.createSpec({ x: 'value' }),
  kit.geom.beeswarm({ aes: { name: 'name', color: 'group' } }),
  kit.scale.x.continuous({ zero: false }),
  kit.scale.color.palette()
);

/** A small seeded PRNG (mulberry32) so each dataset — and thus its dodge layout — is identical every load. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One Box–Muller normal draw — the per-group spread that makes a swarm read as a distribution. */
function gaussian(rng: () => number, mean: number, sd: number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sd;
}

interface GroupSpec {
  group: string;
  count: number;
  mean: number;
  sd: number;
}

/** Generates a labelled, grouped dataset — many points per group drawn from each group's normal. */
function generate(groups: GroupSpec[], seed: number, step: number): Data {
  const rng = createRng(seed);
  const rows: Array<{ name: string; group: string; value: number }> = [];
  for (const group of groups) {
    for (let index = 1; index <= group.count; index += 1) {
      const value = Math.round(gaussian(rng, group.mean, group.sd) / step) * step;
      rows.push({ name: `${group.group} #${index}`, group: group.group, value });
    }
  }
  return { columns: [{ key: 'name' }, { key: 'group' }, { key: 'value' }], rows };
}

// The full Palmer Penguins distribution (~344 birds), the textbook beeswarm: three species whose body
// masses (g) overlap below and separate above — Gentoo sit well clear of Adelie and Chinstrap.
const penguinBodyMass = generate(
  [
    { group: 'Adelie', count: 152, mean: 3701, sd: 459 },
    { group: 'Chinstrap', count: 68, mean: 3733, sd: 384 },
    { group: 'Gentoo', count: 124, mean: 5076, sd: 504 },
  ],
  20240517,
  25
);

// Marathon finishing times (minutes) across four age bands (~300 runners) — a broad, single-mode spread
// that drifts slower with age.
const marathonTimes = generate(
  [
    { group: '18–29', count: 64, mean: 242, sd: 33 },
    { group: '30–39', count: 96, mean: 236, sd: 29 },
    { group: '40–49', count: 84, mean: 249, sd: 31 },
    { group: '50+', count: 58, mean: 264, sd: 35 },
  ],
  19920808,
  1
);

export const PenguinBodyMass: Story = {
  render: () => <BeeswarmGraph input={spec} data={penguinBodyMass} />,
};

export const MarathonTimes: Story = {
  render: () => <BeeswarmGraph input={spec} data={marathonTimes} />,
};
