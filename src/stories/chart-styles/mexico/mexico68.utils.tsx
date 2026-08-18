import type { Decorator } from '@storybook/react';

import type { RichTextContent } from '@graphysdk/viz-engine';

import { MEXICO_COLORS, MEXICO_FONT_FAMILY } from './mexico68.theme';

// Headline: Righteous, uppercase, key phrase in the lead magenta.
export const createMexicoTitle = (segments: Array<{ text: string; color?: string }>): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: segments.map(({ text, color }) => ({
        type: 'text',
        text: text.toUpperCase(),
        marks: [
          {
            type: 'textStyle',
            attrs: { color: color ?? MEXICO_COLORS.ink, fontFamily: MEXICO_FONT_FAMILY.headings, fontSize: '22px' },
          },
        ],
      })),
    },
  ],
});

// Righteous carries the headlines and Rubik the engine text; both load via this
// stylesheet link, which React hoists into <head> so the fonts scope to these stories.
export const MexicoFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Righteous&family=Rubik:wght@400;500;600;700&display=swap"
    />
    <Story />
  </>
);
