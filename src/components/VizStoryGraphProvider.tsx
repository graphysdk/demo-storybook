import { type ReactNode, useMemo } from 'react';

import { GraphProvider, type ThemeOverrides } from '@graphysdk/react-renderer';
import { convertGraphConfigTheme, type FontListInput } from '@graphysdk/react-renderer/graph-config';
import type { ColorScheme, CustomPalettesInput, Data, Locale, SpecInput } from '@graphysdk/viz-engine';
import { config as applyConfig, pipe } from '@graphysdk/viz-engine';
import { convertGraphConfig, type GraphConfig } from '@graphysdk/viz-engine/graph-config';

import { type FooterMode, useStorybookGlobals, type VizApi } from './StorybookGlobalsContext';

/** Demo footer content injected by the `footer` toolbar so the mark has a user footer to sit beside. */
const SAMPLE_SOURCE = { label: 'ACME Analytics', url: 'https://example.com' };
const SAMPLE_CAPTION = 'Illustrative caption — sample footer text for layout testing.';

interface FooterOverrides {
  /** `undefined` leaves the story's own mark config alone; `true` / `false` force it. */
  forcedBrandMark: boolean | undefined;
  sampleSource: boolean;
  sampleCaption: boolean;
}

/** Expands the single toolbar value into the independent footer overrides it stands for. */
const resolveFooterOverrides = (mode: FooterMode): FooterOverrides => {
  switch (mode) {
    case 'default':
      return { forcedBrandMark: undefined, sampleSource: false, sampleCaption: false };
    case 'markShown':
      return { forcedBrandMark: true, sampleSource: false, sampleCaption: false };
    case 'markHidden':
      return { forcedBrandMark: false, sampleSource: false, sampleCaption: false };
    case 'source':
      return { forcedBrandMark: undefined, sampleSource: true, sampleCaption: false };
    case 'sourceMark':
      return { forcedBrandMark: true, sampleSource: true, sampleCaption: false };
    case 'sourceCaption':
      return { forcedBrandMark: undefined, sampleSource: true, sampleCaption: true };
    case 'sourceCaptionMark':
      return { forcedBrandMark: true, sampleSource: true, sampleCaption: true };
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
};

/** Layers the toolbar overrides onto the low-level spec route as a final `config` merge, so they win. */
const applyFooterOverridesToSpec = (
  spec: SpecInput | undefined,
  { forcedBrandMark, sampleSource, sampleCaption }: FooterOverrides
): SpecInput | undefined => {
  if (!spec) return spec;
  // Must set `brandMark.enabled` — resolveConfig prefers it over legacy `isBrandMarkVisible`.
  const content = {
    ...(forcedBrandMark !== undefined
      ? { brandMark: { enabled: forcedBrandMark }, isBrandMarkVisible: forcedBrandMark }
      : {}),
    ...(sampleSource ? { source: SAMPLE_SOURCE, isSourceVisible: true } : {}),
    ...(sampleCaption ? { caption: SAMPLE_CAPTION, isCaptionVisible: true } : {}),
  };
  if (Object.keys(content).length === 0) return spec;
  return pipe(spec, applyConfig({ content }));
};

/** Layers the toolbar overrides onto the high-level config route via the inverted `isXHidden` flags. */
const applyFooterOverridesToConfig = (
  graphConfig: GraphConfig | undefined,
  { forcedBrandMark, sampleSource, sampleCaption }: FooterOverrides
): GraphConfig | undefined => {
  if (!graphConfig) return graphConfig;
  // Must set `brandMark.enabled` — convertConfig ignores `isBrandMarkHidden` when enabled is set.
  const content = {
    ...(forcedBrandMark !== undefined
      ? {
          brandMark: { ...graphConfig.content?.brandMark, enabled: forcedBrandMark },
          isBrandMarkHidden: !forcedBrandMark,
        }
      : {}),
    ...(sampleSource ? { source: SAMPLE_SOURCE, isSourceHidden: false } : {}),
    ...(sampleCaption ? { caption: SAMPLE_CAPTION, isCaptionHidden: false } : {}),
  };
  if (Object.keys(content).length === 0) return graphConfig;
  return { ...graphConfig, content: { ...graphConfig.content, ...content } };
};

const messageStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'sans-serif',
  fontSize: 13,
  color: '#888',
  textAlign: 'center',
  padding: 16,
} as const;

