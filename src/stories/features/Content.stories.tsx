import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Content',
  decorators: [ResizablePlotDecorator],
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

const baseSpec = pipe(
  createSpec(mapping({ x: 'quarter', y: 'sales', color: 'region' })),
  geom.bar({ position: 'stack' }),
  scale.x(),
  scale.y(),
  scale.color.palette()
);

type Mode = 'readonly' | 'editable';

interface ContentArgs {
  showTitle: boolean;
  showSubtitle: boolean;
  showCaption: boolean;
  showSource: boolean;
  showBrandMark: boolean;
  brandMarkPlacement: 'footer' | 'header';
  brandMarkVariant: 'full' | 'mini';
  mode: Mode;
  textScale: number;
}

const DEFAULT_TITLE = 'Quarterly sales by region';
const DEFAULT_SUBTITLE = 'Stacked totals across North, South and West.';
const DEFAULT_CAPTION = 'Click any text in editable mode to format it.';
const DEFAULT_SOURCE = { label: 'Internal pipeline', url: 'https://example.com' };

export const Demo: StoryObj<ContentArgs> = {
  argTypes: {
    showTitle: {
      control: { type: 'boolean' },
      description: 'Toggle the title via `config.content.isTitleVisible`.',
    },
    showSubtitle: {
      control: { type: 'boolean' },
      description: 'Toggle the subtitle via `config.content.isSubtitleVisible`.',
    },
    showCaption: {
      control: { type: 'boolean' },
      description: 'Toggle the caption via `config.content.isCaptionVisible`.',
    },
    showSource: {
      control: { type: 'boolean' },
      description: 'Toggle the data source attribution via `config.content.isSourceVisible`.',
    },
    showBrandMark: {
      control: { type: 'boolean' },
      description:
        'Toggle the Made with Graphy badge via `config.content.brandMark.enabled`. Off by default — enable it and resize the plot to watch the ladder step down full → mini circle → hidden.',
    },
    brandMarkPlacement: {
      control: { type: 'inline-radio' },
      options: ['footer', 'header'],
      description: 'Badge anchor: footer-right (default) or header top-right.',
    },
    brandMarkVariant: {
      control: { type: 'inline-radio' },
      options: ['full', 'mini'],
      description: 'Full pill, or circular mini (hover expands in the live DOM).',
    },
    mode: {
      control: { type: 'inline-radio' },
      options: ['readonly', 'editable'] satisfies Mode[],
      description:
        'In `editable` mode the renderer mounts a TipTap editor for each text slot. Click any visible title/subtitle/caption to open the floating toolbar.',
    },
    textScale: {
      control: { type: 'range', min: 0.5, max: 3, step: 0.1 },
      description: 'Multiplier on every text element via `config.appearance.textScale`.',
    },
  },
  args: {
    showTitle: true,
    showSubtitle: true,
    showCaption: true,
    showSource: true,
    showBrandMark: true,
    brandMarkPlacement: 'footer',
    brandMarkVariant: 'full',
    mode: 'editable',
    textScale: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Exercises `config.content` (title, subtitle, caption, source) and the matching `isXVisible` flags. Switch to `editable` mode and click any text element to see the floating toolbar.',
      },
    },
  },
  render: (args) => {
    const {
      showTitle,
      showSubtitle,
      showCaption,
      showSource,
      showBrandMark,
      brandMarkPlacement,
      brandMarkVariant,
      textScale,
      mode,
    } = args;
    const input = useMemo(() => {
      return {
        spec: pipe(
          baseSpec,
          config({
            content: {
              title: DEFAULT_TITLE,
              isTitleVisible: showTitle,
              subtitle: DEFAULT_SUBTITLE,
              isSubtitleVisible: showSubtitle,
              caption: DEFAULT_CAPTION,
              isCaptionVisible: showCaption,
              source: DEFAULT_SOURCE,
              isSourceVisible: showSource,
              brandMark: {
                enabled: showBrandMark,
                placement: brandMarkPlacement,
                variant: brandMarkVariant,
              },
              isBrandMarkVisible: showBrandMark,
            },
            appearance: { textScale },
          })
        ),
        config: {
          type: 'columnStacked' as const,
          content: {
            title: DEFAULT_TITLE,
            isTitleHidden: !showTitle,
            subtitle: DEFAULT_SUBTITLE,
            isSubtitleHidden: !showSubtitle,
            caption: DEFAULT_CAPTION,
            isCaptionHidden: !showCaption,
            source: DEFAULT_SOURCE,
            isSourceHidden: !showSource,
            brandMark: {
              enabled: showBrandMark,
              placement: brandMarkPlacement,
              variant: brandMarkVariant,
            },
          },
          appearance: { textScale },
        },
      };
    }, [
      showTitle,
      showSubtitle,
      showCaption,
      showSource,
      showBrandMark,
      brandMarkPlacement,
      brandMarkVariant,
      textScale,
    ]);

    return (
      <VizStoryGraphProvider data={salesData} spec={input.spec} config={input.config}>
        <GraphRenderer mode={mode} />
      </VizStoryGraphProvider>
    );
  },
};
