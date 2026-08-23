import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';
import type { GraphConfig } from '@graphysdk/viz-engine/graph-config';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Transitions',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Datasets ──────────────────────────────────────────────────────────────

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const datasetRevenues = {
  steady: [1200, 1400, 1300, 1500, 1400, 1350],
  growth: [800, 1200, 1800, 2400, 3200, 4000],
  volatile: [3000, 800, 2500, 400, 3500, 1000],
  decline: [4000, 3200, 2400, 1800, 1200, 600],
} as const;

type DatasetName = keyof typeof datasetRevenues;
const datasetNames = Object.keys(datasetRevenues) as DatasetName[];
const FIRST_DATASET: DatasetName = 'steady';

const buildSingleSeriesData = (name: DatasetName): Data => ({
  columns: [{ key: 'month' }, { key: 'revenue' }],
  rows: months.map((month, index) => ({ month, revenue: datasetRevenues[name][index] ?? 0 })),
});

// ─── Multi-series datasets ─────────────────────────────────────────────────

const multiDatasetSales = {
  balanced: {
    North: [300, 400, 350, 500, 450, 600],
    South: [280, 380, 330, 480, 420, 560],
  },
  diverging: {
    North: [200, 400, 600, 800, 1000, 1200],
    South: [1200, 1000, 800, 600, 400, 200],
  },
  northDominant: {
    North: [800, 900, 1000, 1100, 1200, 1300],
    South: [100, 150, 120, 180, 140, 160],
  },
} as const;

type MultiDatasetName = keyof typeof multiDatasetSales;
const multiDatasetNames = Object.keys(multiDatasetSales) as MultiDatasetName[];
const FIRST_MULTI_DATASET: MultiDatasetName = 'balanced';

const buildMultiSeriesData = (name: MultiDatasetName): Data => ({
  columns: [{ key: 'month' }, { key: 'North' }, { key: 'South' }],
  rows: months.map((month, index) => ({
    month,
    North: multiDatasetSales[name].North[index] ?? 0,
    South: multiDatasetSales[name].South[index] ?? 0,
  })),
});

const multiReshapeToLong = transform.reshape({
  keep: ['month'],
  reshape: ['North', 'South'],
  keyName: 'region',
  valueName: 'sales',
});

// ─── Shared controls ───────────────────────────────────────────────────────

const buttonStyle = (isActive: boolean) => ({
  padding: '6px 14px',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: isActive ? '#333' : '#fff',
  color: isActive ? '#fff' : '#333',
  cursor: 'pointer' as const,
  fontSize: 13,
  fontWeight: isActive ? 600 : 400,
});

/**
 * Dataset switcher that flips the controlled `data` prop on the surrounding `<GraphProvider>`.
 * The spec is unchanged across swaps, so id-keyed renderers can transition marks.
 */
const DatasetSwitcher = <T extends string>({
  names,
  active,
  onChange,
}: {
  names: T[];
  active: T;
  onChange: (name: T) => void;
}) => {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {names.map((name) => (
        <button
          key={name}
          style={buttonStyle(name === active)}
          onClick={() => {
            if (name !== active) onChange(name);
          }}
        >
          {name}
        </button>
      ))}
    </div>
  );
};

const TransitionsToggle = ({ isEnabled, onChange }: { isEnabled: boolean; onChange: (value: boolean) => void }) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      Transitions:
      <input type="checkbox" checked={isEnabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
};

const ControlsRow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
    {children}
  </div>
);

// ─── Scatter datasets ──────────────────────────────────────────────────────

const scatterDatasetPoints = {
  correlated: [
    [10, 15],
    [20, 22],
    [30, 34],
    [40, 45],
    [50, 58],
    [60, 66],
    [70, 78],
    [80, 88],
  ],
  inverse: [
    [10, 85],
    [20, 74],
    [30, 66],
    [40, 55],
    [50, 44],
    [60, 32],
    [70, 24],
    [80, 12],
  ],
  cluster: [
    [42, 48],
    [45, 52],
    [47, 49],
    [50, 55],
    [52, 50],
    [54, 54],
    [55, 47],
    [58, 51],
  ],
  spread: [
    [12, 78],
    [24, 20],
    [38, 62],
    [46, 34],
    [58, 88],
    [66, 16],
    [78, 70],
    [88, 42],
  ],
} as const;

