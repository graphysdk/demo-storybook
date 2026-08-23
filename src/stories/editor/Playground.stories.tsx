import type { Meta, StoryObj } from '@storybook/react';
import { type CSSProperties, type ReactNode, useState } from 'react';

import {
  AppearanceSection,
  AxisSection,
  BarSection,
  CalloutsSection,
  CaptionSection,
  EditableGraphRenderer,
  EditorPanel,
  GoalSection,
  GraphOptionsSection,
  GraphTypeSection,
  GridSection,
  HeadlineSection,
  LegendSection,
  LineSection,
  NumberFormatSection,
  PointSection,
  PolarSection,
  SourceSection,
  SubtitleSection,
  TextSizeSection,
  TitleSection,
  TrendsAndAveragesSection,
} from '@graphysdk/react-renderer/editable';
import type { Data } from '@graphysdk/viz-engine';
import { config, pipe } from '@graphysdk/viz-engine';

import { EditorHistoryTrail } from '../../components/EditorHistoryTrail';
import { FILLS_VIEWPORT, PanelStoryLayout } from '../../components/PanelStoryLayout';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

import {
  panelAreaStorySpec,
  panelBarStorySpec,
  panelComboStorySpec,
  panelDonutStorySpec,
  panelLineStorySpec,
  panelPieStorySpec,
  panelPointStorySpec,
  panelPolarBarStorySpec,
  panelRadarStorySpec,
  panelSliceStoryData,
  panelStackedBarStorySpec,
  panelStoryData,
} from './panel-story-data';

const meta: Meta = {
  title: 'Editor/Playground',
  parameters: {
    docs: {
      description: {
        component:
          'The editor as a host assembles it: a chart, its history underneath, and a tabbed panel beside it. ' +
          'What is here is what the panel can edit today; what each tab is still missing is named under it.\n\n' +
          "**History is the host's, not the panel's.** The trail under the chart reads `useGraphHistory` from " +
          "the package's *main* entry, so a host writing its own editor gets undo without shipping our panel. " +
          'It also shows what counts as one step: a typed title seals into a single entry rather than one per ' +
          'keystroke.',
      },
    },
  },
};

export default meta;

type ChartKind = (typeof CHART_KINDS)[number];

const CHART_KINDS = [
  'bar',
  'stacked bar',
  'line',
  'area',
  'point',
  'combo',
  'pie',
  'donut',
  'polar bar',
  'radar',
] as const;

/**
 * Every text slot filled, so each content section opens on something rather than an empty field. The
 * caption and the source are shown explicitly: unlike the title and subtitle both default to hidden,
 * so writing one without saying so leaves the chart looking as though the text never arrived.
 */
const SEEDED_CONTENT = config({
  content: {
    title: 'Apple revenue by product line',
    subtitle: 'Edited entirely from the panel beside it',
    caption: 'Summed across the Americas, Europe and China. Quarterly, in US dollars.',
    isCaptionVisible: true,
    source: { label: 'Quarterly revenue filings', url: 'https://example.com/revenue' },
    isSourceVisible: true,
  },
});

/** Which chart the panel opens on. The panel narrows itself per geom, and the polar pair carries angles
 * the type section does not set, so each starting point exercises different branches. */
const SPECS: Record<ChartKind, typeof panelBarStorySpec> = {
  bar: pipe(panelBarStorySpec, SEEDED_CONTENT),
  'stacked bar': pipe(panelStackedBarStorySpec, SEEDED_CONTENT),
  line: pipe(panelLineStorySpec, SEEDED_CONTENT),
  area: pipe(panelAreaStorySpec, SEEDED_CONTENT),
  point: pipe(panelPointStorySpec, SEEDED_CONTENT),
  combo: pipe(panelComboStorySpec, SEEDED_CONTENT),
  pie: pipe(panelPieStorySpec, SEEDED_CONTENT),
  donut: pipe(panelDonutStorySpec, SEEDED_CONTENT),
  'polar bar': pipe(panelPolarBarStorySpec, SEEDED_CONTENT),
  radar: pipe(panelRadarStorySpec, SEEDED_CONTENT),
};

/** A ring divides one figure per product, so the round charts read the quarters already summed. */
const DATA: Partial<Record<ChartKind, Data>> = {
  pie: panelSliceStoryData,
  donut: panelSliceStoryData,
};

