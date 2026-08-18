import { useEffect, useRef } from 'react';

import { useGraphHistory } from '@graphysdk/react-renderer';

import styles from './EditorHistoryTrail.module.css';

/**
 * The whole command stack, in order, with the cursor visible: everything left of it has been applied,
 * everything right of it has been undone and is waiting for a redo. Clicking any step sends the chart
 * there.
 *
 * It reads `useGraphHistory` from the package's *main* entry, so it needs no part of the panel. Every
 * command reaches it the same way, whether a section dispatched it, the chart was edited in place, or
 * an agent streamed it.
 *
 * Its real job is showing what counts as one step: typing a title is a run of transient dispatches
 * that seal into a single entry here, so the trail grows by one word rather than one letter.
 */
export const EditorHistoryTrail = () => {
  const { undo, redo, canUndo, canRedo, undoStack, redoStack } = useGraphHistory();
  const currentStep = useRef<HTMLButtonElement>(null);

  // A run that outgrows the row scrolls rather than wrapping, which would push the chart up every few
  // edits. Keeping the cursor in view is what makes that readable: new steps land off the right edge.
  useEffect(() => {
    currentStep.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [undoStack.length, redoStack.length]);

  // The stack keeps undone commands in the order they were undone, so the most recently undone sits
  // last. Reversed, they read left to right as the steps the chart would walk back into.
  const ahead = [...redoStack].reverse();
  const lastAppliedIndex = undoStack.length - 1;

  /**
   * Walks the chart to a step rather than jumping to it: the stack only moves one command at a time,
   * and each step is its own history entry, so replaying them is what keeps undo honest afterwards.
   */
  const stepBackTo = (index: number) => {
    for (let remaining = lastAppliedIndex - index; remaining > 0; remaining -= 1) {
      undo();
    }
  };

  const stepForwardTo = (index: number) => {
    for (let remaining = index + 1; remaining > 0; remaining -= 1) {
      redo();
    }
  };

  return (
    <div className={styles.trail}>
      <button type="button" className={styles.button} disabled={!canUndo} onClick={undo}>
        Undo
      </button>
      <button type="button" className={styles.button} disabled={!canRedo} onClick={redo}>
        Redo
      </button>

      <div className={styles.steps}>
        {undoStack.length === 0 && ahead.length === 0 && <span className={styles.empty}>No edits yet</span>}

        {undoStack.map((command, index) => {
          const isCurrent = index === lastAppliedIndex;

          return (
            <button
              key={command.id}
              type="button"
              ref={isCurrent ? currentStep : undefined}
              className={`${styles.step} ${isCurrent ? styles.current : styles.applied}`}
              disabled={isCurrent}
              title={isCurrent ? 'Where the chart stands' : 'Go back to here'}
              onClick={() => stepBackTo(index)}
            >
              {command.description}
            </button>
          );
        })}
        {ahead.map((command, index) => (
          <button
            key={command.id}
            type="button"
            className={`${styles.step} ${styles.undone}`}
            title="Go forward to here"
            onClick={() => stepForwardTo(index)}
          >
            {command.description}
          </button>
        ))}
      </div>
    </div>
  );
};