type ScatterDatasetName = keyof typeof scatterDatasetPoints;
const scatterDatasetNames = Object.keys(scatterDatasetPoints) as ScatterDatasetName[];
const FIRST_SCATTER_DATASET: ScatterDatasetName = 'correlated';

const buildScatterData = (name: ScatterDatasetName): Data => ({
  columns: [{ key: 'height' }, { key: 'weight' }],
  rows: scatterDatasetPoints[name].map(([height, weight]) => ({ height, weight })),
});

// ─── Point transitions ──────────────────────────────────────────────────────

export const PointTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<ScatterDatasetName>(FIRST_SCATTER_DATASET);

    const data = useMemo(() => buildScatterData(active), [active]);
    const initialSpec = useMemo(
      () => pipe(createSpec({ x: 'height', y: 'weight' }), geom.point(), scale.x(), scale.y()),
      []
    );

    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'scatter' }), []);

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <ControlsRow>
          <DatasetSwitcher names={scatterDatasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Bar transitions ───────────────────────────────────────────────────────

export const BarTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<DatasetName>(FIRST_DATASET);

    const data = useMemo(() => buildSingleSeriesData(active), [active]);
    const initialSpec = useMemo(
      () => pipe(createSpec({ x: 'month', y: 'revenue' }), geom.bar({ position: 'identity' }), scale.x(), scale.y()),
      []
    );

    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'column' }), []);

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <ControlsRow>
          <DatasetSwitcher names={datasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Line transitions ──────────────────────────────────────────────────────

export const LineTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<DatasetName>(FIRST_DATASET);

    const data = useMemo(() => buildSingleSeriesData(active), [active]);
    const initialSpec = useMemo(
      () => pipe(createSpec({ x: 'month', y: 'revenue' }), geom.line(), scale.x(), scale.y()),
      []
    );

    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'line' }), []);

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <ControlsRow>
          <DatasetSwitcher names={datasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Area transitions ──────────────────────────────────────────────────────

export const AreaTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<DatasetName>(FIRST_DATASET);

    const data = useMemo(() => buildSingleSeriesData(active), [active]);
    const initialSpec = useMemo(
      () => pipe(createSpec({ x: 'month', y: 'revenue' }), geom.area(), scale.x(), scale.y()),
      []
    );

    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'areaStacked' }), []);

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <ControlsRow>
          <DatasetSwitcher names={datasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Stacked bar transitions ───────────────────────────────────────────────

export const StackedBarTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<MultiDatasetName>(FIRST_MULTI_DATASET);

    const data = useMemo(() => buildMultiSeriesData(active), [active]);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec(multiReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
          geom.bar({ position: 'stack' }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );

    const initialConfig = useMemo<GraphConfig>(
      () => ({
        type: 'columnStacked',
        axes: { y: { label: 'sales' } },
      }),
      []
    );

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <ControlsRow>
          <DatasetSwitcher names={multiDatasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Multi-series line transitions ─────────────────────────────────────────

export const MultiLineTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<MultiDatasetName>(FIRST_MULTI_DATASET);

    const data = useMemo(() => buildMultiSeriesData(active), [active]);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec(multiReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
          geom.line(),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );

    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'line', axes: { y: { label: 'sales' } } }), []);

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <ControlsRow>
          <DatasetSwitcher names={multiDatasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Stacked area transitions ──────────────────────────────────────────────

export const StackedAreaTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<MultiDatasetName>(FIRST_MULTI_DATASET);

    const data = useMemo(() => buildMultiSeriesData(active), [active]);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec(multiReshapeToLong, mapping({ x: 'month', y: 'sales', color: 'region' })),
          geom.area({ position: 'stack' }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );

    const initialConfig = useMemo<GraphConfig>(
      () => ({
        type: 'areaStacked',
        axes: { y: { label: 'sales' } },
      }),
      []
    );

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <ControlsRow>
          <DatasetSwitcher names={multiDatasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Pie transitions ──────────────────────────────────────────────────────

// Every dataset shares the same categories so slices keep their identity across switches and
// tween between shapes, rather than remounting and sweeping in as a whole new pie.
const pieDatasetRows = {
  budget: [
    { category: 'Engineering', value: 420 },
    { category: 'Marketing', value: 180 },
    { category: 'Sales', value: 150 },
    { category: 'Operations', value: 95 },
    { category: 'HR', value: 80 },
    { category: 'Legal', value: 75 },
  ],
  afterCuts: [
    { category: 'Engineering', value: 300 },
    { category: 'Marketing', value: 60 },
    { category: 'Sales', value: 140 },
    { category: 'Operations', value: 90 },
    { category: 'HR', value: 45 },
    { category: 'Legal', value: 70 },
  ],
  evenSplit: [
    { category: 'Engineering', value: 100 },
    { category: 'Marketing', value: 100 },
    { category: 'Sales', value: 100 },
    { category: 'Operations', value: 100 },
    { category: 'HR', value: 100 },
    { category: 'Legal', value: 100 },
  ],
  engineeringHeavy: [
    { category: 'Engineering', value: 700 },
    { category: 'Marketing', value: 60 },
    { category: 'Sales', value: 80 },
    { category: 'Operations', value: 50 },
    { category: 'HR', value: 40 },
    { category: 'Legal', value: 30 },
  ],
} as const;

type PieDatasetName = keyof typeof pieDatasetRows;
const pieDatasetNames = Object.keys(pieDatasetRows) as PieDatasetName[];
const FIRST_PIE_DATASET: PieDatasetName = 'budget';

const buildPieData = (name: PieDatasetName): Data => ({
  columns: [{ key: 'category' }, { key: 'value' }],
  rows: [...pieDatasetRows[name]],
});

export const PieTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<PieDatasetName>(FIRST_PIE_DATASET);

    const data = useMemo(() => buildPieData(active), [active]);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: '', y: 'value', color: 'category' }),
          geom.bar({ position: 'fill' }),
          coord.polar({ theta: 'y' }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );

    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'pie' }), []);

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <ControlsRow>
          <DatasetSwitcher names={pieDatasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Donut transitions ────────────────────────────────────────────────────

export const DonutTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<PieDatasetName>(FIRST_PIE_DATASET);

    const data = useMemo(() => buildPieData(active), [active]);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: '', y: 'value', color: 'category' }),
          geom.bar({ position: 'fill' }),
          coord.polar({ theta: 'y', innerRadius: 0.55 }),
          scale.x(),
          scale.y(),
          scale.color.palette()
        ),
      []
    );

    const initialConfig = useMemo<GraphConfig>(() => ({ type: 'donut' }), []);

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <ControlsRow>
          <DatasetSwitcher names={pieDatasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Rose transitions (value grows the radius) ─────────────────────────────

export const RoseTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<DatasetName>(FIRST_DATASET);

    // Months stay fixed across datasets, so each wedge keeps its identity and its radius springs
    // to the new value.
    const data = useMemo(() => buildSingleSeriesData(active), [active]);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: 'month', y: 'revenue', color: 'month' }),
          geom.bar({ position: 'identity' }),
          coord.polar({ theta: 'x' }),
          scale.x.discrete(),
          scale.y({ zero: true }),
          scale.color.palette()
        ),
      []
    );

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec}>
        <ControlsRow>
          <DatasetSwitcher names={datasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Radial bar transitions (value sweeps the angle) ───────────────────────

export const RadialBarTransitions: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [active, setActive] = useState<DatasetName>(FIRST_DATASET);

    // One concentric track per month; switching datasets springs each track's sweep to the new value.
    const data = useMemo(() => buildSingleSeriesData(active), [active]);
    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec({ x: 'month', y: 'revenue', color: 'month' }),
          geom.bar({ position: 'identity' }),
          coord.polar({ theta: 'y', innerRadius: 0.15 }),
          scale.x.discrete(),
          scale.y({ zero: true }),
          scale.color.palette()
        ),
      []
    );

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec}>
        <ControlsRow>
          <DatasetSwitcher names={datasetNames} active={active} onChange={setActive} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </ControlsRow>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};

