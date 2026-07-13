import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type {
  AnnotationItem,
  AnnotationZOrder,
  ArrowheadStyle,
  ArrowLineStyle,
  ArrowThickness,
  Data,
  GraphConfig,
  RichTextContent,
} from '@graphysdk/viz-engine';
import { annotation, config, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

interface FreeformAnnotationsArgs {
  showShape: boolean;
  shapeZOrder: AnnotationZOrder;
  shapeX: number;
  shapeY: number;
  shapeWidth: number;
  shapeHeight: number;
  shapeFillColor: string;
  shapeFillOpacity: number;
  shapeStrokeWidth: number;

  showArrow: boolean;
  arrowStartX: number;
  arrowStartY: number;
  arrowEndX: number;
  arrowEndY: number;
  arrowColor: string;
  arrowThickness: ArrowThickness;
  arrowLineStyle: ArrowLineStyle;
  arrowStartArrowheadStyle: ArrowheadStyle;
  arrowEndArrowheadStyle: ArrowheadStyle;
  hasArrowStickerStyle: boolean;

  showText: boolean;
  text: string;
  isTextBold: boolean;
  textX: number;
  textY: number;
  textWidth: number;
  textBackgroundColor: string;
  textBackgroundColorStyle: 'fade' | 'opaque';
  textAlign: 'left' | 'center' | 'right';
}

const salesData: Data = {
  columns: [
    { key: 'quarter', label: 'Quarter' },
    { key: 'EU', label: 'Europe' },
    { key: 'US', label: 'United States' },
  ],
  rows: [
    { quarter: 'Q1', EU: 1200, US: 1500 },
    { quarter: 'Q2', EU: 1800, US: 1600 },
    { quarter: 'Q3', EU: 2400, US: 2200 },
    { quarter: 'Q4', EU: 2800, US: 3100 },
  ],
};

const fractionControl = { control: { type: 'range' as const, min: 0, max: 1, step: 0.01 } };

const meta: Meta<FreeformAnnotationsArgs> = {
  title: 'Features/Annotations/Freeform Annotations',
  decorators: [ResizablePlotDecorator],
  argTypes: {
    showShape: { control: { type: 'boolean' }, table: { category: 'Shape' } },
    shapeZOrder: {
      control: { type: 'inline-radio' },
      options: ['background', 'foreground'] satisfies AnnotationZOrder[],
      description: '`background` puts the shape behind the geoms; `foreground` puts it on top.',
      table: { category: 'Shape' },
    },
    shapeX: { ...fractionControl, table: { category: 'Shape' } },
    shapeY: { ...fractionControl, table: { category: 'Shape' } },
    shapeWidth: { ...fractionControl, table: { category: 'Shape' } },
    shapeHeight: { ...fractionControl, table: { category: 'Shape' } },
    shapeFillColor: { control: { type: 'color' }, table: { category: 'Shape' } },
    shapeFillOpacity: { ...fractionControl, table: { category: 'Shape' } },
    shapeStrokeWidth: {
      control: { type: 'range', min: 0, max: 8, step: 1 },
      table: { category: 'Shape' },
    },

    showArrow: { control: { type: 'boolean' }, table: { category: 'Arrow' } },
    arrowStartX: { ...fractionControl, table: { category: 'Arrow' } },
    arrowStartY: { ...fractionControl, table: { category: 'Arrow' } },
    arrowEndX: { ...fractionControl, table: { category: 'Arrow' } },
    arrowEndY: { ...fractionControl, table: { category: 'Arrow' } },
    arrowColor: {
      control: { type: 'color' },
      description: 'Empty falls back to the theme `defaultArrowAnnotationColor`.',
      table: { category: 'Arrow' },
    },
    arrowThickness: {
      control: { type: 'inline-radio' },
      options: ['thin', 'medium', 'thick'] satisfies ArrowThickness[],
      table: { category: 'Arrow' },
    },
    arrowLineStyle: {
      control: { type: 'inline-radio' },
      options: ['solid', 'dashed'] satisfies ArrowLineStyle[],
      table: { category: 'Arrow' },
    },
    arrowStartArrowheadStyle: {
      control: { type: 'inline-radio' },
      options: ['none', 'line-arrow'] satisfies ArrowheadStyle[],
      table: { category: 'Arrow' },
    },
    arrowEndArrowheadStyle: {
      control: { type: 'inline-radio' },
      options: ['none', 'line-arrow'] satisfies ArrowheadStyle[],
      table: { category: 'Arrow' },
    },
    hasArrowStickerStyle: {
      control: { type: 'boolean' },
      description: 'Adds a drop shadow + white outline behind the arrow.',
      table: { category: 'Arrow' },
    },

    showText: { control: { type: 'boolean' }, table: { category: 'Text' } },
    text: { control: { type: 'text' }, table: { category: 'Text' } },
    isTextBold: { control: { type: 'boolean' }, table: { category: 'Text' } },
    textX: { ...fractionControl, table: { category: 'Text' } },
    textY: { ...fractionControl, table: { category: 'Text' } },
    textWidth: { ...fractionControl, table: { category: 'Text' } },
    textBackgroundColor: {
      control: { type: 'color' },
      description: 'Empty falls back to a transparent background.',
      table: { category: 'Text' },
    },
    textBackgroundColorStyle: {
      control: { type: 'inline-radio' },
      options: ['opaque', 'fade'] as const,
      table: { category: 'Text' },
    },
    textAlign: {
      control: { type: 'inline-radio' },
      options: ['left', 'center', 'right'] as const,
      table: { category: 'Text' },
    },
  },
  args: {
    showShape: true,
    shapeZOrder: 'foreground',
    shapeX: 0.2,
    shapeY: 0.15,
    shapeWidth: 0.4,
    shapeHeight: 0.4,
    shapeFillColor: '#ffd54f',
    shapeFillOpacity: 0.3,
    shapeStrokeWidth: 1,

    showArrow: true,
    arrowStartX: 0.1,
    arrowStartY: 0.8,
    arrowEndX: 0.7,
    arrowEndY: 0.2,
    arrowColor: '',
    arrowThickness: 'medium',
    arrowLineStyle: 'solid',
    arrowStartArrowheadStyle: 'none',
    arrowEndArrowheadStyle: 'line-arrow',
    hasArrowStickerStyle: false,

    showText: true,
    text: 'Strong Q4 finish',
    isTextBold: true,
    textX: 0.62,
    textY: 0.05,
    textWidth: 0.35,
    textBackgroundColor: '#fff59d',
    textBackgroundColorStyle: 'opaque',
    textAlign: 'center',
  },
};

export default meta;
type Story = StoryObj<FreeformAnnotationsArgs>;

const buildShapeAnnotations = (args: FreeformAnnotationsArgs): AnnotationItem[] => {
  if (!args.showShape) return [];
  return [
    annotation.shape({
      id: 'shape-1',
      kind: 'rectangle',
      zOrder: args.shapeZOrder,
      region: {
        anchorType: 'panel',
        x: args.shapeX,
        y: args.shapeY,
        width: args.shapeWidth,
        height: args.shapeHeight,
      },
      fillColor: args.shapeFillColor,
      fillOpacity: args.shapeFillOpacity,
      strokeWidth: args.shapeStrokeWidth,
    }),
  ];
};

const buildFreeformArrowAnnotations = (args: FreeformAnnotationsArgs): AnnotationItem[] => {
  if (!args.showArrow) return [];
  return [
    annotation.arrow({
      id: 'arrow-1',
      start: { anchorType: 'panel', x: args.arrowStartX, y: args.arrowStartY },
      end: { anchorType: 'panel', x: args.arrowEndX, y: args.arrowEndY },
      color: args.arrowColor === '' ? null : args.arrowColor,
      thickness: args.arrowThickness,
      lineStyle: args.arrowLineStyle,
      startArrowheadStyle: args.arrowStartArrowheadStyle,
      endArrowheadStyle: args.arrowEndArrowheadStyle,
      hasStickerStyle: args.hasArrowStickerStyle,
    }),
  ];
};

const buildTextContent = (text: string, bold: boolean, textAlign: 'left' | 'center' | 'right'): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign },
      content: [{ type: 'text', text, ...(bold ? { marks: [{ type: 'bold' }] } : {}) }],
    },
  ],
});

