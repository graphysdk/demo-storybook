import type { Decorator } from '@storybook/react';

import type { RichTextContent } from '@graphysdk/viz-engine';

import { INTL_COLORS, INTL_FONT_FAMILY } from './international.theme';

// Headline: Golos Text 700, sentence case with a full stop, key phrase in red.
export const createInternationalTitle = (
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
            attrs: { color: color ?? INTL_COLORS.heading, fontFamily: INTL_FONT_FAMILY.heading, fontSize: '20px' },
          },
        ],
      })),
    },
  ],
});

// Golos Text carries the headlines; Inter (the shared base) loads globally. React
// hoists this stylesheet link into <head> so the font is scoped to these stories.
export const InternationalFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400..900&display=swap"
    />
    <Story />
  </>
);
