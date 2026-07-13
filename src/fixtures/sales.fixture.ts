export const SALES_FIXTURE = {
  type: 'bar',
  data: {
    columns: [
      { key: 'c1', label: 'Month' },
      { key: 'c2', label: 'Product A' },
      { key: 'c3', label: 'Product B' },
    ],
    rows: [
      { c1: 'Jan 2025', c2: 1467, c3: 1100 },
      { c1: 'Feb 2025', c2: 1857, c3: 2649 },
      { c1: 'Mar 2025', c2: 2485, c3: 2987 },
      { c1: 'Apr 2025', c2: 3456, c3: 3256 },
      { c1: 'May 2025', c2: 4789, c3: 4895 },
      { c1: 'Jun 2025', c2: 5431, c3: 5781 },
      { c1: 'Jul 2025', c2: 4576, c3: 6548 },
      { c1: 'Aug 2025', c2: 3899, c3: 5344 },
      { c1: 'Sep 2025', c2: 3476, c3: 4883 },
      { c1: 'Oct 2025', c2: 4235, c3: 4561 },
      { c1: 'Nov 2025', c2: 3256, c3: 4127 },
      { c1: 'Dec 2025', c2: 2153, c3: 3854 },
    ],
  },
  axes: {
    y: { label: 'Sales' },
    showGridLines: true,
  },
  appearance: {
    seriesStyles: {
      series1: { customColor: '#BFBFBF' },
      series2: { customColor: '#FF82FF' },
      series3: { customColor: '#65D46F' },
    },
    highlightStyle: 'grey',
    isLogoHidden: true,
    numberFormat: { abbreviation: 'auto', decimalPlaces: 'auto' },
  },
  content: {
    title: 'Monthly Product Sales',
    subtitle: 'Product A vs Product B, 2025',
    caption: 'Units sold per product, aggregated by calendar month.',
    source: {
      label: 'Sales operations dashboard',
      url: 'https://example.com/sales',
    },
    isTitleHidden: false,
    isSubtitleHidden: false,
    isCaptionHidden: false,
    isSourceHidden: false,
  },
};
