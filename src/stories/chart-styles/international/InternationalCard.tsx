import type { DashboardCardProps } from '../ChartStylesDashboard';

import { INTL_COLORS, INTL_FONT_FAMILY } from './international.theme';

const FIG_COUNT = 7;

// Each card is a white plate opening with the fig plate: a 2px ink top rule over a
// numbered caption row. The chart below paints the same white, so plate and plot
// read as one surface.
export const InternationalChartCard = ({ height, name, index, children }: DashboardCardProps) => (
  <div style={{ background: INTL_COLORS.paper, height, display: 'flex', flexDirection: 'column' }}>
    <div
      style={{
        margin: '24px 32px 0',
        borderTop: `2px solid ${INTL_COLORS.heading}`,
        paddingTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        flexShrink: 0,
        fontFamily: INTL_FONT_FAMILY.body,
        fontWeight: 600,
        fontSize: 9.5,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: INTL_COLORS.grey,
      }}
    >
      <span>{`Fig. ${String(index).padStart(2, '0')} / ${name}`}</span>
      <span>{`${String(index).padStart(2, '0')} / ${String(FIG_COUNT).padStart(2, '0')}`}</span>
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);
