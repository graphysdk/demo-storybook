import type { StorybookConfig } from '@storybook/react-vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import remarkGfm from 'remark-gfm';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  addons: [
    '@storybook/addon-mcp',
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  core: {
    builder: '@storybook/builder-vite',
  },
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [vanillaExtractPlugin()],
      // Storybook 10's builder-vite injects a @vitest/mocker-based mocking runtime
      // (vite-inject-mocker-entry.js) whose syntax esbuild can't downlevel to Vite's
      // default 'es2020' target. Storybook is internal tooling, so target the modern
      // engines its runtime already assumes and skip downleveling in both passes:
      // the production build and dev-mode dependency pre-bundling.
      build: { target: 'esnext' },
      optimizeDeps: { esbuildOptions: { target: 'esnext' } },
    }),
};

// eslint-disable-next-line import-x/no-default-export
export default config;