// ─── Large dataset transitions ─────────────────────────────────────────────

const regionNames = ['North', 'South', 'East', 'West'];

function generateStackedBarData(pointCount: number, seed: number): Data {
  const categoriesPerRegion = Math.floor(pointCount / regionNames.length);
  const rows: Array<Record<string, string | number>> = [];

  // Simple seeded pseudo-random for reproducible datasets
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };

  for (let i = 0; i < categoriesPerRegion; i++) {
    const row: Record<string, string | number> = { category: `C${i + 1}` };
    for (const region of regionNames) {
      row[region] = Math.round(200 + random() * 800);
    }
    rows.push(row);
  }

  return {
    columns: [{ key: 'category' }, ...regionNames.map((region) => ({ key: region }))],
    rows,
  };
}

const largeReshapeToLong = transform.reshape({
  keep: ['category'],
  reshape: regionNames,
  keyName: 'region',
  valueName: 'value',
});

const sizeOptions = {
  '100': 100,
  '500': 500,
  '1k': 1000,
  '2k': 2000,
  '5k': 5000,
  '10k': 10000,
} as const;

type SizeName = keyof typeof sizeOptions;
const sizeNames = Object.keys(sizeOptions) as SizeName[];
const FIRST_SIZE: SizeName = '100';

type DatasetVariant = 'dataset-1' | 'dataset-2';
const datasetVariants: DatasetVariant[] = ['dataset-1', 'dataset-2'];
const variantSeeds: Record<DatasetVariant, number> = { 'dataset-1': 42, 'dataset-2': 777 };
const FIRST_VARIANT: DatasetVariant = 'dataset-1';

