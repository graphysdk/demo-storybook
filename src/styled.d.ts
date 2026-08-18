import 'styled-components';

declare module 'styled-components' {
  // The Storybook shell no longer themes via styled-components' ThemeProvider —
  // v2 stories theme through the viz-engine GraphProvider instead.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme {}
}
