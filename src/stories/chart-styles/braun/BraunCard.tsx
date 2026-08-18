import type { DashboardCardProps } from '../ChartStylesDashboard';

import { BRAUN_COLORS, BRAUN_FONT_FAMILY } from './braun.theme';

// Each plate is a warm panel with a quiet caption above it on the desk.
export const BraunChartCard = ({ height, name, index, children }: DashboardCardProps) => (
  <figure style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
    <figcaption
      style={{
        margin: '0 4px 12px',
        fontFamily: BRAUN_FONT_FAMILY.body,
        fontWeight: 500,
        fontSize: 12.5,
        letterSpacing: '0.01em',
        color: BRAUN_COLORS.labelMuted,
      }}
    >
      {`Fig. ${String(index).padStart(2, '0')} — ${name}`}
    </figcaption>
    <div style={{ background: BRAUN_COLORS.panel, borderRadius: 12, height, overflow: 'hidden' }}>{children}</div>
  </figure>
);