const buildTextAnnotations = (args: FreeformAnnotationsArgs): AnnotationItem[] => {
  if (!args.showText) return [];
  return [
    annotation.text({
      id: 'text-1',
      content: buildTextContent(args.text, args.isTextBold, args.textAlign),
      at: { anchorType: 'panel', x: args.textX, y: args.textY },
      width: args.textWidth,
      backgroundColor: args.textBackgroundColor === '' ? null : args.textBackgroundColor,
      backgroundColorStyle: args.textBackgroundColorStyle,
    }),
  ];
};

const buildConfigAnnotations = (args: FreeformAnnotationsArgs): NonNullable<GraphConfig['annotations']> => {
  const annotations: NonNullable<GraphConfig['annotations']> = [];
  if (args.showShape) {
    annotations.push({
      id: 'shape-1',
      type: 'shape',
      shape: 'rectangle',
      layer: args.shapeZOrder === 'background' ? 'belowPlot' : 'abovePlot',
      x: args.shapeX,
      y: args.shapeY,
      width: args.shapeWidth,
      height: args.shapeHeight,
      fillColor: args.shapeFillColor,
      fillOpacity: args.shapeFillOpacity,
      strokeWidth: args.shapeStrokeWidth,
    });
  }
  if (args.showArrow) {
    annotations.push({
      id: 'arrow-1',
      type: 'arrow',
      startX: args.arrowStartX,
      startY: args.arrowStartY,
      endX: args.arrowEndX,
      endY: args.arrowEndY,
      ...(args.arrowColor === '' ? {} : { color: args.arrowColor }),
      thickness: args.arrowThickness,
      lineStyle: args.arrowLineStyle,
      startArrowheadStyle: args.arrowStartArrowheadStyle,
      endArrowheadStyle: args.arrowEndArrowheadStyle,
      hasStickerStyle: args.hasArrowStickerStyle,
    });
  }
  if (args.showText) {
    annotations.push({
      id: 'text-1',
      type: 'text',
      content: buildTextContent(args.text, args.isTextBold, args.textAlign),
      x: args.textX,
      y: args.textY,
      width: args.textWidth,
      ...(args.textBackgroundColor === '' ? {} : { backgroundColor: args.textBackgroundColor }),
      backgroundColorStyle: args.textBackgroundColorStyle,
    });
  }
  return annotations;
};

