import type { CSSProperties, ReactNode } from 'react';

import { darkTheme, lightTheme, ThemeProvider, vars } from '@graphysdk/react-renderer';
import { IntlProvider } from '@graphysdk/react-renderer/editable';

import { useStorybookGlobals } from './StorybookGlobalsContext';

const DEFAULT_PANEL_WIDTH = 280;
const DEFAULT_BLOCK_SIZE = 420;

/** The viewport less Storybook's own padding, for a panel meant to run the height of the window. */
export const FILLS_VIEWPORT = 'calc(100dvh - 2rem)';

const layoutStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 16,
};

// A column, so a story can put a history trail or a caption under the chart itself.
const chartStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minInlineSize: 0,
};

// The panel takes its height from the host, so the column it sits in is what bounds it.
// A column, so a host toolbar can sit above the panel root rather than beside it.
const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 'none',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: vars.border10,
  borderRadius: 6,
  overflow: 'hidden',
  padding: 8,
};

/**
 * A chart with an editing panel beside it.
 *
 * The panel reads its theme from `ThemeProvider`; the box's own border and padding read the class,
 * so the toolbar's choice reaches both.
 *
 * `IntlProvider` is the editing entry's own — Storybook's global one is react-intl's, a different
 * context, and a section with labels throws without this. It takes the toolbar's locale, so the
 * panel translates with the chart rather than staying stuck in one language.
 */
export const PanelStoryLayout = ({
  chart,
  children,
  panelWidth = DEFAULT_PANEL_WIDTH,
  blockSize = DEFAULT_BLOCK_SIZE,
}: {
  chart: ReactNode;
  children: ReactNode;
  /** Widen it for a panel holding several sections; v1's own is 320. */
  panelWidth?: number;
  /** A number of pixels, or any CSS length — {@link FILLS_VIEWPORT} for the whole window. */
  blockSize?: CSSProperties['blockSize'];
}) => {
  const globals = useStorybookGlobals();
  const colorScheme = globals?.theme ?? 'light';
  const locale = globals?.locale ?? 'en-GB';

  return (
    <div style={{ ...layoutStyle, blockSize }}>
      <div style={chartStyle}>{chart}</div>
      <IntlProvider locale={locale}>
        <ThemeProvider colorScheme={colorScheme}>
          <div
            className={colorScheme === 'dark' ? darkTheme : lightTheme}
            style={{ ...panelStyle, inlineSize: panelWidth }}
          >
            {children}
          </div>
        </ThemeProvider>
      </IntlProvider>
    </div>
  );
};
