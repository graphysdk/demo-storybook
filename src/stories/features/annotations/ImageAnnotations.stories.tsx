import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type {
  AnnotationItem,
  AnnotationZOrder,
  Data,
  ImageAnnotationFit,
  RichTextContent,
} from '@graphysdk/viz-engine';
import { annotation, config, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';
import type { GraphConfig } from '@graphysdk/viz-engine/graph-config';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';
import lightning from '../../../assets/lightning-sticker.png';
import smile from '../../../assets/smiley-sticker.png';
import { VizStoryGraphProvider } from '../../../components/VizStoryGraphProvider';

interface ImageAnnotationsArgs {
  src: string;
  zOrder: AnnotationZOrder;
  x: number;
  y: number;
  width: number;
  height: number;
  fit: ImageAnnotationFit;
  opacity: number;
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

const meta: Meta<ImageAnnotationsArgs> = {
  title: 'Features/Annotations/Image Annotations',
  decorators: [ResizablePlotDecorator],
  argTypes: {
    src: { control: { type: 'text' }, description: 'Image URL or data URI.' },
    zOrder: {
      control: { type: 'inline-radio' },
      options: ['background', 'foreground'] satisfies AnnotationZOrder[],
      description: '`background` puts the image behind the geoms; `foreground` puts it on top.',
    },
    x: fractionControl,
    y: fractionControl,
    width: fractionControl,
    height: fractionControl,
    fit: {
      control: { type: 'inline-radio' },
      options: ['fill', 'contain', 'cover'] satisfies ImageAnnotationFit[],
      description: '`fill` stretches, `contain` letterboxes, `cover` crops to fill the box.',
    },
    opacity: fractionControl,
  },
  args: {
    src: lightning,
    zOrder: 'foreground',
    x: 0.3,
    y: 0.25,
    width: 0.08,
    height: 0.3,
    fit: 'contain',
    opacity: 1,
  },
};

export default meta;
type Story = StoryObj<ImageAnnotationsArgs>;

const buildImageAnnotation = (args: ImageAnnotationsArgs): AnnotationItem =>
  annotation.image({
    id: 'image-1',
    src: args.src,
    zOrder: args.zOrder,
    region: { anchorType: 'panel', x: args.x, y: args.y, width: args.width, height: args.height },
    fit: args.fit,
    opacity: args.opacity,
  });

const buildConfigAnnotations = (args: ImageAnnotationsArgs): NonNullable<GraphConfig['annotations']> => [
  {
    id: 'image-1',
    type: 'image',
    src: args.src,
    layer: args.zOrder === 'background' ? 'belowPlot' : 'abovePlot',
    x: args.x,
    y: args.y,
    width: args.width,
    height: args.height,
    fit: args.fit,
    opacity: args.opacity,
  },
];

const buildTextContent = (text: string): RichTextContent => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: 'center' },
      content: [{ type: 'text', text, marks: [{ type: 'bold' }] }],
    },
  ],
});

const buildSpec = (annotations: AnnotationItem[]) =>
  pipe(
    createSpec(
      transform.reshape({ keep: ['quarter'], reshape: ['EU', 'US'], keyName: 'series', valueName: 'value' }),
      mapping({ x: 'quarter', y: 'value', color: 'series' })
    ),
    geom.bar({ position: 'dodge' }),
    scale.x(),
    scale.y(),
    scale.color.palette(),
    config({}),
    ...annotations
  );

const buildConfigForApi = (annotations: NonNullable<GraphConfig['annotations']>): GraphConfig => ({
  type: 'column',
  annotations,
  headlineNumbers: { show: 'none' },
});

const renderStory = (args: ImageAnnotationsArgs) => <ImageAnnotationsStory {...args} />;

const ImageAnnotationsStory = (args: ImageAnnotationsArgs) => {
  const { spec, configForApi } = useMemo(
    () => ({
      spec: buildSpec([buildImageAnnotation(args)]),
      configForApi: buildConfigForApi(buildConfigAnnotations(args)),
    }),
    [args]
  );

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

const fitDemos: Array<{ fit: ImageAnnotationFit; x: number }> = [
  { fit: 'fill', x: 0.05 },
  { fit: 'contain', x: 0.38 },
  { fit: 'cover', x: 0.71 },
];

export const Fit: Story = {
  name: 'Fit',
  parameters: { controls: { disable: true } },
  render: () => {
    const { spec, configForApi } = useMemo(() => {
      const specAnnotations = fitDemos.flatMap(({ fit, x }) => [
        annotation.image({
          id: `image-${fit}`,
          src: smile,
          region: { anchorType: 'panel', x, y: 0.08, width: 0.24, height: 0.5 },
          fit,
        }),
        annotation.text({
          id: `label-${fit}`,
          content: buildTextContent(fit),
          at: { anchorType: 'panel', x, y: 0.62 },
          width: 0.24,
          backgroundColor: '#fff59d',
          backgroundColorStyle: 'opaque',
        }),
      ]);
      const configAnnotations = fitDemos.flatMap(({ fit, x }): NonNullable<GraphConfig['annotations']> => [
        {
          id: `image-${fit}`,
          type: 'image',
          src: smile,
          layer: 'abovePlot',
          x,
          y: 0.08,
          width: 0.24,
          height: 0.5,
          fit,
        },
        {
          id: `label-${fit}`,
          type: 'text',
          content: buildTextContent(fit),
          x,
          y: 0.62,
          width: 0.24,
          backgroundColor: '#fff59d',
          backgroundColorStyle: 'opaque',
        },
      ]);
      return {
        spec: buildSpec(specAnnotations),
        configForApi: buildConfigForApi(configAnnotations),
      };
    }, []);

    return (
      <VizStoryGraphProvider data={salesData} spec={spec} config={configForApi}>
        <GraphRenderer />
      </VizStoryGraphProvider>
    );
  },
};
