import type { AnchorAlign, AnnotationItem, Data, RichTextContent } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

/** Shared demo data and spec builders for the anchor stories (axis/align/selection). */
export const quarterlyData: Data = {
  columns: [
    { key: 'quarter', label: 'Quarter' },
    { key: 'revenue', label: 'Revenue' },
  ],
  rows: [
    { quarter: 'Q1', revenue: 1200 },
    { quarter: 'Q2', revenue: 1800 },
    { quarter: 'Q3', revenue: 2400 },
    { quarter: 'Q4', revenue: 2800 },
  ],
};

export const buildBar = (
  annotations: AnnotationItem[],
  {
    flip = false,
    color = 'quarter',
    position = 'identity',
  }: { flip?: boolean; color?: string; position?: 'identity' | 'dodge' } = {}
) =>
  pipe(
    createSpec(mapping({ x: 'quarter', y: 'revenue', color })),
    geom.bar({ position }),
    ...(flip ? [coord.flip()] : []),
    scale.x(),
    scale.y(),
    scale.color.palette(),
    config({}),
    ...annotations
  );

export const buildLabel = (text: string): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: 'center' },
      content: [{ type: 'text', text, marks: [{ type: 'bold' }] }],
    },
  ],
});

export const ALIGN_POINTS: AnchorAlign[] = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];
