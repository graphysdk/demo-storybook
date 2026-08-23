import type { Data } from '@graphysdk/viz-engine';
import { coord, createSpec, geom, mapping, pipe, scale } from '@graphysdk/viz-engine';

/**
 * Apple revenue by product line, ten quarters of it, summed across the three sales regions.
 *
 * Deliberately harder work than a four-row toy. It gives the panel things to be judged against that a
 * small set cannot: **ten categories** on the domain axis, so tick modes and label crowding mean
 * something; **five series**, so a legend has enough items for its placement to matter; and values in
 * whole dollars rather than billions, so the number format section's abbreviation actually reads as
 * `56.3B` instead of `56.3`.
 *
 * Source: quarterly revenue, rounded to a tenth of a billion per product per region.
 */
export const panelStoryData: Data = {
  columns: [{ key: 'period' }, { key: 'year' }, { key: 'quarter' }, { key: 'product' }, { key: 'revenue' }],
  rows: [
    { period: '2019 Q1', year: 2019, quarter: 'Q1', product: 'iPhone', revenue: 56300000000 },
    { period: '2019 Q1', year: 2019, quarter: 'Q1', product: 'Mac', revenue: 11900000000 },
    { period: '2019 Q1', year: 2019, quarter: 'Q1', product: 'iPad', revenue: 11500000000 },
    { period: '2019 Q1', year: 2019, quarter: 'Q1', product: 'Wearables', revenue: 11300000000 },
    { period: '2019 Q1', year: 2019, quarter: 'Q1', product: 'Services', revenue: 17100000000 },
    { period: '2019 Q2', year: 2019, quarter: 'Q2', product: 'iPhone', revenue: 46900000000 },
    { period: '2019 Q2', year: 2019, quarter: 'Q2', product: 'Mac', revenue: 8700000000 },
    { period: '2019 Q2', year: 2019, quarter: 'Q2', product: 'iPad', revenue: 8600000000 },
    { period: '2019 Q2', year: 2019, quarter: 'Q2', product: 'Wearables', revenue: 8300000000 },
    { period: '2019 Q2', year: 2019, quarter: 'Q2', product: 'Services', revenue: 18100000000 },
    { period: '2020 Q1', year: 2020, quarter: 'Q1', product: 'iPhone', revenue: 62500000000 },
    { period: '2020 Q1', year: 2020, quarter: 'Q1', product: 'Mac', revenue: 12000000000 },
    { period: '2020 Q1', year: 2020, quarter: 'Q1', product: 'iPad', revenue: 10500000000 },
    { period: '2020 Q1', year: 2020, quarter: 'Q1', product: 'Wearables', revenue: 12000000000 },
    { period: '2020 Q1', year: 2020, quarter: 'Q1', product: 'Services', revenue: 19800000000 },
    { period: '2020 Q2', year: 2020, quarter: 'Q2', product: 'iPhone', revenue: 52700000000 },
    { period: '2020 Q2', year: 2020, quarter: 'Q2', product: 'Mac', revenue: 9700000000 },
    { period: '2020 Q2', year: 2020, quarter: 'Q2', product: 'iPad', revenue: 9100000000 },
    { period: '2020 Q2', year: 2020, quarter: 'Q2', product: 'Wearables', revenue: 9800000000 },
    { period: '2020 Q2', year: 2020, quarter: 'Q2', product: 'Services', revenue: 20600000000 },
    { period: '2021 Q1', year: 2021, quarter: 'Q1', product: 'iPhone', revenue: 72800000000 },
    { period: '2021 Q1', year: 2021, quarter: 'Q1', product: 'Mac', revenue: 14700000000 },
    { period: '2021 Q1', year: 2021, quarter: 'Q1', product: 'iPad', revenue: 14200000000 },
    { period: '2021 Q1', year: 2021, quarter: 'Q1', product: 'Wearables', revenue: 14000000000 },
    { period: '2021 Q1', year: 2021, quarter: 'Q1', product: 'Services', revenue: 24300000000 },
    { period: '2021 Q2', year: 2021, quarter: 'Q2', product: 'iPhone', revenue: 64900000000 },
    { period: '2021 Q2', year: 2021, quarter: 'Q2', product: 'Mac', revenue: 13400000000 },
    { period: '2021 Q2', year: 2021, quarter: 'Q2', product: 'iPad', revenue: 12400000000 },
    { period: '2021 Q2', year: 2021, quarter: 'Q2', product: 'Wearables', revenue: 12600000000 },
    { period: '2021 Q2', year: 2021, quarter: 'Q2', product: 'Services', revenue: 25100000000 },
    { period: '2022 Q1', year: 2022, quarter: 'Q1', product: 'iPhone', revenue: 77200000000 },
    { period: '2022 Q1', year: 2022, quarter: 'Q1', product: 'Mac', revenue: 16200000000 },
    { period: '2022 Q1', year: 2022, quarter: 'Q1', product: 'iPad', revenue: 15100000000 },
    { period: '2022 Q1', year: 2022, quarter: 'Q1', product: 'Wearables', revenue: 16000000000 },
    { period: '2022 Q1', year: 2022, quarter: 'Q1', product: 'Services', revenue: 27100000000 },
    { period: '2022 Q2', year: 2022, quarter: 'Q2', product: 'iPhone', revenue: 69700000000 },
    { period: '2022 Q2', year: 2022, quarter: 'Q2', product: 'Mac', revenue: 14000000000 },
    { period: '2022 Q2', year: 2022, quarter: 'Q2', product: 'iPad', revenue: 13400000000 },
    { period: '2022 Q2', year: 2022, quarter: 'Q2', product: 'Wearables', revenue: 14200000000 },
    { period: '2022 Q2', year: 2022, quarter: 'Q2', product: 'Services', revenue: 27600000000 },
    { period: '2023 Q1', year: 2023, quarter: 'Q1', product: 'iPhone', revenue: 82400000000 },
    { period: '2023 Q1', year: 2023, quarter: 'Q1', product: 'Mac', revenue: 17000000000 },
    { period: '2023 Q1', year: 2023, quarter: 'Q1', product: 'iPad', revenue: 16000000000 },
    { period: '2023 Q1', year: 2023, quarter: 'Q1', product: 'Wearables', revenue: 17200000000 },
    { period: '2023 Q1', year: 2023, quarter: 'Q1', product: 'Services', revenue: 29700000000 },
    { period: '2023 Q2', year: 2023, quarter: 'Q2', product: 'iPhone', revenue: 73100000000 },
    { period: '2023 Q2', year: 2023, quarter: 'Q2', product: 'Mac', revenue: 15000000000 },
    { period: '2023 Q2', year: 2023, quarter: 'Q2', product: 'iPad', revenue: 14200000000 },
    { period: '2023 Q2', year: 2023, quarter: 'Q2', product: 'Wearables', revenue: 15100000000 },
    { period: '2023 Q2', year: 2023, quarter: 'Q2', product: 'Services', revenue: 30300000000 },
  ],
};

