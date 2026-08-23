import type { Decorator } from '@storybook/react';
import type { CSSProperties } from 'react';

const RESIZABLE_STYLE: CSSProperties = {
  width: 800,
  height: 450,
  resize: 'both',
  overflow: 'hidden',
  border: '1px dashed #eee',
  borderRadius: 6,
  padding: 10,
};

// Loaded through `iframe.html?...&embed=1` (see the docs GraphEmbed snippet): fill
// the host iframe responsively instead of the fixed resizable canvas used for
// in-Storybook testing.
const EMBED_STYLE: CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  padding: 8,
};

const isEmbedded = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === '1';

export const ResizablePlotDecorator: Decorator = (Story) => {
  return (
    <div style={isEmbedded() ? EMBED_STYLE : RESIZABLE_STYLE}>
      <Story />
    </div>
  );
};
