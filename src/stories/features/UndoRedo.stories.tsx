import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { useCallback, useRef, useState } from 'react';

import type { GraphHandle } from '@graphysdk/react-renderer';
import {
  GraphProvider,
  GraphRenderer,
  useCompiledSelector,
  useGraphCommands,
  useGraphHistory,
  useGraphHistoryShortcuts,
} from '@graphysdk/react-renderer';
import type { Command, CommandMetadata, Data, GraphStyleDeclarations, Spec } from '@graphysdk/viz-engine';
import {
  config,
  createSpec,
  geom,
  mapping,
  pipe,
  scale,
  SetAppearanceTextScaleCommand,
  SetAxisPositionCommand,
  SetContentSubtitleCommand,
  SetContentTitleCommand,
  SetHeadlineShowCommand,
  SetScaleDomainCommand,
  SetStyleRuleCommand,
  style,
} from '@graphysdk/viz-engine';

const meta: Meta = {
  title: 'Features/Undo & Redo',
};

export default meta;

const salesData: Data = {
  columns: [{ key: 'quarter' }, { key: 'region' }, { key: 'sales' }],
  rows: [
    { quarter: 'Q1', region: 'North', sales: 350 },
    { quarter: 'Q1', region: 'South', sales: 200 },
    { quarter: 'Q1', region: 'West', sales: 500 },
    { quarter: 'Q2', region: 'North', sales: 300 },
    { quarter: 'Q2', region: 'South', sales: 250 },
    { quarter: 'Q2', region: 'West', sales: 350 },
    { quarter: 'Q3', region: 'North', sales: 400 },
    { quarter: 'Q3', region: 'South', sales: 300 },
    { quarter: 'Q3', region: 'West', sales: 300 },
    { quarter: 'Q4', region: 'North', sales: 200 },
    { quarter: 'Q4', region: 'South', sales: 150 },
    { quarter: 'Q4', region: 'West', sales: 400 },
  ],
};

const BASE_SPEC = pipe(
  createSpec(mapping({ x: 'quarter', y: 'sales', color: 'region' })),
  geom.bar({ position: 'stack' }),
  scale.x(),
  scale.y(),
  scale.color.palette(),
  config({
    content: {
      title: 'Quarterly sales by region',
      subtitle: 'Every edit below is reversible.',
    },
    legend: { position: 'bottom' },
  })
);

const AUTHOR = 'storybook';

interface ChartAction {
  label: string;
  build: (spec: Spec) => Command;
}

const ACTIONS: ChartAction[] = [
  {
    label: 'Rename title',
    build: (spec) =>
      new SetContentTitleCommand(
        { title: spec.config.content.title === 'Quarterly sales by region' ? 'FY sales' : 'Quarterly sales by region' },
        { author: AUTHOR }
      ),
  },
  {
    label: 'Rewrite subtitle',
    build: (spec) =>
      new SetContentSubtitleCommand(
        {
          subtitle:
            spec.config.content.subtitle === 'Every edit below is reversible.'
              ? 'Stacked totals across North, South and West.'
              : 'Every edit below is reversible.',
        },
        { author: AUTHOR }
      ),
  },
  {
    label: 'Move y axis',
    build: (spec) =>
      new SetAxisPositionCommand(
        { axis: 'y', position: spec.config.axes.y.position === 'right' ? 'left' : 'right' },
        { author: AUTHOR }
      ),
  },
  {
    label: 'Toggle headline total',
    build: (spec) =>
      new SetHeadlineShowCommand(
        { show: spec.config.headline.show === 'total' ? 'none' : 'total' },
        { author: AUTHOR }
      ),
  },
  {
    label: 'Stretch y domain',
    build: (spec) => {
      const yScale = spec.scales.find((entry) => entry.scaledAesthetic === 'y');
      const isStretched = yScale && 'domainMax' in yScale && yScale.domainMax === 1600;
      return new SetScaleDomainCommand(
        { scaledAesthetic: 'y', domainMin: 0, domainMax: isStretched ? 1200 : 1600 },
        { author: AUTHOR }
      );
    },
  },
];

const PANEL_BORDER = '1px solid #d1d5da';
const MUTED = '#5f6469';

const buttonStyle: CSSProperties = {
  padding: '6px 10px',
  border: PANEL_BORDER,
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
};

const stackPanelStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: PANEL_BORDER,
  borderRadius: 8,
  overflow: 'hidden',
};

