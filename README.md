# demo-storybook

A Storybook showcasing graphs built with the Graphy SDK (`@graphysdk/viz-engine` and `@graphysdk/react-renderer`).

## Getting started

```sh
pnpm install
pnpm dev
```

Storybook runs at [http://localhost:6006](http://localhost:6006).

## What's inside

Stories live in `src/stories`:

- **chart-styles** — themed examples (Financial Times, Braun, neo-brutalist, ...)
- **chart-types** — core charts: bar, line, area, pie, point, combo, radar, polar bar
- **plugins** — custom charts: sankey, treemap, voronoi, beeswarm, candlestick and others
- **features** — axes, legends, themes, annotations, data labels, transitions and more



## Scripts


| Command          | Description                      |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Start Storybook in dev mode      |
| `pnpm build`     | Build a static Storybook         |
| `pnpm preview`   | Build and serve the static build |
| `pnpm lint`      | Run ESLint                       |
| `pnpm typecheck` | Run TypeScript checks            |
| `pnpm format`    | Format with Prettier             |




## License

MIT