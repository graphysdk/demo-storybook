import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';

import { useGraphHistory } from '@graphysdk/react-renderer';
import { EditableGraphRenderer } from '@graphysdk/react-renderer/editable';
import type { Data, RichTextContent } from '@graphysdk/viz-engine';
import { annotation, config, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

import lightning from '../../assets/lightning-sticker.png';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Editor/Free-flowing annotations',
};

export default meta;

const quarterlyData: Data = {
  columns: [
    { key: 'quarter', label: 'Quarter' },
    { key: 'revenue', label: 'Revenue' },
  ],
  rows: [
    { quarter: 'Q1', revenue: 1200 },
    { quarter: 'Q2', revenue: 1500 },
    { quarter: 'Q3', revenue: 1800 },
    { quarter: 'Q4', revenue: 2100 },
  ],
};

const boldLine = (text: string): RichTextContent => ({
  type: 'doc',
  content: [
    { type: 'paragraph', attrs: { textAlign: 'center' }, content: [{ type: 'text', text, marks: [{ type: 'bold' }] }] },
  ],
});

/**
 * One chart carrying every case at once. Panel anchors are fractions from the top-left, and the y
 * domain is capped well above the tallest bar so the free-flowing half has clear panel to move in.
 */
const annotatedBars = pipe(
  createSpec(mapping({ x: 'quarter', y: 'revenue' })),
  geom.bar({ position: 'identity' }),
  scale.x(),
  scale.y({ domainMin: 0, domainMax: 3600 }),
  config({ content: { title: 'Revenue by quarter' } }),

  // Behind the geoms and across every bar: a click where a bar covers it must reach the bar.
  annotation.shape({
    id: 'band',
    zOrder: 'background',
    region: { anchorType: 'panel', x: 0, y: 0.72, width: 1, height: 0.28 },
    fillColor: '#f4a261',
    fillOpacity: 0.25,
    strokeWidth: 0,
  }),
  // Overlaps the image below it, which paints later — so the image is what a pointer there reaches.
  annotation.shape({
    id: 'spotlight',
    zOrder: 'foreground',
    region: { anchorType: 'panel', x: 0.06, y: 0.06, width: 0.26, height: 0.22 },
    fillColor: '#4c9be8',
    fillOpacity: 0.18,
    strokeWidth: 1,
  }),
  annotation.image({
    id: 'logo',
    src: lightning,
    region: { anchorType: 'panel', x: 0.22, y: 0.16, width: 0.12, height: 0.18 },
    fit: 'contain',
  }),
  annotation.arrow({
    id: 'pointer',
    start: { anchorType: 'panel', x: 0.44, y: 0.1 },
    end: { anchorType: 'panel', x: 0.6, y: 0.34 },
    thickness: 'medium',
    endArrowheadStyle: 'line-arrow',
    hasStickerStyle: true,
  }),
  annotation.text({
    id: 'panel-text',
    content: boldLine('Floats in the panel'),
    at: { anchorType: 'panel', x: 0.84, y: 0.12 },
    width: 0.28,
    backgroundColor: '#fff3bf',
    backgroundColorStyle: 'opaque',
  }),
  // Pinned to an observation rather than the canvas: selectable, and nothing a drag can move.
  annotation.text({
    id: 'pinned-text',
    content: boldLine('Pinned to Q2'),
    at: { anchorType: 'observation', anchorValue: 'Q2' },
    width: 0.22,
    backgroundColor: '#d3f9d8',
    backgroundColorStyle: 'opaque',
  }),
  // The anchor the `(+)` menu writes when it adds one.
  annotation.sticker({
    id: 'cheer',
    at: { anchorType: 'observation', anchorValue: 'Q4' },
    sticker: 'rocket',
  })
);

const MUTED = '#5f6469';
const BORDER = '1px solid #d1d5da';

const chartStyle: CSSProperties = {
  width: 720,
  height: 440,
  resize: 'both',
  overflow: 'hidden',
  border: '1px dashed #eee',
  borderRadius: 6,
  padding: 10,
};

const panelStyle: CSSProperties = {
  width: 340,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  fontFamily: 'sans-serif',
  fontSize: 12,
};

const buttonStyle: CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  border: BORDER,
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
};

/** The history as a count and a list, so "one drag, one commit" is readable without a devtools trip. */
const EditHistory = () => {
  const { undo, redo, canUndo, canRedo, undoStack } = useGraphHistory();

  return (
    <div style={{ border: BORDER, borderRadius: 8, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderBottom: BORDER,
          background: '#f6f8fa',
          fontWeight: 600,
        }}
      >
        <span>Committed edits</span>
        <span style={{ color: MUTED }}>{undoStack.length}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: 8 }}>
        <button
          type="button"
          style={{ ...buttonStyle, opacity: canUndo ? 1 : 0.45 }}
          disabled={!canUndo}
          onClick={undo}
        >
          ↩ Undo
        </button>
        <button
          type="button"
          style={{ ...buttonStyle, opacity: canRedo ? 1 : 0.45 }}
          disabled={!canRedo}
          onClick={redo}
        >
          ↪ Redo
        </button>
      </div>
      {undoStack.length === 0 ? (
        <div style={{ padding: '0 10px 10px', color: MUTED }}>Nothing committed yet.</div>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: '0 0 6px' }}>
          {undoStack
            .slice(-6)
            .reverse()
            .map((entry) => (
              <li key={entry.id} style={{ padding: '4px 10px', color: MUTED }}>
                {entry.description} · {new Date(entry.timestamp).toLocaleTimeString()}
              </li>
            ))}
        </ol>
      )}
    </div>
  );
};

const ValidationSurface = () => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
    <div style={chartStyle}>
      <EditableGraphRenderer mode="editable" />
    </div>
    <div style={panelStyle}>
      <EditHistory />
    </div>
  </div>
);

export const Canvas: StoryObj = {
  name: 'Every kind at once',
  render: () => (
    <VizStoryGraphProvider data={quarterlyData} spec={annotatedBars}>
      <ValidationSurface />
    </VizStoryGraphProvider>
  ),
};

export const ReadOnly: StoryObj = {
  name: 'Read-only — nothing reachable',
  render: () => (
    <VizStoryGraphProvider data={quarterlyData} spec={annotatedBars}>
      <div style={chartStyle}>
        <EditableGraphRenderer />
      </div>
    </VizStoryGraphProvider>
  ),
};