const StackList = ({
  title,
  entries,
  emptyLabel,
}: {
  title: string;
  entries: readonly CommandMetadata[];
  emptyLabel: string;
}) => (
  <div style={stackPanelStyle}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 10px',
        borderBottom: PANEL_BORDER,
        background: '#f6f8fa',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span>{title}</span>
      <span style={{ color: MUTED }}>{entries.length}</span>
    </div>
    {entries.length === 0 ? (
      <div style={{ padding: '10px', fontSize: 12, color: MUTED }}>{emptyLabel}</div>
    ) : (
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {entries
          .map((entry, index) => ({ entry, isNext: index === entries.length - 1 }))
          .reverse()
          .map(({ entry, isNext }) => (
            <li
              key={entry.id}
              style={{
                padding: '6px 10px',
                borderBottom: '1px solid #eceff1',
                background: isNext ? '#eef6ff' : undefined,
              }}
            >
              <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{entry.description}</span>
                {isNext && <span style={{ color: '#0969da', fontSize: 11 }}>next</span>}
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                {entry.author} · {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
            </li>
          ))}
      </ol>
    )}
  </div>
);

const StoryShell = () => {
  const { dispatch } = useGraphCommands();
  const currentSpec = useCompiledSelector((compiled) => compiled.spec);
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription, undoStack, redoStack } = useGraphHistory();

  const run = useCallback((action: ChartAction) => dispatch(action.build(currentSpec)), [dispatch, currentSpec]);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', fontFamily: 'sans-serif' }}>
      <div style={{ width: 640, height: 420, border: '1px solid #e3e5e8', borderRadius: 8 }}>
        <GraphRenderer mode="editable" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 460 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ACTIONS.map((action) => (
            <button key={action.label} type="button" style={buttonStyle} onClick={() => run(action)}>
              {action.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            style={{ ...buttonStyle, flex: 1, opacity: canUndo ? 1 : 0.45 }}
            disabled={!canUndo}
            title={undoDescription ?? undefined}
            onClick={undo}
          >
            ↩ Undo
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, flex: 1, opacity: canRedo ? 1 : 0.45 }}
            disabled={!canRedo}
            title={redoDescription ?? undefined}
            onClick={redo}
          >
            ↪ Redo
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <StackList title="Undo stack" entries={undoStack} emptyLabel="No edits yet." />
          <StackList title="Redo stack" entries={redoStack} emptyLabel="Cleared by the next edit." />
        </div>

        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
          This story calls <code>useGraphHistoryShortcuts()</code>, so ⌘/Ctrl+Z drives the same history from the
          keyboard. Editing a title inline keeps its own undo while the caret is in the text.
        </p>
      </div>
    </div>
  );
};

const UndoRedoDemo = () => {
  const handleRef = useRef<GraphHandle>(null);
  useGraphHistoryShortcuts(handleRef);

  return (
    <GraphProvider data={salesData} input={BASE_SPEC} handleRef={handleRef}>
      <StoryShell />
    </GraphProvider>
  );
};

export const Demo: StoryObj = {
  render: () => <UndoRedoDemo />,
};

// A held slider is the gesture transient dispatch exists for: one command per frame for live
// feedback, folded into a single undo entry, with `onChange` deferred until `seal()` closes the run.

/** One slider wired to a command: read the current value from the spec, dispatch a frame per input. */
interface LiveControl {
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
  /** The {@link EditTarget} its frames fold under, shown so the merge boundary between runs is visible. */
  targetLabel: string;
  read: (spec: Spec) => number;
  build: (value: number) => Command;
}

const readYDomainMax = (spec: Spec): number | null => {
  const yScale = spec.scales.find((entry) => entry.scaledAesthetic === 'y');
  return yScale && 'domainMax' in yScale ? (yScale.domainMax ?? null) : null;
};

const FRAME_RADIUS_RULE_ID = 'frame-radius';

const LIVE_CONTROLS: LiveControl[] = [
  {
    label: 'Chart corner radius',
    min: 0,
    max: 40,
    step: 1,
    suffix: 'px',
    targetLabel: 'styles',
    read: (spec) => {
      // The control minted this entry itself, so its declarations are the graph vocabulary.
      const entry = spec.styles.defaults.find((candidate) => candidate.id === FRAME_RADIUS_RULE_ID);
      return (entry?.declarations as GraphStyleDeclarations | undefined)?.borderRadius ?? 8;
    },
    build: (borderRadius) =>
      new SetStyleRuleCommand(
        { list: 'defaults', rule: style.graph({ borderRadius }, { id: FRAME_RADIUS_RULE_ID }) },
        { author: AUTHOR }
      ),
  },
  {
    label: 'Text scale',
    min: 0.6,
    max: 1.6,
    step: 0.05,
    suffix: '×',
    targetLabel: 'appearance',
    read: (spec) => spec.config.appearance.textScale,
    build: (textScale) => new SetAppearanceTextScaleCommand({ textScale }, { author: AUTHOR }),
  },
  {
    label: 'Y-axis maximum',
    min: 1100,
    max: 2600,
    step: 50,
    suffix: '',
    targetLabel: 'scale · y',
    read: (spec) => readYDomainMax(spec) ?? 1400,
    build: (domainMax) => new SetScaleDomainCommand({ scaledAesthetic: 'y', domainMax }, { author: AUTHOR }),
  },
];

const sliderRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '8px 10px',
  border: PANEL_BORDER,
  borderRadius: 8,
};

/**
 * A slider that drives its command transiently: every drag frame dispatches `{ transient: true }`,
 * so the run holds one undo entry, and pointer-up or blur seals it — the single point that fires
 * `onChange`. `onBlur` covers the keyboard, where arrow keys move the thumb before focus leaves.
 */
const LiveSlider = ({ control, onFrame }: { control: LiveControl; onFrame: () => void }) => {
  const { dispatch, seal } = useGraphCommands();
  const value = useCompiledSelector((compiled) => control.read(compiled.spec));

  return (
    <label style={sliderRowStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
        <span>{control.label}</span>
        <span style={{ color: '#0969da' }}>
          {Number.isInteger(value) ? value : value.toFixed(2)}
          {control.suffix}
        </span>
      </div>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        onChange={(event) => {
          onFrame();
          dispatch(control.build(event.currentTarget.valueAsNumber), { transient: true });
        }}
        onPointerUp={seal}
        onBlur={seal}
      />
      <div style={{ fontSize: 11, color: MUTED }}>run target · {control.targetLabel}</div>
    </label>
  );
};

const counterStyle: CSSProperties = {
  flex: 1,
  border: PANEL_BORDER,
  borderRadius: 8,
  padding: '8px 10px',
  textAlign: 'center',
};

const Counter = ({ label, value }: { label: string; value: number }) => (
  <div style={counterStyle}>
    <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    <div style={{ fontSize: 11, color: MUTED }}>{label}</div>
  </div>
);

const TransientShell = ({ commits }: { commits: number }) => {
  const [frames, setFrames] = useState(0);
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription, undoStack, redoStack } = useGraphHistory();
  const bumpFrames = useCallback(() => setFrames((count) => count + 1), []);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', fontFamily: 'sans-serif' }}>
      <div style={{ width: 640, height: 420, border: '1px solid #e3e5e8', borderRadius: 8 }}>
        <GraphRenderer mode="editable" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 460 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LIVE_CONTROLS.map((control) => (
            <LiveSlider key={control.label} control={control} onFrame={bumpFrames} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Counter label="Transient frames dispatched" value={frames} />
          <Counter label="Commits persisted (onChange)" value={commits} />
          <Counter label="Undo entries" value={undoStack.length} />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            style={{ ...buttonStyle, flex: 1, opacity: canUndo ? 1 : 0.45 }}
            disabled={!canUndo}
            title={undoDescription ?? undefined}
            onClick={undo}
          >
            ↩ Undo
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, flex: 1, opacity: canRedo ? 1 : 0.45 }}
            disabled={!canRedo}
            title={redoDescription ?? undefined}
            onClick={redo}
          >
            ↪ Redo
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <StackList title="Undo stack" entries={undoStack} emptyLabel="Drag a slider above." />
          <StackList title="Redo stack" entries={redoStack} emptyLabel="Cleared by the next edit." />
        </div>

        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
          Each drag dispatches one command per frame yet leaves a single undo entry: the frame count runs far ahead of
          the commit count, and <code>onChange</code> fires only when the gesture seals. The two appearance sliders
          share a run target, so an unsealed drag of one folds into the other; the y-axis slider targets its scale, so
          its run always stays separate.
        </p>
      </div>
    </div>
  );
};

const TransientDemo = () => {
  const handleRef = useRef<GraphHandle>(null);
  useGraphHistoryShortcuts(handleRef);
  const [commits, setCommits] = useState(0);
  const countCommit = useCallback(() => setCommits((count) => count + 1), []);

  return (
    <GraphProvider data={salesData} input={BASE_SPEC} handleRef={handleRef} onChange={countCommit}>
      <TransientShell commits={commits} />
    </GraphProvider>
  );
};

export const Transient: StoryObj = {
  render: () => <TransientDemo />,
};
