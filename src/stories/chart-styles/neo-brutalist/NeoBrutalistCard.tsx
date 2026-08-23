import type { DashboardCardProps } from '../ChartStylesDashboard';

import { NB_COLORS, NB_FONT_FAMILY } from './neo-brutalist.theme';

// The jagged acid border is a 96px SVG tile — a perimeter jittered by two sine
// waves — repeated via border-image. Drawn, no filters.
const buildJaggedBorderTile = (): string => {
  const tileSize = 96;
  const inset = 6;
  const step = 3;
  const jitterFor = (t: number): number =>
    1.3 * Math.sin((t * Math.PI * 2) / 32) + 0.6 * Math.sin((t * Math.PI * 2) / 13.7 + 2.1);
  const points: string[] = [];
  for (let x = inset; x <= tileSize - inset; x += step) {
    points.push(`${x},${(inset + jitterFor(x)).toFixed(2)}`);
  }
  for (let y = inset + step; y <= tileSize - inset; y += step) {
    points.push(`${(tileSize - inset - jitterFor(y + tileSize)).toFixed(2)},${y}`);
  }
  for (let x = tileSize - inset - step; x >= inset; x -= step) {
    points.push(`${x},${(tileSize - inset - jitterFor(x + tileSize * 2)).toFixed(2)}`);
  }
  for (let y = tileSize - inset - step; y >= inset + step; y -= step) {
    points.push(`${(inset + jitterFor(y + tileSize * 3)).toFixed(2)},${y}`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}"><polygon points="${points.join(' ')}" fill="none" stroke="${NB_COLORS.acid}" stroke-width="2"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const JAGGED_BORDER_TILE = buildJaggedBorderTile();

// Each sheet carries the jagged acid border and the corner strip; the chart below
// paints the same surface, so strip and plot read as one slab.
export const NeoBrutalistChartCard = ({ height, name, index, children }: DashboardCardProps) => (
  <div
    style={{
      background: NB_COLORS.surface,
      height,
      display: 'flex',
      flexDirection: 'column',
      border: '8px solid transparent',
      borderImage: `${JAGGED_BORDER_TILE} 12 / 8px round`,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        margin: '20px 32px 0',
        paddingBottom: 10,
        borderBottom: `1px dashed ${NB_COLORS.metaRule}`,
        fontFamily: NB_FONT_FAMILY.heading,
        fontWeight: 500,
        fontSize: 9.5,
        letterSpacing: '0.18em',
        color: NB_COLORS.secondary,
        flexShrink: 0,
      }}
    >
      <span>
        {String(index).padStart(2, '0')} / {name.toUpperCase()}
      </span>
      <span>{'DATA > OPINIONS'}</span>
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);
