import type { Decorator } from '@storybook/react';

import type { RichTextContent } from '@graphysdk/viz-engine';

import { FT_COLORS, FT_FONT_FAMILY } from './financial-times.theme';

export const createFinancialTimesTitle = (
  segments: Array<{
    text: string;
    color?: string;
  }>
): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: segments.map(({ text, color }) => ({
        type: 'text',
        text,
        marks: [
          {
            type: 'textStyle',
            attrs: { color: color ?? FT_COLORS.black, fontFamily: FT_FONT_FAMILY.body, fontSize: '18px' },
          },
        ],
      })),
    },
  ],
});

// Figtree stands in for FT Metric (chart text); Source Serif 4 for Financier Display
// (the masthead). React hoists this stylesheet link into <head> so the fonts scope to
// these stories.
export const FinancialTimesFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap"
    />
    <Story />
  </>
);
