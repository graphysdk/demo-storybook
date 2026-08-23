import type { CSSProperties, ReactNode } from 'react';

import { darkTheme, lightTheme, ThemeProvider, vars } from '@graphysdk/react-renderer';
import { EditorPanel } from '@graphysdk/react-renderer/editable';

import { useStorybookGlobals } from './StorybookGlobalsContext';

const frameStyle: CSSProperties = {
  inlineSize: 280,
  padding: 12,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: vars.border10,
  borderRadius: 6,
};

/**
 * One control on its own, in the box a section would put it in.
 *
 * The panel root is real because the font-size tokens are ems resolved where the theme class sits,
 * so a plain wrapper would anchor them to the page. `ThemeProvider` carries the toolbar's theme into
 * the panel and any popup it portals.
 */
export const ControlStoryLayout = ({ children }: { children: ReactNode }) => {
  const theme = useStorybookGlobals()?.theme ?? 'light';
  const themeClass = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider colorScheme={theme}>
      <div className={themeClass} style={frameStyle}>
        <EditorPanel.Root>{children}</EditorPanel.Root>
      </div>
    </ThemeProvider>
  );
};
