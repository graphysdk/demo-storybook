import { FT_COLORS, FT_FONT_FAMILY } from './financial-times.theme';

export const FinancialTimesHeader = () => (
  <header style={{ textAlign: 'center', marginBottom: 48 }}>
    <div style={{ width: 64, height: 5, background: FT_COLORS.black, margin: '0 auto 28px' }} />
    <h1 style={{ fontFamily: FT_FONT_FAMILY.display, fontWeight: 700, fontSize: 52, color: '#1A1817', margin: 0 }}>
      Financial Times
    </h1>
    <p style={{ color: FT_COLORS.slate, fontSize: 17, margin: '16px 0 0' }}>
      a Graphy chart theme · the chart is the story · built from a five-reference corpus
    </p>
  </header>
);