/**
 * The same revenue with the quarters summed away: a pie divides one figure between its slices, so it
 * needs a row per product. Derived so the ring and the columns beside it cannot disagree.
 */
export const panelSliceStoryData: Data = {
  columns: [{ key: 'product' }, { key: 'revenue' }],
  rows: sumRevenueByProduct(panelStoryData.rows),
};

function sumRevenueByProduct(rows: Data['rows']): Data['rows'] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const product = String(row.product);
    totals.set(product, (totals.get(product) ?? 0) + Number(row.revenue));
  }

  return [...totals].map(([product, revenue]) => ({ product, revenue }));
}

const REVENUE_BY_PRODUCT = mapping({ x: 'period', y: 'revenue', color: 'product' });

export const panelBarStorySpec = pipe(createSpec(), REVENUE_BY_PRODUCT, geom.bar(), scale.x(), scale.y());

export const panelLineStorySpec = pipe(createSpec(), REVENUE_BY_PRODUCT, geom.line(), scale.x(), scale.y());

export const panelAreaStorySpec = pipe(createSpec(), REVENUE_BY_PRODUCT, geom.area(), scale.x(), scale.y());

export const panelPointStorySpec = pipe(createSpec(), REVENUE_BY_PRODUCT, geom.point(), scale.x(), scale.y());

/** Stacked, which is also the only honest way to read five series of one total. */
export const panelStackedBarStorySpec = pipe(
  createSpec(),
  REVENUE_BY_PRODUCT,
  geom.bar({ position: 'stack' }),
  scale.x(),
  scale.y()
);

/**
 * A pie is one ring split by colour, so x is a constant and the category rides on `color`. A real
 * column on x becomes a band instead, one ring per value.
 */
const REVENUE_BY_PRODUCT_SLICE = mapping({ x: '', y: 'revenue', color: 'product' });

export const panelPieStorySpec = pipe(
  createSpec(),
  REVENUE_BY_PRODUCT_SLICE,
  geom.bar({ position: 'fill' }),
  coord.polar({ theta: 'y' }),
  scale.x(),
  scale.y()
);

export const panelDonutStorySpec = pipe(
  createSpec(),
  REVENUE_BY_PRODUCT_SLICE,
  geom.bar({ position: 'fill' }),
  coord.polar({ theta: 'y', innerRadius: 0.55 }),
  scale.x(),
  scale.y()
);

export const panelPolarBarStorySpec = pipe(
  createSpec(),
  REVENUE_BY_PRODUCT,
  geom.bar({ position: 'dodge' }),
  coord.polar({ theta: 'x' }),
  scale.x(),
  scale.y()
);

export const panelRadarStorySpec = pipe(
  createSpec(),
  REVENUE_BY_PRODUCT,
  geom.line(),
  geom.point({ interactive: false }),
  coord.polar({ theta: 'x' }),
  scale.x(),
  scale.y()
);

/** Two geoms on one chart: the panel has to narrow against the pair rather than against one. */
export const panelComboStorySpec = pipe(
  createSpec(),
  REVENUE_BY_PRODUCT,
  geom.bar(),
  geom.line(),
  scale.x(),
  scale.y()
);
