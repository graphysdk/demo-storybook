import type { Decorator } from '@storybook/react';

import type { RichTextContent } from '@graphysdk/viz-engine';

/** Headline as a rich-text doc: sentence case with the key phrase carried in brand orange. */
export const createLennyTitle = (segments: Array<{ text: string; color?: string }>): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: segments.map(({ text, color }) => ({
        type: 'text',
        text,
        marks: color ? [{ type: 'textStyle', attrs: { color } }] : undefined,
      })),
    },
  ],
});

// Plus Jakarta Sans loads via this stylesheet link, which React hoists into <head>.
export const NewsletterFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800&display=swap"
    />
    <Story />
  </>
);
