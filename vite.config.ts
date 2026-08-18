import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['styled-components', 'react-intl'],
    // d3-shape must stay unbundled so vite resolves the exact version viz-engine
    // declares (it needs arc().digits) rather than collapsing it into one entry.
    exclude: ['d3-shape'],
  },
});
