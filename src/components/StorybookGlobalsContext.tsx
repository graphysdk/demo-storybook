import { createContext, useContext } from 'react';

import type { GraphTheme, Locale } from '@graphysdk/viz-engine';

export type VizApi = 'spec' | 'config';

export interface StorybookGlobals {
  theme: GraphTheme;
  locale: Locale;
  vizApi: VizApi;
}

export const StorybookGlobalsContext = createContext<StorybookGlobals | null>(null);

export const useStorybookGlobals = () => {
  return useContext(StorybookGlobalsContext);
};
