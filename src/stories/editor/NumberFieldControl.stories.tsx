import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from 'storybook/actions';

import { NumberField } from '@graphysdk/react-renderer/editable';

import { ControlStoryLayout } from '../../components/ControlStoryLayout';

interface NumberFieldArgs {
  prefix: string;
  suffix: string;
  min: number;
  max: number;
  step: number;
  hasError: boolean;
  isDisabled: boolean;
}

const NumberFieldDemo = ({ prefix, suffix, min, max, step, hasError, isDisabled }: NumberFieldArgs) => {
  const [value, setValue] = useState<number | null>(2);

  const streamValue = (next: number | null) => {
    setValue(next);
    action('onChange')(next);
  };

  return (
    <ControlStoryLayout>
      <NumberField
        value={value}
        onChange={streamValue}
        onCommit={() => action('onCommit')(value)}
        prefix={prefix === '' ? undefined : prefix}
        suffix={suffix === '' ? undefined : suffix}
        min={min}
        max={max}
        step={step}
        hasError={hasError}
        isDisabled={isDisabled}
        ariaLabel="Decimal places"
      />
    </ControlStoryLayout>
  );
};

const meta: Meta = {
  title: 'Editor/Controls/number-field',
  parameters: {
    docs: {
      description: {
        component:
          'A number, for the settings a slider would be too coarse for: decimal places, an axis ' +
          'minimum, an explicit maximum.\n\n' +
          'Three gestures reach the same value — typing it, dragging the label to scrub it, and the ' +
          'stepper keys. All three stream through `onChange`, and Base UI fires `onValueCommitted` ' +
          'at the end of each, which is exactly the grain `onCommit` seals at. Scrub the field and ' +
          'watch the Actions panel: many changes, one commit.\n\n' +
          'Its value is `number | null`, and the `null` is deliberate. An empty field is a state of ' +
          'its own, not zero — a section that collapsed the two would write `0` into the spec the ' +
          'moment someone cleared the box to retype it.\n\n' +
          'Which side a symbol belongs on is the symbol’s business, not the field’s. A currency or a ' +
          'comparison leads the number — `$ 20`, `≥ 5` — and a unit trails it — `20px`, `5%`. Both are ' +
          'display only: they render inside the box but never reach the value, and neither is selectable, ' +
          'so dragging across the field to retype it picks up the digits and nothing else.',
      },
    },
  },
};

export default meta;

export const Number: StoryObj<NumberFieldArgs> = {
  name: 'Typing a number',
  args: { prefix: '', suffix: 'px', min: 0, max: 10, step: 1, hasError: false, isDisabled: false },
  argTypes: {
    prefix: {
      control: 'text',
      description: 'Shown before the number: a currency or comparison symbol, `$` or `≥`. Empty renders none.',
    },
    suffix: {
      control: 'text',
      description: 'Shown after the number: a unit that reads as one, `px`, `%` or `°`. Empty renders none.',
    },
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    step: { control: { type: 'number' }, description: 'How far one stepper press or arrow key moves.' },
    hasError: { control: 'boolean', description: 'Paints the alert border and sets `aria-invalid`.' },
    isDisabled: { control: 'boolean' },
  },
  render: (args) => <NumberFieldDemo {...args} />,
};
