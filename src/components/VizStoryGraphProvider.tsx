import type { ReactNode } from 'react';

import { type FontListInput, GraphProvider, type ThemeOverrides } from '@graphysdk/react-renderer';
import type { CustomPalettesInput, Data, GraphConfig, GraphTheme, Locale, SpecInput } from '@graphysdk/viz-engine';

import { useStorybookGlobals, type VizApi } from './StorybookGlobalsContext';

const NotExpressible = ({ api }: { api: VizApi }) => (
  <div
    style={{
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
    }}
  >
    Not expressible in the {api === 'spec' ? 'low-level spec' : 'high-level GraphConfig'} API.
  </div>
);

/**
 * Wraps story content in a `<GraphProvider>` seeded with either the low-level spec or the
 * high-level `GraphConfig`, depending on the active storybook global.
 */
export const VizStoryGraphProvider = ({
  data,
  spec,
  config,
  children,
  customPalettes,
  formattingLocale,
  theme,
  themeOverrides,
  fontList,
}: {
  data: Data;
  spec?: SpecInput;
  config?: GraphConfig;
  customPalettes?: CustomPalettesInput;
  children: ReactNode;
  formattingLocale?: Locale;
  theme?: GraphTheme;
  themeOverrides?: ThemeOverrides;
  fontList?: FontListInput;
}) => {
  const globals = useStorybookGlobals();
  const api = globals?.vizApi ?? 'spec';
  const selected = api === 'spec' ? spec : config;
  const resolvedTheme = theme ?? globals?.theme ?? 'light';

  if (!selected) return <NotExpressible api={api} />;

  return (
    <GraphProvider
      key={api}
      input={selected}
      data={data}
      formattingLocale={formattingLocale}
      customPalettes={customPalettes}
      theme={resolvedTheme}
      themeOverrides={themeOverrides}
      fontList={fontList}
    >
      {children}
    </GraphProvider>
  );
};
