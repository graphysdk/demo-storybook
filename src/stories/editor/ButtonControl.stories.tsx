import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { Button } from '@graphysdk/react-renderer/editable';

import { ControlStoryLayout } from '../../components/ControlStoryLayout';

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true" fill="currentColor">
    <rect x={7} y={3} width={2} height={10} rx={1} />
    <rect x={3} y={7} width={10} height={2} rx={1} />
  </svg>
);

interface ButtonArgs {
  content: 'label and icon' | 'label only' | 'icon only';
  variant: 'default' | 'tile';
  isDisabled: boolean;
}

const ButtonDemo = ({ content, variant, isDisabled }: ButtonArgs) => {
  const shared = { onClick: () => action('onClick')(), variant, isDisabled };

  // Icon-only is its own shape in the contract: with no label the icon carries the accessible name,
  // so `ariaLabel` is required rather than optional there.
  if (content === 'icon only') {
    return (
      <ControlStoryLayout>
        <Button icon={<PlusIcon />} ariaLabel="Add reference line" {...shared} />
      </ControlStoryLayout>
    );
  }

  return (
    <ControlStoryLayout>
      <Button label="Add reference line" icon={content === 'label and icon' ? <PlusIcon /> : undefined} {...shared} />
    </ControlStoryLayout>
  );
};

const meta: Meta = {
  title: 'Editor/Controls/button',
  parameters: {
    docs: {
      description: {
        component:
          'An action rather than a value. Every other control in the registry shows what the chart ' +
          'currently holds; this one has nothing to read back, because pressing it *is* the whole ' +
          'gesture — add an annotation, remove a highlight, reset a range.\n\n' +
          'That also makes it the one control with no undo subtlety: each press is its own entry, ' +
          'with no run left open.\n\n' +
          'Nothing on screen changes when it fires, so the Actions panel is the proof.\n\n' +
          'Its content is a choice of three, not two independent flags: a button with neither a ' +
          'label nor an icon would be invisible and unnameable, and two optional props make that ' +
          'state reachable by accident. The type splits the cases so it is not, and requires ' +
          '`ariaLabel` on the icon-only one, where the icon is the only name there is.\n\n' +
          'Two variants rather than a grid of modes, because those are the two shapes legacy has: a ' +
          'plain row, and the tall tile it builds as a separate `BigButton`.',
      },
    },
  },
};

export default meta;

export const Action: StoryObj<ButtonArgs> = {
  name: 'Performing an action',
  args: { content: 'label and icon', variant: 'default', isDisabled: false },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'tile'],
      description:
        'The two shapes legacy actually builds: a row with the icon before the label, and the tall ' +
        'tile with the icon above it, for a grid of add-affordances.',
    },
    content: {
      control: 'inline-radio',
      options: ['label and icon', 'label only', 'icon only'],
      description:
        'One choice rather than two flags. A button with neither is invisible and unnameable, so the ' +
        'contract splits the cases instead of leaving both optional — and icon-only requires `ariaLabel`.',
    },
    isDisabled: { control: 'boolean' },
  },
  render: (args) => <ButtonDemo {...args} />,
};
