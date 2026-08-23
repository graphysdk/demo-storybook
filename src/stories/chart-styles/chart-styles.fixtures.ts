import type { Data } from '@graphysdk/viz-engine';

// The canonical corpus every chart-style dashboard renders. Values and category
// labels are shared across all styles so the only thing that changes between
// stories is the look — never the numbers. Styles that want a different casing
// (uppercase, etc.) belong in the theme, not in a per-story copy of this data.

// CPM by quarter — the last quarter is a forecast, split out via the `type` column.
const cpmData: Data = {
  columns: [{ key: 'quarter' }, { key: 'cpm' }, { key: 'type' }],
  rows: [
    { quarter: "Q2 '24", cpm: 4, type: 'actual' },
    { quarter: "Q3 '24", cpm: 6.1, type: 'actual' },
    { quarter: "Q4 '24", cpm: 5.9, type: 'actual' },
    { quarter: "Q1 '25", cpm: 3.9, type: 'actual' },
    { quarter: "Q2 '25", cpm: 6.5, type: 'forecast' },
  ],
};

// Listings by segment — a two-series stack in long decline.
const listingsData: Data = {
  columns: [{ key: 'year' }, { key: 'segment' }, { key: 'listings' }],
  rows: [
    { year: '2018', segment: 'UK', listings: 1180 },
    { year: '2018', segment: 'International', listings: 370 },
    { year: '2019', segment: 'UK', listings: 1140 },
    { year: '2019', segment: 'International', listings: 350 },
    { year: '2020', segment: 'UK', listings: 1090 },
    { year: '2020', segment: 'International', listings: 340 },
    { year: '2021', segment: 'UK', listings: 1060 },
    { year: '2021', segment: 'International', listings: 330 },
    { year: '2022', segment: 'UK', listings: 1000 },
    { year: '2022', segment: 'International', listings: 310 },
    { year: '2023', segment: 'UK', listings: 970 },
    { year: '2023', segment: 'International', listings: 300 },
    { year: '2024', segment: 'UK', listings: 930 },
    { year: '2024', segment: 'International', listings: 280 },
  ],
};

// Product value race — two series that both render as lines. Used twice: once with
// direct end labels, once with a legend.
const productValueData: Data = {
  columns: [{ key: 'month' }, { key: 'product' }, { key: 'value' }],
  rows: [
    { month: 'Jan', product: 'Product A', value: 120 },
    { month: 'Jan', product: 'Product B', value: 105 },
    { month: 'Feb', product: 'Product A', value: 180 },
    { month: 'Feb', product: 'Product B', value: 115 },
    { month: 'Mar', product: 'Product A', value: 150 },
    { month: 'Mar', product: 'Product B', value: 140 },
    { month: 'Apr', product: 'Product A', value: 220 },
    { month: 'Apr', product: 'Product B', value: 130 },
    { month: 'May', product: 'Product A', value: 260 },
    { month: 'May', product: 'Product B', value: 170 },
    { month: 'Jun', product: 'Product A', value: 300 },
    { month: 'Jun', product: 'Product B', value: 205 },
  ],
};

// Revenue by region — the donut / ranked source. Ordered North-leads-down.
const revenueByRegionData: Data = {
  columns: [{ key: 'region' }, { key: 'revenue' }],
  rows: [
    { region: 'North', revenue: 26 },
    { region: 'East', revenue: 21 },
    { region: 'Central', revenue: 20 },
    { region: 'South', revenue: 17 },
    { region: 'West', revenue: 16 },
  ],
};

// Ad demand seasonality — one observation per month; the golden quarter (Oct–Dec)
// is split out via the `period` column.
const adDemandData: Data = {
  columns: [{ key: 'month' }, { key: 'demand' }, { key: 'period' }],
  rows: [
    { month: 'Jan', demand: 62, period: 'rest of year' },
    { month: 'Feb', demand: 58, period: 'rest of year' },
    { month: 'Mar', demand: 70, period: 'rest of year' },
    { month: 'Apr', demand: 74, period: 'rest of year' },
    { month: 'May', demand: 78, period: 'rest of year' },
    { month: 'Jun', demand: 72, period: 'rest of year' },
    { month: 'Jul', demand: 68, period: 'rest of year' },
    { month: 'Aug', demand: 71, period: 'rest of year' },
    { month: 'Sep', demand: 84, period: 'rest of year' },
    { month: 'Oct', demand: 96, period: 'golden quarter' },
    { month: 'Nov', demand: 132, period: 'golden quarter' },
    { month: 'Dec', demand: 141, period: 'golden quarter' },
  ],
};

// Progress toward 2025 targets — two stacked shares per region (achieved + remaining)
// that complete a full lap on a racetrack.
const targetProgressData: Data = {
  columns: [{ key: 'region' }, { key: 'status' }, { key: 'share' }],
  rows: [
    { region: 'North', status: 'achieved', share: 84 },
    { region: 'North', status: 'remaining', share: 16 },
    { region: 'East', status: 'achieved', share: 71 },
    { region: 'East', status: 'remaining', share: 29 },
    { region: 'Central', status: 'achieved', share: 65 },
    { region: 'Central', status: 'remaining', share: 35 },
    { region: 'South', status: 'achieved', share: 52 },
    { region: 'South', status: 'remaining', share: 48 },
    { region: 'West', status: 'achieved', share: 38 },
    { region: 'West', status: 'remaining', share: 62 },
  ],
};

/** The chart every dashboard renders, in display order. */
export type ChartKey = 'cpm' | 'listings' | 'productRace' | 'donut' | 'productLegend' | 'rose' | 'racetrack';

export interface DashboardChart {
  /** Stable identifier a story keys its spec by. */
  key: ChartKey;
  /** Human name for card chrome (fig plates, captions). */
  name: string;
  /** The rows this chart binds to; shared across every style. */
  data: Data;
  /** Card height in the shared layout. */
  height: number;
}

/**
 * The canonical roster: which charts appear, in what order, bound to which data, at
 * what height. The layout arranges these into a pair / trio / pair band structure.
 */
export const DASHBOARD_CHARTS: readonly DashboardChart[] = [
  { key: 'cpm', name: 'Cost per mille', data: cpmData, height: 520 },
  { key: 'listings', name: 'Listed companies', data: listingsData, height: 520 },
  { key: 'productRace', name: 'Product value race', data: productValueData, height: 400 },
  { key: 'donut', name: 'Revenue by region', data: revenueByRegionData, height: 400 },
  { key: 'productLegend', name: 'Product value, keyed', data: productValueData, height: 400 },
  { key: 'rose', name: 'Ad demand seasonality', data: adDemandData, height: 520 },
  { key: 'racetrack', name: '2025 target progress', data: targetProgressData, height: 520 },
];
