import type { Decorator } from '@storybook/react';

export const ResizablePlotDecorator: Decorator = (Story) => {
  return (
    <div
      style={{
        width: 800,
        height: 450,
        resize: 'both',
        overflow: 'hidden',
        border: '1px dashed #eee',
        borderRadius: 6,
        padding: 10,
      }}
    >
      <Story />
    </div>
  );
};