interface PanelTab {
  id: string;
  label: string;
  /** What is still unbuilt in this tab. */
  missing?: string;
  sections: ReactNode;
}

/** Every section appears in exactly one tab: chart-level under Graph, per-element tuning under Fine tune. */
const TABS = [
  {
    id: 'graph',
    label: 'Graph',
    sections: (
      <>
        <GraphTypeSection />
        <GraphOptionsSection />
        <GridSection />
        <HeadlineSection />
        <LegendSection />
        <NumberFormatSection />
      </>
    ),
  },
  {
    id: 'fine-tune',
    label: 'Fine tune',
    sections: (
      <>
        <AxisSection axis="x" />
        <AxisSection axis="y" />
        <PolarSection />
        <BarSection />
        <LineSection />
        <PointSection />
      </>
    ),
  },
  {
    id: 'design',
    label: 'Design',
    missing: 'background, border, series colours — all waiting on a colour picker control',
    sections: <AppearanceSection />,
  },
  {
    id: 'annotate',
    label: 'Annotate',
    missing: 'call-outs and highlights',
    sections: (
      <>
        <CalloutsSection />
        <TitleSection />
        <SubtitleSection />
        <CaptionSection />
        <SourceSection />
        <GoalSection />
        <TrendsAndAveragesSection />
      </>
    ),
  },
  {
    id: 'size',
    label: 'Size',
    missing: 'chart dimensions and padding',
    sections: <TextSizeSection />,
  },
] as const satisfies readonly PanelTab[];

type TabId = (typeof TABS)[number]['id'];

const tabBarStyle: CSSProperties = {
  display: 'flex',
  gap: 4,
  paddingBlockEnd: 8,
};

const tabStyle: CSSProperties = {
  font: 'inherit',
  fontSize: 12,
  padding: '5px 10px',
  borderRadius: 6,
  border: '1px solid transparent',
  background: 'transparent',
  cursor: 'pointer',
};

const selectedTabStyle: CSSProperties = {
  ...tabStyle,
  background: 'rgb(124 58 237 / 0.12)',
  fontWeight: 600,
};

const missingStyle: CSSProperties = {
  padding: '12px 4px',
  fontSize: 11,
  opacity: 0.55,
};

/**
 * A host's own tab bar, styled with nothing of ours: which panel a host shows is its concern, and v1
 * keeps the rail outside the panel too. Switching tabs remounts the root, so each opens on its own
 * default section rather than inheriting the last one.
 */
const TabbedPanel = () => {
  const [selected, setSelected] = useState<TabId>(TABS[0].id);
  const tab = TABS.find((candidate) => candidate.id === selected) ?? TABS[0];

  return (
    <>
      <div style={tabBarStyle} role="tablist">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === selected}
            style={id === selected ? selectedTabStyle : tabStyle}
            onClick={() => setSelected(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <EditorPanel.Root key={tab.id}>{tab.sections}</EditorPanel.Root>
      {'missing' in tab ? <p style={missingStyle}>Still to build here: {tab.missing}.</p> : null}
    </>
  );
};

const ChartWithHistory = (): ReactNode => (
  <>
    <div style={{ flex: 1, minBlockSize: 0 }}>
      <EditableGraphRenderer mode="editable" />
    </div>
    <EditorHistoryTrail />
  </>
);

export const Playground: StoryObj<{ chart: ChartKind }> = {
  name: 'The editor',
  args: { chart: 'bar' },
  argTypes: {
    chart: {
      control: 'inline-radio',
      options: CHART_KINDS,
      description:
        'Which chart the panel opens on. The type section takes it from there, but it reaches only the types a ' +
        'geom-and-coords switch can name: a rose chart and a radar are reachable here and nowhere in the grid. ' +
        'Sections narrow what they offer to what the chart supports, so this changes the panel as well as the ' +
        'picture: a bar pins its value axis to zero and offers category labels, while a radar keeps its grid and ' +
        'loses every label row.',
    },
  },
  render: ({ chart }) => (
    <VizStoryGraphProvider data={DATA[chart] ?? panelStoryData} spec={SPECS[chart]}>
      <PanelStoryLayout chart={<ChartWithHistory />} panelWidth={360} blockSize={FILLS_VIEWPORT}>
        <TabbedPanel />
      </PanelStoryLayout>
    </VizStoryGraphProvider>
  ),
};
