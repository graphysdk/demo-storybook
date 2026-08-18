import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from 'storybook/actions';

import { TextField } from '@graphysdk/react-renderer/editable';

import { ControlStoryLayout } from '../../components/ControlStoryLayout';

interface TextFieldArgs {
  placeholder: string;
  hasError: boolean;
  isDisabled: boolean;
}

const TextFieldDemo = ({ placeholder, hasError, isDisabled }: TextFieldArgs) => {
  const [value, setValue] = useState('');

  const streamValue = (next: string) => {
    setValue(next);
    action('onChange')(next);
  };

  return (
    <ControlStoryLayout>
      <TextField
        value={value}
        onChange={streamValue}
        onCommit={() => action('onCommit')(value)}
        placeholder={placeholder}
        hasError={hasError}
        isDisabled={isDisabled}
        ariaLabel="Source"
      />
    </ControlStoryLayout>
  );
};

const meta: Meta = {
  title: 'Editor/Controls/text-field',
  parameters: {
    docs: {
      description: {
        component:
          'A line of text — the source label under a chart, a caption, an axis title.\n\n' +
          'Continuous like the slider, but the gesture is a burst of typing rather than a drag: ' +
          '`onChange` fires per keystroke and a section dispatches it transiently, `onCommit` fires ' +
          'on blur and seals. Type a few characters and click away — the Actions panel shows one ' +
          'entry per key and a single commit, which is one undo entry rather than one per letter.\n\n' +
          'Inside a bound panel it does one thing this story cannot show: it intercepts ⌘/Ctrl+Z so ' +
          'the chord steps the chart’s history instead of the browser’s. Native undo would restore ' +
          'the text without dispatching anything, leaving the field showing one value and the spec ' +
          'holding another. With no chart behind it here, the chord is left to the browser, which ' +
          'is the correct behaviour outside a panel.\n\n' +
          '`hasError` is announced as well as painted: a border colour alone tells only the readers ' +
          'who can see it, so the input also carries `aria-invalid`.',
      },
    },
  },
};

export default meta;

export const Typing: StoryObj<TextFieldArgs> = {
  name: 'Typing a value',
  args: { placeholder: 'Office for National Statistics', hasError: false, isDisabled: false },
  argTypes: {
    placeholder: { control: 'text', description: 'Shown while the field is empty.' },
    hasError: { control: 'boolean', description: 'Paints the alert border and sets `aria-invalid`.' },
    isDisabled: { control: 'boolean' },
  },
  render: (args) => <TextFieldDemo {...args} />,
};
