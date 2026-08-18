import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useState } from 'react';

import { defineGeomRenderer, GraphProvider, GraphRenderer } from '@graphysdk/react-renderer';
import type { CompiledGeom, CustomPalettesInput, Data, Plugin, SpecInput, VizDiagnostic } from '@graphysdk/viz-engine';
import {
  createSpec,
  Dataset,
  Geom,
  geom,
  highlight,
  mapping,
  pipe,
  scale,
  style,
  styles,
  transform,
} from '@graphysdk/viz-engine';

// ─── Shared data ──────────────────────────────────────────────────────────────

const data: Data = {
  columns: [{ key: 'category' }, { key: 'revenue' }],
  rows: [
    { category: 'Product A', revenue: 1200 },
    { category: 'Product B', revenue: 1800 },
    { category: 'Product C', revenue: 2400 },
    { category: 'Product D', revenue: 1600 },
    { category: 'Product E', revenue: 3200 },
  ],
};

// ─── Specs ──────────────────────────────────────────────────────────────────

/** A perfectly valid bar chart — used to prove the boundary isolates failures to one chart. */
const validSpec: SpecInput = pipe(
  createSpec(),
  mapping({ x: 'category', y: 'revenue' }),
  geom.bar(),
  scale.x(),
  scale.y()
);

/**
 * Each failure mode is a different invalid spec that the engine rejects with a *different*
 * `UserInputError` code. Because the compiler is non-throwing (`compile` returns a result), none of these unwind
 * the page — they surface as a {@link VizDiagnostic} in the panel and through `onError`.
 */
interface FailureMode {
  label: string;
  /** The stable `code` the engine reports — the machine-readable contract codegen binds to. */
  code: string;
  spec: SpecInput;
}

const FAILURE_MODES: FailureMode[] = [
  {
    label: 'Mapping to a missing column',
    code: 'UNKNOWN_VARIABLE',
    spec: pipe(createSpec(), mapping({ x: 'category', y: 'profit' }), geom.bar(), scale.x(), scale.y()),
  },
  {
    label: 'Required aesthetic not mapped',
    code: 'MISSING_AESTHETIC',
    spec: pipe(createSpec(), mapping({ x: 'category' }), geom.point(), scale.x(), scale.y()),
  },
  {
    label: "'count' stat combined with a 'y' mapping",
    code: 'CONFLICTING_STAT_MAPPING',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue' }),
      geom.bar({ stat: 'count' }),
      scale.x(),
      scale.y()
    ),
  },
  {
    label: "Discrete-only 'lineType' scale fed a numeric column",
    code: 'INCOMPATIBLE_TYPE',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue', lineType: 'revenue' }),
      geom.line(),
      scale.x(),
      scale.y(),
      scale.lineType.discrete()
    ),
  },
];

const FAILURE_MODE_LABELS = FAILURE_MODES.map((mode) => mode.label);
const findFailureMode = (label: string): FailureMode => {
  const mode = FAILURE_MODES.find((candidate) => candidate.label === label) ?? FAILURE_MODES[0];
  if (!mode) throw new Error('FAILURE_MODES must not be empty');
  return mode;
};

/**
 * Specs that compile successfully but emit a *warning*. A warning is recoverable: the engine degrades
 * gracefully rather than failing — dropping a decoration, falling a scale back to linear, or rendering
 * an empty chart — so the chart still renders and the warning is delivered through `onWarnings`, never
 * the panel. (A failure that corrupts the chart's structure or data — see the gallery above — stays fatal.)
 */
