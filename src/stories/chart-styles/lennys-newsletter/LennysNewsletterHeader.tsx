import { BRAND_ORANGE, LENNY_COLORS, LENNY_FONT_FAMILY } from './lennys-newsletter.theme';

export const LennyPageHeader = () => (
  <header style={{ textAlign: 'center', marginBottom: 48 }}>
    <div style={{ width: 64, height: 5, background: BRAND_ORANGE, margin: '0 auto 28px' }} />
    <h1
      style={{
        fontFamily: LENNY_FONT_FAMILY.body,
        fontWeight: 800,
        fontSize: 48,
        color: LENNY_COLORS.ink,
        margin: 0,
      }}
    >
      Lenny&rsquo;s Newsletter
    </h1>
    <p style={{ color: LENNY_COLORS.inkSecondary, fontSize: 16, margin: '16px 0 0' }}>
      a Graphy chart theme · cream plates, one orange lead · engine config only
    </p>
  </header>
);
