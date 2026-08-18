import type { DashboardCardProps } from '../ChartStylesDashboard';

// Each card is just a sized box; the cream plate, outline, and headline all come
// from the spec's appearance and the custom header slot.
export const LennyChartCard = ({ height, children }: DashboardCardProps) => <div style={{ height }}>{children}</div>;
