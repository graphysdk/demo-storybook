import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { coord, createSpec, geom, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

type PointGraphArgs = {
  flipped: boolean;
};

const meta: Meta<PointGraphArgs> = {
  title: 'Chart Types/Point Graph',
  decorators: [ResizablePlotDecorator],
  args: {
    flipped: false,
  },
  argTypes: {
    flipped: {
      control: 'boolean',
      description: 'Flip x/y axes.',
    },
  },
};

export default meta;
type Story = StoryObj<PointGraphArgs>;

const flipIfNeeded = (flipped: boolean) => (flipped ? [coord.flip()] : []);

// ─── Simple scatter plot ──────────────────────────────────────────────────
const simpleData: Data = {
  columns: [{ key: 'weight' }, { key: 'height' }],
  rows: [
    { weight: 60, height: 160 },
    { weight: 65, height: 165 },
    { weight: 70, height: 175 },
    { weight: 75, height: 170 },
    { weight: 80, height: 180 },
    { weight: 85, height: 178 },
    { weight: 90, height: 185 },
  ],
};

export const Simple: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={simpleData}
      spec={pipe(
        createSpec({ x: 'weight', y: 'height' }),
        geom.point(),
        scale.x(),
        scale.y(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'scatter',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Color-grouped scatter plot ───────────────────────────────────────────
const groupedData: Data = {
  columns: [{ key: 'weight' }, { key: 'height' }, { key: 'gender' }],
  rows: [
    { weight: 60, height: 160, gender: 'F' },
    { weight: 65, height: 165, gender: 'F' },
    { weight: 70, height: 175, gender: 'M' },
    { weight: 75, height: 170, gender: 'M' },
    { weight: 80, height: 180, gender: 'M' },
    { weight: 85, height: 178, gender: 'M' },
    { weight: 90, height: 185, gender: 'M' },
    { weight: 55, height: 158, gender: 'F' },
    { weight: 72, height: 172, gender: 'M' },
    { weight: 68, height: 168, gender: 'F' },
    { weight: 62, height: 162, gender: 'F' },
    { weight: 78, height: 176, gender: 'M' },
  ],
};

export const ColorGrouped: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={groupedData}
      spec={pipe(
        createSpec({ x: 'weight', y: 'height', color: 'gender' }),
        geom.point(),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        ...flipIfNeeded(args.flipped)
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Size-mapped scatter (bubble) ─────────────────────────────────────────
const bubbleData: Data = {
  columns: [{ key: 'gdp' }, { key: 'lifeExpectancy' }, { key: 'population' }],
  rows: [
    { gdp: 2000, lifeExpectancy: 55, population: 200 },
    { gdp: 5000, lifeExpectancy: 60, population: 50 },
    { gdp: 10000, lifeExpectancy: 65, population: 300 },
    { gdp: 15000, lifeExpectancy: 70, population: 100 },
    { gdp: 25000, lifeExpectancy: 75, population: 30 },
    { gdp: 40000, lifeExpectancy: 80, population: 60 },
    { gdp: 55000, lifeExpectancy: 82, population: 120 },
    { gdp: 8000, lifeExpectancy: 62, population: 180 },
  ],
};

export const Bubble: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={bubbleData}
      spec={pipe(
        createSpec({ x: 'gdp', y: 'lifeExpectancy', size: 'population' }),
        geom.point(),
        scale.x(),
        scale.y(),
        scale.size.continuous(),
        ...flipIfNeeded(args.flipped)
      )}
      config={{
        type: 'bubble',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Size + color scatter ─────────────────────────────────────────────────
const fullData: Data = {
  columns: [{ key: 'gdp' }, { key: 'lifeExpectancy' }, { key: 'population' }, { key: 'continent' }],
  rows: [
    { gdp: 2000, lifeExpectancy: 55, population: 200, continent: 'Africa' },
    { gdp: 5000, lifeExpectancy: 60, population: 50, continent: 'Asia' },
    { gdp: 10000, lifeExpectancy: 65, population: 300, continent: 'Asia' },
    { gdp: 15000, lifeExpectancy: 70, population: 100, continent: 'Europe' },
    { gdp: 25000, lifeExpectancy: 75, population: 30, continent: 'Europe' },
    { gdp: 40000, lifeExpectancy: 80, population: 60, continent: 'Europe' },
    { gdp: 55000, lifeExpectancy: 82, population: 120, continent: 'Europe' },
    { gdp: 8000, lifeExpectancy: 62, population: 180, continent: 'Americas' },
    { gdp: 3000, lifeExpectancy: 58, population: 90, continent: 'Africa' },
    { gdp: 45000, lifeExpectancy: 81, population: 40, continent: 'Americas' },
  ],
};

// GraphConfig's bubble mapping doesn't infer a color channel, so the
// color-coded variant is spec-only.
export const SizeAndColor: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={fullData}
      spec={pipe(
        createSpec({ x: 'gdp', y: 'lifeExpectancy', size: 'population', color: 'continent' }),
        geom.point(),
        scale.x(),
        scale.y(),
        scale.size.continuous(),
        scale.color.palette(),
        ...flipIfNeeded(args.flipped)
      )}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── With missing values ──────────────────────────────────────────────────

const missingXs = [1, 2, 3, 4, 5, 6, 7, 8];
const missingYs: Array<number | null> = [10, 20, null, 40, null, 60, 70, 80];

const missingData: Data = {
  columns: [{ key: 'x' }, { key: 'y' }],
  rows: missingXs.map((x, index) => ({ x, y: missingYs[index] ?? null })),
};

export const WithMissingValues: Story = {
  render: (args) => (
    <VizStoryGraphProvider
      data={missingData}
      spec={pipe(createSpec({ x: 'x', y: 'y' }), geom.point(), scale.x(), scale.y(), ...flipIfNeeded(args.flipped))}
      config={{
        type: 'scatter',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
