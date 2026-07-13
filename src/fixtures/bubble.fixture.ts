export const BUBBLE_FIXTURE = {
  type: 'bubble',
  data: {
    columns: [
      { key: 'c2', label: 'Series 1' },
      { key: 'c3', label: 'Series 2' },
      { key: 'ljwohzwMcSaymJFfPK5Xv', label: 'Size' },
    ],
    rows: [
      { c2: '1467', c3: '2456', ljwohzwMcSaymJFfPK5Xv: '22' },
      { c2: '1857', c3: '2649', ljwohzwMcSaymJFfPK5Xv: '23' },
      { c2: '2485', c3: '2987', ljwohzwMcSaymJFfPK5Xv: '34' },
      { c2: '3456', c3: '3256', ljwohzwMcSaymJFfPK5Xv: '45' },
      { c2: '4789', c3: '4895', ljwohzwMcSaymJFfPK5Xv: '12' },
      { c2: '5431', c3: '5781', ljwohzwMcSaymJFfPK5Xv: '34' },
      { c2: '4576', c3: '6548', ljwohzwMcSaymJFfPK5Xv: '43' },
      { c2: '3899', c3: '5344', ljwohzwMcSaymJFfPK5Xv: '12' },
      { c2: '3476', c3: '4883', ljwohzwMcSaymJFfPK5Xv: '41' },
      { c2: '4235', c3: '4561', ljwohzwMcSaymJFfPK5Xv: '32' },
      { c2: '3256', c3: '4127', ljwohzwMcSaymJFfPK5Xv: '34' },
      { c2: '2153', c3: '3854', ljwohzwMcSaymJFfPK5Xv: '45' },
    ],
  },
  axes: {
    showGridLines: true,
  },
  legend: {
    position: 'top',
  },
  appearance: {
    border: {
      style: 'gradient',
      color: 'lilac',
    },
    isLogoHidden: true,
    hasRoundedCorners: true,
    numberFormat: { abbreviation: 'auto', decimalPlaces: 'auto' },
  },
  content: {
    title: 'Series Correlation',
    subtitle: 'Series 1 vs Series 2, sized by Size',
    caption: 'Each bubble represents a single observation; bubble area encodes magnitude.',
    source: {
      label: 'Sample dataset',
      url: 'https://example.com/datasets/bubble',
    },
    isTitleHidden: false,
    isSubtitleHidden: false,
    isCaptionHidden: false,
    isSourceHidden: false,
  },
};
