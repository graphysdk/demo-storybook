export const FORECAST_EBITDA_FIXTURE = {
  type: 'funnel',
  data: {
    columns: [
      { key: 'L-6mkRWI92UCQoJO7P95W', label: 'City' },
      { key: 'yzN3HeDv-e5uhVGZjH5RN', label: 'Forecasted EBITDA ($)' },
      { key: 'AXAUx_8Ne5gM7xekAktSr', label: 'Actual EBITDA ($)' },
      { key: 'uwxdRNEu49j-hCR1X1QAz', label: 'Variance ($)' },
      { key: 'pf6As5RGsKzZSp4rPeuuQ', label: 'Variance (%)' },
    ],
    rows: [
      {
        AXAUx_8Ne5gM7xekAktSr: '$480,000',
        'L-6mkRWI92UCQoJO7P95W': 'New York',
        pf6As5RGsKzZSp4rPeuuQ: '-4%',
        'uwxdRNEu49j-hCR1X1QAz': '-$20,000',
        'yzN3HeDv-e5uhVGZjH5RN': '$500,000',
      },
      {
        AXAUx_8Ne5gM7xekAktSr: '$475,000',
        'L-6mkRWI92UCQoJO7P95W': 'Los Angeles',
        pf6As5RGsKzZSp4rPeuuQ: '0.056',
        'uwxdRNEu49j-hCR1X1QAz': '$25,000',
        'yzN3HeDv-e5uhVGZjH5RN': '$450,000',
      },
      {
        AXAUx_8Ne5gM7xekAktSr: '$390,000',
        'L-6mkRWI92UCQoJO7P95W': 'Chicago',
        pf6As5RGsKzZSp4rPeuuQ: '-2.50%',
        'uwxdRNEu49j-hCR1X1QAz': '-$10,000',
        'yzN3HeDv-e5uhVGZjH5RN': '$400,000',
      },
      {
        AXAUx_8Ne5gM7xekAktSr: '$325,000',
        'L-6mkRWI92UCQoJO7P95W': 'San Francisco',
        pf6As5RGsKzZSp4rPeuuQ: '-7.10%',
        'uwxdRNEu49j-hCR1X1QAz': '-$25,000',
        'yzN3HeDv-e5uhVGZjH5RN': '$350,000',
      },
      {
        AXAUx_8Ne5gM7xekAktSr: '$315,000',
        'L-6mkRWI92UCQoJO7P95W': 'Dallas',
        pf6As5RGsKzZSp4rPeuuQ: '0.05',
        'uwxdRNEu49j-hCR1X1QAz': '$15,000',
        'yzN3HeDv-e5uhVGZjH5RN': '$300,000',
      },
      {
        AXAUx_8Ne5gM7xekAktSr: '$270,000',
        'L-6mkRWI92UCQoJO7P95W': 'Miami',
        pf6As5RGsKzZSp4rPeuuQ: '0.08',
        'uwxdRNEu49j-hCR1X1QAz': '$20,000',
        'yzN3HeDv-e5uhVGZjH5RN': '$250,000',
      },
      {},
    ],
  },
  appearance: {
    seriesStyles: {
      series1: { customColor: '#0FB981' },
      series2: { customColor: '#65D46F' },
      series3: { customColor: '#E83562' },
      series4: { customColor: '#FED03C' },
    },
    border: {
      style: 'custom',
      color: '#CBF2E1',
    },
    numberFormat: { abbreviation: 'auto', decimalPlaces: 'auto' },
  },
  content: {
    title: 'Forecast vs Actual EBITDA',
    subtitle: 'Variance by city, fiscal year 2025',
    caption: 'Forecasted figures from the FY25 plan compared against booked actuals.',
    source: {
      label: 'Finance reporting',
      url: 'https://example.com/finance/ebitda',
    },
    isTitleHidden: false,
    isSubtitleHidden: false,
    isCaptionHidden: false,
    isSourceHidden: false,
  },
};
