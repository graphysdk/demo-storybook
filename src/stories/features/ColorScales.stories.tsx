import type { Meta, StoryObj } from '@storybook/react';
import { Fragment, useState } from 'react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { ColorInterpolationSpace, ColorSchemeName, Data, SampleColorSchemeOptions } from '@graphysdk/viz-engine';
import {
  COLOR_INTERPOLATION_SPACES,
  config,
  createSpec,
  DIVERGING_SCHEME_NAMES,
  geom,
  pipe,
  sampleColorScheme,
  scale,
  SEQUENTIAL_SCHEME_NAMES,
  style,
  styles as vizStyles,
} from '@graphysdk/viz-engine';

import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

import styles from './ColorScales.module.css';

const meta: Meta = {
  title: 'Features/Color Scales',
};

export default meta;

// Playground datasets for the colour scatter: `change` (year-on-year %) drives both the x-position and the
// colour, so the ramp sweeps once left→right instead of jumping around. Marker size is fixed, not mapped:
// if size tracked `change`, the small-magnitude end of a lopsided dataset would shrink to invisibility just
// where its colour is what we want to read. The presets differ only in how their extent sits around zero —
// which is exactly what the "Diverging (pin 0)" toggle acts on: a balanced extent hides the toggle (its data
// midpoint already lands near zero); a lopsided one makes pinning the neutral to zero visibly shift the ramp.
type ChangeRow = { volume: number; change: number };

const buildChangeData = (rows: ChangeRow[]): Data => ({
  columns: [{ key: 'volume' }, { key: 'change' }],
  rows,
});

const BALANCED_DATASET = {
  label: 'Balanced',
  hint: 'Extent −14…15 already straddles zero, so its data midpoint sits near zero — pinning barely moves the ramp.',
  data: buildChangeData([
    { volume: 840, change: 12 },
    { volume: 690, change: -8 },
    { volume: 570, change: 3 },
    { volume: 465, change: -14 },
    { volume: 420, change: -5 },
    { volume: 335, change: 9 },
    { volume: 290, change: 15 },
    { volume: 245, change: -2 },
    { volume: 210, change: 7 },
    { volume: 180, change: -11 },
    { volume: 155, change: 4 },
    { volume: 130, change: 10 },
  ]),
};

const MOSTLY_POSITIVE_DATASET = {
  label: 'Mostly positive',
  hint: 'Extent −25…60 is lopsided upward: off puts the neutral colour at ~+18; pinning drops it back to 0.',
  data: buildChangeData([
    { volume: 840, change: 60 },
    { volume: 690, change: 8 },
    { volume: 570, change: 42 },
    { volume: 465, change: -3 },
    { volume: 420, change: -25 },
    { volume: 575, change: -15 },
    { volume: 250, change: -10 },
    { volume: 335, change: 55 },
    { volume: 290, change: 2 },
    { volume: 245, change: 38 },
    { volume: 210, change: -1 },
    { volume: 180, change: 48 },
    { volume: 155, change: 18 },
    { volume: 130, change: 33 },
  ]),
};

const MOSTLY_NEGATIVE_DATASET = {
  label: 'Mostly negative',
  hint: 'Extent −60…25 is the mirror case: off puts the neutral colour at ~−18; pinning recenters it to 0.',
  data: buildChangeData([
    { volume: 840, change: -60 },
    { volume: 690, change: -8 },
    { volume: 570, change: -42 },
    { volume: 465, change: 3 },
    { volume: 420, change: 25 },
    { volume: 575, change: 15 },
    { volume: 250, change: 10 },
    { volume: 335, change: -55 },
    { volume: 290, change: -2 },
    { volume: 245, change: -38 },
    { volume: 210, change: 1 },
    { volume: 180, change: -48 },
    { volume: 155, change: -18 },
    { volume: 130, change: -33 },
  ]),
};

const PLAYGROUND_DATASETS = [BALANCED_DATASET, MOSTLY_POSITIVE_DATASET, MOSTLY_NEGATIVE_DATASET];

