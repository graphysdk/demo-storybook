import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react';

import { TextMeasurerProvider, useTextMeasurer } from '@graphysdk/react-renderer';
import type { FontSpec, MeasuredText, TextMeasurer } from '@graphysdk/viz-engine';
import {
  CachedTextMeasurer,
  DEFAULT_FONT_STYLE,
  DEFAULT_FONT_WEIGHT,
  HeuristicTextMeasurer,
} from '@graphysdk/viz-engine';

import styles from './TextMeasurement.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestCase {
  label: string;
  text: string;
  font: FontSpec;
  /** Font size expressed in em (relative to parent font-size). */
  sizeEm: number;
}

interface DomMeasurement {
  width: number;
  height: number;
}

interface MeasurementResult {
  testCase: TestCase;
  heuristic: MeasuredText;
  canvas: MeasuredText;
  dom: DomMeasurement;
  errorHeuristic: number;
  errorCanvas: number;
}

interface Section {
  title: string;
  cases: TestCase[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_PARENT_FONT_SIZE = 16;

/** Create a TestCase with size expressed in em (relative to a 16px base). */
const tc = (label: string, text: string, font: Omit<FontSpec, 'size'> & { size: number }): TestCase => ({
  label,
  text,
  font,
  sizeEm: font.size / DEFAULT_PARENT_FONT_SIZE,
});

/** Resolve a TestCase's em size to px given the parent's font-size, returning an updated FontSpec. */
const resolveFont = (testCase: TestCase, parentFontSize: number): FontSpec => ({
  ...testCase.font,
  size: testCase.sizeEm * parentFontSize,
});

// ─── Measurers ───────────────────────────────────────────────────────────────

const heuristicMeasurer = new CachedTextMeasurer(new HeuristicTextMeasurer());

// ─── Test case definitions ───────────────────────────────────────────────────

const FONT_FAMILIES = ['Inter', 'Georgia', 'Courier New', 'Arial', 'Times New Roman', 'Verdana'] as const;

// Family override presets exposed via the Storybook select control. Each value is fed verbatim
// to both the canvas measurer (`FontSpec.family`) and the DOM preview span (`font-family`), so
// the table directly shows whether canvas and DOM agree for the chosen family. Use this to:
//   - confirm `useTextMeasurer` re-measures correctly when a webfont finishes loading,
//   - verify the production Inter+fallbacks chain doesn't trip `ctx.font` parsing,
//   - inspect fallback behaviour when an unknown family forces both sides to substitute.
const PRODUCTION_FALLBACK_CHAIN = `'Inter', -apple-system, BlinkMacSystemFont, 'Open Sans', 'Segoe UI', 'Roboto', 'Oxygen-Sans', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif`;

const FAMILY_OVERRIDE_PRESETS: Record<string, string> = {
  '(per-case default)': '',
  Inter: 'Inter',
  'Production chain (Inter + fallbacks)': PRODUCTION_FALLBACK_CHAIN,
  'sans-serif (generic)': 'sans-serif',
  'serif (generic)': 'serif',
  'monospace (generic)': 'monospace',
  Georgia: 'Georgia',
  'Courier New': 'Courier New',
  'Arial Black': 'Arial Black',
  'Nonexistent family': 'ThisFontDoesNotExist',
};
const FAMILY_OVERRIDE_LABELS = Object.keys(FAMILY_OVERRIDE_PRESETS);

/** If `override` is non-empty, returns a copy of `cases` with each `font.family` swapped. */
const applyFamilyOverride = (cases: TestCase[], override: string): TestCase[] => {
  if (!override) return cases;
  return cases.map((testCase) => ({ ...testCase, font: { ...testCase.font, family: override } }));
};

/**
 * Returns a CSS-safe `font-family` value. Single names are quoted to handle whitespace; values
 * that already contain a comma are list-form (already individually quoted internally) and must
 * pass through unchanged — wrapping the whole list in outer quotes produces malformed CSS that
 * both `ctx.font` and `style.font(Family)` silently reject, falling back to the browser default.
 */
const cssFamily = (family: string): string => (family.includes(',') ? family : `'${family}'`);

const BASE_CASES: TestCase[] = [
  // Basic Latin
  tc('Short word', 'Hello', { family: 'Inter', size: 16 }),
  tc('Sentence', 'The quick brown fox jumps over the lazy dog', { family: 'Inter', size: 16 }),
  tc('All caps', 'TOTAL REVENUE BY QUARTER', { family: 'Inter', size: 14 }),
  tc('All lowercase', 'total revenue by quarter', { family: 'Inter', size: 14 }),

  // Numeric tick labels (most common chart text)
  tc('Integer', '1,234,567', { family: 'Inter', size: 12 }),
  tc('Decimal', '3.14159', { family: 'Inter', size: 12 }),
  tc('Currency', '$1,234.56', { family: 'Inter', size: 12 }),
  tc('Percentage', '98.7%', { family: 'Inter', size: 12 }),
  tc('Abbreviated', '1.2M', { family: 'Inter', size: 12 }),
  tc('Negative', '-$4,200.00', { family: 'Inter', size: 12 }),
  tc('Large number', '999,999,999,999', { family: 'Inter', size: 12 }),

  // Date/time labels
  tc('Short date', 'Jan 2025', { family: 'Inter', size: 12 }),
  tc('Full date', 'January 15, 2025', { family: 'Inter', size: 12 }),
  tc('ISO date', '2025-01-15', { family: 'Inter', size: 12 }),
  tc('Quarter', 'Q1 2025', { family: 'Inter', size: 12 }),
  tc('Time', '14:30:00', { family: 'Inter', size: 12 }),

  // Narrow characters
  tc('All narrow (i,l,t)', 'illitlit', { family: 'Inter', size: 16 }),
  tc('All dots/commas', '.,.,.,.,.,', { family: 'Inter', size: 16 }),
  tc('All pipes', '||||||||||', { family: 'Inter', size: 16 }),

  // Wide characters
  tc('All wide (W,M)', 'WMWMWMWMWM', { family: 'Inter', size: 16 }),
  tc('All @', '@@@@@@@@@@', { family: 'Inter', size: 16 }),

  // Mixed width
  tc('Mixed narrow+wide', 'iWiWiWiWiW', { family: 'Inter', size: 16 }),

  // Special characters
  tc('Symbols', '!@#$%^&*()', { family: 'Inter', size: 14 }),
  tc('Brackets', '[{(<>)}]', { family: 'Inter', size: 14 }),
  tc('Math operators', '+ - * / = < >', { family: 'Inter', size: 14 }),

  // Single character (edge case)
  tc('Single char W', 'W', { family: 'Inter', size: 16 }),
  tc('Single char i', 'i', { family: 'Inter', size: 16 }),
  tc('Single space', ' ', { family: 'Inter', size: 16 }),

  // Empty string
  tc('Empty string', '', { family: 'Inter', size: 16 }),
];

const WEIGHT_CASES: TestCase[] = [
  tc('Weight 100', 'Revenue Growth', { family: 'Inter', size: 16, weight: 100 }),
  tc('Weight 300', 'Revenue Growth', { family: 'Inter', size: 16, weight: 300 }),
  tc('Weight 400 (regular)', 'Revenue Growth', { family: 'Inter', size: 16, weight: 400 }),
  tc('Weight 600 (semibold)', 'Revenue Growth', { family: 'Inter', size: 16, weight: 600 }),
  tc('Weight 700 (bold)', 'Revenue Growth', { family: 'Inter', size: 16, weight: 700 }),
  tc('Weight 900 (black)', 'Revenue Growth', { family: 'Inter', size: 16, weight: 900 }),
];

const STYLE_CASES: TestCase[] = [
  tc('Normal', 'Quarterly Earnings', { family: 'Georgia', size: 16, style: 'normal' }),
  tc('Italic', 'Quarterly Earnings', { family: 'Georgia', size: 16, style: 'italic' }),
  tc('Oblique', 'Quarterly Earnings', { family: 'Georgia', size: 16, style: 'oblique' }),
  tc('Bold italic', 'Quarterly Earnings', { family: 'Georgia', size: 16, weight: 700, style: 'italic' }),
];

const SIZE_CASES: TestCase[] = [
  tc('0.5em (8px @16)', 'Axis Label Text', { family: 'Inter', size: 8 }),
  tc('0.625em (10px @16)', 'Axis Label Text', { family: 'Inter', size: 10 }),
  tc('0.75em (12px @16)', 'Axis Label Text', { family: 'Inter', size: 12 }),
  tc('0.875em (14px @16)', 'Axis Label Text', { family: 'Inter', size: 14 }),
  tc('1em (16px @16)', 'Axis Label Text', { family: 'Inter', size: 16 }),
  tc('1.25em (20px @16)', 'Axis Label Text', { family: 'Inter', size: 20 }),
  tc('1.5em (24px @16)', 'Axis Label Text', { family: 'Inter', size: 24 }),
  tc('2em (32px @16)', 'Axis Label Text', { family: 'Inter', size: 32 }),
  tc('3em (48px @16)', 'Axis Label Text', { family: 'Inter', size: 48 }),
];

const FONT_FAMILY_CASES: TestCase[] = FONT_FAMILIES.map((family) =>
  tc(family, 'Total Revenue $1,234.56', { family, size: 14 })
);

const UNICODE_CASES: TestCase[] = [
  tc('Accented Latin', 'Revenus mensuels par region', { family: 'Inter', size: 14 }),
  tc('German umlauts', 'Ubersicht der Ertrage', { family: 'Inter', size: 14 }),
  tc('CJK characters', '\u6708\u5225\u58F2\u4E0A\u9AD8', { family: 'Inter', size: 14 }),
  tc('Arabic', '\u0627\u0644\u0625\u064A\u0631\u0627\u062F\u0627\u062A', { family: 'Inter', size: 14 }),
  tc('Emoji', '\uD83D\uDCC8\uD83D\uDCC9\uD83D\uDCCA\uD83D\uDCB0\uD83D\uDCB5', { family: 'Inter', size: 14 }),
  tc('Mixed Latin+CJK', 'Sales \u58F2\u4E0A 2025', { family: 'Inter', size: 14 }),
  tc('Currency symbols', '\u00A5\u00A3\u20AC\u20B9\u20A9\u20BD', { family: 'Inter', size: 14 }),
];

const REALISTIC_LABELS: TestCase[] = [
  tc('Y-axis: small', '0', { family: 'Inter', size: 11 }),
  tc('Y-axis: medium', '500K', { family: 'Inter', size: 11 }),
  tc('Y-axis: large', '1,000,000', { family: 'Inter', size: 11 }),
  tc('X-axis: month', 'September', { family: 'Inter', size: 11 }),
  tc('X-axis: short month', 'Sep', { family: 'Inter', size: 11 }),
  tc('Legend item', 'North America', { family: 'Inter', size: 12 }),
  tc('Legend item long', 'Asia Pacific (excluding Japan)', { family: 'Inter', size: 12 }),
  tc('Axis title', 'Revenue (USD, millions)', { family: 'Inter', size: 12, weight: 600 }),
  tc('Chart title', 'Quarterly Revenue by Region', { family: 'Inter', size: 18, weight: 700 }),
  tc('Monospace tick', '14:30:00', { family: 'Courier New', size: 11 }),
  tc('Serif title', 'Annual Financial Summary', { family: 'Georgia', size: 16, weight: 700 }),
];

// ─── DOM measurement helper ──────────────────────────────────────────────────

const measureWithDom = (container: HTMLElement, testCases: TestCase[], parentFontSize: number): DomMeasurement[] => {
  const wrapper = document.createElement('div');
  wrapper.style.fontSize = `${parentFontSize}px`;
  wrapper.style.position = 'absolute';
  wrapper.style.visibility = 'hidden';
  wrapper.style.left = '-9999px';
  container.appendChild(wrapper);

  const span = document.createElement('span');
  span.style.whiteSpace = 'nowrap';
  wrapper.appendChild(span);

  const results = testCases.map((testCase) => {
    const font = testCase.font;
    span.style.font = [
      font.style ?? DEFAULT_FONT_STYLE,
      font.weight ?? DEFAULT_FONT_WEIGHT,
      `${testCase.sizeEm}em`,
      cssFamily(font.family),
    ].join(' ');
    span.textContent = testCase.text || '\u200B';
    const rect = span.getBoundingClientRect();
    return {
      width: testCase.text === '' ? 0 : rect.width,
      height: rect.height,
    };
  });

  container.removeChild(wrapper);
  return results;
};

// ─── Result computation ──────────────────────────────────────────────────────

const computeResults = (
  container: HTMLElement,
  testCases: TestCase[],
  canvas: TextMeasurer,
  parentFontSize: number
): MeasurementResult[] => {
  const domMeasurements = measureWithDom(container, testCases, parentFontSize);
  return testCases.map((testCase, index) => {
    const resolvedFont = resolveFont(testCase, parentFontSize);
    const heuristic = heuristicMeasurer.measureText(testCase.text, resolvedFont);
    const canvasResult = canvas.measureText(testCase.text, resolvedFont);
    const dom = domMeasurements[index] ?? { width: 0, height: 0 };
    const domWidth = dom.width;
    return {
      testCase,
      heuristic,
      canvas: canvasResult,
      dom,
      errorHeuristic: domWidth > 0 ? ((heuristic.width - domWidth) / domWidth) * 100 : 0,
      errorCanvas: domWidth > 0 ? ((canvasResult.width - domWidth) / domWidth) * 100 : 0,
    };
  });
};

// ─── Rendering components ────────────────────────────────────────────────────

const getBadgeClass = (error: number): string | undefined => {
  const abs = Math.abs(error);
  if (abs < 2) return styles.badgeGreen;
  if (abs < 5) return styles.badgeYellow;
  if (abs < 10) return styles.badgeOrange;
  return styles.badgeRed;
};

const ErrorBadge = ({ error }: { error: number }) => (
  <span className={`${styles.badge} ${getBadgeClass(error)}`}>
    {error >= 0 ? '+' : ''}
    {error.toFixed(1)}%
  </span>
);

const VisualOverlay = ({ result, parentFontSize }: { result: MeasurementResult; parentFontSize: number }) => {
  const { testCase, heuristic, canvas, dom } = result;

  return (
    <div className={styles.overlay} style={{ height: Math.max(dom.height, 24) + 8, fontSize: parentFontSize }}>
      <span
        className={styles.overlayText}
        style={{
          fontFamily: cssFamily(testCase.font.family),
          fontSize: `${testCase.sizeEm}em`,
          fontWeight: testCase.font.weight,
          fontStyle: testCase.font.style,
        }}
      >
        {testCase.text || <span className={styles.overlayEmpty}>(empty)</span>}
      </span>
      <div className={styles.overlayLineDom} style={{ width: dom.width }} title={`DOM: ${dom.width.toFixed(1)}px`} />
      <div
        className={styles.overlayLineHeuristic}
        style={{ width: heuristic.width }}
        title={`Heuristic: ${heuristic.width.toFixed(1)}px`}
      />
      <div
        className={styles.overlayLineCanvas}
        style={{ width: canvas.width }}
        title={`Canvas: ${canvas.width.toFixed(1)}px`}
      />
    </div>
  );
};

const ResultsTable = ({
  title,
  results,
  parentFontSize,
}: {
  title: string;
  results: MeasurementResult[];
  parentFontSize: number;
}) => (
  <div className={styles.section}>
    <h3 className={styles.sectionTitle}>{title}</h3>
    <table className={styles.table}>
      <thead>
        <tr className={styles.tableHead}>
          <th className={`${styles.th} ${styles.thLabel}`}>Test case</th>
          <th className={styles.th}>Visual comparison</th>
          <th className={`${styles.th} ${styles.thNumeric}`}>DOM (px)</th>
          <th className={`${styles.th} ${styles.thNumeric}`}>Canvas (px)</th>
          <th className={`${styles.th} ${styles.thNumeric}`}>Heuristic (px)</th>
          <th className={`${styles.th} ${styles.thError}`}>Canvas err</th>
          <th className={`${styles.th} ${styles.thError}`}>Heuristic err</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result, index) => (
          <tr key={index} className={styles.row}>
            <td className={`${styles.cell} ${styles.cellLabel}`}>
              <div>{result.testCase.label}</div>
              <div className={styles.labelSub}>
                {result.testCase.sizeEm}em → {(result.testCase.sizeEm * parentFontSize).toFixed(1)}px
              </div>
            </td>
            <td className={styles.cell}>
              <VisualOverlay result={result} parentFontSize={parentFontSize} />
            </td>
            <td className={`${styles.cell} ${styles.cellNumeric}`}>{result.dom.width.toFixed(1)}</td>
            <td className={`${styles.cell} ${styles.cellNumeric}`}>{result.canvas.width.toFixed(1)}</td>
            <td className={`${styles.cell} ${styles.cellNumeric}`}>{result.heuristic.width.toFixed(1)}</td>
            <td className={`${styles.cell} ${styles.cellCenter}`}>
              <ErrorBadge error={result.errorCanvas} />
            </td>
            <td className={`${styles.cell} ${styles.cellCenter}`}>
              <ErrorBadge error={result.errorHeuristic} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MeasurementLegend = () => (
  <div className={styles.legend}>
    <span>
      <span className={`${styles.legendSwatch} ${styles.legendSwatchDom}`} />
      DOM (ground truth)
    </span>
    <span>
      <span className={`${styles.legendSwatch} ${styles.legendSwatchCanvas}`} />
      Canvas measurer
    </span>
    <span>
      <span className={`${styles.legendSwatch} ${styles.legendSwatchHeuristic}`} />
      Heuristic measurer
    </span>
    <span style={{ marginLeft: 8 }}>
      Error: <ErrorBadge error={0.5} /> &lt;2% <ErrorBadge error={3} /> &lt;5% <ErrorBadge error={7} /> &lt;10%{' '}
      <ErrorBadge error={15} /> &ge;10%
    </span>
  </div>
);

// ─── Main story component ────────────────────────────────────────────────────

const TextMeasurementComparison = (props: {
  sections: Section[];
  parentFontSize: number;
  fontFamilyOverride: string;
}) => (
  <TextMeasurerProvider>
    <TextMeasurementComparisonInner {...props} />
  </TextMeasurerProvider>
);

const TextMeasurementComparisonInner = ({
  sections,
  parentFontSize,
  fontFamilyOverride,
}: {
  sections: Section[];
  parentFontSize: number;
  fontFamilyOverride: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMeasurer = useTextMeasurer();
  const [results, setResults] = useState<Array<{ title: string; results: MeasurementResult[] }> | null>(null);

  const overriddenSections = useMemo(
    () => sections.map((section) => ({ ...section, cases: applyFamilyOverride(section.cases, fontFamilyOverride) })),
    [sections, fontFamilyOverride]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setResults(
      overriddenSections.map((section) => ({
        title: section.title,
        results: computeResults(container, section.cases, canvasMeasurer, parentFontSize),
      }))
    );
  }, [overriddenSections, canvasMeasurer, parentFontSize]);

  return (
    <div ref={containerRef} className={styles.container}>
      <MeasurementLegend />
      <div className={styles.info}>
        Parent font-size: <strong>{parentFontSize}px</strong>
        {fontFamilyOverride && (
          <>
            {' | '}Family override: <strong>{fontFamilyOverride}</strong>
          </>
        )}
      </div>
      {results
        ? results.map((section, index) => (
            <ResultsTable key={index} title={section.title} results={section.results} parentFontSize={parentFontSize} />
          ))
        : 'Measuring...'}
    </div>
  );
};

// ─── Storybook meta ──────────────────────────────────────────────────────────

interface StoryArgs {
  parentFontSize: number;
  fontFamilyPreset: string;
  customFontFamily: string;
}

const meta: Meta<StoryArgs> = {
  title: 'Utils/Text Measurement',
  args: {
    parentFontSize: DEFAULT_PARENT_FONT_SIZE,
    fontFamilyPreset: FAMILY_OVERRIDE_LABELS[0],
    customFontFamily: '',
  },
  argTypes: {
    parentFontSize: {
      control: { type: 'range', min: 8, max: 20, step: 1 },
      description: 'Parent element font-size in px. All test cases use em units relative to this value.',
    },
    fontFamilyPreset: {
      control: { type: 'select' },
      options: FAMILY_OVERRIDE_LABELS,
      description:
        'Override every test case to use this family. "(per-case default)" leaves each case using its own family.',
    },
    customFontFamily: {
      control: { type: 'text' },
      description:
        'Custom font-family string (overrides the preset when non-empty). Paste any valid CSS font-family value, including full fallback chains.',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
Visual accuracy comparison of the three text measurement strategies:

- **DOM** (\`getBoundingClientRect\`) — ground truth, what the browser actually renders
- **Canvas** (\`OffscreenCanvas.measureText\`) — the production browser measurer
- **Heuristic** (character-width table) — the zero-dependency fallback for tests

Font sizes are defined in **em** units. Use the **parentFontSize** control to change the
parent element's font-size and observe how the em-based sizes resolve to different pixel values.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// ─── Hoisted section constants (stable references for useMemo) ──────────────

const ALL_SECTIONS: Section[] = [
  { title: 'Realistic chart labels', cases: REALISTIC_LABELS },
  { title: 'Basic Latin text', cases: BASE_CASES },
  { title: 'Font weights', cases: WEIGHT_CASES },
  { title: 'Font styles', cases: STYLE_CASES },
  { title: 'Font sizes', cases: SIZE_CASES },
  { title: 'Font families', cases: FONT_FAMILY_CASES },
  { title: 'Unicode & international', cases: UNICODE_CASES },
];

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Custom text trumps preset; otherwise look up the preset value. */
const resolveFamilyOverride = (args: StoryArgs): string =>
  args.customFontFamily.trim() || (FAMILY_OVERRIDE_PRESETS[args.fontFamilyPreset] ?? '');

export const AllSections: Story = {
  render: (args) => (
    <TextMeasurementComparison
      sections={ALL_SECTIONS}
      parentFontSize={args.parentFontSize}
      fontFamilyOverride={resolveFamilyOverride(args)}
    />
  ),
};

// ─── Canvas-only story (for perf profiling) ─────────────────────────────────

interface CanvasOnlyResult {
  testCase: TestCase;
  canvas: MeasuredText;
}

const CanvasOnlyMeasurement = (props: { sections: Section[]; parentFontSize: number; fontFamilyOverride: string }) => (
  <TextMeasurerProvider>
    <CanvasOnlyMeasurementInner {...props} />
  </TextMeasurerProvider>
);

const CanvasOnlyMeasurementInner = ({
  sections,
  parentFontSize,
  fontFamilyOverride,
}: {
  sections: Section[];
  parentFontSize: number;
  fontFamilyOverride: string;
}) => {
  const canvasMeasurer = useTextMeasurer();
  const [isPending, startTransition] = useTransition();
  const [sectionResults, setSectionResults] = useState<Array<{ title: string; results: CanvasOnlyResult[] }> | null>(
    null
  );
  const [elapsed, setElapsed] = useState(0);

  const overriddenSections = useMemo(
    () => sections.map((section) => ({ ...section, cases: applyFamilyOverride(section.cases, fontFamilyOverride) })),
    [sections, fontFamilyOverride]
  );

  useEffect(() => {
    startTransition(() => {
      const start = performance.now();
      const computed = overriddenSections.map((section) => ({
        title: section.title,
        results: section.cases.map((testCase): CanvasOnlyResult => {
          const resolvedFont = resolveFont(testCase, parentFontSize);
          return { testCase, canvas: canvasMeasurer.measureText(testCase.text, resolvedFont) };
        }),
      }));
      const duration = performance.now() - start;

      setSectionResults(computed);
      setElapsed(duration);
    });
  }, [overriddenSections, canvasMeasurer, parentFontSize]);

  return (
    <div className={`${styles.container} ${isPending ? styles.containerPending : ''}`}>
      <div className={styles.info}>
        Parent font-size: <strong>{parentFontSize}px</strong> | Canvas measurement time:{' '}
        <strong>{elapsed.toFixed(2)}ms</strong> ({overriddenSections.reduce((sum, sec) => sum + sec.cases.length, 0)}{' '}
        items){isPending && ' | Recalculating...'}
        {fontFamilyOverride && (
          <>
            {' | '}Family override: <strong>{fontFamilyOverride}</strong>
          </>
        )}
      </div>
      {sectionResults
        ? sectionResults.map((section, index) => (
            <div key={index} className={styles.section}>
              <h3 className={styles.sectionTitle}>{section.title}</h3>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHead}>
                    <th className={`${styles.th} ${styles.thLabel}`}>Test case</th>
                    <th className={`${styles.th} ${styles.thWidth100}`}>Width (px)</th>
                    <th className={`${styles.th} ${styles.thWidth100}`}>Height (px)</th>
                    <th className={styles.th}>Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {section.results.map((result, resultIndex) => (
                    <tr key={resultIndex} className={styles.row}>
                      <td className={`${styles.cell} ${styles.cellLabel}`}>
                        <div>{result.testCase.label}</div>
                        <div className={styles.labelSub}>
                          {result.testCase.sizeEm}em → {(result.testCase.sizeEm * parentFontSize).toFixed(1)}px
                        </div>
                      </td>
                      <td className={`${styles.cell} ${styles.cellNumeric}`}>{result.canvas.width.toFixed(1)}</td>
                      <td className={`${styles.cell} ${styles.cellNumeric}`}>{result.canvas.height.toFixed(1)}</td>
                      <td className={`${styles.cell} ${styles.cellPreview}`}>
                        <div
                          className={styles.previewWrapper}
                          style={{ height: Math.max(result.canvas.height, 20), fontSize: parentFontSize }}
                        >
                          <span
                            className={styles.previewText}
                            style={{
                              fontFamily: cssFamily(result.testCase.font.family),
                              fontSize: `${result.testCase.sizeEm}em`,
                              fontWeight: result.testCase.font.weight,
                              fontStyle: result.testCase.font.style,
                            }}
                          >
                            {result.testCase.text || <span className={styles.overlayEmpty}>(empty)</span>}
                          </span>
                          <div
                            className={styles.previewLine}
                            style={{ width: Math.min(result.canvas.width, 300) }}
                            title={`Canvas: ${result.canvas.width.toFixed(1)}px`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        : 'Measuring...'}
    </div>
  );
};

export const CanvasOnly: Story = {
  render: (args) => (
    <CanvasOnlyMeasurement
      sections={ALL_SECTIONS}
      parentFontSize={args.parentFontSize}
      fontFamilyOverride={resolveFamilyOverride(args)}
    />
  ),
};
