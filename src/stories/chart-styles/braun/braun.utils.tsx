import type { Decorator } from '@storybook/react';

import type { RichTextContent } from '@graphysdk/viz-engine';

import { BRAUN_COLORS, BRAUN_FONT_FAMILY } from './braun.theme';

// Chart title: Archivo 500 16px in ink. Rams-plain — it names the reading, no
// accent phrase, since orange belongs to the data.
export const createBraunTitle = (text: string): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [
        {
          type: 'text',
          text,
          marks: [
            {
              type: 'textStyle',
              attrs: { color: BRAUN_COLORS.ink, fontFamily: BRAUN_FONT_FAMILY.body, fontSize: '16px' },
            },
          ],
        },
      ],
    },
  ],
});

// Archivo everywhere. Space Grotesk-style engine text loads globally; this
// stylesheet link scopes Archivo to these stories.
export const BraunFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap"
    />
    <Story />
  </>
);
