import type { Meta, StoryObj } from '@storybook/react';

import { EditableGraphRenderer } from '@graphysdk/react-renderer/editable';
import type { Data } from '@graphysdk/viz-engine';
import { annotation, config, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Editor/Difference arrow selection',
  decorators: [ResizablePlotDecorator],
  parameters: {
    docs: {
      description: {
        component:
          'Selecting a difference arrow on the canvas. Clicking the arrow — its line, its arrowhead or its ' +
          'label — selects it, and the overlay paints a handle on each endpoint plus an outline around the ' +
          'label. `Escape` clears the selection, `Delete` removes the arrow, and clicking empty canvas clears.',
      },
    },
  },
};

export default meta;

const revenueData: Data = {
  columns: [
    { key: 'product', label: 'Product' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'region', label: 'Region' },
  ],
  rows: [
    { product: 'Alpha', revenue: 1200, region: 'EU' },
    { product: 'Bravo', revenue: 1850, region: 'EU' },
    { product: 'Charlie', revenue: 1450, region: 'EU' },
    { product: 'Delta', revenue: 2400, region: 'EU' },
    { product: 'Alpha', revenue: 900, region: 'US' },
    { product: 'Bravo', revenue: 1500, region: 'US' },
    { product: 'Charlie', revenue: 1750, region: 'US' },
    { product: 'Delta', revenue: 1350, region: 'US' },
  ],
};

const euArrow = annotation.differenceArrow({
  id: 'arrow-eu',
  start: { anchorValue: 'Alpha', groupValue: 'EU' },
  end: { anchorValue: 'Delta', groupValue: 'EU' },
  label: 'relative-difference',
  size: 'medium',
});

const usArrow = annotation.differenceArrow({
  id: 'arrow-us',
  start: { anchorValue: 'Bravo', groupValue: 'US' },
  end: { anchorValue: 'Charlie', groupValue: 'US' },
  label: 'absolute-difference',
  size: 'medium',
});

const dodgedBars = [
  createSpec(mapping({ x: 'product', y: 'revenue', color: 'region' })),
  geom.bar({ position: 'dodge' }),
  scale.x(),
  scale.y(),
  scale.color.palette(),
  config({}),
] as const;

export const SingleArrow: StoryObj = {
  name: 'One arrow',
  parameters: {
    docs: {
      description: {
        story:
          'Click the arrow to select it. The handles sit on the two observations the arrow measures between, ' +
          'which is what a later endpoint re-target has to grab.',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider data={revenueData} spec={pipe(...dodgedBars, euArrow)}>
      <EditableGraphRenderer mode="editable" />
    </VizStoryGraphProvider>
  ),
};

export const TwoArrows: StoryObj = {
  name: 'Two arrows',
  parameters: {
    docs: {
      description: {
        story:
          'Clicking one arrow moves the selection off the other, and where the two overlap the topmost ' + 'one wins.',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider data={revenueData} spec={pipe(...dodgedBars, euArrow, usArrow)}>
      <EditableGraphRenderer mode="editable" />
    </VizStoryGraphProvider>
  ),
};

export const ReadOnly: StoryObj = {
  name: 'Read-only — not selectable',
  parameters: {
    docs: {
      description: {
        story: 'The same arrows in the default mode. Nothing mounts the overlay, so a click resolves nothing.',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider data={revenueData} spec={pipe(...dodgedBars, euArrow, usArrow)}>
      <EditableGraphRenderer />
    </VizStoryGraphProvider>
  ),
};
