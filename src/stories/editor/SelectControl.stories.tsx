import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from 'storybook/actions';

import type { ControlOption } from '@graphysdk/react-renderer/editable';
import { Select } from '@graphysdk/react-renderer/editable';

import { ControlStoryLayout } from '../../components/ControlStoryLayout';

const MISSING_VALUE_OPTIONS: ControlOption[] = [
  { value: 'gap', label: 'Leave a gap', description: 'The line breaks where data is missing.' },
  { value: 'connect', label: 'Connect', description: 'The line spans the gap as if nothing were missing.' },
  { value: 'zero', label: 'Treat as zero', description: 'Missing points drop to the baseline.' },
];

const PLAIN_OPTIONS: ControlOption[] = MISSING_VALUE_OPTIONS.map(({ value, label }) => ({ value, label }));

interface SelectArgs {
  hasDescriptions: boolean;
  hasSelection: boolean;
  placeholder: string;
  hasError: boolean;
  isDisabled: boolean;
}

const SelectDemo = ({ hasDescriptions, hasSelection, placeholder, hasError, isDisabled }: SelectArgs) => {
  const [value, setValue] = useState<string | null>(hasSelection ? 'gap' : null);
  const options = hasDescriptions ? MISSING_VALUE_OPTIONS : PLAIN_OPTIONS;

  const onChange = (next: string | null) => {
    setValue(next);
    action('onChange')(next);
  };

  return (
    <ControlStoryLayout>
      <Select
        // Remounts when the starting selection changes, so the arg is not fighting local state.
        key={String(hasSelection)}
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        hasError={hasError}
        isDisabled={isDisabled}
        ariaLabel="Missing values"
      />
    </ControlStoryLayout>
  );
};

const meta: Meta = {
  title: 'Editor/Controls/select',
  parameters: {
    docs: {
      description: {
        component:
          'A single choice from a set too long or too wordy for a segmented row — how a line treats ' +
          'missing values, which series an average is drawn from.\n\n' +
          'Discrete, like `toggle-group` and `radio-grid`: each pick is its own undo entry, with no ' +
          'gesture to seal. What it adds over those two is room — an option can carry a second line ' +
          'explaining itself, which neither of the others has space for.\n\n' +
          'Its value is nullable so a section can show "nothing chosen yet", but `onChange` only ' +
          'ever fires with a real option: clearing a required setting is not a gesture the panel ' +
          'offers. A value the options no longer contain still renders as itself rather than ' +
          'reading as empty, so a spec holding something outdated shows what it holds.\n\n' +
          '**Known gap:** the popup portals to the page and re-applies the theme from the chart’s ' +
          '`ThemeProvider`. With no chart behind it here there is none, so the popup falls back to ' +
          'the page cascade — the panel does not yet scope a theme of its own.',
      },
    },
  },
};

export default meta;

export const Dropdown: StoryObj<SelectArgs> = {
  name: 'Choosing from a list',
  args: {
    hasDescriptions: true,
    hasSelection: true,
    placeholder: 'Choose one',
    hasError: false,
    isDisabled: false,
  },
  argTypes: {
    hasDescriptions: {
      control: 'boolean',
      description: 'Gives each option a second line. The reason to reach for this control over a segmented row.',
    },
    hasSelection: { control: 'boolean', description: 'Off starts empty, so the placeholder shows.' },
    placeholder: { control: 'text', description: 'Shown only while nothing is selected.' },
    hasError: { control: 'boolean', description: 'Paints the alert border on the trigger.' },
    isDisabled: { control: 'boolean' },
  },
  render: (args) => <SelectDemo {...args} />,
};