const WARNING_MODES: FailureMode[] = [
  {
    label: 'Palette override id does not resolve (drops the override)',
    code: 'PALETTE_NOT_FOUND',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue', color: 'category' }),
      geom.bar(),
      scale.x(),
      scale.y(),
      scale.color.palette({ palette: { type: 'graphy' }, overrides: { 1: { id: 'nonexistent-brand-id' } } })
    ),
  },
  {
    label: 'Custom palette id never registered (falls back to default)',
    code: 'PALETTE_NOT_FOUND',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue', color: 'category' }),
      geom.bar(),
      scale.x(),
      scale.y(),
      scale.color.palette({ palette: { type: 'custom', id: 'brand-palette' } })
    ),
  },
  {
    label: 'Ordering operator on a categorical highlight (drops the highlight)',
    code: 'INVALID_PREDICATE_OPERATOR',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue' }),
      geom.bar(),
      scale.x(),
      scale.y(),
      highlight({ variable: 'category', gt: 'Product B' })
    ),
  },
  {
    label: 'Highlight targets a layer id no layer carries (drops the highlight)',
    code: 'UNKNOWN_LAYER_ID',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue' }),
      geom.bar(),
      scale.x(),
      scale.y(),
      highlight({ variable: 'category', eq: 'Product A' }, { layerId: 'no-such-layer' })
    ),
  },
  {
    label: 'Style entry with an undrawable color (dropped; the built-in look renders)',
    code: 'INVALID_STYLE_RULE',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue' }),
      geom.bar(),
      scale.x(),
      scale.y(),
      styles({ defaults: [style.geom({ color: 'not a color' } as never)] })
    ),
  },
  {
    label: 'Highlight predicate references an unknown variable (drops the highlight)',
    code: 'UNKNOWN_VARIABLE',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue' }),
      geom.bar(),
      scale.x(),
      scale.y(),
      highlight({ variable: 'nonexistent', eq: 'Product A' })
    ),
  },
  {
    label: 'Log scale over a zero-baseline domain (falls back to a linear scale)',
    code: 'INCOMPATIBLE_SCALE_DOMAIN',
    spec: pipe(createSpec(), mapping({ x: 'category', y: 'revenue' }), geom.bar(), scale.x(), scale.y.log()),
  },
  {
    label: 'A filter removes every row (nothing left to plot)',
    code: 'EMPTY_DATASET',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue' }),
      transform.filter({ variableName: 'revenue', operator: 'gt', value: 100_000 }),
      geom.bar(),
      scale.x(),
      scale.y()
    ),
  },
  {
    label: "Mapping an aesthetic the geom doesn't declare ('size' on a bar; the mapping is ignored)",
    code: 'UNDECLARED_AESTHETIC',
    spec: pipe(
      createSpec(),
      mapping({ x: 'category', y: 'revenue', size: 'revenue' }),
      geom.bar(),
      scale.x(),
      scale.y()
    ),
  },
];

// ─── Presentation helpers ───────────────────────────────────────────────────────

const CHART_WIDTH = 460;
const CHART_HEIGHT = 300;

const SEVERITY_STYLE: Record<VizDiagnostic['severity'], { background: string; color: string }> = {
  error: { background: '#FDE7E7', color: '#C0392B' },
  warning: { background: '#FBF1DD', color: '#9C6B16' },
};

const Label = ({ children }: { children: ReactNode }) => (
  <div style={{ fontFamily: 'sans-serif', fontSize: 12, color: '#666', marginBottom: 6 }}>{children}</div>
);

