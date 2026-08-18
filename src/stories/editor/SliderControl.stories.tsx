import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { action } from 'storybook/actions';

import { Slider } from '@graphysdk/react-renderer/editable';

import { ControlStoryLayout } from '../../components/ControlStoryLayout';

interface SliderArgs {
  defaultValue: number;
  suffix: string;
  min: number;
  max: number;
  step: number;
  isDisabled: boolean;
}

/**
 * The frame count is the point: a drag is many `onChange` calls and exactly one `onCommit`, and
 * nothing on screen would show that. A section dispatches the first transiently and seals on the
 * second, which is how a whole drag becomes one undo entry.
 */
const SliderDemo = ({ defaultValue, suffix, min, max, step, isDisabled }: SliderArgs) => {
  const [value, setValue] = useState(defaultValue);
  // What the drag actually reached. Reading state in the commit handler would report the value the
  // last render closed over, which React can still be a frame behind when the pointer comes up.
  const streamed = useRef(value);

  const onChange = (next: number) => {
    streamed.current = next;
    setValue(next);
    action('onChange')(next);
  };
  const onCommit = () => {
    action('onCommit')(streamed.current);
  };

  return (
    <ControlStoryLayout>
      <Slider
        value={value}
        onChange={onChange}
        onCommit={onCommit}
        min={min}
        max={max}
        step={step}
        suffix={suffix === '' ? undefined : suffix}
        isDisabled={isDisabled}
        ariaLabel="Line width"
      />
    </ControlStoryLayout>
  );
};

const meta: Meta = {
  title: 'Editor/Controls/slider',
  parameters: {
    docs: {
      description: {
        component:
          'A value dragged along a track — line width, point size, anything numeric with a range ' +
          'worth feeling rather than typing.\n\n' +
          'This is the first control of the continuous kind, and the pair of callbacks is the whole ' +
          'reason it exists: `onChange` fires throughout the drag and a section dispatches it ' +
          'transiently, `onCommit` fires once on release and seals the run. Get the second one wrong ' +
          'and a single drag leaves fifty undo entries behind it.\n\n' +
          'Drag the thumb and watch the Actions panel: many `onChange` entries and exactly one ' +
          '`onCommit`, at the end. Base UI streams a drag through its own value setter and fires the ' +
          'commit only on pointer-up, so the two never interleave.\n\n' +
          'Arrow keys behave the same way, and getting there took work: Base UI commits on every ' +
          'keyboard change, so holding a key would turn one press into an undo entry per auto-repeat. ' +
          'Those commits are swallowed and the run seals on key up instead — the keyboard’s ' +
          'equivalent of releasing the thumb. Hold an arrow down: the value climbs, and one commit ' +
          'lands when you let go. Blur seals too, for focus leaving mid-hold.',
      },
    },
  },
};

export default meta;

export const Dragging: StoryObj<SliderArgs> = {
  name: 'Dragging a value',
  args: { defaultValue: 4, suffix: 'px', min: 1, max: 12, step: 1, isDisabled: false },
  argTypes: {
    defaultValue: {
      control: { type: 'number' },
      description:
        'Where the slider starts. The story holds the value from here on, as a section holds it in the chart.',
    },
    min: { control: { type: 'number' }, description: 'Low end of the range.' },
    max: { control: { type: 'number' }, description: 'High end of the range.' },
    step: { control: { type: 'number' }, description: 'Granularity. A smaller step means more frames per drag.' },
    suffix: {
      control: 'text',
      description:
        'Unit for the readout beside the track. Empty hides the readout entirely, which is a legitimate ' +
        'slider. A value a unit cannot describe goes through `formatValue` instead.',
    },
    isDisabled: { control: 'boolean', description: 'Greys out the track and refuses both pointer and keys.' },
  },
  render: (args) => <SliderDemo key={args.defaultValue} {...args} />,
};