const NotExpressible = ({ api }: { api: VizApi }) => (
  <div style={messageStyle}>
    Not expressible in the {api === 'spec' ? 'low-level spec' : 'high-level GraphConfig'} API.
  </div>
);

/**
 * Wraps story content in a `<GraphProvider>` seeded with either the low-level spec or the
 * high-level `GraphConfig`, depending on the active storybook global.
 *
 * The provider only takes a `SpecInput`, so the config route converts first: `convertGraphConfig`
 * for the data half, `convertGraphConfigTheme` for the renderer half (theme overrides and fonts).
 */
export const VizStoryGraphProvider = ({
  data,
  spec,
  config,
  children,
  customPalettes,
  formattingLocale,
  colorScheme,
  themeOverrides,
  fontList,
}: {
  data: Data;
  spec?: SpecInput;
  config?: GraphConfig;
  customPalettes?: CustomPalettesInput;
  children: ReactNode;
  formattingLocale?: Locale;
  colorScheme?: ColorScheme;
  themeOverrides?: ThemeOverrides;
  fontList?: FontListInput;
}) => {
  const globals = useStorybookGlobals();
  const api = globals?.vizApi ?? 'spec';
  const resolvedColorScheme = colorScheme ?? globals?.theme ?? 'light';
  const footerMode = globals?.footer ?? 'default';
  const overrides = useMemo(() => resolveFooterOverrides(footerMode), [footerMode]);

  const effectiveSpec = useMemo(() => applyFooterOverridesToSpec(spec, overrides), [spec, overrides]);
  const effectiveConfig = useMemo(() => applyFooterOverridesToConfig(config, overrides), [config, overrides]);
  const selectedConfig = api === 'spec' ? undefined : effectiveConfig;

  const converted = useGraphConfigConverter({
    config: selectedConfig,
    data,
    colorScheme: resolvedColorScheme,
    customPalettes,
    themeOverrides,
    fontList,
  });

  if (converted.kind === 'error') {
    return <div style={messageStyle}>GraphConfig conversion failed: {converted.error}</div>;
  }

  const input = api === 'spec' ? effectiveSpec : converted.input;
  if (!input) return <NotExpressible api={api} />;

  return (
    <GraphProvider
      key={api}
      input={input}
      data={data}
      formattingLocale={formattingLocale}
      customPalettes={customPalettes}
      colorScheme={resolvedColorScheme}
      themeOverrides={converted.themeOverrides}
    >
      {children}
    </GraphProvider>
  );
};

type GraphConfigConverterResult =
  { kind: 'success'; input?: SpecInput; themeOverrides?: ThemeOverrides } | { kind: 'error'; error: string };

const useGraphConfigConverter = (props: {
  config?: GraphConfig;
  data: Data;
  colorScheme: ColorScheme;
  customPalettes?: CustomPalettesInput;
  themeOverrides?: ThemeOverrides;
  fontList?: FontListInput;
}): GraphConfigConverterResult => {
  const converted = useMemo(() => {
    if (!props.config) return undefined;
    try {
      return {
        kind: 'success',
        input: convertGraphConfig(props.config, props.data, {
          colorScheme: props.colorScheme,
          customPalettes: props.customPalettes,
        }),
      };
    } catch (error) {
      return { input: undefined, error: error instanceof Error ? error.message : String(error) };
    }
  }, [props.config, props.data, props.colorScheme, props.customPalettes]);

  const resolvedThemeOverrides = useMemo(
    () =>
      props.config
        ? { ...props.themeOverrides, ...convertGraphConfigTheme(props.config, props.fontList) }
        : props.themeOverrides,
    [props.config, props.themeOverrides, props.fontList]
  );

  return { kind: 'success', input: converted?.input, themeOverrides: resolvedThemeOverrides };
};
