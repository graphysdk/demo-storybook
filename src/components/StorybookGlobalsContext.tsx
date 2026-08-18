import { createContext, useContext } from 'react';

import type { ColorScheme } from '@graphysdk/viz-engine';

export type Locale = 'en-GB' | 'en-US' | 'pt-PT' | 'ar';

export type VizApi = 'spec' | 'config';

/**
 * Single toolbar override for footer content, combining the demo user footer (source / caption) with the
 * Made with Graphy provenance badge. `default` leaves each story's own config untouched (the
 * renderer default hides the mark and injects nothing); every other value forces the corresponding
 * combination across every story so the footer can be exercised in any situation — including
 * source-left + badge-right layouts that stories without their own footer could not otherwise show.
 */
export type FooterMode =
  'default' | 'markShown' | 'markHidden' | 'source' | 'sourceMark' | 'sourceCaption' | 'sourceCaptionMark';

export interface StorybookGlobals {
  theme: ColorScheme;
  locale: Locale;
  vizApi: VizApi;
  footer: FooterMode;
}

export const StorybookGlobalsContext = createContext<StorybookGlobals | null>(null);

export const useStorybookGlobals = () => {
  return useContext(StorybookGlobalsContext);
};
