import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useRef, useState } from 'react';
import { action } from 'storybook/actions';

import type { ControlOption } from '@graphysdk/react-renderer/editable';
import { RadioGrid } from '@graphysdk/react-renderer/editable';

import { ControlStoryLayout } from '../../components/ControlStoryLayout';

type ChartKind = 'bar' | 'column' | 'line' | 'area' | 'pie' | 'scatter';

const KIND_LABELS: Record<ChartKind, string> = {
  bar: 'Bar',
  column: 'Column',
  line: 'Line',
  area: 'Area',
  pie: 'Pie',
  scatter: 'Scatter',
};

const Glyph = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 16 16" width={18} height={18} aria-hidden="true" fill="currentColor">
    {children}
  </svg>
);

const GlyphColumns = ({ heights }: { heights: number[] }) => (
  <Glyph>
    {heights.map((height, index) => (
      <rect key={height} x={2 + index * 5} y={14 - height} width={3} height={height} />
    ))}
  </Glyph>
);

const GlyphRows = ({ widths }: { widths: number[] }) => (
  <Glyph>
    {widths.map((width, index) => (
      <rect key={width} x={2} y={2 + index * 5} width={width} height={3} />
    ))}
  </Glyph>
);

const GlyphPath = ({ path, isFilled = false }: { path: string; isFilled?: boolean }) => (
  <Glyph>
    <path d={path} fill={isFilled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} />
  </Glyph>
);

const GlyphPie = () => (
  <Glyph>
    <circle cx={8} cy={8} r={6} opacity={0.35} />
    <path d="M8 8 L8 2 A6 6 0 0 1 13.2 11 Z" />
  </Glyph>
);

const SCATTER_DOTS = [
  [4, 11],
  [7, 6],
  [11, 9],
  [13, 4],
] as const;

const GlyphDots = () => (
  <Glyph>
    {SCATTER_DOTS.map(([cx, cy]) => (
      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.6} />
    ))}
  </Glyph>
);

const Chip = ({ colour }: { colour: string }) => (
  <span
    aria-hidden="true"
    style={{ display: 'block', inlineSize: 16, blockSize: 16, borderRadius: 4, background: colour }}
  />
);

const KIND_ICONS: Record<ChartKind, ReactNode> = {
  bar: <GlyphRows widths={[12, 8, 5]} />,
  column: <GlyphColumns heights={[5, 9, 12]} />,
  line: <GlyphPath path="M2 12 L6 7 L10 9 L14 3" />,
  area: <GlyphPath path="M2 12 L6 7 L10 9 L14 3 L14 14 L2 14 Z" isFilled />,
  pie: <GlyphPie />,
  scatter: <GlyphDots />,
};

const SWATCH_COLOURS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'] as const;

const DEFAULT_SWATCH = SWATCH_COLOURS[0];
const LAST_SWATCH = SWATCH_COLOURS[5];

interface RadioGridArgs {
  itemLayout: 'tile' | 'swatch';
  columns: number;
  isDisabled: boolean;
  hasDisabledOption: boolean;
}

const buildKindOptions = (hasDisabledOption: boolean): ControlOption[] =>
  (Object.keys(KIND_LABELS) as ChartKind[]).map((kind) => ({
    value: kind,
    label: KIND_LABELS[kind],
    icon: KIND_ICONS[kind],
    isDisabled: hasDisabledOption && kind === 'scatter',
  }));

const buildSwatchOptions = (hasDisabledOption: boolean): ControlOption[] =>
  SWATCH_COLOURS.map((colour) => ({
    value: colour,
    // The accessible name, since a swatch shows no caption.
    label: colour.toUpperCase(),
    icon: <Chip colour={colour} />,
    isDisabled: hasDisabledOption && colour === LAST_SWATCH,
  }));

const RadioGridDemo = ({ itemLayout, columns, isDisabled, hasDisabledOption }: RadioGridArgs) => {
  const isSwatch = itemLayout === 'swatch';
  const options = isSwatch ? buildSwatchOptions(hasDisabledOption) : buildKindOptions(hasDisabledOption);
  const [value, setValue] = useState<string>(isSwatch ? DEFAULT_SWATCH : 'bar');

  // What the gesture actually reached, so a commit reports the option it landed on rather than the
  // one the last render closed over.
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
      <RadioGrid
        key={itemLayout}
        value={value}
        options={options}
        onChange={onChange}
        onCommit={onCommit}
        columns={columns}
        itemLayout={itemLayout}
        isDisabled={isDisabled}
        ariaLabel="Chart type"
      />
    </ControlStoryLayout>
  );
};

const meta: Meta = {
  title: 'Editor/Controls/radio-grid',
  parameters: {
    docs: {
      description: {
        component:
          'A grid of picture-led choices, for settings that read faster as shapes than as words — ' +
          'chart type, text size, a row of colour chips.\n\n' +
          'The sibling of `toggle-group`, and the split between them is layout rather than ' +
          'behaviour: both pick exactly one of a set, but a grid of pictures does not fit a header ' +
          'row, so a section using this one is collapsible where a segmented row can sit inline.\n\n' +
          '`tile` captions each icon. `swatch` drops the caption for a dense grid of pure pictures ' +
          '— colour chips a name would only clutter — and names each option through `aria-label` ' +
          'instead, so it stays readable to someone who cannot see the colour.\n\n' +
          'Arrow keys select here rather than only moving focus, so holding one sweeps across the ' +
          'options and fires a change for each it crosses. Hold an arrow and watch the Actions panel: ' +
          'a change per option, and a single `onCommit` when you let go. Without that, crossing six ' +
          'options would leave six undo entries behind one press. A click commits as it happens, ' +
          'since a press is a whole gesture.',
      },
    },
  },
};

export default meta;

export const Grid: StoryObj<RadioGridArgs> = {
  name: 'Choosing a picture',
  args: { itemLayout: 'tile', columns: 3, isDisabled: false, hasDisabledOption: false },
  argTypes: {
    itemLayout: {
      control: 'inline-radio',
      options: ['tile', 'swatch'],
      description: 'Captioned tiles, or bare chips named only to a screen reader.',
    },
    columns: {
      control: { type: 'range', min: 1, max: 6, step: 1 },
      description: 'Items per row. Defaults to one row of everything; widths above six are clamped.',
    },
    isDisabled: { control: 'boolean', description: 'Greys out the whole grid.' },
    hasDisabledOption: { control: 'boolean', description: 'Disables the last option alone, leaving it visible.' },
  },
  render: (args) => <RadioGridDemo {...args} />,
};
