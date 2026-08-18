import { NB_COLORS, NB_FONT_FAMILY } from './neo-brutalist.theme';

export const NeoBrutalistHeader = () => (
  <header style={{ textAlign: 'center', marginBottom: 48 }}>
    <div style={{ width: 64, height: 5, background: NB_COLORS.acid, margin: '0 auto 28px' }} />
    <h1
      style={{
        fontFamily: NB_FONT_FAMILY.heading,
        fontWeight: 700,
        fontSize: 48,
        letterSpacing: '0.02em',
        color: NB_COLORS.body,
        margin: 0,
      }}
    >
      NEO <span style={{ color: NB_COLORS.acid }}>BRUTALIST.</span>
    </h1>
    <p
      style={{
        color: NB_COLORS.secondary,
        fontFamily: NB_FONT_FAMILY.heading,
        fontWeight: 500,
        fontSize: 12,
        letterSpacing: '0.18em',
        margin: '16px 0 0',
      }}
    >
      A GRAPHY CHART THEME · ACID IS FOR DATA ONLY · {'DATA > OPINIONS'}
    </p>
  </header>
);
