import type { DashboardCardProps } from '../ChartStylesDashboard';

import { MEXICO_COLORS, MEXICO_FONT_FAMILY } from './mexico68.theme';

const FIG_COUNT = 7;

export const MexicoChartCard = ({ height, name, index, children }: DashboardCardProps) => (
  <div
    style={{
      background: MEXICO_COLORS.card,
      borderRadius: 20,
      height,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        margin: '24px 32px 0',
        borderTop: `2px solid ${MEXICO_COLORS.ink}`,
        paddingTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        flexShrink: 0,
        fontFamily: MEXICO_FONT_FAMILY.body,
        fontWeight: 600,
        fontSize: 9.5,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: MEXICO_COLORS.axisGrey,
      }}
    >
      <span>{`Fig. ${String(index).padStart(2, '0')} / ${name}`}</span>
      <span>{`${String(index).padStart(2, '0')} / ${String(FIG_COUNT).padStart(2, '0')}`}</span>
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);
