import type { DashboardCardProps } from '../ChartStylesDashboard';

import { FT_COLORS } from './financial-times.theme';

// Each card is FT paper with the signature black accent tab; the chart below it
// paints the same paper, so tab and plot read as one surface.
export const FinancialTimesChartCard = ({ height, children }: DashboardCardProps) => (
  <div style={{ background: FT_COLORS.paper, height, display: 'flex', flexDirection: 'column' }}>
    <div style={{ width: 44, height: 4, background: FT_COLORS.black, margin: '28px 0 0 32px', flexShrink: 0 }} />
    <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);