const renderStory = (args: FreeformAnnotationsArgs) => <FreeformAnnotationsStory {...args} />;

const FreeformAnnotationsStory = (args: FreeformAnnotationsArgs) => {
  const { spec, configForApi } = useMemo(() => {
    const specInput = pipe(
      createSpec(
        transform.reshape({ keep: ['quarter'], reshape: ['EU', 'US'], keyName: 'series', valueName: 'value' }),
        mapping({ x: 'quarter', y: 'value', color: 'series' })
      ),
      geom.bar({ position: 'dodge' }),
      scale.x(),
      scale.y(),
      scale.color.palette(),
      config({}),
      ...buildShapeAnnotations(args),
      ...buildFreeformArrowAnnotations(args),
      ...buildTextAnnotations(args)
    );
    return {
      spec: specInput,
      configForApi: {
        type: 'column',
        annotations: buildConfigAnnotations(args),
        headlineNumbers: { show: 'none' as const },
      } satisfies GraphConfig,
    };
  }, [args]);

  return (
    <VizStoryGraphProvider data={salesData} spec={spec} config={configForApi}>
      <GraphRenderer />
    </VizStoryGraphProvider>
  );
};

export const Playground: Story = {
  name: 'Playground',
  render: renderStory,
};

export const RectangleHighlight: Story = {
  name: 'Rectangle highlight',
  args: {
    showShape: true,
    showArrow: false,
    showText: false,
    shapeZOrder: 'foreground',
    shapeFillColor: '#1e88e5',
    shapeFillOpacity: 0.15,
  },
  render: renderStory,
};

export const ArrowCallout: Story = {
  name: 'Arrow callout',
  args: {
    showShape: false,
    showArrow: true,
    showText: false,
    arrowThickness: 'thick',
    hasArrowStickerStyle: true,
  },
  render: renderStory,
};

export const ShapeBehindBars: Story = {
  name: 'Shape behind bars',
  args: {
    showShape: true,
    showArrow: false,
    showText: false,
    shapeZOrder: 'background',
    shapeFillColor: '#ef5350',
    shapeFillOpacity: 0.25,
    shapeX: 0,
    shapeY: 0,
    shapeWidth: 1,
    shapeHeight: 0.5,
  },
  render: renderStory,
};

export const TextCallout: Story = {
  name: 'Text callout',
  args: {
    showShape: false,
    showArrow: false,
    showText: true,
    text: 'Forecast revision',
    isTextBold: true,
    textX: 0.05,
    textY: 0.05,
    textWidth: 0.4,
    textBackgroundColor: '#1e88e5',
    textBackgroundColorStyle: 'fade',
    textAlign: 'center',
  },
  render: renderStory,
};

export const ArrowWithTextLabel: Story = {
  name: 'Arrow with text label',
  args: {
    showShape: false,
    showArrow: true,
    showText: true,
    arrowStartX: 0.55,
    arrowStartY: 0.25,
    arrowEndX: 0.78,
    arrowEndY: 0.55,
    arrowThickness: 'medium',
    hasArrowStickerStyle: true,
    text: 'Outlier',
    isTextBold: true,
    textX: 0.4,
    textY: 0.1,
    textWidth: 0.2,
    textBackgroundColor: '#fff59d',
    textBackgroundColorStyle: 'opaque',
    textAlign: 'center',
  },
  render: renderStory,
};