/** Renders the structured `VizDiagnostic`s captured from `onError` / `onWarnings` — the machine-readable view. */
const DiagnosticsReadout = ({ title, diagnostics }: { title: string; diagnostics: VizDiagnostic[] }) => {
  if (diagnostics.length === 0) return null;
  return (
    <div style={{ marginTop: 10, fontFamily: 'sans-serif', fontSize: 12 }}>
      <div style={{ color: '#666', marginBottom: 4 }}>{title}</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {diagnostics.map((diagnostic, index) => (
          <li
            key={`${diagnostic.code}-${index}`}
            style={{ border: '1px solid #eee', borderRadius: 6, padding: '6px 8px', background: '#fafafa' }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span
                style={{
                  ...SEVERITY_STYLE[diagnostic.severity],
                  fontSize: 10,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  borderRadius: 4,
                  padding: '1px 6px',
                }}
              >
                {diagnostic.severity}
              </span>
              <code style={{ fontWeight: 600 }}>{diagnostic.code}</code>
              <span style={{ color: '#999' }}>· {diagnostic.kind}</span>
            </div>
            <div style={{ marginTop: 4, color: '#333' }}>{diagnostic.message}</div>
            {diagnostic.suggestion && (
              <div style={{ marginTop: 2, color: '#777', fontStyle: 'italic' }}>{diagnostic.suggestion}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * One chart in its own {@link GraphProvider}, capturing `onError` / `onWarnings` so the structured
 * diagnostics can be shown beside the chart. A failed compile shows the panel in place; a warning
 * leaves the chart rendered and only populates the readout.
 */
const GraphCard = ({
  spec,
  customPalettes,
  plugins,
  label,
  children,
  shouldDisplayDiagnostics = false,
}: {
  spec: SpecInput;
  customPalettes?: CustomPalettesInput;
  /** Custom geoms / stats / transforms (and their render halves) to register — drives the registration diagnostics. */
  plugins?: readonly Plugin[];
  label?: ReactNode;
  /** Override the provider's content — used to inject a component that throws during render. */
  children?: ReactNode;
  /** Whether to display the diagnostics readouts. */
  shouldDisplayDiagnostics?: boolean;
}) => {
  const [errors, setErrors] = useState<VizDiagnostic[]>([]);
  const [warnings, setWarnings] = useState<VizDiagnostic[]>([]);

  return (
    <div style={{ width: CHART_WIDTH }}>
      {label && <Label>{label}</Label>}
      <GraphProvider
        input={spec}
        data={data}
        customPalettes={customPalettes}
        plugins={plugins}
        onError={setErrors}
        onWarnings={setWarnings}
      >
        {children ?? <GraphRenderer sizing={{ mode: 'fixed', width: CHART_WIDTH, height: CHART_HEIGHT }} />}
      </GraphProvider>
      {shouldDisplayDiagnostics && (
        <>
          <DiagnosticsReadout title="onError reported" diagnostics={errors} />
          <DiagnosticsReadout title="onWarnings reported" diagnostics={warnings} />
        </>
      )}
    </div>
  );
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

interface StoryArgs {
  failureMode: string;
}

const meta: Meta<StoryArgs> = {
  title: 'Utils/Error Boundary',
  args: {
    failureMode: FAILURE_MODE_LABELS[0],
  },
  argTypes: {
    failureMode: {
      control: { type: 'select' },
      options: FAILURE_MODE_LABELS,
      description: 'Which invalid spec to feed the chart. Each is rejected with a different UserInputError code.',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
The engine compiles a spec without throwing (\`compile\` returns a result), so an invalid spec doesn't unwind the
page — it produces a structured \`VizDiagnostic\`. \`<GraphProvider>\` routes both kinds of failure
through a **single** \`GraphErrorBoundary\`:

- **Compile failures** (a missing column, a stat/mapping contradiction, an incompatible scale type)
  are handed to the boundary as \`forcedErrors\`; it shows the \`GraphErrorPanel\` in place.
- **Render-throws** from a renderer component are caught by the same boundary and render the same panel.

So there is exactly one panel call site, and the rest of the page keeps rendering either way. Every
failure also fires \`onError(errors)\` with the machine-readable \`code\` / \`kind\` / \`context\` /
\`suggestion\` — what codegen reads to auto-correct.

**Warnings are different**: a recoverable problem (e.g. a palette override id that doesn't resolve)
is *not* fatal. The chart renders normally and the warning is delivered through \`onWarnings\` —
never the panel. See the **Warnings** story.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Every failure mode at once, so the distinct codes and panels are visible side by side. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {FAILURE_MODES.map((mode) => (
        <GraphCard key={mode.label} spec={mode.spec} label={`${mode.label} → ${mode.code}`} />
      ))}
    </div>
  ),
};

/**
 * A compile that succeeds but emits a warning. The chart renders normally — the warning is *not*
 * fatal — and is delivered through `onWarnings`, shown in the readout below the chart.
 */
export const Warnings: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {WARNING_MODES.map((mode) => (
        <GraphCard
          key={mode.label}
          spec={mode.spec}
          label={`${mode.label} → renders + ${mode.code}`}
          shouldDisplayDiagnostics
        />
      ))}
    </div>
  ),
};

/**
 * One broken chart between two valid ones. The boundary scopes the failure to its own chart, so its
 * siblings render normally — exactly what the per-chart boundary buys over a page-level one.
 */
export const Isolation: Story = {
  render: (args) => {
    const mode = findFailureMode(args.failureMode);
    return (
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <GraphCard key="valid-left" spec={validSpec} label="Valid chart" />
        <GraphCard key={mode.label} spec={mode.spec} label={`Broken chart → ${mode.code}`} />
        <GraphCard key="valid-right" spec={validSpec} label="Valid chart" />
      </div>
    );
  },
};

/**
 * A renderer component that throws *during render* (not a compile failure). The same boundary
 * catches it and shows the same panel — a non-`VizError` throw is normalised to an
 * `INTERNAL_INVARIANT` diagnostic — proving both failure modes share one surface.
 */
const Boom = (): never => {
  throw new Error('A renderer component threw during render');
};

export const RenderThrow: Story = {
  render: () => (
    <GraphCard
      key="render-throw"
      spec={validSpec}
      label="A child throws during render → same panel, INTERNAL_INVARIANT"
    >
      <Boom />
    </GraphCard>
  ),
};

/**
 * Toggle between the broken and valid spec. Because the boundary resets when its `input` changes,
 * switching back to a valid spec recovers the chart with no remount or page reload.
 */
const RecoveryDemo = ({ failureMode }: StoryArgs) => {
  const [isBroken, setIsBroken] = useState(true);
  const mode = findFailureMode(failureMode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <button
        type="button"
        onClick={() => setIsBroken((previous) => !previous)}
        style={{
          fontFamily: 'sans-serif',
          fontSize: 13,
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid #ccc',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        {isBroken ? 'Fix the chart' : 'Break the chart'}
      </button>
      <GraphCard key={isBroken ? mode.label : 'valid'} spec={isBroken ? mode.spec : validSpec} />
    </div>
  );
};

export const Recovery: Story = {
  render: (args) => <RecoveryDemo {...args} />,
};

// ─── Registration diagnostics (custom plugins) ───────────────────────────────────

/** A minimal custom geom. Its compile body is never reached in these stories — the diagnostics fire
 * from registration alone (the bar spec uses only the built-in `bar`). */
class DotGeom extends Geom {
  readonly type = 'dot';
  override readonly defaultParams = {};
  compile(): CompiledGeom {
    return { data: new Dataset(), mapping: {} };
  }
}

const dotRenderer = (): Plugin =>
  defineGeomRenderer(new DotGeom(), {
    coord: 'cartesian',
    render: () => null,
    renderHover: () => null,
    renderHoverCompanions: () => null,
  });

/**
 * Misconfigured `plugins` arrays surface through the same diagnostic path as bad specs — nothing
 * throws. Registering a custom geom's compile half with no renderer is a fatal error (the panel);
 * registering two render halves on the same `(geom, coord)` resolves last-in-array-wins and only
 * warns, so the chart still renders.
 */
export const RegistrationDiagnostics: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <GraphCard
        key="missing-renderer"
        spec={validSpec}
        plugins={[new DotGeom()]}
        label="Custom geom registered without a renderer → MISSING_GEOM_RENDERER (panel)"
        shouldDisplayDiagnostics
      />
      <GraphCard
        key="renderer-collision"
        spec={validSpec}
        plugins={[dotRenderer(), dotRenderer()]}
        label="Two distinct geoms named 'dot' → DUPLICATE_REGISTERED_TYPE (one warning, renders)"
        shouldDisplayDiagnostics
      />
    </div>
  ),
};
