import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useRef, useState } from 'react';
import { action } from 'storybook/actions';

import type { ControlOption } from '@graphysdk/react-renderer/editable';
import { ToggleGroup } from '@graphysdk/react-renderer/editable';

import { ControlStoryLayout } from '../../components/ControlStoryLayout';

type Placement = 'top' | 'right' | 'none';
type Presentation = 'labels' | 'icons' | 'long labels';

const PLACEMENTS: readonly Placement[] = ['top', 'right', 'none'];

const SHORT_LABELS: Record<Placement, string> = { top: 'Top', right: 'Right', none: 'None' };

/** Long enough to overflow the cell, which is how the label's ellipsis clamp becomes visible. */
const LONG_LABELS: Record<Placement, string> = {
  top: 'Above the plot',
  right: 'Down the right side',
  none: 'Hidden entirely',
};

const PLACEMENT_ICONS: Partial<Record<Placement, ReactNode>> = {
  top: (
    <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true" fill="currentColor">
      <rect x={2} y={2} width={12} height={2} />
      <rect x={2} y={6} width={12} height={8} opacity={0.3} />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true" fill="currentColor">
      <rect x={12} y={2} width={2} height={12} />
      <rect x={2} y={2} width={8} height={12} opacity={0.3} />
    </svg>
  ),
  none: (
    <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true" fill="currentColor">
      <rect x={2} y={2} width={12} height={12} opacity={0.3} />
    </svg>
  ),
};

const NO_ICONS: Partial<Record<Placement, ReactNode>> = {};

interface ToggleGroupArgs {
  presentation: Presentation;
  isDisabled: boolean;
  hasDisabledOption: boolean;
}

const buildOptions = ({ presentation, hasDisabledOption }: ToggleGroupArgs): ControlOption[] => {
  const labels = presentation === 'long labels' ? LONG_LABELS : SHORT_LABELS;
  const icons = presentation === 'icons' ? PLACEMENT_ICONS : NO_ICONS;

  return PLACEMENTS.map((placement) => ({
    value: placement,
    label: labels[placement],
    icon: icons[placement],
    isDisabled: hasDisabledOption && placement === 'right',
  }));
};

/**
 * The control holds its own value here, which is the one place it does: inside a section the chart
 * holds it, and the control only shows what came back from the compiled spec.
 */
const ToggleGroupDemo = (args: ToggleGroupArgs) => {
  const [value, setValue] = useState<string>('top');

  const changed = useRef(value);

  const onChange = (next: string) => {
    changed.current = next;
    setValue(next);
    action('onChange')(next);
  };

  const onCommit = () => {
    action('onCommit')(changed.current);
  };

  return (
    <ControlStoryLayout>
      <ToggleGroup
        value={value}
        options={buildOptions(args)}
        onChange={onChange}
        onCommit={onCommit}
        isDisabled={args.isDisabled}
        ariaLabel="Legend position"
      />
    </ControlStoryLayout>
  );
};

const meta: Meta = {
  title: 'Editor/Controls/toggle-group',
  parameters: {
    docs: {
      description: {
        component:
          'A segmented single choice — the shape legacy calls tab buttons, and the control every ' +
          'section reaches for when the options fit on one row. It is what a host sees before ' +
          'deciding whether to replace it, so this is the only place it appears without a chart ' +
          'behind it.\n\n' +
          'The choice is required: pressing the already-pressed option is ignored rather than ' +
          'clearing it, since no setting the panel writes has an empty state. Options carry a ' +
          'label, an optional icon and their own disabled flag, so a section can offer a placement ' +
          'the chart cannot currently take without removing it from the row.',
      },
    },
  },
};

export default meta;

export const Segmented: StoryObj<ToggleGroupArgs> = {
  name: 'Choosing one of a set',
  args: { presentation: 'labels', isDisabled: false, hasDisabledOption: false },
  argTypes: {
    presentation: {
      control: 'inline-radio',
      options: ['labels', 'icons', 'long labels'],
      description:
        'How each option names itself. An icon-only option keeps its label as the accessible name; a ' +
        'label too long for its cell ellipsises rather than widening the row.',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disables the whole control, as a section does when nothing is selectable.',
    },
    hasDisabledOption: {
      control: 'boolean',
      description: 'Disables `Right` alone, which is how a section offers a placement the chart cannot take.',
    },
  },
  render: (args) => <ToggleGroupDemo {...args} />,
};
