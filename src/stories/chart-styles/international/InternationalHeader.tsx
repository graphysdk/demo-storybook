import { INTL_COLORS, INTL_FONT_FAMILY } from './international.theme';

export const InternationalHeader = () => (
  <header style={{ textAlign: 'center', marginBottom: 48 }}>
    <div style={{ width: 64, height: 5, background: INTL_COLORS.accent, margin: '0 auto 28px' }} />
    <h1
      style={{
        fontFamily: INTL_FONT_FAMILY.heading,
        fontWeight: 700,
        fontSize: 52,
        color: INTL_COLORS.heading,
        margin: 0,
      }}
    >
      International
    </h1>
    <p style={{ color: INTL_COLORS.grey, fontSize: 17, margin: '16px 0 0' }}>
      a Graphy chart theme · ink, grey, and one red accent · engine config only
    </p>
  </header>
);
