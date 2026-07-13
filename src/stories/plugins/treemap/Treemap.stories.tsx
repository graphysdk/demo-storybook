import type { Meta, StoryObj } from '@storybook/react';

import { config } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';

import { kit, TreemapGraph } from './TreemapGraph';

const meta: Meta = {
  title: 'Plugins/Treemap',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj;

// The author maps the hierarchy the layout reads, and `color` to the real `group` column, so the engine's
// categorical scale gives each group (and its leaves) one hue — the leaves lighten by value render-side. The
// colour legend is suppressed: each group cell carries its name in a header band, so a key would be redundant.
const spec = kit.pipe(
  kit.createSpec({}),
  kit.geom.treemap({ aes: { group: 'group', label: 'label', value: 'value', color: 'group' } }),
  config({ legend: { position: 'none' } })
);

export const MarketCap: Story = {
  render: () => (
    <TreemapGraph
      input={spec}
      data={{
        columns: [{ key: 'group' }, { key: 'label' }, { key: 'value' }],
        rows: [
          { group: 'Technology', label: 'Apple', value: 3300 },
          { group: 'Technology', label: 'Microsoft', value: 3100 },
          { group: 'Technology', label: 'Nvidia', value: 2900 },
          { group: 'Technology', label: 'Alphabet', value: 2100 },
          { group: 'Technology', label: 'Meta', value: 1300 },
          { group: 'Technology', label: 'Broadcom', value: 800 },
          { group: 'Consumer', label: 'Amazon', value: 2000 },
          { group: 'Consumer', label: 'Tesla', value: 800 },
          { group: 'Consumer', label: 'Walmart', value: 620 },
          { group: 'Consumer', label: 'Home Depot', value: 380 },
          { group: 'Financials', label: 'Berkshire', value: 900 },
          { group: 'Financials', label: 'JPMorgan', value: 650 },
          { group: 'Financials', label: 'Visa', value: 560 },
          { group: 'Financials', label: 'Mastercard', value: 430 },
          { group: 'Financials', label: 'Bank of America', value: 320 },
          { group: 'Healthcare', label: 'Eli Lilly', value: 820 },
          { group: 'Healthcare', label: 'UnitedHealth', value: 520 },
          { group: 'Healthcare', label: 'J&J', value: 380 },
          { group: 'Healthcare', label: 'Merck', value: 320 },
          { group: 'Energy', label: 'Saudi Aramco', value: 1800 },
          { group: 'Energy', label: 'Exxon', value: 520 },
          { group: 'Energy', label: 'Chevron', value: 290 },
        ],
      }}
    />
  ),
};

export const WorldPopulation: Story = {
  render: () => (
    <TreemapGraph
      input={spec}
      data={{
        columns: [{ key: 'group' }, { key: 'label' }, { key: 'value' }],
        rows: [
          { group: 'Asia', label: 'India', value: 1430 },
          { group: 'Asia', label: 'China', value: 1410 },
          { group: 'Asia', label: 'Indonesia', value: 277 },
          { group: 'Asia', label: 'Pakistan', value: 240 },
          { group: 'Asia', label: 'Bangladesh', value: 173 },
          { group: 'Asia', label: 'Japan', value: 124 },
          { group: 'Africa', label: 'Nigeria', value: 223 },
          { group: 'Africa', label: 'Ethiopia', value: 126 },
          { group: 'Africa', label: 'Egypt', value: 112 },
          { group: 'Africa', label: 'DR Congo', value: 102 },
          { group: 'Africa', label: 'Tanzania', value: 67 },
          { group: 'Americas', label: 'United States', value: 335 },
          { group: 'Americas', label: 'Brazil', value: 216 },
          { group: 'Americas', label: 'Mexico', value: 129 },
          { group: 'Americas', label: 'Colombia', value: 52 },
          { group: 'Americas', label: 'Argentina', value: 46 },
          { group: 'Europe', label: 'Russia', value: 144 },
          { group: 'Europe', label: 'Germany', value: 84 },
          { group: 'Europe', label: 'France', value: 68 },
          { group: 'Europe', label: 'United Kingdom', value: 67 },
          { group: 'Europe', label: 'Italy', value: 59 },
          { group: 'Oceania', label: 'Australia', value: 26 },
          { group: 'Oceania', label: 'Papua New Guinea', value: 10 },
        ],
      }}
    />
  ),
};
