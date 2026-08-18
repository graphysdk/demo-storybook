import type { Decorator } from '@storybook/react';

import { type GraphSlots, type SwatchSlotProps } from '@graphysdk/react-renderer';
import type { RichTextContent } from '@graphysdk/viz-engine';

import { NB_COLORS, NB_FONT_FAMILY } from './neo-brutalist.theme';

export const createNeoBrutalistTitle = (segments: Array<{ text: string; color?: string }>): RichTextContent => ({
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
            attrs: { color: color ?? NB_COLORS.body, fontFamily: NB_FONT_FAMILY.heading, fontSize: '24px' },
          },
        ],
      })),
    },
  ],
});

// Sub line rendered by the engine at spec-line size.
export const createNeoBrutalistSubtitle = (segments: Array<{ text: string; color?: string }>): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: segments.map(({ text, color }) => ({
        type: 'text',
        text: text.toUpperCase(),
        marks: [
          {
            type: 'textStyle',
            attrs: { color: color ?? NB_COLORS.secondary, fontFamily: NB_FONT_FAMILY.heading, fontSize: '10px' },
          },
        ],
      })),
    },
  ],
});

// Space Grotesk carries headings and engine text; Inter (the shared base) loads
// globally. React hoists this stylesheet link into <head> so the font is scoped to
// these stories.
export const NeoBrutalistFontsDecorator: Decorator = (Story) => (
  <>
    <link
      rel="stylesheet"
      precedence="default"
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap"
    />
    <Story />
  </>
);

// Sharp-cornered rectangles mirroring the bars: acid-filled for the actuals, and a
// hollow acid outline for the forecast — whose series color is 'transparent', so
// the default swatch would paint nothing.
const NeoBrutalistSwatch = (props: SwatchSlotProps) => {
  const width = props.width ?? 12;
  const height = props.height ?? 12;
  const isHollow = props.label === 'forecast';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        fill={isHollow ? 'none' : props.color}
        stroke={isHollow ? NB_COLORS.acid : 'none'}
        strokeWidth={1.5}
      />
    </svg>
  );
};

export const nbSwatchSlots: GraphSlots = { Swatch: NeoBrutalistSwatch };
