import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from 'storybook/actions';

import { Switch } from '@graphysdk/react-renderer/editable';

import { ControlStoryLayout } from '../../components/ControlStoryLayout';

interface SwitchArgs {
  isDisabled: boolean;
}

const SwitchDemo = ({ isDisabled }: SwitchArgs) => {
  const [isChecked, setIsChecked] = useState(true);

  const onChange = (next: boolean) => {
    setIsChecked(next);
    action('onChange')(next);
  };

  return (
    <ControlStoryLayout>
      <Switch isChecked={isChecked} onChange={onChange} isDisabled={isDisabled} ariaLabel="Show data labels" />
    </ControlStoryLayout>
  );
};

const meta: Meta = {
  title: 'Editor/Controls/switch',
  parameters: {
    docs: {
      description: {
        component:
          'An on/off toggle, for a setting whose whole value is whether it is on: data labels, grid ' +
          'lines, a visible title.\n\n' +
          'It is the only control whose value prop is not called `value` — `isChecked` says what the ' +
          'state is rather than what it holds. Every flip is its own undo entry, so there is no ' +
          'gesture to seal here.\n\n' +
          'Rendered bare, it carries no label: inside a section the row supplies one and names the ' +
          'switch through `ariaLabelledBy`. This story passes `ariaLabel` instead, which is the ' +
          'other half of that contract and the only correct way to use it without a row.',
      },
    },
  },
};

export default meta;

export const OnOff: StoryObj<SwitchArgs> = {
  name: 'Turning a setting on and off',
  args: { isDisabled: false },
  argTypes: {
    isDisabled: { control: 'boolean', description: 'Greys it out and refuses the click, keeping the state it shows.' },
  },
  render: (args) => <SwitchDemo {...args} />,
};