/**
 * Two-axis switcher for the large-dataset story: one button group picks size, another picks
 * variant. Both flip the controlled `data` prop on the surrounding `<GraphProvider>`.
 */
const LargeDatasetControls = ({
  size,
  variant,
  onSizeChange,
  onVariantChange,
}: {
  size: SizeName;
  variant: DatasetVariant;
  onSizeChange: (next: SizeName) => void;
  onVariantChange: (next: DatasetVariant) => void;
}) => {
  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        {sizeNames.map((name) => (
          <button
            key={name}
            style={buttonStyle(name === size)}
            onClick={() => {
              if (name !== size) onSizeChange(name);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {datasetVariants.map((name) => (
          <button
            key={name}
            style={buttonStyle(name === variant)}
            onClick={() => {
              if (name !== variant) onVariantChange(name);
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </>
  );
};

export const LargeDataset: Story = {
  render: () => {
    const [areTransitionsEnabled, setAreTransitionsEnabled] = useState(true);
    const [size, setSize] = useState<SizeName>(FIRST_SIZE);
    const [variant, setVariant] = useState<DatasetVariant>(FIRST_VARIANT);

    const data = useMemo(() => generateStackedBarData(sizeOptions[size], variantSeeds[variant]), [size, variant]);

    const initialSpec = useMemo(
      () =>
        pipe(
          createSpec(largeReshapeToLong, mapping({ x: 'category', y: 'value', color: 'region' })),
          geom.bar({ position: 'stack' }),
          scale.x(),
          scale.y(),
          scale.color.palette(),
          config({ content: { title: 'Large Dataset', subtitle: 'A large dataset with many categories and regions' } })
        ),
      []
    );

    const initialConfig = useMemo<GraphConfig>(
      () => ({
        type: 'columnStacked',
        content: { title: 'Large Dataset', subtitle: 'A large dataset with many categories and regions' },
      }),
      []
    );

    return (
      <VizStoryGraphProvider data={data} spec={initialSpec} config={initialConfig}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <LargeDatasetControls size={size} variant={variant} onSizeChange={setSize} onVariantChange={setVariant} />
          <TransitionsToggle isEnabled={areTransitionsEnabled} onChange={setAreTransitionsEnabled} />
        </div>
        <GraphRenderer animation={{ transitions: areTransitionsEnabled }} />
      </VizStoryGraphProvider>
    );
  },
};