/** A named scheme (or explicit range) sampled into an even strip of discrete stops. */
const RampStrip = ({
  ramp,
  count,
  title,
  height,
}: {
  ramp: SampleColorSchemeOptions;
  count: number;
  title?: string;
  height?: number;
}) => (
  <div className={styles.swatchStrip} title={title} style={height ? { height } : undefined}>
    {sampleColorScheme(ramp, count).map((color, index) => (
      <div key={`${title ?? 'ramp'}-${index}`} className={styles.swatch} style={{ background: color }} />
    ))}
  </div>
);

// ─── Playground ──────────────────────────────────────────────────────────────
// Pick an existing named scheme or hand-build a custom ramp, then watch it drive a live chart. A custom
// range blends its stops in the chosen interpolation space; `reverse` flips the ramp. Two independent
// diverging knobs: "Diverging (pin 0)" sets `domainMid: 0`, pinning the ramp's neutral stop to zero;
// "Symmetric arms" then balances the domain's two arms about that midpoint so equal +/- magnitudes read at
// equal intensity (on by default, and meaningful only once a midpoint is pinned). Switch the underlying data
// to feel when they matter — a balanced extent barely moves, while a lopsided one recenters under pinning and
// leaves its short arm shy of full saturation under symmetry.

const PREVIEW_STOPS = 20;
const DEFAULT_CUSTOM_STOPS = ['#2166ac', '#f7f7f7', '#b2182b'];

type PlaygroundSource = 'scheme' | 'custom';

const PLAYGROUND_GROUPS: Array<{ label: string; schemes: readonly ColorSchemeName[] }> = [
  { label: 'Sequential', schemes: SEQUENTIAL_SCHEME_NAMES },
  { label: 'Diverging', schemes: DIVERGING_SCHEME_NAMES },
];

