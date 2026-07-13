export const DEV_FIXTURE = {
  type: 'waterfall',
  data: {
    columns: [
      { key: '2jP7-', label: 'Fruit' },
      { key: 'XdkM8', label: 'Quantity' },
    ],
    rows: [
      { '2jP7-': 'Apples', XdkM8: 45 },
      { '2jP7-': 'Bananas', XdkM8: 60 },
      { '2jP7-': 'Oranges', XdkM8: 40 },
      { '2jP7-': 'Grapes', XdkM8: 25 },
      { '2jP7-': 'Peaches', XdkM8: 35 },
    ],
  },
  axes: {
    y: { label: undefined, min: 0 },
    showGridLines: true,
  },
  appearance: {
    textScale: 1.2,
    numberFormat: { abbreviation: 'auto', decimalPlaces: 'auto' },
  },
  content: {
    title: 'Fruit Inventory',
    subtitle: 'Current stock levels by variety',
    caption: 'Quantities reflect end-of-day counts in the main warehouse.',
    source: {
      label: 'Internal warehouse log',
      url: 'https://example.com/warehouse',
    },
    isTitleHidden: false,
    isSubtitleHidden: false,
    isCaptionHidden: false,
    isSourceHidden: false,
  },
};
