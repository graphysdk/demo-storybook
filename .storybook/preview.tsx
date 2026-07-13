import type { Preview } from '@storybook/react';
import { IntlProvider } from 'react-intl';

import type { GraphTheme, Locale } from '@graphysdk/viz-engine';

import { ResetStyles } from '../src/components/CssReset';
import { StorybookGlobalsContext } from '../src/components/StorybookGlobalsContext';

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        method: 'alphabetical',
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#000000' },
      ],
    },
  },
  initialGlobals: {
    theme: 'light',
    locale: 'en-GB',
    backgrounds: { value: '#ffffff' },
    vizApi: 'spec',
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as GraphTheme | undefined) ?? 'light';
      const locale = (context.globals.locale || 'en-GB') as Locale;

      return (
        <StorybookGlobalsContext.Provider
          value={{ theme, locale, vizApi: (context.globals.vizApi || 'spec') as 'spec' | 'config' }}
        >
          <Story />
        </StorybookGlobalsContext.Provider>
      );
    },
    (Story, context) => {
      const theme = context.globals.theme ?? 'light';
      const backgroundColor = theme === 'dark' ? '#000000' : '#ffffff';

      return (
        <div style={{ backgroundColor }}>
          <Story />
        </div>
      );
    },
    (Story, context) => (
      <IntlProvider locale={context.globals.locale} messages={{}}>
        <ResetStyles />
        <Story />
      </IntlProvider>
    ),
  ],
};

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    toolbar: {
      items: [
        { title: 'Light mode', value: 'light', icon: 'circlehollow' },
        { title: 'Dark mode', value: 'dark', icon: 'circle' },
      ],
      dynamicTitle: true,
    },
  },
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    toolbar: {
      icon: 'globe',
      items: [
        { title: 'English (UK)', value: 'en-GB' },
        { title: 'English (US)', value: 'en-US' },
        { title: 'Portuguese (PT)', value: 'pt-PT' },
        { title: 'Arabic (RTL)', value: 'ar' },
      ],
      dynamicTitle: true,
    },
  },
  vizApi: {
    name: 'Viz API',
    description: 'Which API to render new-viz stories with',
    toolbar: {
      icon: 'graphline',
      items: [
        { title: 'Low-level spec', value: 'spec' },
        { title: 'High-level config', value: 'config' },
      ],
      dynamicTitle: true,
    },
  },
};

// eslint-disable-next-line import-x/no-default-export
export default preview;
