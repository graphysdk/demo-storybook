export const LOST_DEALS_FIXTURE = {
  type: 'bar',
  data: {
    columns: [
      { key: 'c1', label: 'Reason' },
      { key: 'c2', label: 'Won Deals (%)' },
      { key: 'c3', label: 'Lost Deals (%)' },
      { key: '9P8sW23mM8J1CsVd3RjH1', label: 'Other' },
    ],
    rows: [
      { c1: 'Price', c2: '35%', c3: '40%', '9P8sW23mM8J1CsVd3RjH1': '20%' },
      { c1: 'Product Fit', c2: '25%', c3: '20%', '9P8sW23mM8J1CsVd3RjH1': '30' },
      { c1: 'Competition', c2: '15%', c3: '25%', '9P8sW23mM8J1CsVd3RjH1': '10' },
      { c1: 'Something', c2: '15%', c3: '25%', '9P8sW23mM8J1CsVd3RjH1': '10' },
      { c1: 'Other', c2: '15%', c3: '25%', '9P8sW23mM8J1CsVd3RjH1': '10' },
    ],
  },
  axes: {
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
    border: {
      style: 'custom',
      color: '#FFE3E3',
    },
    numberFormat: { abbreviation: 'auto', decimalPlaces: 'auto' },
  },
  content: {
    title: 'Deal Outcomes by Reason',
    subtitle: 'Win and loss drivers, Q4 2025',
    caption: 'Percentage breakdown of won and lost deals across the top reason categories.',
    source: {
      label: 'CRM win/loss analysis',
      url: 'https://example.com/crm/deals',
    },
    isTitleHidden: false,
    isSubtitleHidden: false,
    isCaptionHidden: false,
    isSourceHidden: false,
  },
};
