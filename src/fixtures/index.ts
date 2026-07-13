import { BUBBLE_FIXTURE } from './bubble.fixture.js';
import { DEV_FIXTURE } from './dev.fixture.js';
import { FORECAST_EBITDA_FIXTURE } from './forecast-ebitda.fixture.js';
import { GLOBAL_EMISSIONS_FIXTURE } from './global-emissions.fixture.js';
import { LOST_DEALS_FIXTURE } from './lost-deals.fixture.js';
import { PENGUINS_FIXTURE } from './penguins.fixture.js';
import { PROMPTS_FIXTURE } from './prompts.fixture.js';
import { SALES_FIXTURE } from './sales.fixture.js';
import { STOCKS_FIXTURE } from './stocks.fixture.js';

export type FixtureName = (typeof FIXTURES)[number]['name'];

export const FIXTURES = [
  { name: 'Dev', value: DEV_FIXTURE },
  { name: 'Prompts', value: PROMPTS_FIXTURE },
  { name: 'Global Emissions', value: GLOBAL_EMISSIONS_FIXTURE },
  { name: 'Lost Deals', value: LOST_DEALS_FIXTURE },
  { name: 'Sales', value: SALES_FIXTURE },
  { name: 'Penguins', value: PENGUINS_FIXTURE },
  { name: 'Forecast EBITDA', value: FORECAST_EBITDA_FIXTURE },
  { name: 'Stocks', value: STOCKS_FIXTURE },
  { name: 'Bubble', value: BUBBLE_FIXTURE },
] as const;

export const DATASETS = [
  { name: 'Dev', value: DEV_FIXTURE.data },
  { name: 'Prompts', value: PROMPTS_FIXTURE.data },
  { name: 'Global Emissions', value: GLOBAL_EMISSIONS_FIXTURE.data },
  { name: 'Lost Deals', value: LOST_DEALS_FIXTURE.data },
  { name: 'Sales', value: SALES_FIXTURE.data },
  { name: 'Penguins', value: PENGUINS_FIXTURE.data },
  { name: 'Forecast EBITDA', value: FORECAST_EBITDA_FIXTURE.data },
  { name: 'Stocks', value: STOCKS_FIXTURE.data },
  { name: 'Bubble', value: BUBBLE_FIXTURE.data },
] as const;