const ColorPlaygroundView = () => {
  const [source, setSource] = useState<PlaygroundSource>('scheme');
  const [scheme, setScheme] = useState<ColorSchemeName>('viridis');
  const [stops, setStops] = useState<string[]>(DEFAULT_CUSTOM_STOPS);
  const [interpolate, setInterpolate] = useState<ColorInterpolationSpace>('lab');
  const [reverse, setReverse] = useState(false);
  const [diverging, setDiverging] = useState(false);
  const [symmetric, setSymmetric] = useState(true);
  const [dataset, setDataset] = useState(BALANCED_DATASET);

  const setStopAt = (index: number, color: string) =>
    setStops((current) => current.map((stop, position) => (position === index ? color : stop)));
  const addStop = () => setStops((current) => [...current, '#cccccc']);
  const removeStopAt = (index: number) => setStops((current) => current.filter((_, position) => position !== index));

  const ramp: SampleColorSchemeOptions =
    source === 'scheme' ? { scheme, reverse } : { range: stops, interpolate, reverse };
  const smoothGradient = `linear-gradient(to right, ${sampleColorScheme(ramp, 24).join(', ')})`;

  const sourceLines =
    source === 'scheme'
      ? [`  scheme: '${scheme}',`]
      : [`  range: [${stops.map((stop) => `'${stop}'`).join(', ')}],`, `  interpolate: '${interpolate}',`];
  const codeSnippet = [
    'scale.color.continuous({',
    ...sourceLines,
    ...(reverse ? ['  reverse: true,'] : []),
    ...(diverging ? ['  domainMid: 0,', `  symmetric: ${symmetric},`] : []),
    '})',
  ].join('\n');

  const divergingOptions = diverging ? { domainMid: 0, symmetric } : {};
  const colorScale = scale.color.continuous({ ...ramp, ...divergingOptions });

  return (
    <div className={styles.playgroundRoot}>
      <div className={styles.panel}>
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Source</div>
          <div className={styles.radioRow}>
            <label className={styles.inlineChoice}>
              <input type="radio" name="source" checked={source === 'scheme'} onChange={() => setSource('scheme')} />
              Named scheme
            </label>
            <label className={styles.inlineChoice}>
              <input type="radio" name="source" checked={source === 'custom'} onChange={() => setSource('custom')} />
              Custom range
            </label>
          </div>
        </div>

        {source === 'scheme' ? (
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>Scheme</div>
            <div className={styles.schemePicker}>
              {PLAYGROUND_GROUPS.map((group) => (
                <Fragment key={group.label}>
                  <div className={styles.pickerGroupLabel}>{group.label}</div>
                  {group.schemes.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={`${styles.pickerRow} ${scheme === name ? styles.pickerRowSelected : ''}`}
                      onClick={() => setScheme(name)}
                    >
                      <span className={styles.pickerName}>{name}</span>
                      <RampStrip ramp={{ scheme: name, reverse }} count={16} height={14} title={name} />
                    </button>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabel}>Colour stops</div>
              {stops.map((stop, index) => (
                <div key={`stop-${index}`} className={styles.stopRow}>
                  <input
                    type="color"
                    className={styles.stopColor}
                    value={stop}
                    aria-label={`Stop ${index + 1}`}
                    onChange={(event) => setStopAt(index, event.target.value)}
                  />
                  <code className={styles.stopHex}>{stop}</code>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => removeStopAt(index)}
                    disabled={stops.length <= 2}
                    aria-label={`Remove stop ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className={styles.ghostButton} onClick={addStop}>
                + Add stop
              </button>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabel}>Interpolation space</div>
              <div className={styles.radioRow}>
                {COLOR_INTERPOLATION_SPACES.map((space) => (
                  <label key={space} className={styles.inlineChoice}>
                    <input
                      type="radio"
                      name="interpolate"
                      checked={interpolate === space}
                      onChange={() => setInterpolate(space)}
                    />
                    {space}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Data</div>
          <div className={styles.radioRow}>
            {PLAYGROUND_DATASETS.map((preset) => (
              <label key={preset.label} className={styles.inlineChoice}>
                <input type="radio" name="dataset" checked={dataset === preset} onChange={() => setDataset(preset)} />
                {preset.label}
              </label>
            ))}
          </div>
          <p className={styles.fieldHint}>{dataset.hint}</p>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Options</div>
          <div className={styles.radioRow}>
            <label className={styles.inlineChoice}>
              <input type="checkbox" checked={reverse} onChange={(event) => setReverse(event.target.checked)} />
              Reverse
            </label>
            <label className={styles.inlineChoice}>
              <input type="checkbox" checked={diverging} onChange={(event) => setDiverging(event.target.checked)} />
              Diverging (pin&nbsp;0)
            </label>
            <label className={styles.inlineChoice}>
              <input
                type="checkbox"
                checked={symmetric}
                disabled={!diverging}
                onChange={(event) => setSymmetric(event.target.checked)}
              />
              Symmetric&nbsp;arms
            </label>
          </div>
          {diverging && !symmetric && (
            <p className={styles.fieldHint}>
              Raw extent: the neutral colour stays pinned to 0, but the shorter arm still saturates fully, so equal +/−
              magnitudes read at unequal intensity.
            </p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Spec</div>
          <pre className={styles.codeBlock}>{codeSnippet}</pre>
        </div>
      </div>

      <div className={styles.previewStack}>
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Ramp — {PREVIEW_STOPS} stops</div>
          <RampStrip ramp={ramp} count={PREVIEW_STOPS} title="ramp preview" />
          <div className={styles.gradientBar} style={{ background: smoothGradient }} />
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Applied — year-on-year change (%)</div>
          <div className={styles.chartFrame}>
            <VizStoryGraphProvider
              data={dataset.data}
              spec={pipe(
                createSpec({ x: 'change', y: 'volume', color: 'change' }),
                geom.point(),
                vizStyles({ defaults: [style.geom.point({ size: 14 })] }),
                geom.rule({ aes: { x: { value: 0 } }, params: { label: '', labelPosition: 'end' } }),
                scale.x(),
                scale.y(),
                colorScale,
                config({
                  axes: { x: { label: 'Year-on-year change (%)' }, y: { label: 'Volume (units)' } },
                  legend: { position: 'none' },
                })
              )}
            >
              <GraphRenderer />
            </VizStoryGraphProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ColorPlayground: StoryObj = {
  name: 'Playground',
  render: () => <ColorPlaygroundView />,
};
