import type { ReactNode } from 'react';

import type { SpecInput } from '@graphysdk/viz-engine';

import { type ChartKey, DASHBOARD_CHARTS, type DashboardChart } from './chart-styles.fixtures';
import layout from './chart-styles-dashboard.module.css';

export interface DashboardCardProps extends DashboardCard {
  children: ReactNode;
}

/** One chart handed to a story's card renderer: the canonical roster entry plus its spec and position. */
export interface DashboardCard extends DashboardChart {
  /** 1-based display order, for numbered fig plates. */
  index: number;
  /** The style's spec for this chart. */
  spec: SpecInput;
}

export interface ChartStylesDashboardProps {
  /** Page canvas behind the cards. */
  background: string;
  /** Base font for the page scaffold. */
  fontFamily: string;
  /** Gap between cards and bands. */
  gap?: number;
  /** The style's header block, rendered above the grid. */
  header: ReactNode;
  /** One spec per canonical chart, keyed by {@link ChartKey}. */
  specs: Record<ChartKey, SpecInput>;
  /** Wraps a single chart in the style's card chrome and graph provider. */
  renderCard: (card: DashboardCard) => ReactNode;
}

/**
 * The shared dashboard frame: a centered page with a header over three bands — a
 * responsive pair, a responsive trio, and a second pair. Every chart-style story
 * renders the same seven charts from the same data in this same layout; the story
 * supplies only the look (page tokens, header, per-chart specs, and card chrome).
 */
export const ChartStylesDashboard = ({
  background,
  fontFamily,
  gap = 28,
  header,
  specs,
  renderCard,
}: ChartStylesDashboardProps): ReactNode => {
  const cards = new Map<ChartKey, ReactNode>();
  DASHBOARD_CHARTS.forEach((chart, position) => {
    cards.set(chart.key, renderCard({ ...chart, index: position + 1, spec: specs[chart.key] }));
  });

  return (
    <div style={{ minHeight: '100vh', background, padding: '56px 40px 64px', fontFamily }}>
      {header}
      <div style={{ maxWidth: 1500, margin: '0 auto', display: 'grid', gap }}>
        <div className={layout.pair} style={{ gap }}>
          {cards.get('cpm')}
          {cards.get('listings')}
        </div>
        <div className={layout.trioContainer}>
          <div className={layout.trio} style={{ gap }}>
            {cards.get('productRace')}
            {cards.get('donut')}
            {cards.get('productLegend')}
          </div>
        </div>
        <div className={layout.pair} style={{ gap }}>
          {cards.get('rose')}
          {cards.get('racetrack')}
        </div>
      </div>
    </div>
  );
};
